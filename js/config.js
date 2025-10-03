// Environment variables configuration for GitHub Pages deployment
const getEnvVar = (key, fallback = '') => {
    // For GitHub Pages deployment, variables are injected via build process
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || fallback;
    }
    // For client-side access (GitHub Pages replaces these during build)
    return window[`__ENV_${key}__`] || fallback;
};

// Configuration for the Gjinn application
const CONFIG = {
    // Environment variables
    ENV: {
        SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
        SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        POLLINATION_API_KEY: getEnvVar('VITE_POLLINATION_API_KEY')
    },
    
    // Supabase Configuration (using your existing schema)
    SUPABASE: {
        URL: getEnvVar('VITE_SUPABASE_URL'),
        ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        TABLES: {
            PROFILES: 'profiles',
            IMAGES: 'generated_images',
            REQUESTS: 'generation_requests',
            SETTINGS: 'user_settings'
        },
        STORAGE: {
            BUCKET: 'gjinn-images'
        }
    },
    
    // Pollination Configuration
    POLLINATION: {
        API_KEY: getEnvVar('VITE_POLLINATION_API_KEY'),
        MODELS: {
            FLUX: 'flux',
            STABLE_DIFFUSION: 'stable-diffusion',
            DALL_E: 'dall-e-3',
            DEFAULT: 'flux'
        },
        DEFAULT_SETTINGS: {
            width: 1024,
            height: 1024,
            steps: 30,
            cfg_scale: 7.5,
            sampler: 'euler_a',
            seed: -1
        },
        API: {
            BASE_URL: 'https://image.pollinations.ai/prompt',
            TIMEOUT: 120000, // 2 minutes for image generation
            MAX_RETRIES: 3
        }
    },
    
    // Application Settings
    APP: {
        NAME: 'Gjinn',
        VERSION: '2.2.0',
        MAX_REQUESTS_PER_HOUR: 20,
        CACHE_TTL: 3600,
        DEFAULT_THEME: 'system',
        FEATURES: {
            DAILY_PROMPTS: true,
            USER_AUTH: true,
            IMAGE_STORAGE: true,
            PUBLIC_GALLERY: true,
            RATE_LIMITING: true
        }
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 5000,
        LOADING_DELAY: 300,
        DEBOUNCE_DELAY: 500,
        ANIMATION_DURATION: 300,
        IMAGE_PREVIEW_SIZE: 512
    }
};

// Database Operations Helper Class
class DatabaseOperations {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        try {
            if (typeof window !== 'undefined' && window.supabase && CONFIG.SUPABASE.URL && CONFIG.SUPABASE.ANON_KEY) {
                this.supabase = window.supabase.createClient(
                    CONFIG.SUPABASE.URL,
                    CONFIG.SUPABASE.ANON_KEY,
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true,
                            storage: window.localStorage,
                            storageKey: 'gjinn-auth-token'
                        }
                    }
                );
                
