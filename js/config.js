// Environment variables (automatically injected by GitHub Pages/Vite)
const getEnvVar = (key, fallback = '') => {
    // For GitHub Pages deployment, variables are injected via build process
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || fallback;
    }
    // For client-side access (GitHub Pages replaces these during build)
    return window[`__ENV_${key}__`] || fallback;
};

// Configuration for the application
const CONFIG = {
    // Environment variables
    ENV: {
        SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
        SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        POLLINATION_API_KEY: getEnvVar('VITE_POLLINATION_API_KEY')
    },
    
    // Supabase Configuration
    SUPABASE: {
        URL: getEnvVar('VITE_SUPABASE_URL'),
        ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        TABLES: {
            IMAGES: 'gjinn_images',
            USERS: 'gjinn_users',
            DAILY_COMPLETIONS: 'gjinn_daily_completions',
            USER_SETTINGS: 'gjinn_user_settings'
        },
        STORAGE: {
            BUCKET: 'gjinn-generated-images'
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
            steps: 30,
            width: 1024,
            height: 1024,
            cfg_scale: 7.5,
            seed: -1,
            upscale: true
        },
        API: {
            BASE_URL: 'https://image.pollinations.ai/prompt',
            TIMEOUT: 60000, // 60 seconds for image generation
            MAX_RETRIES: 3
        }
    },
    
    // Application Settings
    APP: {
        NAME: 'Gjinn',
        VERSION: '2.1.0',
        MAX_REQUESTS_PER_HOUR: 20,
        CACHE_TTL: 3600, // 1 hour in seconds
        DEFAULT_THEME: 'system',
        FEATURES: {
            DAILY_PROMPTS: true,
            USER_AUTH: true,
            IMAGE_STORAGE: true,
            OFFLINE_MODE: false
        }
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 5000,
        LOADING_DELAY: 300,
        DEBOUNCE_DELAY: 500,
        ANIMATION_DURATION: 300
    }
};

// Initialize Supabase client only if we have the required config
let supabaseClient = null;

if (typeof window !== 'undefined' && CONFIG.SUPABASE.URL && CONFIG.SUPABASE.ANON_KEY) {
    try {
        // Load Supabase if not already loaded
        if (typeof supabase === 'undefined' && window.supabase) {
            supabaseClient = window.supabase.createClient(
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
            
            // Make it globally available
            window.supabase = supabaseClient;
            console.log('✅ Supabase initialized successfully');
        }
    } catch (error) {
        console.warn('⚠️ Supabase initialization failed:', error.message);
    }
} else {
    console.log('ℹ️ Supabase not configured - running in local mode');
}

// Initialize Pollination if available
if (typeof window !== 'undefined' && window.Pollinations && CONFIG.POLLINATION.API_KEY) {
    try {
        window.Pollinations.configure({
            apiKey: CONFIG.POLLINATION.API_KEY
        });
        console.log('✅ Pollination API initialized successfully');
    } catch (error) {
        console.warn('⚠️ Pollination initialization failed:', error.message);
    }
}

// Database Schema Helper Functions
const DB_HELPERS = {
    // Images table operations
    async saveImage(imageData) {
        if (!supabaseClient) {
            console.warn('Supabase not available, saving to localStorage');
            const saved = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
            saved.unshift(imageData);
            localStorage.setItem('gjinn_images', JSON.stringify(saved));
            return imageData;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .insert([{
                    user_id: imageData.userId,
                    prompt: imageData.prompt,
                    image_url: imageData.imageUrl,
                    model_used: imageData.model,
                    settings: imageData.settings,
                    is_daily_prompt: imageData.isDailyPrompt || false,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving image:', error);
            // Fallback to localStorage
            const saved = JSON.parse(localStorage.getItem('gjinn_images') || '[]');
            saved.unshift(imageData);
            localStorage.setItem('gjinn_images', JSON.stringify(saved));
            return imageData;
        }
    },
    
    // Get user's images
    async getUserImages(userId, limit = 20) {
        if (!supabaseClient) {
            return JSON.parse(localStorage.getItem('gjinn_images') || '[]').slice(0, limit);
        }
        
        try {
            const { data, error } = await supabaseClient
                .from(CONFIG.SUPABASE.TABLES.IMAGES)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching images:', error);
            return JSON.parse(localStorage.getItem('gjinn_images') || '[]').slice(0, limit);
        }
    },
    
    // Save daily prompt completion
    async saveDailyCompletion(userId, promptId, imageId) {
        if (!supabaseClient) {
            const completions = JSON.parse(localStorage.getItem('gjinn_daily_completions') || '[]');
            completions.push({
                user_id: userId,
                prompt_id: promptId,
                image_id: imageId,
                completed_at: new Date().toISOString(),
                date: new Date().toDateString()
            });
            localStorage.setItem('gjinn_daily_completions', JSON.stringify(completions));
            return;
        }
        
        try {
            const { error } = await supabaseClient
                .from(CONFIG.SUPABASE.TABLES.DAILY_COMPLETIONS)
                .insert([{
                    user_id: userId,
                    prompt_id: promptId,
                    image_id: imageId,
                    completion_date: new Date().toDateString(),
                    created_at: new Date().toISOString()
                }]);
                
            if (error) throw error;
        } catch (error) {
            console.error('Error saving daily completion:', error);
        }
    }
};

// Make everything available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.DB_HELPERS = DB_HELPERS;
    
    // Initialize database tables if needed
    if (supabaseClient) {
        window.addEventListener('load', async () => {
            try {
                // Test connection
                await supabaseClient.from(CONFIG.SUPABASE.TABLES.IMAGES).select('count', { count: 'exact', head: true });
                console.log('✅ Database connection verified');
            } catch (error) {
                console.warn('⚠️ Database tables may need setup:', error.message);
            }
        });
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, DB_HELPERS, supabaseClient };
}

// Development logging
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Development mode - Config loaded:', {
        supabaseConfigured: !!(CONFIG.SUPABASE.URL && CONFIG.SUPABASE.ANON_KEY),
        pollinationConfigured: !!CONFIG.POLLINATION.API_KEY,
        version: CONFIG.APP.VERSION
    });
}