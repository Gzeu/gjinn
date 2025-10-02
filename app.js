// Gjinn - AI Genie Dashboard JavaScript

// Store wishes in localStorage
let wishes = JSON.parse(localStorage.getItem('gjinnWishes')) || [];

// DOM Elements
const wishInput = document.getElementById('wishInput');
const makeWishBtn = document.getElementById('makeWishBtn');
const wishesContainer = document.getElementById('wishesContainer');
const magicParticles = document.getElementById('magicParticles');
const mcpStatus = document.getElementById('mcpStatus');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadWishes();
    setupEventListeners();
    checkMCPStatus();
});

// Setup event listeners
function setupEventListeners() {
    makeWishBtn.addEventListener('click', handleMakeWish);
    
    wishInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleMakeWish();
        }
    });
}

// Handle making a wish
function handleMakeWish() {
    const wishText = wishInput.value.trim();
    
    if (!wishText) {
        showNotification('Please enter a wish!', 'warning');
        return;
    }
    
    // Create wish object
    const wish = {
        id: Date.now(),
        text: wishText,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Add to wishes array
    wishes.unshift(wish);
    localStorage.setItem('gjinnWishes', JSON.stringify(wishes));
    
    // Create magic animation
    createMagicParticles();
    
    // Add wish to display
    addWishToDisplay(wish);
    
    // Clear input
    wishInput.value = '';
    
    // Show success notification
    showNotification('Your wish has been granted! ✨', 'success');
    
    // Simulate processing (in future, this will call MCP)
    setTimeout(() => {
        processWish(wish.id);
    }, 2000);
}

// Load wishes from localStorage
function loadWishes() {
    wishesContainer.innerHTML = '';
    
    if (wishes.length === 0) {
        wishesContainer.innerHTML = '<p style="text-align: center; color: #b0b0b0; padding: 40px;">No wishes yet. Make your first wish above! ✨</p>';
        return;
    }
    
    wishes.forEach(wish => {
        addWishToDisplay(wish);
    });
}

// Add wish to display
function addWishToDisplay(wish) {
    const wishCard = document.createElement('div');
    wishCard.className = 'wish-card';
    wishCard.dataset.wishId = wish.id;
    
    const statusEmoji = wish.status === 'fulfilled' ? '✅' : '⏳';
    const statusText = wish.status === 'fulfilled' ? 'Fulfilled' : 'Processing';
    
    wishCard.innerHTML = `
        <h3>${statusEmoji} ${statusText}</h3>
        <p>${escapeHtml(wish.text)}</p>
        <div class="wish-timestamp">
            ${formatTimestamp(wish.timestamp)}
        </div>
    `;
    
    if (wishesContainer.querySelector('p')) {
        wishesContainer.innerHTML = '';
    }
    
    wishesContainer.insertBefore(wishCard, wishesContainer.firstChild);
}

// Process wish (placeholder for MCP integration)
function processWish(wishId) {
    const wishIndex = wishes.findIndex(w => w.id === wishId);
    
    if (wishIndex !== -1) {
        wishes[wishIndex].status = 'fulfilled';
        localStorage.setItem('gjinnWishes', JSON.stringify(wishes));
        
        // Update display
        const wishCard = document.querySelector(`[data-wish-id="${wishId}"]`);
        if (wishCard) {
            wishCard.querySelector('h3').innerHTML = '✅ Fulfilled';
        }
        
        createMagicParticles();
    }
}

// Create magic particles animation
function createMagicParticles() {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '50%';
        
        // Random delay
        particle.style.animationDelay = Math.random() * 0.5 + 's';
        
        magicParticles.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            particle.remove();
        }, 3000);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4ade80' : type === 'warning' ? '#fbbf24' : '#60a5fa'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format timestamp
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check MCP status (placeholder for future integration)
function checkMCPStatus() {
    // This will be replaced with actual MCP connection check
    // For now, we'll just show it as ready
    mcpStatus.textContent = 'Ready for Setup';
    mcpStatus.style.color = '#4ade80';
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// MCP Integration placeholder
// Future: Connect to Model Context Protocol for AI interactions
const MCP = {
    initialized: false,
    
    async init() {
        // Future MCP initialization code
        console.log('MCP initialization ready for setup');
    },
    
    async sendWish(wishText) {
        // Future: Send wish to AI model through MCP
        console.log('Wish sent to MCP:', wishText);
    }
};

// Initialize MCP when available
if (typeof window !== 'undefined') {
    MCP.init().catch(err => console.log('MCP not yet configured:', err));
}
