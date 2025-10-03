-- Gjinn Database Schema for Supabase
-- Execute this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tables for Gjinn application

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.gjinn_users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    completion_streak INTEGER DEFAULT 0,
    total_images INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    UNIQUE(email)
);

-- 2. Generated Images table
CREATE TABLE IF NOT EXISTS public.gjinn_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.gjinn_users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    model_used TEXT DEFAULT 'flux',
    settings JSONB DEFAULT '{}',
    is_daily_prompt BOOLEAN DEFAULT FALSE,
    daily_prompt_id INTEGER,
    is_favorited BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Prompt Completions table
CREATE TABLE IF NOT EXISTS public.gjinn_daily_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.gjinn_users(id) ON DELETE CASCADE,
    prompt_id INTEGER NOT NULL,
    image_id UUID REFERENCES public.gjinn_images(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, completion_date) -- One completion per day per user
);

-- 4. User Settings table
CREATE TABLE IF NOT EXISTS public.gjinn_user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.gjinn_users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    particles_enabled BOOLEAN DEFAULT TRUE,
    animations_enabled BOOLEAN DEFAULT TRUE,
    sound_effects BOOLEAN DEFAULT TRUE,
    daily_prompts_enabled BOOLEAN DEFAULT TRUE,
    preferred_model TEXT DEFAULT 'flux',
    default_image_size TEXT DEFAULT '1024x1024',
    auto_save BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gjinn_images_user_id ON public.gjinn_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gjinn_images_created_at ON public.gjinn_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gjinn_images_is_public ON public.gjinn_images(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_gjinn_images_daily_prompt ON public.gjinn_images(is_daily_prompt, daily_prompt_id) WHERE is_daily_prompt = TRUE;
CREATE INDEX IF NOT EXISTS idx_gjinn_daily_completions_user_date ON public.gjinn_daily_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_gjinn_users_last_active ON public.gjinn_users(last_active DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_gjinn_images_updated_at
    BEFORE UPDATE ON public.gjinn_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gjinn_user_settings_updated_at
    BEFORE UPDATE ON public.gjinn_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE public.gjinn_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gjinn_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gjinn_daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gjinn_user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.gjinn_users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.gjinn_users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.gjinn_users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Images policies
CREATE POLICY "Users can read own images" ON public.gjinn_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read public images" ON public.gjinn_images
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own images" ON public.gjinn_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON public.gjinn_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON public.gjinn_images
    FOR DELETE USING (auth.uid() = user_id);

-- Daily completions policies
CREATE POLICY "Users can read own completions" ON public.gjinn_daily_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.gjinn_daily_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can read own settings" ON public.gjinn_user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.gjinn_user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.gjinn_user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create Storage Bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gjinn-generated-images', 'gjinn-generated-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'gjinn-generated-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'gjinn-generated-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Public can read public images" ON storage.objects
    FOR SELECT USING (bucket_id = 'gjinn-generated-images');

CREATE POLICY "Users can update own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'gjinn-generated-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'gjinn-generated-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create functions for common operations

-- Function to get user's completion streak
CREATE OR REPLACE FUNCTION get_user_completion_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE := CURRENT_DATE;
BEGIN
    -- Count consecutive days of completions going backwards from today
    LOOP
        IF EXISTS (
            SELECT 1 FROM public.gjinn_daily_completions 
            WHERE user_id = user_uuid AND completion_date = check_date
        ) THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT; -- Break the loop when we find a missing day
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total images count
    UPDATE public.gjinn_users 
    SET total_images = (
        SELECT COUNT(*) FROM public.gjinn_images 
        WHERE user_id = NEW.user_id
    ),
    completion_streak = get_user_completion_streak(NEW.user_id),
    last_active = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update user stats when images are added
CREATE TRIGGER update_user_stats_on_image_insert
    AFTER INSERT ON public.gjinn_images
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gjinn_users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, gjinn_users.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, gjinn_users.avatar_url),
        last_active = NOW();
    
    -- Create default user settings
    INSERT INTO public.gjinn_user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.gjinn_users TO authenticated;
GRANT ALL ON public.gjinn_images TO authenticated;
GRANT ALL ON public.gjinn_daily_completions TO authenticated;
GRANT ALL ON public.gjinn_user_settings TO authenticated;
GRANT SELECT ON public.gjinn_images TO anon; -- For public images
GRANT EXECUTE ON FUNCTION get_user_completion_streak(UUID) TO authenticated;

-- Create some sample data (optional)
/*
INSERT INTO public.gjinn_images (user_id, prompt, image_url, model_used, is_public)
VALUES 
    (NULL, 'A mystical forest with glowing mushrooms', 'https://picsum.photos/1024/1024?random=1', 'flux', TRUE),
    (NULL, 'Cyberpunk cityscape at night', 'https://picsum.photos/1024/1024?random=2', 'stable-diffusion', TRUE),
    (NULL, 'Dragon made of autumn leaves', 'https://picsum.photos/1024/1024?random=3', 'flux', TRUE);
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Gjinn database schema created successfully! 🧞‍♂️✨';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Create user accounts';
    RAISE NOTICE '2. Store generated images with links';
    RAISE NOTICE '3. Track daily prompt completions';
    RAISE NOTICE '4. Manage user settings and preferences';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your GitHub repository secrets if needed';
    RAISE NOTICE '2. Test the connection from your app';
    RAISE NOTICE '3. Start generating and storing images!';
END$$;