// Enhanced Gjinn AI - Fixed Implementation with Real Data
class GjinnAI {
  constructor() {
    this.apiEndpoints = {
      pollinations: 'https://image.pollinations.ai/prompt/',
      wishes: []
    };
    this.stats = {
      totalWishes: 0,
      completedWishes: 0,
      favoriteWishes: 0
    };
    this.wishes = [];
    this.init();
  }

  async init() {
    console.log('🧞‍♂️ Initializing Gjinn AI...');
    await this.loadStoredWishes();
    this.generateDailyWish();
    this.setupEventListeners();
    this.updateDashboard();
    this.loadDemoData();
    console.log('✨ Gjinn AI initialized successfully!');
  }

  // Load some demo data for immediate functionality
  loadDemoData() {
    if (this.wishes.length === 0) {
      this.wishes = [
        {
          id: 1,
          prompt: "A mystical forest with glowing mushrooms",
          type: "image",
          status: "completed",
          result: {
            url: "https://image.pollinations.ai/prompt/A%20mystical%20forest%20with%20glowing%20mushrooms?width=512&height=512&seed=42"
          },
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          favorite: true
        },
        {
          id: 2,
          prompt: "Cyberpunk cityscape at night",
          type: "image", 
          status: "generating",
          timestamp: new Date().toISOString(),
          favorite: false
        }
      ];
      this.saveWishes();
      this.updateWishDisplay();
      this.updateDashboard();
    }
  }

  // Daily Wish Generator
  async generateDailyWish() {
    const dailyPrompts = [
      "A magical sunset over crystal mountains",
      "Ancient library with floating books and golden light",
      "Cyberpunk city with neon reflections in rain",
      "Enchanted forest with glowing mushrooms and fireflies",
      "Space station overlooking a nebula",
      "Underwater palace with bioluminescent creatures",
      "Steampunk airship above Victorian city",
      "Dragon's lair with treasure and mystical artifacts"
    ];
    
    const today = new Date().toDateString();
    const storedDaily = localStorage.getItem('dailyWish');
    const storedDate = localStorage.getItem('dailyWishDate');
    
    if (storedDate !== today) {
      const randomPrompt = dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
      localStorage.setItem('dailyWish', randomPrompt);
      localStorage.setItem('dailyWishDate', today);
      this.displayDailyWish(randomPrompt);
    } else if (storedDaily) {
      this.displayDailyWish(storedDaily);
    } else {
      // Fallback to random prompt
      const randomPrompt = dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
      this.displayDailyWish(randomPrompt);
    }
  }

  displayDailyWish(prompt) {
    const dailySection = document.getElementById('daily-wish-section');
    if (dailySection) {
      dailySection.innerHTML = `
        <div class="daily-wish-card">
          <h3>🌟 Today's Magical Inspiration</h3>
          <p class="daily-prompt">${prompt}</p>
          <button onclick="gjinn.createWish('${prompt.replace(/'/g, '\\\'')}')" class="wish-btn">Grant This Wish!</button>
        </div>
      `;
      console.log('📅 Daily wish displayed:', prompt);
    } else {
      console.warn('⚠️ Daily wish section not found in DOM');
    }
  }

  // Enhanced Image Generation with Real API
  async createWish(prompt, type = 'image') {
    if (!prompt || !prompt.trim()) {
      this.showError('Please describe your wish!');
      return;
    }

    console.log('🎨 Creating wish:', prompt);

    const wishId = Date.now();
    const wish = {
      id: wishId,
      prompt: prompt.trim(),
      type,
      status: 'generating',
      timestamp: new Date().toISOString(),
      favorite: false
    };

    this.wishes.unshift(wish);
    this.updateWishDisplay();
    this.showGeneratingState(wishId);
    this.showSuccess('🎭 Your wish is being granted...');

    try {
      let result;
      switch (type) {
        case 'image':
          result = await this.generateImage(prompt);
          break;
        default:
          result = await this.generateImage(prompt);
      }

      wish.status = 'completed';
      wish.result = result;
      wish.completedAt = new Date().toISOString();
      
      this.stats.totalWishes++;
      this.stats.completedWishes++;
      
      this.saveWishes();
      this.updateWishDisplay();
      this.updateDashboard();
      
      this.showSuccess('✨ Wish granted successfully!');
      
      // Send to MCP connectors
      await this.sendToMCPConnectors(wish);
      
    } catch (error) {
      wish.status = 'failed';
      wish.error = error.message;
      this.showError(`Failed to generate: ${error.message}`);
      this.updateWishDisplay();
    }
  }

  async generateImage(prompt) {
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000000);
    
