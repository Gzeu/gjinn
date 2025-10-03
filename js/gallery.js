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
        
        // Image container
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-card-image-container';
        
        // Image
        const img = document.createElement('img');
        img.src = image.image_url;
        img.alt = image.prompt || 'Generated image';
        img.loading = 'lazy';
        img.className = 'gallery-card-image';
        
        // Overlay with prompt and actions
        const overlay = document.createElement('div');
        overlay.className = 'gallery-card-overlay';
        
        // Prompt text
        const prompt = document.createElement('div');
        prompt.className = 'gallery-card-prompt';
        prompt.textContent = image.prompt || 'No prompt provided';
        prompt.title = image.prompt || ''; // Show full prompt on hover
        
        // Actions container
        const actions = document.createElement('div');
        actions.className = 'gallery-card-actions';
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-icon';
        downloadBtn.setAttribute('aria-label', 'Download image');
        downloadBtn.title = 'Download';
        downloadBtn.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i>';
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadImage(image);
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.setAttribute('aria-label', 'Delete image');
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteImage(image.id, card);
        });
        
        // Add buttons to actions
        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);
        
        // Add elements to overlay
        overlay.appendChild(prompt);
        overlay.appendChild(actions);
        
        // Add image to container
        imgContainer.appendChild(img);
        
        // Add all to card
        card.appendChild(imgContainer);
        card.appendChild(overlay);
        
        // Add click handler for the card (optional: open larger view)
        card.addEventListener('click', (e) => {
            // Only trigger if clicking on the card itself, not buttons
            if (e.target === card || e.target === img) {
                this.viewImage(image);
            }
        });
        
        return card;
    }

    async downloadImage(image, event) {
        try {
            // Show loading state
            const button = event ? event.currentTarget : null;
            const originalHTML = button ? button.innerHTML : '';
            
            if (button) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
            }
            
            // Create a new image element to handle CORS
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            // Load the image
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = image.image_url + '?t=' + new Date().getTime(); // Cache buster
            });
            
            // Create canvas to handle the image
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Convert to blob and download
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    try {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `gjinn-${image.id || Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        
                        // Clean up
                        setTimeout(() => {
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            if (button) {
                                button.innerHTML = originalHTML;
                                button.disabled = false;
                            }
                            this.showToast('Download started', 'success');
                            resolve();
                        }, 100);
                    } catch (err) {
                        console.error('Error in download process:', err);
                        reject(err);
                    }
                }, 'image/png');
            });
            
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showToast('Failed to download image', 'error');
            
            // Reset button state on error
            if (event && event.currentTarget) {
                event.currentTarget.innerHTML = '<i class="fas fa-download"></i>';
                event.currentTarget.disabled = false;
            }
            throw error;
        }
    }

    async deleteImage(imageId, cardElement) {
        try {
            // Show confirmation dialog with custom styling
            const confirmed = await new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'confirm-modal';
                modal.innerHTML = `
                    <div class="confirm-dialog">
                        <h3>Delete Image</h3>
                        <p>Are you sure you want to delete this image? This action cannot be undone.</p>
                        <div class="confirm-buttons">
                            <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                            <button class="btn btn-danger" id="confirm-delete">Delete</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Handle button clicks
                const cancelBtn = modal.querySelector('#confirm-cancel');
                const deleteBtn = modal.querySelector('#confirm-delete');
                
                const cleanup = () => {
                    cancelBtn.removeEventListener('click', onCancel);
                    deleteBtn.removeEventListener('click', onDelete);
                    modal.removeEventListener('click', onClickOutside);
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                };
                
                const onCancel = () => {
                    cleanup();
                    resolve(false);
                };
                
                const onDelete = () => {
                    cleanup();
                    resolve(true);
                };
                
                const onClickOutside = (e) => {
                    if (e.target === modal) {
                        cleanup();
                        resolve(false);
                    }
                };
                
                cancelBtn.addEventListener('click', onCancel);
                deleteBtn.addEventListener('click', onDelete);
                modal.addEventListener('click', onClickOutside);
            });
            
            if (!confirmed) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            await window.imageService.deleteGeneration(user.id, imageId);
            
            // Animate removal
            cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.9)';
            
            // Remove from DOM after animation
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (cardElement.parentNode) {
                        cardElement.remove();
                    }
                    this.showToast('Image deleted', 'success');
                    resolve();
                }, 300);
            });
            
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showToast('Failed to delete image', 'error');
            throw error;
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
