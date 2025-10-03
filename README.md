# 🧞‍♂️ Gjinn - Your AI Genie of Imagination

Gjinn is a powerful AI tool that transforms your creative ideas into stunning AI-generated images. Available both as a web application and a command-line tool, Gjinn grants your visual wishes with the power of AI. Inspired by the mystical genies of legend, it brings your imagination to life with just a few commands.

## ✨ Features

### Web Application
- 🎨 Generate unique AI artwork with various styles and presets
- 🌓 Dark/Light mode support
- 📱 Responsive design that works on all devices
- 🔐 User authentication to save your creations
- 🖼️ Gallery to browse and manage your generated images
- ⚡ Fast and intuitive user interface
- 🌟 Magical particle effects and animations
- 🎨 Multiple AI models and style presets

### Command Line Interface (CLI)
- 🖥️ Generate images directly from your terminal
- 🎨 Support for multiple art styles
- 💾 Save outputs to custom directories
- 🔍 Verbose mode for detailed logging
- 🚀 Quick and easy setup

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ (required for both web and CLI)
- npm or yarn package manager
- Modern web browser (for web application)
- API keys for AI services

## 🌐 Web Application

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gzeu/gjinn.git
   cd gjinn
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add your API keys:
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

## 💻 Command Line Interface (CLI)

### Installation

Install Gjinn CLI globally:
```bash
npm install -g gjinn
```

### Usage

```bash
gjinn [command] [options]
```

### Commands

#### Generate Images
Generate AI images from text prompts:
```bash
gjinn --generate "a beautiful sunset over mountains" --style "digital art"
```

#### Available Options
- `-g, --generate <prompt>`: Text prompt for image generation (required)
- `-s, --style <style>`: Art style (e.g., "digital art", "watercolor", "pixel art")
- `-o, --output <path>`: Output directory (default: "./output")
- `-v, --verbose`: Enable verbose output
- `-V, --version`: Output the version number
- `-h, --help`: Display help

#### Examples

Generate a digital art image:
```bash
gjinn --generate "a cyberpunk city at night" --style "digital art"
```

Generate with custom output directory:
```bash
gjinn --generate "a serene lake at dawn" -o "~/Pictures/AI_Art"
```

Enable verbose output:
```bash
gjinn --generate "a futuristic spaceship" -v
```

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
