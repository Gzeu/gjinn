// Enhanced Gjinn AI - Complete Implementation with Real Data
class GjinnAI {
  constructor() {
    this.apiEndpoints = {
      pollinations: 'https://image.pollinations.ai/prompt/',
      dailyPrompts: 'https://api.quotegarden.com/api/v3/quotes/random',
      wishes: []
    };
    this.stats = {
      totalWishes: 0,
      completedWishes: 0,
      favoriteWishes: 0
    };
    this.init();
  }

  async init() {
    await this.loadStoredWishes();
    this.generateDailyWish();
    this.setupEventListeners();
    this.updateDashboard();
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
    } else {
      this.displayDailyWish(storedDaily);
    }
  }

  displayDailyWish(prompt) {
    const dailySection = document.getElementById('daily-wish-section');
    if (dailySection) {
      dailySection.innerHTML = `
        <div class="daily-wish-card">
          <h3>🌟 Today's Magical Inspiration</h3>
          <p class="daily-prompt">${prompt}</p>
          <button onclick="gjinn.createWish('${prompt}')" class="wish-btn">Grant This Wish!</button>
        </div>
      `;
    }
  }

  // Enhanced Image Generation with Real API
  async createWish(prompt, type = 'image') {
    if (!prompt.trim()) {
      this.showError('Please describe your wish!');
      return;
    }

    const wishId = Date.now();
    const wish = {
      id: wishId,
      prompt,
      type,
      status: 'generating',
      timestamp: new Date().toISOString(),
      favorite: false
    };

    this.wishes.unshift(wish);
    this.updateWishDisplay();
    this.showGeneratingState(wishId);

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
    
    // Verify image loads successfully
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        url: imageUrl,
        width,
        height,
        seed
      });
      img.onerror = () => reject(new Error('Image generation failed'));
      img.src = imageUrl;
      
      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Generation timeout')), 30000);
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

  displayCompletedWishes() {
    const completedContainer = document.getElementById('completed-wishes-container');
    const completedWishes = this.wishes.filter(w => w.status === 'completed').slice(0, 5);
    
    if (completedContainer) {
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
          <small class="wish-time">Completed ${new Date(wish.completedAt).toLocaleString()}</small>
        </div>
      `).join('');
    }
  }

  displayGallery() {
    const galleryContainer = document.getElementById('creative-gallery');
    const allCompleted = this.wishes.filter(w => w.status === 'completed');
    
    if (galleryContainer) {
      galleryContainer.innerHTML = allCompleted.map(wish => `
        <div class="gallery-item" data-id="${wish.id}">
          <div class="gallery-image">
            ${wish.result ? this.renderWishResult(wish, 'gallery') : ''}
          </div>
          <div class="gallery-info">
            <h4>${wish.prompt.substring(0, 30)}...</h4>
            <div class="gallery-meta">
              <span class="downloads">0 downloads</span>
              <span class="type">${this.getWishIcon(wish.type)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  renderWishResult(wish, context = 'default') {
    if (wish.type === 'image' && wish.result) {
      const imgClass = context === 'gallery' ? 'gallery-img' : 'result-img';
      return `<img src="${wish.result.url}" alt="${wish.prompt}" class="${imgClass}" loading="lazy">`;
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
    
    const totalElement = document.getElementById('total-wishes');
    const completedElement = document.getElementById('completed-wishes');
    const favoritesElement = document.getElementById('favorite-wishes');
    
    if (totalElement) totalElement.textContent = stats.total;
    if (completedElement) completedElement.textContent = stats.completed;
    if (favoritesElement) favoritesElement.textContent = stats.favorites;
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
    }
  }

  async downloadWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish && wish.result) {
      const link = document.createElement('a');
      link.href = wish.result.url;
      link.download = `gjinn-${wish.id}.jpg`;
      link.click();
    }
  }

  shareWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish && navigator.share) {
      navigator.share({
        title: 'My Gjinn Creation',
        text: wish.prompt,
        url: wish.result?.url
      });
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
    localStorage.setItem('gjinn_wishes', JSON.stringify(this.wishes));
    localStorage.setItem('gjinn_stats', JSON.stringify(this.stats));
  }

  async loadStoredWishes() {
    const stored = localStorage.getItem('gjinn_wishes');
    const storedStats = localStorage.getItem('gjinn_stats');
    
    if (stored) {
      this.wishes = JSON.parse(stored);
    }
    if (storedStats) {
      this.stats = JSON.parse(storedStats);
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
  }

  setupEventListeners() {
    const wishForm = document.getElementById('wish-form');
    if (wishForm) {
      wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('wish');
        if (input) {
          this.createWish(input.value);
          input.value = '';
        }
      });
    }

    // Setup wish input if it exists
    const wishInput = document.getElementById('wish');
    if (wishInput) {
      wishInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.createWish(wishInput.value);
          wishInput.value = '';
        }
      });
    }
  }
}

// Global function for button onclick
function generateContent() {
  const wishInput = document.getElementById('wish');
  if (wishInput && gjinn) {
    gjinn.createWish(wishInput.value);
    wishInput.value = '';
  }
}

// Initialize Gjinn AI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gjinn = new GjinnAI();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GjinnAI;
}