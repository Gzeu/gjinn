// Configuration for the application
const CONFIG = {
    // Supabase Configuration
    SUPABASE: {
        URL: 'YOUR_SUPABASE_URL',
        ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
        TABLES: {
            IMAGES: 'generated_images',
            USERS: 'users',
            REQUESTS: 'generation_requests'
        }
    },
    
    // Pollination Configuration
    POLLINATION: {
        MODELS: {
            STABLE_DIFFUSION: 'stability-ai/sdxl',
            KANDINSKY: 'kandinsky-community/kandinsky-2',
            DALL_E: 'openai/dall-e-3'
        },
        DEFAULT_SETTINGS: {
            steps: 50,
            width: 1024,
            height: 1024,
            seed: -1,
            upscale: true
        }
    },
    
    // Application Settings
    APP: {
        MAX_REQUESTS_PER_HOUR: 20,
        CACHE_TTL: 3600, // 1 hour in seconds
        VERSION: '1.0.0'
    }
};

// Initialize Supabase client
const supabase = supabase.createClient(
    CONFIG.SUPABASE.URL,
    CONFIG.SUPABASE.ANON_KEY
);
