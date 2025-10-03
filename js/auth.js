import { supabase } from './config.js';

class AuthManager {
    constructor() {
        // DOM Elements
        this.authModal = document.getElementById('auth-modal');
        this.userMenuButton = document.getElementById('user-menu-button');
        this.userMenu = document.getElementById('user-menu');
        this.authSignIn = document.getElementById('auth-signin');
        this.authSignUp = document.getElementById('auth-signup');
        this.signInForm = document.getElementById('signin-form');
        this.signUpForm = document.getElementById('signup-form');
        this.forgotPasswordForm = document.getElementById('forgot-password-form');
        this.switchToSignUp = document.getElementById('switch-to-signup');
        this.switchToSignIn = document.getElementById('switch-to-signin');
        this.forgotPassword = document.getElementById('forgot-password');
        this.switchToSignInFromForgot = document.getElementById('switch-to-signin-from-forgot');
        this.modalClose = document.querySelectorAll('.modal-close');
        this.signOutButton = document.getElementById('signout-button');
        
        // State
        this.user = null;
        this.session = null;
        
        // Initialize
        this.initEventListeners();
        this.initAuthStateListener();
        
        // Check initial auth state
        this.getSession();
    
    initEventListeners() {
        // Toggle user menu
        if (this.userMenuButton) {
            this.userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = this.userMenuButton.getAttribute('aria-expanded') === 'true';
                this.userMenuButton.setAttribute('aria-expanded', !isExpanded);
                this.userMenu.classList.toggle('active');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userMenu && !this.userMenu.contains(e.target) && 
                this.userMenuButton && !this.userMenuButton.contains(e.target)) {
                this.userMenu.classList.remove('active');
                this.userMenuButton.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Auth modal toggles
        if (this.authSignIn) this.authSignIn.addEventListener('click', () => this.showAuthModal('signin'));
        if (this.authSignUp) this.authSignUp.addEventListener('click', () => this.showAuthModal('signup'));
        if (this.switchToSignUp) this.switchToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('signup');
        });
        if (this.switchToSignIn) this.switchToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('signin');
        });
        if (this.forgotPassword) this.forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('forgot');
        });
        if (this.switchToSignInFromForgot) this.switchToSignInFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('signin');
        });
        if (this.modalClose) this.modalClose.addEventListener('click', () => this.hideAuthModal());
        
        // Form submissions
        if (this.signInForm) this.signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        if (this.signUpForm) this.signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
        if (this.forgotPasswordForm) this.forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        
        // Social auth
        document.querySelectorAll('.auth-provider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.currentTarget.dataset.provider;
                this.handleSocialAuth(provider);
            });
        });
    }
    
    showAuthModal(formType = 'signin') {
        // Hide all forms first
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        // Show the selected form
        switch(formType) {
            case 'signin':
                this.signInForm.classList.add('active');
                break;
            case 'signup':
                this.signUpForm.classList.add('active');
                break;
            case 'forgot':
                this.forgotPasswordForm.classList.add('active');
                break;
        }
        
        // Show the modal
        this.authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    hideAuthModal() {
        this.authModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    async checkAuthState() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (session) {
                this.updateUIForAuthenticatedUser(session.user);
            } else {
                this.updateUIForGuest();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            this.updateUIForGuest();
        }
    }
    
    async handleSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('signin-email-input').value;
        const password = document.getElementById('signin-password').value;
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Update UI and close modal
            this.updateUIForAuthenticatedUser(data.user);
            this.hideAuthModal();
            
            // Show success message
            this.showNotification('Successfully signed in!', 'success');
            
        } catch (error) {
            console.error('Sign in error:', error);
            this.showNotification(error.message || 'Failed to sign in. Please try again.', 'error');
        }
    }
    
    async handleSignUp(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email-input').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-password-confirm').value;
        
        // Basic validation
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: email.split('@')[0],
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
                    }
                }
            });
            
            if (error) throw error;
            
            // Check if email confirmation is required
            if (data.user?.identities?.length === 0) {
                this.showNotification('User already registered', 'error');
                return;
            }
            
            // Update UI and show success message
            this.updateUIForAuthenticatedUser(data.user);
            this.hideAuthModal();
            
            if (data.user?.identities?.length > 0) {
                this.showNotification('Check your email for a confirmation link!', 'success');
            } else {
                this.showNotification('Successfully signed up!', 'success');
            }
            
        } catch (error) {
            console.error('Sign up error:', error);
            this.showNotification(error.message || 'Failed to sign up. Please try again.', 'error');
        }
    }
    
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value;
        
        if (!email) {
            this.showNotification('Please enter your email address', 'error');
            return;
        }
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            
            if (error) throw error;
            
            this.showNotification('Password reset link sent to your email', 'success');
            this.showAuthModal('signin');
            
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showNotification(error.message || 'Failed to send reset link. Please try again.', 'error');
        }
    }
    
    async handleSocialAuth(provider) {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            
            if (error) throw error;
            
        } catch (error) {
            console.error(`${provider} auth error:`, error);
            this.showNotification(`Failed to sign in with ${provider}. Please try again.`, 'error');
        }
    }
    
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.updateUIForGuest();
            this.showNotification('Successfully signed out', 'success');
            
        } catch (error) {
            console.error('Sign out error:', error);
            this.showNotification('Failed to sign out. Please try again.', 'error');
        }
    }
    
    updateUIForAuthenticatedUser(user) {
        // Update user menu
        const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
        
        // Update user menu button
        this.userMenuButton.innerHTML = `
            <img src="${avatarUrl}" alt="${username}'s avatar" class="avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random'">
            <span class="username">${username}</span>
            <svg class="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Update user menu content
        this.userMenu.innerHTML = `
            <div class="user-info">
                <img src="${avatarUrl}" alt="${username}'s avatar" class="user-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random'">
                <div>
                    <div class="user-name">${username}</div>
                    <div class="user-email">${user.email}</div>
                </div>
            </div>
            <div class="divider"></div>
            <a href="#" class="menu-item" id="user-settings">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19.4 15C19.2663 15.3016 19.2029 15.6302 19.2157 15.9612C19.2285 16.2922 19.3171 16.6157 19.474 16.9046C19.631 17.1934 19.852 17.4402 20.118 17.6241C20.384 17.808 20.6876 17.9238 21.004 17.962L21.1 18V20C21.1 20.5304 20.8893 21.0391 20.5142 21.4142C20.1391 21.7893 19.6304 22 19.1 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V17.962C3.31579 17.9239 3.61882 17.8082 3.88426 17.6246C4.1497 17.441 4.37013 17.1947 4.52667 16.9063C4.68321 16.6179 4.77163 16.2951 4.78447 15.9647C4.79731 15.6344 4.73414 15.3063 4.6 15.005" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19.4 9C19.2663 8.69842 19.2029 8.36975 19.2157 8.03875C19.2285 7.70775 19.3171 7.38431 19.474 7.09546C19.631 6.80662 19.852 6.55977 20.118 6.37588C20.384 6.19199 20.6876 6.0762 21.004 6.038L21.1 6V4C21.1 3.46957 20.8893 2.96086 20.5142 2.58579C20.1391 2.21071 19.6304 2 19.1 2H5C4.46957 2 3.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V6.038C3.31579 6.07615 3.61882 6.19178 3.88426 6.3754C4.1497 6.55903 4.37013 6.80525 4.52667 7.09369C4.68321 7.38212 4.77163 7.70488 4.78447 8.03523C4.79731 8.36558 4.73414 8.69368 4.6 8.995" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Settings
            </a>
            <button class="menu-item" id="sign-out">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sign Out
            </button>
        `;
        
        // Add event listeners to new menu items
        document.getElementById('sign-out')?.addEventListener('click', () => this.signOut());
        document.getElementById('user-settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            // Show settings panel or navigate to settings page
            console.log('Navigate to settings');
        });
        
        // Update any other UI elements that depend on auth state
        document.body.classList.add('user-authenticated');
    }
    
    updateUIForGuest() {
        // Reset user menu
        this.userMenuButton.innerHTML = `
            <span class="avatar">👤</span>
            <span class="username">Guest</span>
            <svg class="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Reset user menu content
        this.userMenu.innerHTML = `
            <button id="auth-signin" class="menu-item">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M10 17L15 12M15 12L10 7M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sign In
            </button>
            <button id="auth-signup" class="menu-item">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Create Account
            </button>
        `;
        
        // Re-initialize event listeners for the new buttons
        document.getElementById('auth-signin')?.addEventListener('click', () => this.showAuthModal('signin'));
        document.getElementById('auth-signup')?.addEventListener('click', () => this.showAuthModal('signup'));
        
        // Update any other UI elements that depend on auth state
        document.body.classList.remove('user-authenticated');
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

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if auth elements exist
    if (document.getElementById('auth-modal')) {
        window.authManager = new AuthManager();
    }
});

// Export for use in other modules
export { AuthManager };