                this.isInitialized = true;
                window.supabase = this.supabase;
                console.log('✅ Supabase initialized with your existing schema');
            } else {
                console.log('ℹ️ Running in local mode - using localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Supabase initialization failed:', error.message);
        }
    }
    
    // Save generated image using your existing schema
    async saveImage(imageData) {
        // Always save to localStorage as fallback
        this.saveToLocalStorage(imageData);
        
        if (!this.isInitialized) {
            console.log('Image saved locally only');
            return imageData;
        }
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('User not authenticated - image saved locally only');
                return imageData;
            }
            
            // Save to your existing generated_images table
            const imageRecord = {
                user_id: user.id,
                prompt: imageData.prompt,
                negative_prompt: imageData.negativePrompt || null,
                model: imageData.model || 'flux',
                width: imageData.settings?.width || 1024,
                height: imageData.settings?.height || 1024,
                steps: imageData.settings?.steps || 30,
                seed: imageData.settings?.seed || -1,
                cfg_scale: imageData.settings?.cfg_scale || 7.5,
                sampler: imageData.settings?.sampler || 'euler_a',
                image_url: imageData.imageUrl,
                thumbnail_url: imageData.thumbnailUrl || null,
                metadata: {
                    isDailyPrompt: imageData.isDailyPrompt || false,
                    dailyPromptId: imageData.dailyPromptId || null,
                    generationTime: imageData.generationTime || null,
                    originalPrompt: imageData.prompt
                },
                is_public: imageData.isPublic || false
            };
            
            const { data, error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .insert(imageRecord)
                .select()
                .single();
                
            if (error) throw error;
            
            console.log('✅ Image saved to database:', data.id);
            return { ...imageData, databaseId: data.id, ...data };
        } catch (error) {
            console.error('Database save error:', error);
            return imageData; // Still return the data since localStorage save succeeded
        }
    }
    
    saveToLocalStorage(imageData) {
        try {
            const saved = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
            const imageWithId = {
                ...imageData,
                localId: `local_${Date.now()}`,
                savedAt: new Date().toISOString()
            };
            saved.unshift(imageWithId);
            
            // Keep only last 100 images in localStorage
            if (saved.length > 100) {
                saved.splice(100);
            }
            
            localStorage.setItem('gjinn_images', JSON.stringify(saved));
            return imageWithId;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return imageData;
        }
    }
    
    // Get user's images from your existing table
    async getUserImages(limit = 20, offset = 0) {
        // Get localStorage images as fallback
        const localImages = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
        
        if (!this.isInitialized) {
            return localImages.slice(offset, offset + limit);
        }
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                return localImages.slice(offset, offset + limit);
            }
            
            const { data, error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
                
            if (error) throw error;
            
            // Convert to format expected by the app
            const convertedImages = (data || []).map(img => ({
                id: img.id,
                localId: img.id,
                databaseId: img.id,
                prompt: img.prompt,
                imageUrl: img.image_url,
                thumbnailUrl: img.thumbnail_url,
                model: img.model,
                settings: {
                    width: img.width,
                    height: img.height,
                    steps: img.steps,
                    seed: img.seed,
                    cfg_scale: img.cfg_scale,
                    sampler: img.sampler
                },
                isPublic: img.is_public,
                isDailyPrompt: img.metadata?.isDailyPrompt || false,
                dailyPromptId: img.metadata?.dailyPromptId,
                createdAt: img.created_at,
                timestamp: img.created_at,
                user: img.profiles
            }));
            
            return convertedImages;
        } catch (error) {
            console.error('Error fetching user images:', error);
            return localImages.slice(offset, offset + limit);
        }
    }
    
    // Get public images for community gallery
    async getPublicImages(limit = 20, offset = 0) {
        if (!this.isInitialized) {
            return [];
        }
        
        try {
            const { data, error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
                
            if (error) throw error;
            
            return (data || []).map(img => ({
                id: img.id,
                prompt: img.prompt,
                imageUrl: img.image_url,
                thumbnailUrl: img.thumbnail_url,
                model: img.model,
                createdAt: img.created_at,
                user: img.profiles
            }));
        } catch (error) {
            console.error('Error fetching public images:', error);
            return [];
        }
    }
    
    // Update image publicity status
    async updateImagePublicity(imageId, isPublic) {
        if (!this.isInitialized) return false;
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;
            
            const { error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .update({ is_public: isPublic })
                .eq('id', imageId)
                .eq('user_id', user.id);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating image publicity:', error);
            return false;
        }
    }
    
    // Get user settings using your existing schema
    async getUserSettings(userId) {
        const localSettings = JSON.parse(localStorage.getItem('gjinn_user_settings') || '{}');
        
        if (!this.isInitialized || !userId) {
            return localSettings;
        }
        
        try {
            const { data, error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.SETTINGS)
                .select('*')
                .eq('user_id', userId)
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
    
    // Update user settings
    async updateUserSettings(userId, settings) {
        localStorage.setItem('gjinn_user_settings', JSON.stringify(settings));
        
        if (!this.isInitialized || !userId) {
            return settings;
        }
        
        try {
            const { data, error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.SETTINGS)
                .upsert({
                    user_id: userId,
                    theme: settings.theme || 'system',
                    default_model: settings.defaultModel || 'flux',
                    default_width: settings.defaultWidth || 1024,
                    default_height: settings.defaultHeight || 1024,
                    default_steps: settings.defaultSteps || 30,
                    default_cfg_scale: settings.defaultCfgScale || 7.5,
                    default_sampler: settings.defaultSampler || 'euler_a',
                    updated_at: new Date().toISOString()
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
    
    // Check rate limiting using your existing table
    async checkRateLimit(userId) {
        if (!this.isInitialized || !userId) {
            // Local rate limiting
            const requests = JSON.parse(localStorage.getItem('gjinn_requests') || '[]');
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            const recentRequests = requests.filter(req => req.created_at > oneHourAgo);
            return recentRequests.length < CONFIG.APP.MAX_REQUESTS_PER_HOUR;
        }
        
        try {
            const { data, error } = await this.supabase
                .rpc('get_user_request_count', { user_id: userId });
                
            if (error) throw error;
            
            return (data || 0) < CONFIG.APP.MAX_REQUESTS_PER_HOUR;
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return true; // Allow on error
        }
    }
    
    // Record generation request
    async recordRequest(userId, prompt, model) {
        // Save locally
        const requests = JSON.parse(localStorage.getItem('gjinn_requests') || '[]');
        requests.unshift({
            user_id: userId,
            prompt,
            model,
            created_at: new Date().toISOString()
        });
        // Keep only last 100 requests
        if (requests.length > 100) requests.splice(100);
        localStorage.setItem('gjinn_requests', JSON.stringify(requests));
        
        if (!this.isInitialized || !userId) return;
        
        try {
            // Create a simple hash of the prompt for deduplication
            const promptHash = btoa(prompt).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
            
            const { error } = await this.supabase
                .from(CONFIG.SUPABASE.TABLES.REQUESTS)
                .insert({
                    user_id: userId,
                    model: model,
                    prompt_hash: promptHash,
                    status: 'pending'
                });
                
            if (error) throw error;
        } catch (error) {
            console.error('Error recording request:', error);
        }
    }
}

// Initialize database operations
let dbOps = null;
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        dbOps = new DatabaseOperations();
        window.dbOps = dbOps;
    });
}

// Make everything available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    
    // Development logging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Gjinn Development Mode - Config:', {
            supabaseConfigured: !!(CONFIG.SUPABASE.URL && CONFIG.SUPABASE.ANON_KEY),
            pollinationConfigured: !!CONFIG.POLLINATION.API_KEY,
            version: CONFIG.APP.VERSION,
            tables: CONFIG.SUPABASE.TABLES
        });
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, DatabaseOperations };
}