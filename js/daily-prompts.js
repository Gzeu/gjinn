// Daily Creative Prompts for Gjinn
export class DailyPrompts {
    constructor() {
        this.prompts = [
            {
                id: 1,
                type: 'image',
                text: 'A bioluminescent city floating in the clouds at twilight',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['fantasy', 'sci-fi', 'architecture']
            },
            {
                id: 2,
                type: 'image', 
                text: 'An ancient library where books float and glow with magical energy',
                category: 'fantasy',
                difficulty: 'beginner',
                tags: ['magic', 'library', 'mystical']
            },
            {
                id: 3,
                type: 'audio',
                text: 'The sound of a mystical forest at dawn with fairy whispers',
                category: 'nature',
                difficulty: 'intermediate',
                tags: ['nature', 'magical', 'ambient']
            },
            {
                id: 4,
                type: 'text',
                text: 'Write a short story about a robot discovering emotions',
                category: 'sci-fi',
                difficulty: 'advanced',
                tags: ['sci-fi', 'emotions', 'AI']
            },
            {
                id: 5,
                type: 'image',
                text: 'A steampunk workshop where clockwork butterflies are being built',
                category: 'steampunk',
                difficulty: 'intermediate',
                tags: ['steampunk', 'workshop', 'mechanical']
            },
            {
                id: 6,
                type: 'image',
                text: 'Underwater ruins of an advanced civilization with coral growing through technology',
                category: 'sci-fi',
                difficulty: 'advanced',
                tags: ['underwater', 'ruins', 'sci-fi', 'nature']
            },
            {
                id: 7,
                type: 'audio',
                text: 'Create ambient sounds of a space station orbiting a distant planet',
                category: 'sci-fi',
                difficulty: 'intermediate',
                tags: ['space', 'ambient', 'sci-fi']
            },
            {
                id: 8,
                type: 'image',
                text: 'A dragon made entirely of autumn leaves taking flight',
                category: 'fantasy',
                difficulty: 'beginner',
                tags: ['dragon', 'autumn', 'nature']
            },
            {
                id: 9,
                type: 'text',
                text: 'A tale of the last lighthouse keeper in a world of flying ships',
                category: 'adventure',
                difficulty: 'intermediate',
                tags: ['lighthouse', 'adventure', 'flying']
            },
            {
                id: 10,
                type: 'image',
                text: 'Crystal caves where each crystal contains a tiny universe',
                category: 'fantasy',
                difficulty: 'advanced',
                tags: ['crystals', 'universe', 'caves']
            },
            {
                id: 11,
                type: 'image',
                text: 'A cyberpunk street food vendor selling glowing noodles from a hover cart',
                category: 'cyberpunk',
                difficulty: 'intermediate',
                tags: ['cyberpunk', 'food', 'street']
            },
            {
                id: 12,
                type: 'audio',
                text: 'The musical conversation between whales and dolphins in the deep ocean',
                category: 'nature',
                difficulty: 'beginner',
                tags: ['ocean', 'whales', 'music']
            },
            {
                id: 13,
                type: 'image',
                text: 'A garden where flowers bloom in geometric patterns and mathematical fractals',
                category: 'abstract',
                difficulty: 'advanced',
                tags: ['geometric', 'fractals', 'garden']
            },
            {
                id: 14,
                type: 'text',
                text: 'The diary entries of a time traveler stuck in a library between dimensions',
                category: 'sci-fi',
                difficulty: 'advanced',
                tags: ['time-travel', 'diary', 'dimensions']
            },
            {
                id: 15,
                type: 'image',
                text: 'Victorian-era inventors working on a machine to capture dreams',
                category: 'steampunk',
                difficulty: 'intermediate',
                tags: ['victorian', 'dreams', 'invention']
            },
            {
                id: 16,
                type: 'image',
                text: 'A cosmic phoenix made of stardust and nebula clouds',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['phoenix', 'cosmic', 'stardust']
            },
            {
                id: 17,
                type: 'audio',
                text: 'The sound of ancient wind chimes in a forgotten temple',
                category: 'ambient',
                difficulty: 'beginner',
                tags: ['wind-chimes', 'temple', 'ancient']
            },
            {
                id: 18,
                type: 'image',
                text: 'A miniature world existing inside a snow globe on a wizard\'s desk',
                category: 'fantasy',
                difficulty: 'beginner',
                tags: ['miniature', 'snow-globe', 'wizard']
            },
            {
                id: 19,
                type: 'text',
                text: 'A love story between two AIs learning to understand human emotions',
                category: 'romance',
                difficulty: 'advanced',
                tags: ['AI', 'love', 'emotions']
            },
            {
                id: 20,
                type: 'image',
                text: 'Floating islands connected by bridges of pure light',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['floating-islands', 'light-bridges', 'magical']
            },
            {
                id: 21,
                type: 'image',
                text: 'A robot gardener tending to plants on Mars with Earth visible in the sky',
                category: 'sci-fi',
                difficulty: 'intermediate',
                tags: ['mars', 'robot', 'gardening', 'earth']
            },
            {
                id: 22,
                type: 'audio',
                text: 'The rhythmic sounds of a blacksmith forging magic swords',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['blacksmith', 'magic', 'medieval']
            },
            {
                id: 23,
                type: 'image',
                text: 'A tea ceremony taking place inside a giant flower',
                category: 'whimsical',
                difficulty: 'beginner',
                tags: ['tea-ceremony', 'flower', 'miniature']
            },
            {
                id: 24,
                type: 'text',
                text: 'The memoirs of the moon\'s first and only inhabitant',
                category: 'sci-fi',
                difficulty: 'intermediate',
                tags: ['moon', 'solitude', 'space']
            },
            {
                id: 25,
                type: 'image',
                text: 'A clockwork heart powered by captured starlight',
                category: 'steampunk',
                difficulty: 'advanced',
                tags: ['clockwork', 'heart', 'starlight']
            },
            {
                id: 26,
                type: 'image',
                text: 'Mermaids building coral cities in the twilight zone of the ocean',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['mermaids', 'coral', 'ocean-city']
            },
            {
                id: 27,
                type: 'audio',
                text: 'The sound of aurora borealis if it could sing',
                category: 'nature',
                difficulty: 'advanced',
                tags: ['aurora', 'singing', 'northern-lights']
            },
            {
                id: 28,
                type: 'image',
                text: 'A library where the books are windows to other worlds',
                category: 'fantasy',
                difficulty: 'beginner',
                tags: ['library', 'portal', 'other-worlds']
            },
            {
                id: 29,
                type: 'text',
                text: 'A conversation between the last tree and the first seed of a new forest',
                category: 'nature',
                difficulty: 'intermediate',
                tags: ['tree', 'seed', 'conversation', 'forest']
            },
            {
                id: 30,
                type: 'image',
                text: 'Time itself flowing like a river through a cosmic landscape',
                category: 'abstract',
                difficulty: 'advanced',
                tags: ['time', 'river', 'cosmic', 'abstract']
            },
            {
                id: 31,
                type: 'image',
                text: 'A city built inside the hollow trunk of a colossal tree',
                category: 'fantasy',
                difficulty: 'intermediate',
                tags: ['tree-city', 'colossal', 'nature-architecture']
            }
        ];
    }

