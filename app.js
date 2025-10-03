// Gjinn AI Genie Application - Fixed Navigation
// Import daily prompts if available
let DailyPrompts;
if (typeof module !== 'undefined' && module.exports) {
    const { DailyPrompts: DP } = require('./js/daily-prompts.js');
    DailyPrompts = DP;
} else {
    // Browser environment - will be loaded via script tag
}

class GjinnApp {
    constructor() {
        // Initialize Pollination
        this.pollination = window.Pollinations;
        
        // Initialize daily prompts system
        this.initializeDailyPrompts();
        
        // State management
        this.state = {
            wishes: [],
            galleryItems: [],
            currentWishId: 1,
            isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
            isLoading: false,
            error: null,
            currentModel: window.CONFIG?.POLLINATION?.MODELS?.DEFAULT || 'flux',
            settings: {
                model: window.CONFIG?.POLLINATION?.MODELS?.DEFAULT || 'flux',
                stylePreset: 'fantasy-art',
                steps: 50,
                width: 1024,
                height: 1024,
                seed: -1,
                upscale: true,
                particlesEnabled: true,
                animationsEnabled: true,
                soundEffects: true,
                autoSave: true,
                showDailyPrompts: true
            },
            user: {
                isAuthenticated: false,
                name: 'Guest',
                userId: null,
                favorites: new Set(),
                requestCount: 0,
                lastRequestTime: null,
                completionStreak: 0
            },
            generationStatus: {
                isGenerating: false,
                progress: 0,
                currentPrompt: '',
                estimatedTimeRemaining: null
            },
            dailyPrompt: null,
            currentSection: 'home'
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
        this.handleError = this.handleError.bind(this);
        this.showSection = this.showSection.bind(this);
        this.createWish = this.createWish.bind(this);
        
        // Initialize the app
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Gjinn...');
            
            // Initialize UI first
            this.setupEventListeners();
            this.createMagicParticles();
            this.startSparkleAnimation();
            
            // Load sample data initially
            this.loadSampleData();
            
            // Load user data and settings
            await this.loadUserData();
            
            // Load gallery items
            await this.loadGalleryItems();
            
            // Initialize daily prompt
            this.initializeTodaysPrompt();
            
            // Update UI
            this.updateStats();
            this.renderAllSections();
            
            // Initialize database connection
            await this.initializeDatabase();
            
            console.log('✅ Gjinn initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Gjinn:', error);
            this.handleError(error, 'init');
        }
    }

    async initializeDatabase() {
        try {
            // Check if database operations are available
            if (window.dbOps) {
                console.log('✅ Database operations available');
                return true;
            } else {
                console.log('ℹ️ Database not available - using localStorage only');
                return false;
            }
        } catch (error) {
            console.warn('⚠️ Database initialization warning:', error);
            return false;
        }
    }

    setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        // Navigation - Fixed implementation
        const navLinks = document.querySelectorAll('.nav-link');
        console.log(`Found ${navLinks.length} navigation links`);
        
