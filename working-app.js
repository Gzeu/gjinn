// Gjinn AI - Working Implementation
let gjinn;

class GjinnAI {
  constructor() {
    this.wishes = [];
    this.init();
  }

  init() {
    console.log('🧞‍♂️ Initializing Gjinn AI...');
    this.loadStoredWishes();
    this.generateDailyWish();
    this.setupEventListeners();
    this.updateDashboard();
    console.log('✨ Gjinn AI ready!');
  }

  generateDailyWish() {
    const prompts = [
      "A magical sunset over crystal mountains",
      "Ancient library with floating books and golden light", 
      "Cyberpunk city with neon reflections in rain",
      "Enchanted forest with glowing mushrooms",
      "Space station overlooking a nebula",
      "Underwater palace with bioluminescent creatures",
      "Steampunk airship above Victorian city",
      "Dragon's lair with treasure and artifacts"
    ];
    
    const today = new Date().toDateString();
    let dailyWish = localStorage.getItem('dailyWish');
    let storedDate = localStorage.getItem('dailyWishDate');
    
    if (storedDate !== today) {
      dailyWish = prompts[Math.floor(Math.random() * prompts.length)];
      localStorage.setItem('dailyWish', dailyWish);
      localStorage.setItem('dailyWishDate', today);
    }
    
    this.displayDailyWish(dailyWish);
  }

  displayDailyWish(prompt) {
    const section = document.getElementById('daily-wish-section');
    if (section) {
      section.innerHTML = `
        <div class="daily-wish-card">
          <h3>🌟 Today's Magical Inspiration</h3>
          <p class="daily-prompt">${prompt}</p>
          <button onclick="gjinn.createWish('${prompt.replace(/'/g, '\\\'')}')" class="wish-btn">Grant This Wish!</button>
        </div>
      `;
    }
  }

  async createWish(prompt) {
    if (!prompt || !prompt.trim()) {
      alert('Please describe your wish!');
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
    this.showNotification('🎭 Generating your wish...', 'info');

    try {
      const result = await this.generateImage(prompt);
      wish.status = 'completed';
      wish.result = result;
      wish.completedAt = new Date().toISOString();
      
      this.saveWishes();
      this.updateAllDisplays();
      this.showNotification('✨ Wish granted successfully!', 'success');
      
    } catch (error) {
      wish.status = 'failed';
      wish.error = error.message;
      this.updateAllDisplays();
      this.showNotification(`❌ Failed: ${error.message}`, 'error');
    }
  }

  async generateImage(prompt) {
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ url: imageUrl, width: 1024, height: 1024, seed });
      img.onerror = () => reject(new Error('Image generation failed'));
      img.src = imageUrl;
      
      setTimeout(() => reject(new Error('Generation timeout')), 30000);
    });
  }

  updateAllDisplays() {
    this.displayActiveWishes();
    this.displayCompletedWishes();
    this.displayGallery();
    this.updateDashboard();
  }

  displayActiveWishes() {
    const container = document.getElementById('active-wishes');
    if (!container) return;
    
    const active = this.wishes.filter(w => w.status === 'generating');
    
    if (active.length === 0) {
      container.innerHTML = '<div class="empty-state">No active wishes</div>';
    } else {
      container.innerHTML = active.map(wish => `
        <div class="wish-card">
          <div class="wish-header">
            <span class="wish-type">🖼️ ${wish.type}</span>
            <div class="wish-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="animation: progress-animation 2s ease-in-out infinite;"></div>
              </div>
              <span>Generating...</span>
            </div>
          </div>
          <p class="wish-prompt">${wish.prompt}</p>
        </div>
      `).join('');
    }
  }

  displayCompletedWishes() {
    const container = document.getElementById('completed-wishes-container');
    if (!container) return;
    
    const completed = this.wishes.filter(w => w.status === 'completed').slice(0, 3);
    
    if (completed.length === 0) {
      container.innerHTML = '<div class="empty-state">No completed wishes yet</div>';
    } else {
      container.innerHTML = completed.map(wish => `
        <div class="wish-card completed">
          <div class="wish-header">
            <span class="wish-type">🖼️ ${wish.type}</span>
            <div class="wish-actions">
              <button onclick="gjinn.toggleFavorite(${wish.id})" class="action-btn ${wish.favorite ? 'favorited' : ''}">
                ${wish.favorite ? '❤️' : '🤍'}
              </button>
              <button onclick="gjinn.downloadWish(${wish.id})" class="action-btn">⬇️</button>
            </div>
          </div>
          ${wish.result ? `<img src="${wish.result.url}" alt="${wish.prompt}" class="result-img" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px; margin: 10px 0;">` : ''}
          <p class="wish-prompt">${wish.prompt}</p>
        </div>
      `).join('');
    }
  }

  displayGallery() {
    const container = document.getElementById('creative-gallery');
    if (!container) return;
    
    const completed = this.wishes.filter(w => w.status === 'completed');
    
    if (completed.length === 0) {
      container.innerHTML = '<div class="empty-state">Gallery is empty - create some wishes!</div>';
    } else {
      container.innerHTML = completed.map(wish => `
        <div class="gallery-item">
          <div class="gallery-image">
            ${wish.result ? `<img src="${wish.result.url}" alt="${wish.prompt}" class="gallery-img">` : '<div class="placeholder">🖼️</div>'}
          </div>
          <div class="gallery-info">
            <h4>${wish.prompt.substring(0, 25)}...</h4>
            <div class="gallery-meta">
              <span>image</span>
              <span>🖼️</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  updateDashboard() {
    const total = this.wishes.length;
    const completed = this.wishes.filter(w => w.status === 'completed').length;
    const favorites = this.wishes.filter(w => w.favorite).length;
    
    const elements = {
      'total-wishes': total,
      'completed-wishes': completed, 
      'favorite-wishes': favorites
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
      }
    });
    
    console.log('📊 Dashboard updated:', { total, completed, favorites });
  }

  toggleFavorite(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish) {
      wish.favorite = !wish.favorite;
      this.saveWishes();
      this.updateAllDisplays();
    }
  }

  downloadWish(wishId) {
    const wish = this.wishes.find(w => w.id === wishId);
    if (wish && wish.result) {
      const link = document.createElement('a');
      link.href = wish.result.url;
      link.download = `gjinn-${wish.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showNotification('⬇️ Download started!', 'success');
    }
  }

  saveWishes() {
    localStorage.setItem('gjinn_wishes', JSON.stringify(this.wishes));
  }

  loadStoredWishes() {
    const stored = localStorage.getItem('gjinn_wishes');
    if (stored) {
      try {
        this.wishes = JSON.parse(stored);
        console.log('📦 Loaded', this.wishes.length, 'stored wishes');
      } catch (e) {
        console.error('Failed to load stored wishes:', e);
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      success: '#4ECDC4',
      error: '#FF6B6B', 
      info: '#4FACFE'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Global function for onclick compatibility
function generateContent() {
  const input = document.getElementById('wish');
  if (input && input.value.trim() && gjinn) {
    gjinn.createWish(input.value.trim());
    input.value = '';
  } else if (!input.value.trim()) {
    alert('Please enter your wish first!');
  }
}

// Initialize when DOM is ready
function initGjinn() {
  console.log('🚀 Starting Gjinn initialization...');
  gjinn = new GjinnAI();
  window.gjinn = gjinn;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGjinn);
} else {
  initGjinn();
}

// Fallback initialization
setTimeout(() => {
  if (!window.gjinn) {
    console.log('🔄 Fallback initialization...');
    initGjinn();
  }
}, 1000);