    // Get today's prompt based on day of year
    getTodaysPrompt() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const promptIndex = dayOfYear % this.prompts.length;
        
        return {
            ...this.prompts[promptIndex],
            date: now.toDateString(),
            isToday: true
        };
    }

    // Get a random prompt
    getRandomPrompt() {
        const randomIndex = Math.floor(Math.random() * this.prompts.length);
        return this.prompts[randomIndex];
    }

    // Get prompts by category
    getPromptsByCategory(category) {
        return this.prompts.filter(prompt => prompt.category === category);
    }

    // Get prompts by type
    getPromptsByType(type) {
        return this.prompts.filter(prompt => prompt.type === type);
    }

    // Get prompts by difficulty
    getPromptsByDifficulty(difficulty) {
        return this.prompts.filter(prompt => prompt.difficulty === difficulty);
    }

    // Search prompts by tags
    searchPromptsByTag(tag) {
        return this.prompts.filter(prompt => 
            prompt.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
    }

    // Get all categories
    getCategories() {
        return [...new Set(this.prompts.map(prompt => prompt.category))];
    }

    // Get all difficulty levels
    getDifficulties() {
        return [...new Set(this.prompts.map(prompt => prompt.difficulty))];
    }

    // Get all tags
    getAllTags() {
        const allTags = this.prompts.flatMap(prompt => prompt.tags);
        return [...new Set(allTags)];
    }

    // Check if user has completed today's prompt
    hasCompletedTodaysPrompt() {
        const todaysPrompt = this.getTodaysPrompt();
        const completedPrompts = JSON.parse(localStorage.getItem('gjinn_completed_daily_prompts') || '[]');
        const today = new Date().toDateString();
        
        return completedPrompts.some(completed => 
            completed.date === today && completed.promptId === todaysPrompt.id
        );
    }

    // Mark today's prompt as completed
    markTodaysPromptCompleted(wishId) {
        const todaysPrompt = this.getTodaysPrompt();
        const completedPrompts = JSON.parse(localStorage.getItem('gjinn_completed_daily_prompts') || '[]');
        const today = new Date().toDateString();
        
        const completion = {
            date: today,
            promptId: todaysPrompt.id,
            wishId: wishId,
            completedAt: new Date().toISOString()
        };
        
        // Remove any existing completion for today (in case of multiple attempts)
        const filteredCompletions = completedPrompts.filter(c => c.date !== today);
        filteredCompletions.push(completion);
        
        localStorage.setItem('gjinn_completed_daily_prompts', JSON.stringify(filteredCompletions));
        return completion;
    }

    // Get completion streak
    getCompletionStreak() {
        const completedPrompts = JSON.parse(localStorage.getItem('gjinn_completed_daily_prompts') || '[]');
        let streak = 0;
        let currentDate = new Date();
        
        // Go backwards from today to find consecutive days
        while (true) {
            const dateString = currentDate.toDateString();
            const hasCompletion = completedPrompts.some(c => c.date === dateString);
            
            if (hasCompletion) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
}