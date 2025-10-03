# 🧞‍♂️ Gjinn - Your AI Genie of Imagination

Gjinn is a modern web application that transforms your creative ideas into stunning AI-generated images. Inspired by the mystical genies of legend, Gjinn grants your visual wishes with the power of AI.

## ✨ Features

- 🎨 Generate unique AI artwork with various styles and presets
- 🌓 Dark/Light mode support
- 📱 Responsive design that works on all devices
- 🔐 User authentication to save your creations
- 🖼️ Gallery to browse and manage your generated images
- ⚡ Fast and intuitive user interface
- 🌟 Magical particle effects and animations
- 🎨 Multiple AI models and style presets

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for development)
- npm or yarn (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gjinn.git
   cd gjinn
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   POLLINATION_API_KEY=your_pollination_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI/UX**: CSS Variables, Flexbox, CSS Grid
- **AI Integration**: Pollination API
- **Authentication**: Supabase
- **Icons**: Lucide Icons
- **Animations**: Custom CSS animations and particles

## 📂 Project Structure

```
gjinn/
├── assets/           # Static assets (images, fonts, etc.)
├── css/              # Stylesheets
│   ├── main.css      # Main styles
│   ├── auth.css      # Authentication styles
│   └── variables.css # CSS variables and theming
├── js/
│   ├── app.js        # Main application logic
│   ├── config.js     # Configuration and constants
│   └── auth.js       # Authentication logic
├── index.html        # Main HTML file
├── manifest.json     # PWA manifest
└── README.md         # This file
```

## 🌟 Features in Detail

### 🎨 AI Image Generation
- Multiple AI models to choose from
- Customizable parameters (steps, dimensions, seed, etc.)
- Style presets for different artistic effects
- Real-time generation progress

### 🖼️ Gallery
- Browse your generated images
- Filter and search functionality
- Download and share options
- Favorite and organize your creations

### ⚙️ Settings
- Toggle dark/light theme
- Adjust generation settings
- Configure notifications
- Manage account preferences

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to contribute to this project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Pollination](https://pollinations.ai/) for the AI image generation API
- [Supabase](https://supabase.com/) for authentication and database
- All the open-source libraries and tools that made this project possible

---

<p align="center">
  Made with ❤️ and a touch of magic
</p>
