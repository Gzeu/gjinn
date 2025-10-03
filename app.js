// Gjinn AI Genie Application
class GjinnApp {
    constructor() {
        // Initialize Pollination
        this.pollination = window.Pollinations;
        
        // State management
        this.state = {
            wishes: [],
            galleryItems: [],
            currentWishId: 1,
            isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
            isLoading: false,
            error: null,
            currentModel: CONFIG.POLLINATION.MODELS.STABLE_DIFFUSION,
            settings: {
                model: CONFIG.POLLINATION.MODELS.STABLE_DIFFUSION,
                stylePreset: 'fantasy-art',
                steps: 50,
                width: 1024,
                height: 1024,
                seed: -1,
                upscale: true,
                particlesEnabled: true,
                animationsEnabled: true,
                soundEffects: true,
                autoSave: true
            },
            user: {
                isAuthenticated: false,
                name: 'Guest',
                userId: null,
                favorites: new Set(),
                requestCount: 0,
                lastRequestTime: null
            },
            generationStatus: {
                isGenerating: false,
                progress: 0,
                currentPrompt: '',
                estimatedTimeRemaining: null
            }
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Initialize the app
        this.init();
    }

    async init() {
        try {
            // Initialize UI
            this.setupEventListeners();
            this.createMagicParticles();
            this.startSparkleAnimation();
            
            // Load user data and settings
            await this.loadUserData();
            
            // Load gallery items
            await this.loadGalleryItems();
            
            // Update UI
            this.updateStats();
            this.renderAllSections();
            
            // Initialize Pollination
            await this.initializePollination();
            
            console.log('Gjinn initialized successfully');
        } catch (error) {
            console.error('Error initializing Gjinn:', error);
            this.handleError(error, 'init');
        }
    }
    
    /**
     * Initialize Pollination with API key if needed
     */
    async initializePollination() {
        try {
            // Check if we have a stored API key
            const apiKey = localStorage.getItem('pollination_api_key');
            if (apiKey) {
                this.pollination.configure({ apiKey });
            }
            
            // Check API status
            const status = await this.pollination.status();
            console.log('Pollination API status:', status);
            
            return true;
        } catch (error) {
            console.warn('Pollination initialization warning:', error.message);
            // Continue without API key (using public endpoint with limitations)
            return false;
        }
    }
    
    /**
     * Generate an image using Pollination
     * @param {string} prompt - The text prompt for image generation
     * @param {object} options - Generation options
     */
    async generateImage(prompt, options = {}) {
        if (!prompt || prompt.trim() === '') {
            throw new Error('Prompt cannot be empty');
        }
        
        // Check rate limiting
        if (!this.canMakeRequest()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        try {
            // Update UI state
            this.setState({
                generationStatus: {
                    isGenerating: true,
                    progress: 0,
                    currentPrompt: prompt,
                    estimatedTimeRemaining: 'Calculating...'
                },
                isLoading: true
            });
            
            // Prepare generation options
            const generationOptions = {
                model: this.state.settings.model,
                prompt: prompt,
                ...CONFIG.POLLINATION.DEFAULT_SETTINGS,
                ...options,
                // Override with user settings
                width: this.state.settings.width,
                height: this.state.settings.height,
                steps: this.state.settings.steps,
                seed: this.state.settings.seed === -1 ? Math.floor(Math.random() * 1000000) : this.state.settings.seed
            };
            
            // Track start time
            const startTime = Date.now();
            
            // Start generation
            const result = await this.pollination.generate(generationOptions, 
                // Progress callback
                (progress) => {
                    this.updateGenerationProgress(progress, startTime);
                }
            );
            
            // Save the generated image
            const imageData = {
                id: `img_${Date.now()}`,
                prompt: prompt,
                imageUrl: result.url,
                model: generationOptions.model,
                timestamp: new Date().toISOString(),
                settings: generationOptions,
                userId: this.state.user.userId,
                isPublic: this.state.user.isAuthenticated
            };
            
            // Save to Supabase if authenticated
            if (this.state.user.isAuthenticated) {
                await this.saveImageToSupabase(imageData);
            }
            
            // Add to gallery
            this.addToGallery(imageData);
            
            // Update request count
            this.updateRequestCount();
            
            return imageData;
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.handleError(error, 'generateImage');
            throw error;
        } finally {
            // Reset generation status
            this.setState({
                generationStatus: {
                    isGenerating: false,
                    progress: 0,
                    currentPrompt: '',
                    estimatedTimeRemaining: null
                },
                isLoading: false
            });
        }
    }
    
    /**
     * Update generation progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {number} startTime - Timestamp when generation started
     */
    updateGenerationProgress(progress, startTime) {
        const elapsed = (Date.now() - startTime) / 1000; // in seconds
        const estimatedTotal = (elapsed * 100) / Math.max(progress, 1);
        const remaining = Math.max(0, estimatedTotal - elapsed);
        
        this.setState({
            generationStatus: {
                ...this.state.generationStatus,
                progress: Math.min(progress, 100),
                estimatedTimeRemaining: this.formatTimeRemaining(remaining)
            }
        });
    }
    
    /**
     * Format time remaining in a human-readable format
     */
    formatTimeRemaining(seconds) {
        if (isNaN(seconds) || seconds === 0) return 'Calculating...';
        if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    /**
     * Check if user can make a new request based on rate limiting
     */
    canMakeRequest() {
        const { user } = this.state;
        const now = Date.now();
        
        // Reset counter if it's been more than an hour since last request
        if (user.lastRequestTime && (now - user.lastRequestTime) > 3600000) {
            this.setState({
                user: {
                    ...user,
                    requestCount: 0,
                    lastRequestTime: now
                }
            });
            return true;
        }
        
        // Check if user has remaining requests
        return user.requestCount < CONFIG.APP.MAX_REQUESTS_PER_HOUR;
    }
    
    /**
     * Update request count and last request time
     */
    updateRequestCount() {
        const { user } = this.state;
        this.setState({
            user: {
                ...user,
                requestCount: (user.requestCount || 0) + 1,
                lastRequestTime: Date.now()
            }
        });
    }
    
    /**
     * Save image data to Supabase
     */
    async saveImageToSupabase(imageData) {
        try {
            const { data, error } = await supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .insert([{
                    user_id: this.state.user.userId,
                    prompt: imageData.prompt,
                    image_url: imageData.imageUrl,
                    model: imageData.model,
                    settings: imageData.settings,
                    is_public: imageData.isPublic
                }]);
                
            if (error) throw error;
            
            console.log('Image saved to Supabase:', data);
            return data;
        } catch (error) {
            console.error('Error saving image to Supabase:', error);
            throw error;
        }
    }
    
    /**
     * Load gallery items from Supabase or local storage
     */
    async loadGalleryItems() {
        try {
            let items = [];
            
            if (this.state.user.isAuthenticated) {
                // Load from Supabase
                const { data, error } = await supabase
                    .from(CONFIG.SUPABASE.TABLES.IMAGES)
                    .select('*')
                    .or(`user_id.eq.${this.state.user.userId},is_public.eq.true`)
                    .order('created_at', { ascending: false });
                    
                if (error) throw error;
                
                items = data || [];
            } else {
                // Load from local storage
                const savedItems = localStorage.getItem('gjinn_gallery');
                items = savedItems ? JSON.parse(savedItems) : [];
            }
            
            this.setState({
                galleryItems: items,
                currentWishId: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1
            });
            
            return items;
        } catch (error) {
            console.error('Error loading gallery items:', error);
            this.handleError(error, 'loadGalleryItems');
            return [];
        }
    }
    
    /**
     * Add an image to the gallery
     */
    addToGallery(imageData) {
        const newGallery = [imageData, ...this.state.galleryItems];
        
        // Update state
        this.setState({
            galleryItems: newGallery,
            currentWishId: this.state.currentWishId + 1
        });
        
        // Persist to local storage if not authenticated
        if (!this.state.user.isAuthenticated) {
            localStorage.setItem('gjinn_gallery', JSON.stringify(newGallery));
        }
        
        // Update UI
        this.renderGallery();
    }
    
    /**
     * Load user data from Supabase or local storage
     */
    async loadUserData() {
        try {
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // User is authenticated
                const userData = {
                    isAuthenticated: true,
                    userId: session.user.id,
                    name: session.user.email?.split('@')[0] || 'User',
                    email: session.user.email,
                    favorites: new Set(),
                    requestCount: 0,
                    lastRequestTime: null
                };
                
                // Load user preferences
                const { data: preferences } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();
                    
                if (preferences) {
                    // Apply user preferences
                    this.setState({
                        settings: {
                            ...this.state.settings,
                            ...preferences.settings
                        },
                        isDarkMode: preferences.dark_mode || false
                    });
                }
                
                this.setState({ user: userData });
                return userData;
            } else {
                // Not authenticated, use local storage
                const savedData = localStorage.getItem('gjinn_user');
                if (savedData) {
                    const userData = JSON.parse(savedData);
                    this.setState({
                        user: {
                            ...userData,
                            favorites: new Set(userData.favorites || [])
                        }
                    });
                    return userData;
                }
                return null;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleError(error, 'loadUserData');
            return null;
        }
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