// Gjinn AI Genie Application
class GjinnApp {
    constructor() {
        this.wishes = [];
        this.galleryItems = [];
        this.currentWishId = 1;
        this.settings = {
            imageModel: 'flux',
            audioQuality: 'high',
            particlesEnabled: true,
            animationsEnabled: true,
            soundEffects: true
        };
        
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.createMagicParticles();
        this.startSparkleAnimation();
        this.updateStats();
        this.renderAllSections();
    }

    loadSampleData() {
        // Load sample wishes from the provided data
        this.wishes = [
            {
                id: 1,
                text: "A mystical forest with glowing mushrooms",
                type: "image",
                status: "completed",
                thumbnail: "https://picsum.photos/150/150?random=1",
                createdAt: "2025-10-01T15:30:00Z",
                favorited: true,
                downloads: 23
            },
            {
                id: 2,
                text: "Ambient ocean waves with whale songs",
                type: "audio",
                status: "completed",
                duration: "2:15",
                createdAt: "2025-10-01T14:20:00Z",
                favorited: false,
                downloads: 12
            },
            {
                id: 3,
                text: "A cyberpunk cityscape at night",
                type: "image",
                status: "processing",
                progress: 75,
                createdAt: "2025-10-02T10:15:00Z",
                favorited: false,
                downloads: 0
            },
            {
                id: 4,
                text: "Epic fantasy adventure story",
                type: "text",
                status: "completed",
                wordCount: 450,
                createdAt: "2025-10-01T18:45:00Z",
                favorited: true,
                downloads: 31
            },
            {
                id: 5,
                text: "Peaceful rain sounds for meditation",
                type: "audio",
                status: "queued",
                createdAt: "2025-10-02T11:00:00Z",
                favorited: false,
                downloads: 0
            }
        ];

        // Load gallery items
        this.galleryItems = [
            {
                id: 101,
                title: "Cosmic Nebula",
                type: "image",
                thumbnail: "https://picsum.photos/200/200?random=2",
                favorited: true,
                downloads: 23
            },
            {
                id: 102,
                title: "Dragon's Roar",
                type: "audio",
                duration: "0:45",
                favorited: false,
                downloads: 12
            },
            {
                id: 103,
                title: "Ancient Castle",
                type: "image",
                thumbnail: "https://picsum.photos/200/200?random=3",
                favorited: true,
                downloads: 31
            },
            {
                id: 104,
                title: "Jazz Cafe Ambience",
                type: "audio",
                duration: "3:20",
                favorited: false,
                downloads: 18
            },
            {
                id: 105,
                title: "Enchanted Garden",
                type: "image",
                thumbnail: "https://picsum.photos/200/200?random=4",
                favorited: false,
                downloads: 8
            },
            {
                id: 106,
                title: "Mountain Adventure Tale",
                type: "text",
                favorited: true,
                downloads: 15
            }
        ];
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Wish creation buttons
        document.querySelectorAll('.btn--magical').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.createWish(type);
            });
        });

        // Input sparkles effect
        const wishInput = document.getElementById('wish-input');
        wishInput.addEventListener('focus', () => this.startInputSparkles());
        wishInput.addEventListener('blur', () => this.stopInputSparkles());
        wishInput.addEventListener('input', () => this.updateInputSparkles());

        // Gallery filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterGallery(e.target.dataset.filter);
            });
        });

        // Settings
        document.getElementById('image-model').addEventListener('change', (e) => {
            this.settings.imageModel = e.target.value;
            this.saveSettings();
        });

        document.getElementById('audio-quality').addEventListener('change', (e) => {
            this.settings.audioQuality = e.target.value;
            this.saveSettings();
        });

        document.getElementById('particles-enabled').addEventListener('change', (e) => {
            this.settings.particlesEnabled = e.target.checked;
            this.toggleParticles();
            this.saveSettings();
        });

        document.getElementById('animations-enabled').addEventListener('change', (e) => {
            this.settings.animationsEnabled = e.target.checked;
            this.toggleAnimations();
            this.saveSettings();
        });

        // Modal close
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            this.closeSuccessModal();
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Render section-specific content
        this.renderSection(sectionName);
    }

    renderSection(sectionName) {
        switch(sectionName) {
            case 'home':
                this.renderActiveWishes();
                this.renderCompletedWishes();
                break;
            case 'wishes':
                this.renderAllWishes();
                break;
            case 'gallery':
                this.renderGallery();
                break;
        }
    }

    renderAllSections() {
        this.renderActiveWishes();
        this.renderCompletedWishes();
        this.renderAllWishes();
        this.renderGallery();
    }

    createWish(type) {
        const input = document.getElementById('wish-input');
        const text = input.value.trim();

        if (!text) {
            this.showNotification('Please enter your creative wish first!', 'warning');
            input.focus();
            return;
        }

        const wish = {
            id: this.currentWishId++,
            text: text,
            type: type,
            status: 'queued',
            progress: 0,
            createdAt: new Date().toISOString(),
            favorited: false,
            downloads: 0
        };

        this.wishes.unshift(wish);
        input.value = '';
        
        this.showSuccessModal(`Your ${type} creation wish has been granted!`);
        this.simulateWishProcessing(wish);
        this.renderAllSections();
        this.updateStats();
    }

    simulateWishProcessing(wish) {
        // Simulate processing stages
        setTimeout(() => {
            wish.status = 'processing';
            wish.progress = 25;
            this.renderAllSections();
        }, 1000);

        setTimeout(() => {
            wish.progress = 50;
            this.renderAllSections();
        }, 2000);

        setTimeout(() => {
            wish.progress = 75;
            this.renderAllSections();
        }, 3000);

        setTimeout(() => {
            wish.status = 'completed';
            wish.progress = 100;
            
            if (wish.type === 'image') {
                wish.thumbnail = `https://picsum.photos/150/150?random=${wish.id}`;
            } else if (wish.type === 'audio') {
                wish.duration = this.generateRandomDuration();
            } else if (wish.type === 'text') {
                wish.wordCount = Math.floor(Math.random() * 500) + 100;
            }
            
            this.renderAllSections();
            this.updateStats();
            this.showNotification('Wish completed! ✨', 'success');
        }, 4000);
    }

    generateRandomDuration() {
        const minutes = Math.floor(Math.random() * 5) + 1;
        const seconds = Math.floor(Math.random() * 59);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    renderActiveWishes() {
        const container = document.getElementById('active-wishes');
        const activeWishes = this.wishes.filter(w => w.status === 'queued' || w.status === 'processing');
        
        if (activeWishes.length === 0) {
            container.innerHTML = '<div class="empty-state">No active wishes at the moment. Make a wish above! ✨</div>';
            return;
        }

        container.innerHTML = activeWishes.map(wish => this.createWishCard(wish)).join('');
    }

    renderCompletedWishes() {
        const container = document.getElementById('completed-wishes');
        const completedWishes = this.wishes.filter(w => w.status === 'completed').slice(0, 6);
        
        container.innerHTML = completedWishes.map(wish => this.createWishCard(wish)).join('');
    }

    renderAllWishes() {
        const container = document.getElementById('all-wishes-container');
        container.innerHTML = this.wishes.map(wish => this.createWishCard(wish)).join('');
    }

    createWishCard(wish) {
        const typeClass = `wish-type--${wish.type}`;
        const typeIcon = {
            image: '🖼️',
            audio: '🎵',
            text: '📜'
        };

        let progressSection = '';
        if (wish.status === 'processing') {
            progressSection = `
                <div class="wish-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${wish.progress}%"></div>
                    </div>
                    <span class="progress-text">${wish.progress}%</span>
                </div>
            `;
        } else if (wish.status === 'queued') {
            progressSection = '<div class="progress-text">In queue...</div>';
        } else if (wish.status === 'completed') {
            let completedInfo = '';
            if (wish.type === 'audio' && wish.duration) {
                completedInfo = `<span class="progress-text">Duration: ${wish.duration}</span>`;
            } else if (wish.type === 'text' && wish.wordCount) {
                completedInfo = `<span class="progress-text">${wish.wordCount} words</span>`;
            } else if (wish.type === 'image') {
                completedInfo = '<span class="progress-text">Ready to view</span>';
            }
            progressSection = completedInfo;
        }

        const thumbnail = wish.thumbnail ? 
            `<img src="${wish.thumbnail}" alt="${wish.text}" class="wish-thumbnail">` : 
            `<div class="wish-thumbnail" style="background: linear-gradient(45deg, rgba(155, 89, 182, 0.3), rgba(52, 152, 219, 0.3)); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">${typeIcon[wish.type]}</div>`;

        return `
            <div class="wish-card" data-wish-id="${wish.id}">
                <div class="wish-header">
                    <span class="wish-type ${typeClass}">${typeIcon[wish.type]} ${wish.type.charAt(0).toUpperCase() + wish.type.slice(1)}</span>
                    ${wish.status === 'completed' ? 
                        `<button class="favorite-btn ${wish.favorited ? 'favorited' : ''}" onclick="app.toggleFavorite(${wish.id}, 'wish')">
                            ${wish.favorited ? '❤️' : '🤍'}
                        </button>` : ''
                    }
                </div>
                <div class="wish-content" style="display: flex; gap: 12px; align-items: center;">
                    <div style="flex: 1;">
                        <div class="wish-text">${wish.text}</div>
                        ${progressSection}
                    </div>
                    ${wish.status === 'completed' ? thumbnail : ''}
                </div>
            </div>
        `;
    }

    renderGallery(filter = 'all') {
        const container = document.getElementById('gallery-items');
        let items = [...this.galleryItems];

        // Add completed wishes to gallery
        const completedWishes = this.wishes.filter(w => w.status === 'completed');
        completedWishes.forEach(wish => {
            items.push({
                id: `wish-${wish.id}`,
                title: wish.text,
                type: wish.type,
                thumbnail: wish.thumbnail,
                favorited: wish.favorited,
                downloads: wish.downloads || 0,
                duration: wish.duration,
                wordCount: wish.wordCount
            });
        });

        if (filter !== 'all') {
            if (filter === 'favorited') {
                items = items.filter(item => item.favorited);
            } else {
                items = items.filter(item => item.type === filter);
            }
        }

        container.innerHTML = items.map(item => this.createGalleryItem(item)).join('');
    }

    createGalleryItem(item) {
        const typeIcons = {
            image: '🖼️',
            audio: '🎵',
            text: '📜'
        };

        let thumbnail;
        if (item.type === 'image' && item.thumbnail) {
            thumbnail = `<img src="${item.thumbnail}" alt="${item.title}" class="gallery-thumbnail">`;
        } else {
            thumbnail = `<div class="gallery-thumbnail">${typeIcons[item.type]}</div>`;
        }

        let metadata = '';
        if (item.type === 'audio' && item.duration) {
            metadata = `<span>${item.duration}</span>`;
        } else if (item.type === 'text' && item.wordCount) {
            metadata = `<span>${item.wordCount} words</span>`;
        } else if (item.type === 'image') {
            metadata = `<span>${item.downloads || 0} downloads</span>`;
        }

        return `
            <div class="gallery-item" data-item-id="${item.id}">
                ${thumbnail}
                <div class="gallery-content">
                    <h4 class="gallery-title">${item.title}</h4>
                    <div class="gallery-meta">
                        <span class="gallery-type wish-type wish-type--${item.type}">${item.type}</span>
                        <button class="favorite-btn ${item.favorited ? 'favorited' : ''}" onclick="app.toggleFavorite('${item.id}', 'gallery')">
                            ${item.favorited ? '❤️' : '🤍'}
                        </button>
                    </div>
                    ${metadata}
                </div>
            </div>
        `;
    }

    filterGallery(filter) {
        this.renderGallery(filter);
    }

    toggleFavorite(id, type) {
        if (type === 'wish') {
            const wish = this.wishes.find(w => w.id === parseInt(id));
            if (wish) {
                wish.favorited = !wish.favorited;
            }
        } else if (type === 'gallery') {
            const item = this.galleryItems.find(i => i.id == id);
            if (item) {
                item.favorited = !item.favorited;
            } else {
                // Check in wishes converted to gallery items
                const wishId = id.toString().replace('wish-', '');
                const wish = this.wishes.find(w => w.id === parseInt(wishId));
                if (wish) {
                    wish.favorited = !wish.favorited;
                }
            }
        }
        
        this.renderAllSections();
        this.updateStats();
    }

    updateStats() {
        const totalWishes = this.wishes.length;
        const completedCount = this.wishes.filter(w => w.status === 'completed').length;
        const favoritesCount = this.wishes.filter(w => w.favorited).length + 
                              this.galleryItems.filter(i => i.favorited).length;

        document.getElementById('total-wishes').textContent = totalWishes;
        document.getElementById('completed-count').textContent = completedCount;
        document.getElementById('favorites-count').textContent = favoritesCount;
    }

    createMagicParticles() {
        if (!this.settings.particlesEnabled) return;

        const particlesContainer = document.querySelector('.magic-particles');
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 215, 0, 0.8);
                border-radius: 50%;
                pointer-events: none;
                animation: float-particle ${Math.random() * 10 + 5}s linear infinite;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
            `;
            particlesContainer.appendChild(particle);
        }

        // Add particle animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float-particle {
                0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    startInputSparkles() {
        const sparklesContainer = document.querySelector('.input-sparkles');
        sparklesContainer.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #FFD700;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: sparkle-twinkle 1s ease-in-out infinite alternate;
                animation-delay: ${Math.random() * 1}s;
            `;
            sparklesContainer.appendChild(sparkle);
        }
    }

    stopInputSparkles() {
        const sparklesContainer = document.querySelector('.input-sparkles');
        sparklesContainer.innerHTML = '';
    }

    updateInputSparkles() {
        const input = document.getElementById('wish-input');
        if (input.value.length > 0 && document.activeElement === input) {
            this.startInputSparkles();
        }
    }

    startSparkleAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes sparkle-twinkle {
                0% { opacity: 0; transform: scale(0); }
                100% { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    showSuccessModal(message) {
        const modal = document.getElementById('success-modal');
        const messageEl = document.getElementById('success-message');
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        
        // Auto close after 3 seconds
        setTimeout(() => {
            this.closeSuccessModal();
        }, 3000);
    }

    closeSuccessModal() {
        document.getElementById('success-modal').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(78, 205, 196, 0.9)' : 
                        type === 'warning' ? 'rgba(255, 193, 7, 0.9)' : 
                        'rgba(52, 152, 219, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }

    toggleParticles() {
        const particlesContainer = document.querySelector('.magic-particles');
        if (this.settings.particlesEnabled) {
            particlesContainer.innerHTML = '';
            this.createMagicParticles();
        } else {
            particlesContainer.innerHTML = '';
        }
    }

    toggleAnimations() {
        const body = document.body;
        if (this.settings.animationsEnabled) {
            body.classList.remove('no-animations');
        } else {
            body.classList.add('no-animations');
        }
    }

    saveSettings() {
        // In a real app, this would save to a backend or localStorage
        // For now, we'll just store in memory
        console.log('Settings saved:', this.settings);
    }
}

// Global functions for onclick handlers
function closeSuccessModal() {
    app.closeSuccessModal();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GjinnApp();
});

// Add some CSS for disabled animations
const noAnimationsStyle = document.createElement('style');
noAnimationsStyle.textContent = `
    .no-animations * {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
    }
`;
document.head.appendChild(noAnimationsStyle);