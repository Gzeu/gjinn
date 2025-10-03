# 🚀 Gjinn Database Setup Guide

## 📋 Overview
This guide helps you configure Gjinn with Supabase for user authentication and persistent image storage.

## 🔧 Supabase Configuration

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project:
   - **Name**: `gjinn-ai-genie`
   - **Region**: Choose closest region
   - **Database Password**: Generate secure password

### Step 2: Setup Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Copy content from `database/supabase-schema.sql`
3. Execute the SQL script
4. Verify tables created in **Table Editor**:
   - `gjinn_users` - User profiles
   - `gjinn_images` - Generated images with URLs
   - `gjinn_daily_completions` - Daily challenge completions
   - `gjinn_user_settings` - User preferences

### Step 3: Get API Credentials
1. Go to **Settings → API**
2. Copy **Project URL** (VITE_SUPABASE_URL)
3. Copy **anon public key** (VITE_SUPABASE_ANON_KEY)

## 🔑 GitHub Secrets (Already Configured)

Your repository already has these environment secrets:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`  
- ✅ `VITE_POLLINATION_API_KEY`

## 🧪 Testing Integration

### Test Database Connection:
1. Deploy your app (push to main)
2. Open [https://gzeu.github.io/gjinn/](https://gzeu.github.io/gjinn/)
3. Check browser console for:
   ```
   ✅ Supabase initialized successfully
   ✅ Database connection verified
   ```

### Test User Registration:
1. Click "Sign In" → "Create Account"
2. Register with email or OAuth
3. Check `gjinn_users` table in Supabase

### Test Image Storage:
1. Sign in to your account
2. Generate an image
3. Check `gjinn_images` table for saved image with URL
4. Verify image appears in your Gallery

## 🎯 Key Features

- **User Authentication**: Google/GitHub OAuth + email
- **Image Persistence**: All generated images saved with URLs
- **Daily Challenges**: Track completions and streaks
- **Cross-Device Sync**: Access images from any device
- **Local Fallback**: Works without account (localStorage)

## 🐛 Troubleshooting

### Environment Variables Not Injected
**Symptom**: Console shows `{{ VITE_SUPABASE_URL }}`
**Fix**: Verify secrets are in **Environment secrets** (not Repository secrets)

### Database Connection Failed
**Symptom**: "Supabase not configured" message
**Fix**: Check URL and anon key are correct in secrets

### Images Not Saving
**Symptom**: Images only in localStorage
**Fix**: 
1. Verify user is signed in
2. Check table permissions in Supabase
3. Check browser console for errors

---

🎉 **Success!** Your Gjinn app now has full database integration for persistent image storage and user management!