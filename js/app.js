// Main application entry point
import { AuthManager } from './auth.js';

class GjinnApp {
    constructor() {
        // Initialize state
        this.state = {
            isInitialized: false,
            isGenerating: false,
            currentModel: 'stable-diffusion-xl',
            settings: {
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
                apiKey: localStorage.getItem('pollinations_api_key') || '',
                saveToCloud: true,
                autoSave: true,
                notifications: true
            },
            user: {
                isAuthenticated: false,
                name: 'Guest',
                email: '',
                avatar: '👤',
                favorites: []
            },
            generations: []
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.showNotification = this.showNotification.bind(this);
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        try {
            // Initialize auth
            this.authManager = new AuthManager();
            
            // Load saved state
            await this.loadState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI based on initial state
            this.updateUI();
            
            // Check for saved API key
            if (this.state.settings.apiKey) {
                // Initialize Pollination with saved API key if available
                if (window.Pollinations) {
                    window.Pollinations.configure({ apiKey: this.state.settings.apiKey });
                }
            }
            
            // Mark as initialized
            this.state.isInitialized = true;
            
            console.log('Gjinn app initialized');
            
        } catch (error) {
            console.error('Error initializing Gjinn app:', error);
            this.showNotification('Failed to initialize the application', 'error');
        }
    }
    
    async loadState() {
        try {
            const savedState = localStorage.getItem('gjinn_app_state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state = {
                    ...this.state,
                    ...parsedState,
                    // Don't override certain states
                    isInitialized: this.state.isInitialized,
                    isGenerating: this.state.isGenerating
                };
            }
            
            // Apply dark mode if enabled
            if (this.state.settings.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
            
        } catch (error) {
            console.error('Error loading app state:', error);
        }
    }
    
    saveState() {
        try {
            // Don't save everything, just what's needed
            const stateToSave = {
                settings: this.state.settings,
                user: this.state.user,
                currentModel: this.state.currentModel,
                generations: this.state.generations
            };
            
            localStorage.setItem('gjinn_app_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving app state:', error);
        }
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleDarkMode);
        }
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Listen for auth state changes
        window.addEventListener('auth-state-changed', (e) => {
            this.state.user = {
                ...this.state.user,
                isAuthenticated: e.detail.isAuthenticated,
                name: e.detail.user?.user_metadata?.full_name || e.detail.user?.email?.split('@')[0] || 'User',
                email: e.detail.user?.email || '',
                avatar: e.detail.user?.user_metadata?.avatar_url || '👤'
            };
            
            this.updateUI();
            this.saveState();
        });
    }
    
    toggleDarkMode() {
        this.state.settings.darkMode = !this.state.settings.darkMode;
        
        if (this.state.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        this.saveState();
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Deactivate all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show the selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
        
        // Activate the clicked nav link
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update URL without page reload
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
    
    updateUI() {
        // Update theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.state.settings.darkMode ? '☀️' : '🌙';
        }
        
        // Update user info in UI if needed
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            if (this.state.user.isAuthenticated) {
                userInfo.innerHTML = `
                    <span class="user-avatar">${this.state.user.avatar}</span>
                    <span class="user-name">${this.state.user.name}</span>
                `;
            } else {
                userInfo.innerHTML = `
                    <span class="user-avatar">👤</span>
                    <span class="user-name">Guest</span>
                `;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page that needs the app
    if (document.getElementById('app')) {
        window.gjinnApp = new GjinnApp();
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
        window.gjinnApp?.showSection(e.state.section);
    }
});
