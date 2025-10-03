// Load environment variables (will be replaced by Vite's import.meta.env in production)
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://jgejprgxwznijtwlfxhs.supabase.co',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZWpwcmd4d3puaWp0d2xmeGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODc5MTksImV4cCI6MjA3NDk2MzkxOX0.qOr0dFPRYfBZRsAL9KheSlv9PH-CaC-lll9KYRhqtsQ',
    POLLINATION_API_KEY: import.meta.env.VITE_POLLINATION_API_KEY || ''
};

// Configuration for the application
const CONFIG = {
    // Supabase Configuration
    SUPABASE: {
        URL: ENV.SUPABASE_URL,
        ANON_KEY: ENV.SUPABASE_ANON_KEY,
        TABLES: {
            IMAGES: 'generated_images',
            USERS: 'profiles',
            REQUESTS: 'generation_requests',
            SETTINGS: 'user_settings'
        },
        STORAGE: {
            BUCKET: 'generated-images',
            AVATARS: 'user-avatars'
        }
    },
    
    // Pollination Configuration
    POLLINATION: {
        API_KEY: ENV.POLLINATION_API_KEY,
        MODELS: {
            STABLE_DIFFUSION: 'stability-ai/sdxl',
            KANDINSKY: 'kandinsky-community/kandinsky-2',
            DALL_E: 'openai/dall-e-3',
            DEFAULT: 'stability-ai/sdxl'
        },
        DEFAULT_SETTINGS: {
            steps: 30,
            width: 1024,
            height: 1024,
            cfg_scale: 7.5,
            sampler: 'euler_a',
            seed: -1,
            upscale: true
        },
        API: {
            BASE_URL: 'https://api.pollinations.ai',
            ENDPOINTS: {
                GENERATE: '/generate',
                STATUS: '/status',
                MODELS: '/models',
                ACCOUNT: '/account'
            },
            TIMEOUT: 30000, // 30 seconds
            MAX_RETRIES: 3
        }
    },
    
    // Application Settings
    APP: {
        NAME: 'Gjinn',
        VERSION: '1.0.0',
        MAX_REQUESTS_PER_HOUR: 20,
        CACHE_TTL: 3600, // 1 hour in seconds
        DEFAULT_THEME: 'system', // 'light', 'dark', or 'system'
        UPLOAD_LIMIT: 10 * 1024 * 1024, // 10MB
        SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
        FEATURES: {
            UPLOADS: true,
            SOCIAL_LOGIN: true,
            OFFLINE_MODE: true
        }
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 5000, // 5 seconds
        LOADING_DELAY: 300, // ms before showing loading indicator
        DEBOUNCE_DELAY: 500, // ms for search/input debouncing
        INFINITE_SCROLL_THRESHOLD: 200 // pixels from bottom to trigger loading more
    },
    
    // Error Messages
    ERRORS: {
        AUTH: {
            NOT_LOGGED_IN: 'You must be logged in to perform this action',
            PERMISSION_DENIED: 'You do not have permission to perform this action',
            INVALID_CREDENTIALS: 'Invalid email or password',
            EMAIL_TAKEN: 'Email is already in use',
            WEAK_PASSWORD: 'Password should be at least 6 characters',
            INVALID_EMAIL: 'Please enter a valid email address'
        },
        API: {
            TIMEOUT: 'Request timed out. Please try again.',
            NETWORK: 'Network error. Please check your connection.',
            SERVER: 'Server error. Please try again later.'
        }
    }
};

// Initialize Supabase client
let supabase;

if (typeof window !== 'undefined') {
    supabase = supabase.createClient(
        CONFIG.SUPABASE.URL,
        CONFIG.SUPABASE.ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage,
                storageKey: 'sb-auth-token'
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        }
    );
}

// Initialize Pollination if available
if (window.Pollinations) {
    window.Pollinations.configure({
        apiKey: CONFIG.POLLINATION.API_KEY,
        baseUrl: CONFIG.POLLINATION.API.BASE_URL
    });
}

// Make config available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.ENV = ENV;
}

// Export for ES modules
export { CONFIG, ENV, supabase };

// Log environment in development
if (import.meta.env.DEV) {
    console.log('Running in development mode');
    console.log('Supabase URL:', CONFIG.SUPABASE.URL);
    console.log('App Version:', CONFIG.APP.VERSION);
}
