# ✨ Gjinn - Your AI Genie of Imagination

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Gjinn** is a magical, interactive AI-powered dashboard that brings your wishes to life! Experience the enchantment of a genie lamp combined with modern web technologies and AI capabilities.

## 🌟 Features

- **✨ Magical User Interface**: Beautiful gradient backgrounds with floating animations
- **🧞 Interactive Genie Lamp**: Animated SVG lamp that responds to your wishes
- **💫 Wish Management**: Create, track, and manage your wishes with persistent storage
- **🎨 Particle Effects**: Eye-catching magical particle animations
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🔮 MCP Integration Ready**: Prepared for Model Context Protocol integration
- **💾 Local Storage**: Your wishes are saved locally in your browser

## 🚀 Live Demo

Visit the live site: [https://gzeu.github.io/gjinn/](https://gzeu.github.io/gjinn/)

## 🛠️ Technologies Used

- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with animations, gradients, and flexbox/grid
- **JavaScript (ES6+)**: Interactive functionality and dynamic content
- **LocalStorage API**: Client-side data persistence
- **GitHub Pages**: Free hosting and deployment

## 📦 Project Structure

```
gjinn/
├── index.html      # Main HTML file
├── style.css       # Styling and animations
├── app.js          # JavaScript functionality
└── README.md       # Project documentation
```

## 🎯 How to Use

1. **Make a Wish**: Type your wish in the text area (e.g., "Create a magical landing page")
2. **Grant Your Wish**: Click the "Grant My Wish" button or press `Ctrl+Enter`
3. **Watch the Magic**: Enjoy the particle animations as your wish is processed
4. **Track Progress**: View your wishes in the dashboard below
5. **See Results**: Wishes automatically update to "Fulfilled" status after processing

## 💻 Local Development

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A local web server (optional, but recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Gzeu/gjinn.git
cd gjinn
```

2. Open `index.html` in your browser or use a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with npx)
npx serve
```

3. Navigate to `http://localhost:8000` in your browser

## 🔮 Future MCP Integration

Gjinn is designed to integrate with the **Model Context Protocol (MCP)** for enhanced AI capabilities:

- **AI-Powered Wish Processing**: Connect to LLMs for intelligent wish fulfillment
- **Context-Aware Responses**: Leverage MCP for contextual understanding
- **Enhanced Interactions**: Real-time AI conversations about your wishes

### MCP Setup (Coming Soon)

The `app.js` file includes placeholder MCP integration code ready for implementation:

```javascript
const MCP = {
    initialized: false,
    async init() {
        // MCP initialization code
    },
    async sendWish(wishText) {
        // Send wish to AI model through MCP
    }
};
```

## 🎨 Customization

### Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gold: #ffd700;
    --orange: #ff6b35;
}
```

### Animations

Adjust animation timings and effects in `style.css`:

```css
@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Gzeu**

- GitHub: [@Gzeu](https://github.com/Gzeu)
- Repository: [gjinn](https://github.com/Gzeu/gjinn)

## 🙏 Acknowledgments

- Inspired by the magic of genie lamps and wishes
- Built with modern web technologies
- Designed for easy MCP integration

## 📸 Screenshots

### Main Dashboard
![Gjinn Dashboard](https://via.placeholder.com/800x400?text=Gjinn+Dashboard)

### Wish Creation
![Making a Wish](https://via.placeholder.com/800x400?text=Make+a+Wish)

### Wish Tracking
![Wish List](https://via.placeholder.com/800x400?text=Your+Wishes)

---

**Made with ✨ magic and 💻 code**

Visit: [https://gzeu.github.io/gjinn/](https://gzeu.github.io/gjinn/)