    const imageUrl = `${this.apiEndpoints.pollinations}${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
    
    console.log('🖼️ Generating image:', imageUrl);
    
    // Verify image loads successfully
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ Image generated successfully');
        resolve({
          url: imageUrl,
          width,
          height,
          seed
        });
      };
      img.onerror = () => {
        console.error('❌ Image generation failed');
        reject(new Error('Image generation failed'));
      };
      img.src = imageUrl;
      
      // Timeout after 30 seconds
      setTimeout(() => {
        console.error('⏰ Image generation timeout');
        reject(new Error('Generation timeout'));
      }, 30000);
    });
  }

  // Enhanced Gallery Display
  updateWishDisplay() {
    this.displayActiveWishes();
    this.displayCompletedWishes();
    this.displayGallery();
  }

  displayActiveWishes() {
    const activeContainer = document.getElementById('active-wishes');
    const activeWishes = this.wishes.filter(w => w.status === 'generating');
    
    if (activeContainer) {
      if (activeWishes.length === 0) {
        activeContainer.innerHTML = '<div class="empty-state">No active wishes. Create one above! 🌟</div>';
      } else {
        activeContainer.innerHTML = activeWishes.map(wish => `
          <div class="wish-card active" data-id="${wish.id}">
            <div class="wish-header">
              <span class="wish-type">${this.getWishIcon(wish.type)} ${wish.type}</span>
              <div class="wish-progress">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span>Generating...</span>
              </div>
            </div>
            <p class="wish-prompt">${wish.prompt}</p>
            <small class="wish-time">Started ${new Date(wish.timestamp).toLocaleTimeString()}</small>
          </div>
        `).join('');
      }
    }
  }

  displayCompletedWishes() {
    const completedContainer = document.getElementById('completed-wishes-container');
    const completedWishes = this.wishes.filter(w => w.status === 'completed').slice(0, 5);
    
    if (completedContainer) {
      if (completedWishes.length === 0) {
        completedContainer.innerHTML = '<div class="empty-state">No completed wishes yet. Create your first wish! ✨</div>';
      } else {
        completedContainer.innerHTML = completedWishes.map(wish => `
          <div class="wish-card completed" data-id="${wish.id}">
            <div class="wish-header">
              <span class="wish-type">${this.getWishIcon(wish.type)} ${wish.type}</span>
              <div class="wish-actions">
                <button onclick="gjinn.toggleFavorite(${wish.id})" class="action-btn ${wish.favorite ? 'favorited' : ''}">
                  ${wish.favorite ? '❤️' : '🤍'}
                </button>
                <button onclick="gjinn.downloadWish(${wish.id})" class="action-btn">⬇️</button>
                <button onclick="gjinn.shareWish(${wish.id})" class="action-btn">📤</button>
              </div>
            </div>
            <div class="wish-result">
              ${wish.result ? this.renderWishResult(wish) : 'Ready to view'}
            </div>
            <p class="wish-prompt">${wish.prompt}</p>
            <small class="wish-time">Completed ${new Date(wish.completedAt || wish.timestamp).toLocaleString()}</small>
          </div>
        `).join('');
      }
    }
  }

  displayGallery() {
    const galleryContainer = document.getElementById('creative-gallery');
    const allCompleted = this.wishes.filter(w => w.status === 'completed');
    
    if (galleryContainer) {
      if (allCompleted.length === 0) {
        galleryContainer.innerHTML = '<div class="empty-state">Your gallery is empty. Create some wishes to see them here! 🎨</div>';
      } else {
        galleryContainer.innerHTML = allCompleted.map(wish => `
          <div class="gallery-item" data-id="${wish.id}">
            <div class="gallery-image">
              ${wish.result ? this.renderWishResult(wish, 'gallery') : '<div class="placeholder">🖼️</div>'}
            </div>
            <div class="gallery-info">
              <h4>${wish.prompt.substring(0, 30)}${wish.prompt.length > 30 ? '...' : ''}</h4>
              <div class="gallery-meta">
                <span class="downloads">0 downloads</span>
                <span class="type">${this.getWishIcon(wish.type)}</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderWishResult(wish, context = 'default') {
    if (wish.type === 'image' && wish.result && wish.result.url) {
      const imgClass = context === 'gallery' ? 'gallery-img' : 'result-img';
      return `<img src="${wish.result.url}" alt="${wish.prompt}" class="${imgClass}" loading="lazy" style="max-width: 100%; height: auto;">`;
    }
    return `<div class="placeholder">Result not available</div>`;
  }

  // MCP Connectors Integration
  async sendToMCPConnectors(wish) {
    const mcpPayload = {
      type: 'wish_completed',
      data: {
        id: wish.id,
        prompt: wish.prompt,
        type: wish.type,
        timestamp: wish.completedAt,
        result_url: wish.result?.url
      }
    };

    // Simulate MCP connector calls
    try {
      // Slack notification
      console.log('📤 Sending to Slack:', mcpPayload);
      
      // Notion database update
      console.log('📊 Updating Notion:', mcpPayload);
      
      // Linear task creation
      console.log('🎯 Creating Linear task:', mcpPayload);
      
    } catch (error) {
      console.error('MCP connector error:', error);
    }
  }

