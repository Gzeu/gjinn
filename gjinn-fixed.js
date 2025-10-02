// Gjinn AI - Final Working Implementation
console.log('🧞‍♂️ Gjinn AI Starting...');

class GjinnAI {
  constructor() {
    this.wishes = [];
    this.currentPrompt = '';
    console.log('🏠 Gjinn AI instance created');
    this.init();
  }

  async init() {
    try {
      console.log('⚙️ Initializing Gjinn AI...');
      await this.loadStoredWishes();
      await this.generateDailyWish();
      this.setupEventListeners();
      this.updateDashboard();
      this.showWelcomeMessage();
      console.log('✨ Gjinn AI initialized successfully!');
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  showWelcomeMessage() {
    this.showNotification('🧞‍♂️ Gjinn AI is ready to grant your wishes!', 'success');
  }

  async generateDailyWish() {
    const prompts = [
      "A magical sunset over crystal mountains",
      "Ancient library with floating books and golden light", 
      "Cyberpunk city with neon reflections in rain",
      "Enchanted forest with glowing mushrooms and fireflies",
      "Space station overlooking a colorful nebula",
      "Underwater palace with bioluminescent sea creatures",
      "Steampunk airship flying above a Victorian city",
      "Dragon's lair filled with treasure and mystical artifacts",
      "Floating islands connected by rainbow bridges",
      "Crystal cave with magical glowing formations"
    ];
    
    const today = new Date().toDateString();
    let dailyWish = localStorage.getItem('gjinn_daily_wish');
    let storedDate = localStorage.getItem('gjinn_daily_date');
    
    if (storedDate !== today) {
      dailyWish = prompts[Math.floor(Math.random() * prompts.length)];
      localStorage.setItem('gjinn_daily_wish', dailyWish);
      localStorage.setItem('gjinn_daily_date', today);
      console.log('📅 New daily wish generated:', dailyWish);
    } else {
      console.log('📅 Using stored daily wish:', dailyWish);
    }
    
    this.currentPrompt = dailyWish;
    this.displayDailyWish(dailyWish);
  }

  displayDailyWish(prompt) {
    const section = document.getElementById('daily-wish-section');
    if (section) {
      section.innerHTML = `
        <div class="daily-wish-card">
          <h3>🌟 Today's Magical Inspiration</h3>
          <p class="daily-prompt" style="font-size: 1.1rem; margin: 1.5rem 0; font-style: italic; color: rgba(255,255,255,0.9);">
            "${prompt}"
          </p>
          <button onclick="gjinn.createWishFromDaily()" class="wish-btn" 
                  style="background: linear-gradient(45deg, #4FACFE, #00F2FE); border: none; padding: 1rem 2rem; border-radius: 50px; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            ✨ Grant This Wish!
          </button>
          <button onclick="gjinn.generateDailyWish()" 
                  style="background: transparent; border: 2px solid rgba(255,255,255,0.3); padding: 0.5rem 1rem; border-radius: 25px; color: white; margin-left: 1rem; cursor: pointer;">
            🔄 New Inspiration
          </button>
        </div>
      `;
      console.log('🎆 Daily wish displayed');
    } else {
      console.error('⚠️ Daily wish section not found');
    }
  }

  createWishFromDaily() {
    if (this.currentPrompt) {
      this.createWish(this.currentPrompt);
    }
  }

  async createWish(prompt) {
    if (!prompt || !prompt.trim()) {
      this.showNotification('⚠️ Please describe your wish!', 'warning');
      return;
    }

    console.log('🎨 Creating wish:', prompt);
    
    const wishId = Date.now();
    const wish = {
      id: wishId,
      prompt: prompt.trim(),
      type: 'image',
      status: 'generating',
      timestamp: new Date().toISOString(),
      favorite: false
    };

    this.wishes.unshift(wish);
    this.updateAllDisplays();
    this.showNotification('🎭 Your wish is being granted...', 'info');

    try {
      const result = await this.generateImage(prompt);
      wish.status = 'completed';
      wish.result = result;
      wish.completedAt = new Date().toISOString();
      
      this.saveWishes();
      this.updateAllDisplays();
      this.showNotification('🎉 Wish granted successfully!', 'success');
      
      console.log('✨ Wish completed:', wish);
      
    } catch (error) {
      console.error('❌ Wish generation failed:', error);
      wish.status = 'failed';
      wish.error = error.message;
      this.updateAllDisplays();
      this.showNotification(`❌ Generation failed: ${error.message}`, 'error');
    }
  }

  async generateImage(prompt) {
    console.log('🖼️ Generating image for:', prompt);
    
    const seed = Math.floor(Math.random() * 1000000);
    const width = 1024;
    const height = 1024;
    
    // Using Pollinations API with enhanced parameters
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&enhance=true&nologo=true`;
    
    console.log('🔗 Image URL:', imageUrl);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        console.log('✅ Image loaded successfully');
        resolve({ 
          url: imageUrl, 
          width, 
          height, 
          seed,
          generatedAt: new Date().toISOString()
        });
      };
      
      img.onerror = (error) => {
        console.error('❌ Image load failed:', error);
        reject(new Error('Image generation failed'));
      };
      
      img.src = imageUrl;
      
      // 30 second timeout
      setTimeout(() => {
        console.error('⏰ Image generation timeout');
        reject(new Error('Generation timeout - please try again'));
      }, 30000);
    });
  }

  updateAllDisplays() {
    console.log('🔄 Updating all displays...');
    this.displayActiveWishes();
    this.displayCompletedWishes();
    this.displayGallery();
    this.updateDashboard();
  }

  displayActiveWishes() {
    const container = document.getElementById('active-wishes');
    if (!container) {
      console.warn('Active wishes container not found');
      return;
    }
    
    const activeWishes = this.wishes.filter(w => w.status === 'generating');
    
    if (activeWishes.length === 0) {
      container.innerHTML = '<div class="empty-state">No active wishes. Create one above! 🌟</div>';
    } else {
      container.innerHTML = activeWishes.map(wish => `
        <div class="wish-card" style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 16px; margin: 1rem 0; border: 1px solid rgba(255,255,255,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="background: linear-gradient(45deg, #4FACFE, #00F2FE); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
              🖼️ ${wish.type}
            </span>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(45deg, #4FACFE, #00F2FE); animation: progress 2s ease-in-out infinite; border-radius: 3px;"></div>
              </div>
              <span style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Generating...</span>
            </div>
          </div>
          <p style="color: rgba(255,255,255,0.9); margin-bottom: 0.5rem;">${wish.prompt}</p>
          <small style="color: rgba(255,255,255,0.6);">Started ${new Date(wish.timestamp).toLocaleTimeString()}</small>
        </div>
      `).join('');
    }
  }

  displayCompletedWishes() {
    const container = document.getElementById('completed-wishes-container');
    if (!container) {
      console.warn('Completed wishes container not found');
      return;
    }
    
    const completedWishes = this.wishes.filter(w => w.status === 'completed').slice(0, 3);
    
    if (completedWishes.length === 0) {
      container.innerHTML = '<div class="empty-state">No completed wishes yet. Create your first wish! ✨</div>';
    } else {
      container.innerHTML = completedWishes.map(wish => `
        <div class="wish-card" style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 16px; margin: 1rem 0; border: 1px solid rgba(255,255,255,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="background: linear-gradient(45deg, #4FACFE, #00F2FE); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
              🖼️ ${wish.type}
            </span>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="gjinn.toggleFavorite(${wish.id})" 
                      style="background: ${wish.favorite ? 'linear-gradient(45deg, #FF6B6B, #FF8E8E)' : 'rgba(255,255,255,0.1)'}; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.1rem;">
                ${wish.favorite ? '❤️' : '🤍'}
              </button>
              <button onclick="gjinn.downloadWish(${wish.id})" 
                      style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.1rem;">
                ⬇️
              </button>
            </div>
          </div>
          ${wish.result ? `
            <div style="margin: 1rem 0;">
              <img src="${wish.result.url}" alt="${wish.prompt}" 
                   style="width: 100%; max-width: 300px; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            </div>
          ` : ''}
          <p style="color: rgba(255,255,255,0.9); margin-bottom: 0.5rem;">${wish.prompt}</p>
          <small style="color: rgba(255,255,255,0.6);">Completed ${new Date(wish.completedAt || wish.timestamp).toLocaleString()}</small>
        </div>
      `).join('');
    }
  }

  displayGallery() {
    const container = document.getElementById('creative-gallery');
    if (!container) {
      console.warn('Gallery container not found');
      return;
    }
    
    const completedWishes = this.wishes.filter(w => w.status === 'completed');
    
    if (completedWishes.length === 0) {
      container.innerHTML = '<div class="empty-state">Gallery is empty - create some magical wishes! 🎨</div>';
    } else {
      container.innerHTML = completedWishes.map(wish => `
        <div class="gallery-item" style="background: rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.3s ease;" 
             onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
          <div class="gallery-image" style="height: 200px; overflow: hidden;">
            ${wish.result ? 
              `<img src="${wish.result.url}" alt="${wish.prompt}" style="width: 100%; height: 100%; object-fit: cover;">` : 
              '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(45deg, rgba(79, 172, 254, 0.3), rgba(155, 89, 182, 0.3)); font-size: 3rem;">🖼️</div>'
            }
          </div>
          <div style="padding: 1rem;">
            <h4 style="color: white; font-size: 1rem; margin-bottom: 0.5rem;">${wish.prompt.length > 30 ? wish.prompt.substring(0, 30) + '...' : wish.prompt}</h4>
            <div style="display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.7); font-size: 0.8rem;">
              <span>image</span>
              <span>🖼️</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  updateDashboard() {
    const stats = {
      total: this.wishes.length,
      completed: this.wishes.filter(w => w.status === 'completed').length,
      favorites: this.wishes.filter(w => w.favorite).length
    };
    
    // Update dashboard elements
    const totalEl = document.getElementById('total-wishes');
    const completedEl = document.getElementById('completed-wishes');
    const favoritesEl = document.getElementById('favorite-wishes');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (completedEl) completedEl.textContent = stats.completed;
    if (favoritesEl) favoritesEl.textContent = stats.favorites;
    
    console.log('📊 Dashboard updated:', stats);
  }

  toggleFavorite(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish) {
      wish.favorite = !wish.favorite;
      this.saveWishes();
      this.updateAllDisplays();
      this.showNotification(
        wish.favorite ? '❤️ Added to favorites!' : '🤍 Removed from favorites', 
        'success'
      );
    }
  }

  downloadWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish && wish.result && wish.result.url) {
      try {
        // Create download link
        const link = document.createElement('a');
        link.href = wish.result.url;
        link.download = `gjinn-creation-${wish.id}.jpg`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('⬇️ Download started!', 'success');
        console.log('⬇️ Download initiated for wish:', wishId);
      } catch (error) {
        console.error('Download failed:', error);
        this.showNotification('❌ Download failed', 'error');
      }
    } else {
      this.showNotification('⚠️ No image available for download', 'warning');
    }
  }

  saveWishes() {
    try {
      localStorage.setItem('gjinn_wishes', JSON.stringify(this.wishes));
      console.log('💾 Wishes saved successfully');
    } catch (error) {
      console.error('Failed to save wishes:', error);
    }
  }

  async loadStoredWishes() {
    try {
      const stored = localStorage.getItem('gjinn_wishes');
      if (stored) {
        this.wishes = JSON.parse(stored);
        console.log('📦 Loaded', this.wishes.length, 'stored wishes');
      }
    } catch (error) {
      console.error('Failed to load stored wishes:', error);
      this.wishes = [];
    }
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: '#4ECDC4',
      error: '#FF6B6B',
      warning: '#FFA726',
      info: '#4FACFE'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      z-index: 1000;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      font-weight: 600;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      animation: notificationSlideIn 0.4s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add animation styles if not present
    if (!document.getElementById('notification-animations')) {
      const style = document.createElement('style');
      style.id = 'notification-animations';
      style.textContent = `
        @keyframes notificationSlideIn {
          from {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes notificationSlideOut {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'notificationSlideOut 0.4s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 400);
      }
    }, 4000);
  }

  setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Form submission
    const form = document.getElementById('wish-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('wish');
        if (input && input.value.trim()) {
          this.createWish(input.value.trim());
          input.value = '';
        } else {
          this.showNotification('⚠️ Please enter your wish first!', 'warning');
        }
      });
      console.log('📝 Form listener attached');
    }

    // Input enter key
    const input = document.getElementById('wish');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (input.value.trim()) {
            this.createWish(input.value.trim());
            input.value = '';
          } else {
            this.showNotification('⚠️ Please enter your wish first!', 'warning');
          }
        }
      });
      console.log('⌨️ Input listener attached');
    }
    
    // Focus effect for input
    if (input) {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#4FACFE';
        input.style.boxShadow = '0 0 20px rgba(79, 172, 254, 0.3)';
      });
      
      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        input.style.boxShadow = 'none';
      });
    }

    console.log('✅ All event listeners attached successfully');
  }
}

// Global function for button onclick compatibility  
function generateContent() {
  const input = document.getElementById('wish');
  if (input && input.value.trim() && window.gjinn) {
    window.gjinn.createWish(input.value.trim());
    input.value = '';
  } else if (input && !input.value.trim()) {
    alert('⚠️ Please enter your wish first!');
    input.focus();
  } else {
    console.error('Gjinn not initialized or input not found');
  }
}

// Initialize Gjinn AI
function initializeGjinn() {
  console.log('🚀 Initializing Gjinn AI...');
  try {
    window.gjinn = new GjinnAI();
    console.log('✅ Gjinn AI initialized and attached to window');
  } catch (error) {
    console.error('❌ Failed to initialize Gjinn AI:', error);
  }
}

// Multiple initialization strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGjinn);
} else {
  initializeGjinn();
}

// Fallback initialization
setTimeout(initializeGjinn, 500);

// Additional fallback for very slow connections
setTimeout(() => {
  if (!window.gjinn) {
    console.log('🔄 Final fallback initialization...');
    initializeGjinn();
  }
}, 2000);

console.log('🎆 Gjinn AI script loaded successfully!');

// Export for debugging
window.GjinnAI = GjinnAI;