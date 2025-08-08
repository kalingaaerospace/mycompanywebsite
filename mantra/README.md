# 🕉️ Sacred Chanting - Spiritual Web App

A beautiful, optimized spiritual-themed web application for mantra chanting and meditation practice. Built with pure HTML, CSS, and JavaScript - no backend required!

## ✨ Features

### Landing Page
- **Peaceful Design**: Clean, divine theme with soft gradients and spiritual fonts
- **Mantra Selection**: Choose from 4 sacred mantras:
  - 🌸 Radha Radha
  - 🪶 Krishna Krishna
  - 🏛️ Jay Jagannath
  - 🔱 Om Namah Shivaya
- **Custom Suggestions**: Email link to suggest your own mantras
- **Fully Responsive**: Works perfectly on mobile, tablet, and desktop

### Chanting Page
- **Beautiful Counter**: Circular counter with animated border
- **Large Chant Button**: Easy-to-tap chanting button with ripple effects
- **Persistent Storage**: Counts saved in localStorage (survives page refresh)
- **Audio Feedback**: Soft "ding" sound on each chant
- **Milestone Celebrations**: Special effects for achievement milestones
- **Reset Functionality**: Clear counter with confirmation

### Technical Features
- **PWA Ready**: Progressive Web App capabilities
- **Offline Support**: Works without internet connection
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Performance Optimized**: Minified code and efficient animations
- **Accessibility**: Keyboard navigation and focus management
- **Mobile Features**: Haptic feedback and touch optimizations

## 🚀 Quick Start

1. **Download the files** to your local directory
2. **Open `index.html`** in any modern web browser
3. **Start chanting!** Select a mantra and begin your spiritual practice

## 📁 File Structure

```
sacred-chanting/
├── index.html          # Main HTML file
├── style.css           # All CSS styles and animations
├── script.js           # JavaScript functionality
├── manifest.json       # PWA manifest (optional)
└── README.md          # This documentation
```

## 🌐 Deployment Options

### GitHub Pages
1. Create a new repository on GitHub
2. Upload all files
3. Go to Settings → Pages
4. Select source branch (usually `main`)
5. Your app will be live at `https://yourusername.github.io/repository-name`

### Netlify (Recommended)
1. Visit [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Get instant HTTPS deployment
4. Automatic updates when you change files

### Vercel
1. Visit [vercel.com](https://vercel.com)
2. Import your project
3. Deploy with zero configuration

### Traditional Web Hosting
Upload all files to any web hosting service (shared hosting, VPS, etc.)

## 🎮 Usage Instructions

### Basic Usage
1. **Select Mantra**: Choose your preferred mantra from the landing page
2. **Start Chanting**: Click the large chant button to increment counter
3. **Track Progress**: Your count is automatically saved
4. **Reset When Needed**: Use the reset button to start fresh

### Keyboard Shortcuts
- **Space/Enter**: Chant (on chanting page)
- **Escape**: Go back to landing page
- **Ctrl+R**: Reset counter (with confirmation)

### Advanced Features
- **Export Statistics**: Open browser console and run `exportChantingStats()`
- **Milestone Tracking**: Automatic celebrations at 1, 10, 50, 100, 500, 1K, 5K, 10K chants
- **Floating Particles**: Subtle animated spiritual elements

## 🔧 Customization

### Adding New Mantras
Edit the `index.html` file and add new mantra buttons:

```html
<button class="mantra-btn" onclick="selectMantra('Your Mantra', '🕉️')">
    <span class="mantra-symbol">🕉️</span>
    <span class="mantra-text">Your Mantra</span>
</button>
```

### Changing Colors
Edit the CSS variables in `style.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #your-color1, #your-color2);
    --secondary-gradient: linear-gradient(135deg, #your-color3, #your-color4);
}
```

### Modifying Sounds
Replace the audio data in `index.html` or add your own audio file:

```html
<audio id="chantSound" preload="auto">
    <source src="your-chant-sound.mp3" type="audio/mpeg">
</audio>
```

## 📱 Progressive Web App

The app includes PWA features:
- **Install Prompt**: Can be installed on mobile devices
- **Offline Support**: Works without internet
- **App-like Experience**: Full screen on mobile

To enhance PWA features, create a `manifest.json`:

```json
{
    "name": "Sacred Chanting",
    "short_name": "Chanting",
    "description": "Spiritual mantra chanting app",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#667eea",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        }
    ]
}
```

## 🔒 Privacy & Data

- **Local Storage Only**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **No Network Calls**: Completely offline after loading
- **Data Control**: Clear browser data to reset everything

## 🎨 Design Philosophy

- **Spiritual Aesthetic**: Colors and fonts chosen for peaceful meditation
- **Minimalism**: Clean interface without distractions
- **Responsive Design**: Perfect experience on any device size
- **Accessibility First**: Keyboard navigation and screen reader friendly
- **Performance**: Fast loading and smooth animations

## 🤝 Contributing Suggestions

Email your mantra suggestions to: **KALINGAAEROSPACE@gmail.com**

Include:
- Mantra text
- Meaning and significance
- Cultural/religious origin
- Suggested emoji symbol

## 🙏 Spiritual Guidance

### Best Practices for Chanting
1. **Find a Quiet Space**: Minimize distractions
2. **Set Intention**: Begin with a clear spiritual purpose
3. **Breathe Deeply**: Synchronize with your breath
4. **Focus Mind**: Concentrate on the meaning
5. **Regular Practice**: Consistency brings the most benefit

### Mantra Meanings
- **Radha Radha**: Devotion to the divine feminine energy
- **Krishna Krishna**: Calling upon the divine consciousness
- **Jay Jagannath**: Victory to the Lord of the Universe
- **Om Namah Shivaya**: I bow to the divine within

## 📧 Support

For technical support or spiritual guidance:
- **Email**: KALINGAAEROSPACE@gmail.com
- **Subject**: Sacred Chanting App Support

## 📄 License

This project is released under the MIT License. Feel free to use, modify, and distribute for personal and commercial purposes.

## 🕉️ Acknowledgments

Created with devotion for the spiritual community. May this app serve your practice and bring you closer to the divine.

**Om Shanti Shanti Shanti** 🙏

---

*"The goal of life is to make your heartbeat match the beat of the universe, to match your nature with Nature."* - Joseph Campbell
