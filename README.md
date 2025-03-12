# DrishtiDev Chrome Extension

A powerful Chrome extension for web developers providing element inspection, responsive design preview, and network monitoring capabilities.

## Features

- 🔍 **Element Inspector**: Real-time element inspection with CSS property display
- 📱 **Responsive Design Preview**: Multi-device viewport simulation with synchronized interactions
- 🌐 **Network URL Tracking**: Live network request monitoring and analysis

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Chrome browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/drishtidev.git
   cd drishtidev
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

### Development

- Watch mode: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Project Structure

```
drishtidev/
├── src/
│   ├── content/           # Content scripts
│   ├── popup/            # Extension popup
│   └── background/       # Background scripts
├── dist/                # Compiled JavaScript
├── types/              # TypeScript type definitions
├── assets/             # Images and icons
└── manifest.json       # Extension manifest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Hoverify's core features
- Built with TypeScript and Chrome WebExtensions API