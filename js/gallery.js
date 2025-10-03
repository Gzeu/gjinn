import { supabase, CONFIG } from './config.js';

class Gallery {
    constructor(containerId = 'gallery-container') {
        this.container = document.getElementById(containerId);
        this.loading = false;
        this.currentPage = 0;
        this.itemsPerPage = 20;
        this.hasMore = true;
        this.initialize();
    }

    async initialize() {
        if (!this.container) return;
        
        // Set up infinite scroll
        this.setupInfiniteScroll();
        
        // Initial load
        await this.loadMoreItems();
        
        // Listen for new images
        this.setupRealtimeUpdates();
    }

    setupInfiniteScroll() {
        const observer = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting && !this.loading && this.hasMore) {
                await this.loadMoreItems();
            }
        }, { threshold: 0.1 });

        // Create a sentinel element for infinite scroll
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'gallery-sentinel';
        this.container.parentNode.insertBefore(this.sentinel, this.container.nextSibling);
        observer.observe(this.sentinel);
    }

    async loadMoreItems() {
        if (this.loading) return;
        this.loading = true;
        
        try {
            // Show loading state
            this.showLoading();
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            
            // Fetch images
            const { data: images, error } = await supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(
                    this.currentPage * this.itemsPerPage,
                    (this.currentPage + 1) * this.itemsPerPage - 1
                );

            if (error) throw error;
            
            // Update state
            this.hasMore = images.length === this.itemsPerPage;
            this.currentPage++;
            
            // Render images
            if (images.length > 0) {
                this.renderImages(images);
            } else if (this.currentPage === 0) {
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('Error loading gallery items:', error);
            this.showError('Failed to load images');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }

    renderImages(images) {
        const fragment = document.createDocumentFragment();
        
        images.forEach(image => {
            const card = this.createImageCard(image);
            fragment.appendChild(card);
        });
        
        this.container.appendChild(fragment);
    }

    createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.dataset.id = image.id;
        
        // Image
        const img = document.createElement('img');
        img.src = image.image_url;
        img.alt = image.prompt || 'Generated image';
        img.loading = 'lazy';
        
        // Overlay with prompt
        const overlay = document.createElement('div');
        overlay.className = 'gallery-card-overlay';
        
        const prompt = document.createElement('div');
        prompt.className = 'gallery-card-prompt';
        prompt.textContent = image.prompt || 'No prompt provided';
        
        const actions = document.createElement('div');
        actions.className = 'gallery-card-actions';
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-icon';
        downloadBtn.title = 'Download';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.onclick = (e) => this.downloadImage(image);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = (e) => this.deleteImage(image.id, card);
        
        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);
        
        overlay.appendChild(prompt);
        overlay.appendChild(actions);
        
        card.appendChild(img);
        card.appendChild(overlay);
        
        return card;
    }

    async downloadImage(image) {
        try {
            const response = await fetch(image.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `gjinn-${image.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            this.showToast('Download started', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showToast('Failed to download image', 'error');
        }
    }

    async deleteImage(imageId, cardElement) {
        if (!confirm('Are you sure you want to delete this image?')) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await window.imageService.deleteGeneration(user.id, imageId);
            
            // Remove from UI
            cardElement.classList.add('removing');
            setTimeout(() => cardElement.remove(), 300);
            
            this.showToast('Image deleted', 'success');
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showToast('Failed to delete image', 'error');
        }
    }

    setupRealtimeUpdates() {
        // Subscribe to new images
        const channel = supabase
            .channel('realtime images')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: CONFIG.SUPABASE.TABLES.IMAGES
            }, (payload) => {
                // Only add if it's a new image for the current user
                if (payload.new && this.container) {
                    const card = this.createImageCard(payload.new);
                    this.container.insertBefore(card, this.container.firstChild);
                }
            })
            .subscribe();

        // Cleanup on component unmount
        this.cleanup = () => {
            supabase.removeChannel(channel);
        };
    }

    showLoading() {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-spinner';
            this.loadingElement.innerHTML = '<div class="spinner"></div>';
            this.container.parentNode.insertBefore(this.loadingElement, this.sentinel);
        }
        this.loadingElement.style.display = 'block';
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <i class="fas fa-images"></i>
            </div>
            <h3>No images yet</h3>
            <p>Generate your first image to see it here</p>
            <button id="generate-first" class="btn btn-primary">Generate Image</button>
        `;
        
        this.container.innerHTML = '';
        this.container.appendChild(emptyState);
        
        // Add event listener to the generate button
        const generateBtn = document.getElementById('generate-first');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                // Trigger the generate image flow
                const event = new Event('show-generator');
                document.dispatchEvent(event);
            });
        }
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // Remove any existing error messages
        const existingError = this.container.querySelector('.error-message');
        if (existingError) {
            this.container.removeChild(existingError);
        }
        
        this.container.prepend(errorElement);
    }

    showToast(message, type = 'info') {
        // You can implement a toast notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Example: Show a simple alert for now
        alert(`[${type.toUpperCase()}] ${message}`);
    }

    // Clean up event listeners and subscriptions
    destroy() {
        if (this.cleanup) this.cleanup();
        if (this.sentinel && this.sentinel.parentNode) {
            this.sentinel.parentNode.removeChild(this.sentinel);
        }
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if gallery container exists
    if (document.getElementById('gallery-container')) {
        window.gallery = new Gallery();
    }
});

export default Gallery;
