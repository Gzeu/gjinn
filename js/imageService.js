import { supabase, CONFIG } from './config.js';

class ImageService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.initializeStorage();
    }

    // Initialize storage bucket if it doesn't exist
    async initializeStorage() {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets.some(b => b.name === CONFIG.SUPABASE.STORAGE.BUCKET);
        
        if (!bucketExists) {
            await supabase.storage.createBucket(CONFIG.SUPABASE.STORAGE.BUCKET, {
                public: false,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                fileSizeLimit: 10 * 1024 * 1024 // 10MB
            });
        }
    }

    // Generate image using Pollination API
    async generateImage(prompt, options = {}) {
        const userId = (await supabase.auth.getUser())?.data?.user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Default options
        const settings = {
            model: CONFIG.POLLINATION.MODELS.DEFAULT,
            ...CONFIG.POLLINATION.DEFAULT_SETTINGS,
            ...options,
            prompt: prompt.trim()
        };

        // Add to queue
        return new Promise((resolve, reject) => {
            this.queue.push({
                settings,
                resolve,
                reject,
                userId
            });
            this.processQueue();
        });
    }

    // Process the generation queue
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        try {
            const { settings, resolve, reject, userId } = this.queue.shift();
            
            // Track the request
            const requestId = await this.trackRequest(userId, {
                ...settings,
                status: 'processing'
            });

            // Generate image using Pollination
            const imageUrl = await this.callPollinationAPI(settings);
            
            // Upload to Supabase Storage
            const { url, path } = await this.uploadToStorage(userId, imageUrl, settings);
            
            // Save to database
            const imageData = await this.saveImageToDatabase(userId, {
                ...settings,
                imageUrl: url,
                storagePath: path,
                requestId
            });

            // Update request status
            await this.updateRequestStatus(requestId, 'completed');
            
            resolve(imageData);
        } catch (error) {
            console.error('Image generation failed:', error);
            reject(error);
            
            // Update request status if we have a requestId
            if (requestId) {
                await this.updateRequestStatus(requestId, 'failed', error.message);
            }
        } finally {
            this.isProcessing = false;
            this.processQueue(); // Process next in queue
        }
    }

    // Call Pollination API
    async callPollinationAPI(settings) {
        const { model, prompt, ...params } = settings;
        
        // Use Pollination SDK if available
        if (window.Pollinations) {
            return window.Pollinations.generate(prompt, {
                model,
                ...params
            });
        }
        
        // Fallback to direct API call
        const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': CONFIG.POLLINATION.API_KEY 
                    ? `Bearer ${CONFIG.POLLINATION.API_KEY}` 
                    : undefined
            },
            body: JSON.stringify({
                prompt,
                model,
                ...params
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate image');
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    // Upload image to Supabase Storage
    async uploadToStorage(userId, imageUrl, metadata) {
        const filename = `generations/${userId}/${Date.now()}.png`;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const { data, error } = await supabase.storage
            .from(CONFIG.SUPABASE.STORAGE.BUCKET)
            .upload(filename, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/png',
                metadata: {
                    ...metadata,
                    uploadedBy: userId,
                    originalUrl: imageUrl
                }
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(CONFIG.SUPABASE.STORAGE.BUCKET)
            .getPublicUrl(data.path);

        return {
            url: publicUrl,
            path: data.path
        };
    }

    // Save image data to database
    async saveImageToDatabase(userId, data) {
        const { error } = await supabase
            .from(CONFIG.SUPABASE.TABLES.IMAGES)
            .insert([{
                user_id: userId,
                prompt: data.prompt,
                negative_prompt: data.negative_prompt,
                model: data.model,
                width: data.width,
                height: data.height,
                steps: data.steps,
                seed: data.seed,
                cfg_scale: data.cfg_scale,
                sampler: data.sampler,
                image_url: data.imageUrl,
                storage_path: data.storagePath,
                metadata: {
                    ...data,
                    requestId: data.requestId
                }
            }])
            .select();

        if (error) throw error;
        return data;
    }

    // Track generation request
    async trackRequest(userId, data) {
        const { data: request, error } = await supabase
            .from(CONFIG.SUPABASE.TABLES.REQUESTS)
            .insert([{
                user_id: userId,
                model: data.model,
                prompt_hash: this.hashString(data.prompt),
                status: data.status,
                metadata: data
            }])
            .select('id')
            .single();

        if (error) throw error;
        return request.id;
    }

    // Update request status
    async updateRequestStatus(requestId, status, error = null) {
        const updateData = { status };
        if (error) updateData.error_message = error;
        
        const { error: updateError } = await supabase
            .from(CONFIG.SUPABASE.TABLES.REQUESTS)
            .update(updateData)
            .eq('id', requestId);

        if (updateError) console.error('Failed to update request status:', updateError);
    }

    // Get user's generation history
    async getUserGenerations(userId, limit = 20, offset = 0) {
        const { data, error } = await supabase
            .from(CONFIG.SUPABASE.TABLES.IMAGES)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    }

    // Delete a generated image
    async deleteGeneration(userId, imageId) {
        // First get the image to verify ownership
        const { data: image, error: fetchError } = await supabase
            .from(CONFIG.SUPABASE.TABLES.IMAGES)
            .select('id, storage_path')
            .eq('id', imageId)
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;
        if (!image) throw new Error('Image not found or access denied');

        // Delete from storage
        if (image.storage_path) {
            const { error: storageError } = await supabase.storage
                .from(CONFIG.SUPABASE.STORAGE.BUCKET)
                .remove([image.storage_path]);

            if (storageError) console.error('Failed to delete from storage:', storageError);
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from(CONFIG.SUPABASE.TABLES.IMAGES)
            .delete()
            .eq('id', imageId);

        if (deleteError) throw deleteError;
        return true;
    }

    // Helper function to hash strings (for prompt hashing)
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
}

// Create a singleton instance
const imageService = new ImageService();

// Make available globally
window.imageService = imageService;

export default imageService;