  // Dashboard Analytics
  updateDashboard() {
    const stats = this.calculateStats();
    
    // Try multiple possible element IDs
    const totalElement = document.getElementById('total-wishes') || document.querySelector('.stat-number');
    const completedElement = document.getElementById('completed-wishes') || document.getElementById('completed-count');
    const favoritesElement = document.getElementById('favorite-wishes') || document.getElementById('favorites-count');
    
    if (totalElement) {
      totalElement.textContent = stats.total;
      console.log('📊 Updated total wishes:', stats.total);
    }
    if (completedElement) {
      completedElement.textContent = stats.completed;
      console.log('✅ Updated completed wishes:', stats.completed);
    }
    if (favoritesElement) {
      favoritesElement.textContent = stats.favorites;
      console.log('❤️ Updated favorite wishes:', stats.favorites);
    }
  }

  calculateStats() {
    return {
      total: this.wishes.length,
      completed: this.wishes.filter(w => w.status === 'completed').length,
      favorites: this.wishes.filter(w => w.favorite).length,
      today: this.wishes.filter(w => {
        const wishDate = new Date(w.timestamp).toDateString();
        return wishDate === new Date().toDateString();
      }).length
    };
  }

  // Utility methods
  getWishIcon(type) {
    const icons = {
      image: '🖼️',
      audio: '🎵',
      text: '📜'
    };
    return icons[type] || '✨';
  }

  toggleFavorite(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish) {
      wish.favorite = !wish.favorite;
      this.saveWishes();
      this.updateWishDisplay();
      this.updateDashboard();
      console.log('❤️ Toggled favorite for wish:', wishId);
    }
  }

  async downloadWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish && wish.result && wish.result.url) {
      try {
        const link = document.createElement('a');
        link.href = wish.result.url;
        link.download = `gjinn-${wish.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showSuccess('⬇️ Download started!');
      } catch (error) {
        this.showError('Download failed: ' + error.message);
      }
    } else {
      this.showError('No image available for download');
    }
  }

  shareWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish) {
      if (navigator.share && wish.result) {
        navigator.share({
          title: 'My Gjinn Creation',
          text: wish.prompt,
          url: wish.result?.url
        }).catch(error => {
          console.log('Share cancelled or failed:', error);
        });
      } else {
        // Fallback to clipboard
        const shareText = `Check out my AI creation: "${wish.prompt}" ${wish.result?.url || ''}`;
        navigator.clipboard.writeText(shareText).then(() => {
          this.showSuccess('📋 Share link copied to clipboard!');
        }).catch(() => {
          this.showError('Share not available on this device');
        });
      }
    }
  }

  showGeneratingState(wishId) {
    const wishCard = document.querySelector(`[data-id="${wishId}"]`);
    if (wishCard) {
      const progressFill = wishCard.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.animation = 'progress-animation 3s ease-in-out infinite';
      }
    }
  }

  // Storage management
  saveWishes() {
    try {
      localStorage.setItem('gjinn_wishes', JSON.stringify(this.wishes));
      localStorage.setItem('gjinn_stats', JSON.stringify(this.stats));
      console.log('💾 Wishes saved to localStorage');
    } catch (error) {
      console.error('Failed to save wishes:', error);
    }
  }

  async loadStoredWishes() {
    try {
      const stored = localStorage.getItem('gjinn_wishes');
      const storedStats = localStorage.getItem('gjinn_stats');
      
      if (stored) {
        this.wishes = JSON.parse(stored);
        console.log('📂 Loaded wishes from storage:', this.wishes.length);
      }
      if (storedStats) {
        this.stats = JSON.parse(storedStats);
        console.log('📊 Loaded stats from storage:', this.stats);
      }
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => errorDiv.style.display = 'none', 5000);
    } else {
      alert(message);
    }
    console.error('❌ Error:', message);
  }

  showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #4ECDC4, #44A08D);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);

    console.log('✅ Success:', message);
  }

  setupEventListeners() {
    // Form submission
    const wishForm = document.getElementById('wish-form');
    if (wishForm) {
      wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('wish');
        if (input && input.value.trim()) {
          this.createWish(input.value.trim());
          input.value = '';
        }
      });
      console.log('📝 Form listener attached');
    }

    // Direct input listener
    const wishInput = document.getElementById('wish');
    if (wishInput) {
      wishInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && wishInput.value.trim()) {
          e.preventDefault();
          this.createWish(wishInput.value.trim());
          wishInput.value = '';
        }
      });
      console.log('⌨️ Input listener attached');
    }

    // Add CSS for animations if not present
    if (!document.querySelector('#gjinn-animations')) {
      const style = document.createElement('style');
      style.id = 'gjinn-animations';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(100%); }
        }
        .empty-state {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          padding: 2rem;
          font-style: italic;
        }
        .placeholder {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Global function for button onclick compatibility
function generateContent() {
  const wishInput = document.getElementById('wish');
  if (wishInput && window.gjinn) {
    if (wishInput.value.trim()) {
      window.gjinn.createWish(wishInput.value.trim());
      wishInput.value = '';
    } else {
      window.gjinn.showError('Please enter a wish first!');
    }
  }
}

// Initialize Gjinn AI when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGjinn);
} else {
  initializeGjinn();
}

function initializeGjinn() {
  console.log('🚀 Starting Gjinn AI initialization...');
  window.gjinn = new GjinnAI();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GjinnAI;
}