        navLinks.forEach((link, index) => {
            const section = link.dataset.section;
            console.log(`Setting up nav link ${index}: ${section}`);
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Navigation clicked: ${section}`);
                this.showSection(section);
            });
        });

        // Wish creation buttons - Fixed implementation
        const magicalBtns = document.querySelectorAll('.btn--magical');
        console.log(`Found ${magicalBtns.length} magical buttons`);
        
        magicalBtns.forEach((btn, index) => {
            const type = btn.dataset.type;
            console.log(`Setting up magical button ${index}: ${type}`);
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Magical button clicked: ${type}`);
                this.createWish(type);
            });
        });

        // Input sparkles effect
        const wishInput = document.getElementById('wish-input');
        if (wishInput) {
            wishInput.addEventListener('focus', () => this.startInputSparkles());
            wishInput.addEventListener('blur', () => this.stopInputSparkles());
            wishInput.addEventListener('input', () => this.updateInputSparkles());
            console.log('✅ Wish input events set up');
        } else {
            console.warn('⚠️ Wish input not found');
        }

        // Gallery filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterGallery(e.target.dataset.filter);
            });
        });

        // Settings event listeners
        this.setupSettingsListeners();
        
        // Auth event listeners
        this.setupAuthListeners();
        
        console.log('✅ All event listeners set up successfully');
    }
    
    setupSettingsListeners() {
        // Model selection
        const imageModel = document.getElementById('image-model');
        if (imageModel) {
            imageModel.addEventListener('change', (e) => {
                this.state.settings.model = e.target.value;
                this.saveSettings();
            });
        }

        // Checkbox settings
        const checkboxSettings = [
            { id: 'particles-enabled', key: 'particlesEnabled', callback: () => this.toggleParticles() },
            { id: 'animations-enabled', key: 'animationsEnabled', callback: () => this.toggleAnimations() },
            { id: 'sound-effects', key: 'soundEffects' },
            { id: 'daily-prompts-enabled', key: 'showDailyPrompts', callback: () => this.renderDailyPrompt() },
            { id: 'auto-save', key: 'autoSave' }
        ];
        
        checkboxSettings.forEach(setting => {
            const element = document.getElementById(setting.id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.state.settings[setting.key] = e.target.checked;
                    if (setting.callback) setting.callback();
                    this.saveSettings();
                });
            }
        });
    }
    
    setupAuthListeners() {
        // Sign in buttons
        const signinGoogle = document.getElementById('signin-google');
        if (signinGoogle) {
            signinGoogle.addEventListener('click', () => this.signInWithGoogle());
        }
        
        const signinGithub = document.getElementById('signin-github');
        if (signinGithub) {
            signinGithub.addEventListener('click', () => this.signInWithGithub());
        }
        
        // Modal controls
        const authSignin = document.getElementById('auth-signin');
        if (authSignin) {
            authSignin.addEventListener('click', () => this.showAuthModal('signin'));
        }
        
        const authSignup = document.getElementById('auth-signup');
        if (authSignup) {
            authSignup.addEventListener('click', () => this.showAuthModal('signup'));
        }
        
        const authSignout = document.getElementById('auth-signout');
        if (authSignout) {
            authSignout.addEventListener('click', () => this.signOut());
        }
        
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeAuthModal());
        }
        
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeAuthModal());
        }
    }

    showSection(sectionName) {
        console.log(`📋 Showing section: ${sectionName}`);
        
        // Update state
        this.state.currentSection = sectionName;
        
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`✅ Section ${sectionName} activated`);
        } else {
            console.error(`❌ Section ${sectionName} not found`);
            return;
        }

        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const targetNav = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
            console.log(`✅ Navigation ${sectionName} activated`);
        }

        // Render section-specific content
        this.renderSection(sectionName);
    }

    renderSection(sectionName) {
        console.log(`🎨 Rendering section: ${sectionName}`);
        
        switch(sectionName) {
            case 'home':
                this.renderActiveWishes();
                this.renderCompletedWishes();
                this.renderDailyPrompt();
                break;
            case 'wishes':
                this.renderAllWishes();
                break;
            case 'gallery':
                this.renderGallery();
                break;
            case 'settings':
                this.loadSettingsValues();
                break;
        }
    }
    
    loadSettingsValues() {
        // Load current settings into form elements
        const imageModel = document.getElementById('image-model');
        if (imageModel) {
            imageModel.value = this.state.settings.model;
        }
        
        // Load checkbox values
        const checkboxes = {
            'particles-enabled': this.state.settings.particlesEnabled,
            'animations-enabled': this.state.settings.animationsEnabled,
            'sound-effects': this.state.settings.soundEffects,
            'daily-prompts-enabled': this.state.settings.showDailyPrompts,
            'auto-save': this.state.settings.autoSave
        };
        
        Object.entries(checkboxes).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = value;
            }
        });
    }

    createWish(type) {
        console.log(`✨ Creating wish of type: ${type}`);
        
        const input = document.getElementById('wish-input');
        const text = input ? input.value.trim() : '';

        if (!text) {
            this.showNotification('Please enter your creative wish first!', 'warning');
            if (input) input.focus();
            return;
        }

        const wish = {
            id: this.state.currentWishId++,
            text: text,
            type: type,
            status: 'queued',
            progress: 0,
            createdAt: new Date().toISOString(),
            favorited: false,
            downloads: 0
        };

        this.state.wishes.unshift(wish);
        if (input) input.value = '';
        
        // Check if this matches today's prompt and mark as completed
        if (this.state.dailyPrompt && text === this.state.dailyPrompt.text) {
            if (this.dailyPrompts.markTodaysPromptCompleted) {
                this.dailyPrompts.markTodaysPromptCompleted(wish.id);
                this.showNotification('🎉 Daily challenge completed! Keep up the streak!', 'success');
                setTimeout(() => this.renderDailyPrompt(), 500);
            }
        }
        
        this.showSuccessModal(`Your ${type} creation wish has been granted!`);
        this.simulateWishProcessing(wish);
        this.renderAllSections();
        this.updateStats();
        
        console.log(`✅ Wish created successfully:`, wish);
    }

    // Authentication methods
    async signInWithGoogle() {
        console.log('🔑 Attempting Google sign in...');
        
        if (window.supabaseIntegration) {
            try {
                await window.supabaseIntegration.signInWithGoogle();
                this.showNotification('Signing in with Google...', 'info');
            } catch (error) {
                console.error('Google sign in error:', error);
                this.showNotification('Sign in failed. Please try again.', 'error');
            }
        } else {
            this.showNotification('Authentication not available', 'warning');
        }
    }
    
    async signInWithGithub() {
        console.log('🔑 Attempting GitHub sign in...');
        
        if (window.supabaseIntegration) {
            try {
                await window.supabaseIntegration.signInWithGitHub();
                this.showNotification('Signing in with GitHub...', 'info');
            } catch (error) {
                console.error('GitHub sign in error:', error);
                this.showNotification('Sign in failed. Please try again.', 'error');
            }
        } else {
            this.showNotification('Authentication not available', 'warning');
        }
    }
    
    async signOut() {
        console.log('🔑 Signing out...');
        
        if (window.supabaseIntegration) {
            try {
                await window.supabaseIntegration.signOut();
                this.showNotification('Signed out successfully', 'success');
                this.updateUserUI();
            } catch (error) {
                console.error('Sign out error:', error);
                this.showNotification('Sign out failed', 'error');
            }
        }
    }
    
    showAuthModal(mode = 'signin') {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Show the correct form
            const forms = modal.querySelectorAll('.auth-form');
            forms.forEach(form => form.classList.remove('active'));
            
            const targetForm = document.getElementById(`${mode}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        }
    }
    
    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    updateUserUI() {
        const isSignedIn = window.supabaseIntegration?.isSignedIn() || false;
        const userDisplayName = window.supabaseIntegration?.getUserDisplayName() || 'Guest';
        
        // Update display name
        const displayNameEl = document.getElementById('user-display-name');
        if (displayNameEl) {
            displayNameEl.textContent = userDisplayName;
        }
        
        // Toggle menu visibility
        const signedOutMenu = document.getElementById('signed-out-menu');
        const signedInMenu = document.getElementById('signed-in-menu');
        
        if (signedOutMenu && signedInMenu) {
            if (isSignedIn) {
                signedOutMenu.classList.add('hidden');
                signedInMenu.classList.remove('hidden');
            } else {
                signedOutMenu.classList.remove('hidden');
                signedInMenu.classList.add('hidden');
            }
        }
    }

    // Rest of the methods remain the same...
    initializeDailyPrompts() {
        try {
            if (window.DailyPrompts) {
                this.dailyPrompts = new window.DailyPrompts();
            } else {
                this.dailyPrompts = {
                    prompts: [
                        { id: 1, type: 'image', text: 'A mystical forest with glowing mushrooms at twilight', category: 'fantasy' },
                        { id: 2, type: 'image', text: 'Floating islands connected by bridges of pure light', category: 'fantasy' },
                        { id: 3, type: 'audio', text: 'The sound of wind chimes in a magical garden', category: 'ambient' }
                    ],
                    getTodaysPrompt() {
                        const dayIndex = new Date().getDate() % this.prompts.length;
                        return { ...this.prompts[dayIndex], isToday: true, date: new Date().toDateString() };
                    }
                };
            }
        } catch (error) {
            console.warn('Could not initialize daily prompts:', error);
        }
    }
    
    initializeTodaysPrompt() {
        if (this.dailyPrompts) {
            try {
                const todaysPrompt = this.dailyPrompts.getTodaysPrompt();
                this.state.dailyPrompt = todaysPrompt;
                this.renderDailyPrompt();
            } catch (error) {
                console.error('Error loading today\'s prompt:', error);
            }
        }
    }

    renderDailyPrompt() {
        const { dailyPrompt, settings } = this.state;
        
        if (!dailyPrompt || !settings.showDailyPrompts) return;
        
        let container = document.getElementById('daily-prompt-container');
        if (!container) {
            container = this.createDailyPromptContainer();
        }
        
        if (!container) return;
        
        const isCompleted = this.dailyPrompts.hasCompletedTodaysPrompt ? 
            this.dailyPrompts.hasCompletedTodaysPrompt() : false;
        
        const streak = this.dailyPrompts.getCompletionStreak ? 
            this.dailyPrompts.getCompletionStreak() : 0;
        
        const typeIcons = {
            image: '🖼️',
            audio: '🎵',
            text: '📜'
        };
        
        container.innerHTML = `
            <div class="daily-prompt-card ${isCompleted ? 'completed' : ''}">
                <div class="daily-prompt-header">
                    <div class="prompt-badge">
                        <span class="prompt-icon">🌟</span>
                        <span>Daily Challenge</span>
                    </div>
                    ${streak > 0 ? `<div class="streak-badge">${streak}🔥</div>` : ''}
                </div>
                <div class="prompt-content">
                    <div class="prompt-type">
                        ${typeIcons[dailyPrompt.type]} ${dailyPrompt.type.charAt(0).toUpperCase() + dailyPrompt.type.slice(1)}
                    </div>
                    <h3 class="prompt-text">${dailyPrompt.text}</h3>
                    ${dailyPrompt.category ? `<span class="prompt-category">${dailyPrompt.category}</span>` : ''}
                </div>
                <div class="prompt-actions">
                    ${isCompleted ? 
                        '<span class="completed-badge">✅ Completed Today!</span>' :
                        `<button class="btn btn--daily-prompt" onclick="app.useDailyPrompt()">
                            <span>Accept Challenge</span>
                            <span class="btn-sparkle">✨</span>
                        </button>`
                    }
                </div>
            </div>
        `;
    }
    
    createDailyPromptContainer() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return null;
        
        const container = document.createElement('div');
        container.id = 'daily-prompt-container';
        container.className = 'daily-prompt-container';
        
        const wishMaker = heroContent.querySelector('.wish-maker');
        if (wishMaker) {
            heroContent.insertBefore(container, wishMaker);
        } else {
            heroContent.appendChild(container);
        }
        
        this.addDailyPromptStyles();
        return container;
    }
    
    addDailyPromptStyles() {
        if (document.getElementById('daily-prompt-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'daily-prompt-styles';
        style.textContent = `
            .daily-prompt-container {
                margin: 2rem 0;
            }
            
            .daily-prompt-card {
                background: linear-gradient(135deg, rgba(116, 58, 213, 0.15), rgba(159, 122, 234, 0.1));
                border: 2px solid rgba(116, 58, 213, 0.3);
                border-radius: 16px;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            .daily-prompt-card:hover {
                border-color: rgba(116, 58, 213, 0.5);
                box-shadow: 0 8px 32px rgba(116, 58, 213, 0.2);
                transform: translateY(-2px);
            }
            
            .daily-prompt-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .prompt-badge {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(116, 58, 213, 0.2);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
                color: #9F7AEA;
            }
            
            .streak-badge {
                background: linear-gradient(45deg, #FF6B35, #FF8E53);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-weight: 600;
                font-size: 0.875rem;
            }
            
            .btn--daily-prompt {
                background: linear-gradient(135deg, #9F7AEA, #B794F6);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .btn--daily-prompt:hover {
                background: linear-gradient(135deg, #8B5CF6, #A78BFA);
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
    
    useDailyPrompt() {
        const { dailyPrompt } = this.state;
        if (!dailyPrompt) return;
        
        const wishInput = document.getElementById('wish-input');
        if (wishInput) {
            wishInput.value = dailyPrompt.text;
            wishInput.focus();
        }
        
        this.showNotification('Daily prompt loaded! Ready to create? ✨', 'success');
        this.highlightCreateButtons(dailyPrompt.type);
    }
    
    highlightCreateButtons(preferredType) {
        document.querySelectorAll('.btn--magical').forEach(btn => {
            btn.classList.remove('highlighted', 'preferred');
        });
        
        document.querySelectorAll('.btn--magical').forEach(btn => {
            btn.classList.add('highlighted');
        });
        
        const preferredBtn = document.querySelector(`[data-type="${preferredType}"]`);
        if (preferredBtn) {
            preferredBtn.classList.add('preferred');
        }
        
        setTimeout(() => {
            document.querySelectorAll('.btn--magical').forEach(btn => {
                btn.classList.remove('highlighted');
            });
        }, 2000);
    }

    loadSampleData() {
        this.state.wishes = [
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
            }
        ];

        this.state.galleryItems = [
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
            }
        ];
    }

    simulateWishProcessing(wish) {
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
        if (!container) return;
        
        const activeWishes = this.state.wishes.filter(w => w.status === 'queued' || w.status === 'processing');
        
        if (activeWishes.length === 0) {
            container.innerHTML = '<div class="empty-state">No active wishes at the moment. Make a wish above! ✨</div>';
            return;
        }

        container.innerHTML = activeWishes.map(wish => this.createWishCard(wish)).join('');
    }

    renderCompletedWishes() {
        const container = document.getElementById('completed-wishes');
        if (!container) return;
        
        const completedWishes = this.state.wishes.filter(w => w.status === 'completed').slice(0, 6);
        container.innerHTML = completedWishes.map(wish => this.createWishCard(wish)).join('');
    }

    renderAllWishes() {
        const container = document.getElementById('all-wishes-container');
        if (!container) return;
        
        container.innerHTML = this.state.wishes.map(wish => this.createWishCard(wish)).join('');
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
        if (!container) return;
        
        let items = [...this.state.galleryItems];

        const completedWishes = this.state.wishes.filter(w => w.status === 'completed');
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

    renderAllSections() {
        this.renderActiveWishes();
        this.renderCompletedWishes();
        this.renderAllWishes();
        this.renderGallery();
        this.renderDailyPrompt();
    }

    filterGallery(filter) {
        this.renderGallery(filter);
    }

    toggleFavorite(id, type) {
        if (type === 'wish') {
            const wish = this.state.wishes.find(w => w.id === parseInt(id));
            if (wish) {
                wish.favorited = !wish.favorited;
            }
        } else if (type === 'gallery') {
            const item = this.state.galleryItems.find(i => i.id == id);
            if (item) {
                item.favorited = !item.favorited;
            } else {
                const wishId = id.toString().replace('wish-', '');
                const wish = this.state.wishes.find(w => w.id === parseInt(wishId));
                if (wish) {
                    wish.favorited = !wish.favorited;
                }
            }
        }
        
        this.renderAllSections();
        this.updateStats();
    }

    updateStats() {
        const totalWishes = this.state.wishes.length;
        const completedCount = this.state.wishes.filter(w => w.status === 'completed').length;
        const favoritesCount = this.state.wishes.filter(w => w.favorited).length + 
                              this.state.galleryItems.filter(i => i.favorited).length;

        const totalElement = document.getElementById('total-wishes');
        const completedElement = document.getElementById('completed-count');
        const favoritesElement = document.getElementById('favorites-count');
        
        if (totalElement) totalElement.textContent = totalWishes;
        if (completedElement) completedElement.textContent = completedCount;
        if (favoritesElement) favoritesElement.textContent = favoritesCount;
    }

    async loadUserData() {
        try {
            const savedData = localStorage.getItem('gjinn_user');
            if (savedData) {
                const userData = JSON.parse(savedData);
                this.state.user = {
                    ...this.state.user,
                    ...userData,
                    favorites: new Set(userData.favorites || [])
                };
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleError(error, 'loadUserData');
            return null;
        }
    }

    async loadGalleryItems() {
        try {
            const savedItems = localStorage.getItem('gjinn_gallery');
            const items = savedItems ? JSON.parse(savedItems) : [];
            
            this.state.galleryItems = items;
            this.state.currentWishId = items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
            
            return items;
        } catch (error) {
            console.error('Error loading gallery items:', error);
            this.handleError(error, 'loadGalleryItems');
            return [];
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gjinn_settings', JSON.stringify(this.state.settings));
            console.log('Settings saved:', this.state.settings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    createMagicParticles() {
        if (!this.state.settings.particlesEnabled) return;

        const particlesContainer = document.querySelector('.magic-particles');
        if (!particlesContainer) return;
        
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

        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
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
    }

    startInputSparkles() {
        const sparklesContainer = document.querySelector('.input-sparkles');
        if (!sparklesContainer) return;
        
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
        if (sparklesContainer) {
            sparklesContainer.innerHTML = '';
        }
    }

    updateInputSparkles() {
        const input = document.getElementById('wish-input');
        if (input && input.value.length > 0 && document.activeElement === input) {
            this.startInputSparkles();
        }
    }

    startSparkleAnimation() {
        if (!document.getElementById('sparkle-styles')) {
            const style = document.createElement('style');
            style.id = 'sparkle-styles';
            style.textContent = `
                @keyframes sparkle-twinkle {
                    0% { opacity: 0; transform: scale(0); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showSuccessModal(message) {
        const modal = document.getElementById('success-modal');
        const messageEl = document.getElementById('success-message');
        
        if (modal && messageEl) {
            messageEl.textContent = message;
            modal.classList.remove('hidden');
            
            setTimeout(() => {
                this.closeSuccessModal();
            }, 3000);
        }
    }

    closeSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                        type === 'warning' ? 'rgba(251, 191, 36, 0.9)' : 
                        type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                        'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);

        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
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
    }

    toggleParticles() {
        const particlesContainer = document.querySelector('.magic-particles');
        if (!particlesContainer) return;
        
        if (this.state.settings.particlesEnabled) {
            particlesContainer.innerHTML = '';
            this.createMagicParticles();
        } else {
            particlesContainer.innerHTML = '';
        }
    }

    toggleAnimations() {
        const body = document.body;
        if (this.state.settings.animationsEnabled) {
            body.classList.remove('no-animations');
        } else {
            body.classList.add('no-animations');
        }
    }

    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        this.state.error = error.message;
        this.showNotification(`An error occurred: ${error.message}`, 'error');
    }
}

// Global functions for onclick handlers
function closeSuccessModal() {
    if (window.app) {
        app.closeSuccessModal();
    }
}

// Listen for user authentication events
if (typeof window !== 'undefined') {
    window.addEventListener('userSignedIn', (event) => {
        console.log('👤 User signed in:', event.detail);
        if (window.app) {
            window.app.updateUserUI();
            window.app.showNotification('Welcome! You\'re now signed in.', 'success');
        }
    });
    
    window.addEventListener('userSignedOut', () => {
        console.log('👤 User signed out');
        if (window.app) {
            window.app.updateUserUI();
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Gjinn...');
    window.app = new GjinnApp();
});

// Add CSS for disabled animations
if (!document.getElementById('no-animations-styles')) {
    const noAnimationsStyle = document.createElement('style');
    noAnimationsStyle.id = 'no-animations-styles';
    noAnimationsStyle.textContent = `
        .no-animations * {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
    `;
    document.head.appendChild(noAnimationsStyle);
}