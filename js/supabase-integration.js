// Supabase Integration Module for Gjinn
// Handles user authentication, image storage, and data persistence

class SupabaseIntegration {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be available
            if (!window.supabase) {
                console.log('ℹ️ Supabase not available, using local storage mode');
                return;
            }

            this.supabase = window.supabase;
            this.isInitialized = true;

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session?.user) {
                this.currentUser = session.user;
                await this.ensureUserProfile(session.user);
                console.log('✅ User session restored:', session.user.email);
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session?.user) {
                    this.currentUser = session.user;
                    await this.ensureUserProfile(session.user);
                    window.dispatchEvent(new CustomEvent('userSignedIn', { detail: session.user }));
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    window.dispatchEvent(new CustomEvent('userSignedOut'));
                }
            });

            console.log('✅ Supabase integration initialized');
        } catch (error) {
            console.error('Supabase initialization error:', error);
        }
    }

    // Ensure user profile exists in our custom table
    async ensureUserProfile(user) {
        if (!this.isInitialized) return null;

        try {
            const { data: profile, error } = await this.supabase
                .from('gjinn_users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // User doesn't exist, create profile
                const { data: newProfile, error: createError } = await this.supabase
                    .from('gjinn_users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
                        avatar_url: user.user_metadata?.avatar_url
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                return newProfile;
            }

            if (error) throw error;
            return profile;
        } catch (error) {
            console.error('Error ensuring user profile:', error);
            return null;
        }
    }

    // Authentication methods
    async signInWithGoogle() {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return data;
    }

    async signInWithGitHub() {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return data;
    }

    async signInWithEmail(email, password) {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signUpWithEmail(email, password) {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: email.split('@')[0]
                }
            }
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        if (!this.isInitialized) return;

        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    // Image storage and retrieval
    async saveGeneratedImage(imageData) {
        // Always save to localStorage as fallback
        this.saveToLocalStorage(imageData);

        if (!this.isInitialized || !this.currentUser) {
            console.log('Saving image to localStorage only (not signed in)');
            return imageData;
        }

        try {
            const imageRecord = {
                user_id: this.currentUser.id,
                prompt: imageData.prompt,
                image_url: imageData.imageUrl,
                model_used: imageData.model || 'flux',
                settings: imageData.settings || {},
                is_daily_prompt: imageData.isDailyPrompt || false,
                daily_prompt_id: imageData.dailyPromptId || null,
                is_public: imageData.isPublic || false,
                generation_time_ms: imageData.generationTime || null
            };

            const { data, error } = await this.supabase
                .from('gjinn_images')
                .insert(imageRecord)
                .select()
                .single();

            if (error) throw error;
            
            console.log('✅ Image saved to Supabase:', data.id);
            return { ...imageData, databaseId: data.id };
        } catch (error) {
            console.error('Error saving image to Supabase:', error);
            // Still return the image data since localStorage save succeeded
            return imageData;
        }
    }

    saveToLocalStorage(imageData) {
        try {
            const saved = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
            const imageWithId = {
                ...imageData,
                localId: Date.now().toString(),
                savedAt: new Date().toISOString()
            };
            saved.unshift(imageWithId);
            
            // Keep only last 50 images in localStorage
            if (saved.length > 50) {
                saved.splice(50);
            }
            
            localStorage.setItem('gjinn_images', JSON.stringify(saved));
            return imageWithId;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return imageData;
        }
    }

    async getUserImages(limit = 20, offset = 0) {
        // Always get localStorage images
        const localImages = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
        
        if (!this.isInitialized || !this.currentUser) {
            return localImages.slice(offset, offset + limit);
        }

        try {
            const { data, error } = await this.supabase
                .from('gjinn_images')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            // Merge database images with local images, removing duplicates
            const mergedImages = [...data];
            
            localImages.forEach(localImg => {
                if (!mergedImages.find(dbImg => dbImg.image_url === localImg.imageUrl)) {
                    mergedImages.push({
                        id: localImg.localId,
                        prompt: localImg.prompt,
                        image_url: localImg.imageUrl,
                        model_used: localImg.model,
                        created_at: localImg.savedAt,
                        is_local: true
                    });
                }
            });

            return mergedImages.slice(0, limit);
        } catch (error) {
            console.error('Error fetching user images:', error);
            return localImages.slice(offset, offset + limit);
        }
    }

    async getPublicImages(limit = 20, offset = 0) {
        if (!this.isInitialized) {
            // Return some sample public images from localStorage if available
            const localImages = JSON.parse(localStorage.getItem('gjinn_public_samples') || '[]');
            return localImages.slice(offset, offset + limit);
        }

        try {
            const { data, error } = await this.supabase
                .from('gjinn_images')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching public images:', error);
            return [];
        }
    }

    async toggleImageFavorite(imageId, isFavorited) {
        if (!this.isInitialized || !this.currentUser) {
            // Handle locally
            this.updateLocalImageFavorite(imageId, isFavorited);
            return;
        }

        try {
            const { error } = await this.supabase
                .from('gjinn_images')
                .update({ is_favorited: isFavorited })
                .eq('id', imageId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            
            // Also update locally
            this.updateLocalImageFavorite(imageId, isFavorited);
        } catch (error) {
            console.error('Error updating favorite status:', error);
            throw error;
        }
    }

    updateLocalImageFavorite(imageId, isFavorited) {
        try {
            const saved = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
            const imageIndex = saved.findIndex(img => 
                img.localId === imageId || img.databaseId === imageId
            );
            
            if (imageIndex !== -1) {
                saved[imageIndex].isFavorited = isFavorited;
                localStorage.setItem('gjinn_images', JSON.stringify(saved));
            }
        } catch (error) {
            console.error('Error updating local favorite:', error);
        }
    }

    async saveDailyCompletion(promptId, imageId) {
        // Save locally first
        const completions = JSON.parse(localStorage.getItem('gjinn_daily_completions') || '[]');
        const today = new Date().toDateString();
        
        completions.push({
            prompt_id: promptId,
            image_id: imageId,
            completion_date: today,
            created_at: new Date().toISOString()
        });
        
        localStorage.setItem('gjinn_daily_completions', JSON.stringify(completions));

        if (!this.isInitialized || !this.currentUser) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('gjinn_daily_completions')
                .insert({
                    user_id: this.currentUser.id,
                    prompt_id: promptId,
                    image_id: imageId,
                    completion_date: today
                });

            if (error && error.code !== '23505') { // Ignore duplicate key error
                throw error;
            }
        } catch (error) {
            console.error('Error saving daily completion:', error);
        }
    }

    async getUserSettings() {
        // Get local settings first
        const localSettings = JSON.parse(localStorage.getItem('gjinn_settings') || '{}');
        
        if (!this.isInitialized || !this.currentUser) {
            return localSettings;
        }

        try {
            const { data, error } = await this.supabase
                .from('gjinn_user_settings')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data || localSettings;
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return localSettings;
        }
    }

    async updateUserSettings(settings) {
        // Save locally first
        localStorage.setItem('gjinn_settings', JSON.stringify(settings));
        
        if (!this.isInitialized || !this.currentUser) {
            return settings;
        }

        try {
            const { data, error } = await this.supabase
                .from('gjinn_user_settings')
                .upsert({
                    user_id: this.currentUser.id,
                    ...settings
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating user settings:', error);
            return settings;
        }
    }

    // Utility methods
    isSignedIn() {
        return this.isInitialized && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserEmail() {
        return this.currentUser?.email || 'Guest';
    }

    getUserDisplayName() {
        return this.currentUser?.user_metadata?.display_name || 
               this.currentUser?.email?.split('@')[0] || 
               'Guest';
    }
}

// Create global instance
window.supabaseIntegration = new SupabaseIntegration();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseIntegration;
}