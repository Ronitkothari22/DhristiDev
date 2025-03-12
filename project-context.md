# DrishtiDev - Chrome Extension for Web Developers

## Project Overview
DrishtiDev is a Chrome browser extension designed to enhance web development workflow by providing powerful inspection, responsive design preview, and network monitoring capabilities. The name combines "Drishti" (Sanskrit for "vision") with "Dev" (developer), reflecting its purpose of providing clear insights for web developers.

## Core Features

### 1. Element Inspector
- Real-time element inspection on hover
- Comprehensive CSS property display
- One-click data copying
- Type-safe DOM manipulation

### 2. Responsive Design Preview
- Multi-device viewport simulation
- Synchronized scrolling and interactions
- Custom viewport size support
- Real-time preview updates

### 3. Network URL Tracking
- Live network request monitoring
- Status code tracking
- Request/response data logging
- Type-safe network data handling

## Technical Stack
- **Language**: TypeScript
- **Platform**: Chrome WebExtensions API
- **Build Tools**: TypeScript Compiler
- **Dependencies**: 
  - @types/chrome (for TypeScript definitions)
  - No external frameworks or paid services

## Project Structure
```
drishtidev/
├── src/
│   ├── content/           # Content scripts
│   │   ├── inspector.ts   # Element inspection logic
│   │   ├── responsive.ts  # Responsive preview logic
│   │   └── network.ts     # Network monitoring logic
│   ├── popup/            # Extension popup
│   │   ├── popup.html    # Popup UI
│   │   ├── popup.ts      # Popup logic
│   │   └── styles.css    # Popup styling
│   └── background/       # Background scripts
│       └── background.ts # Background service worker
├── dist/                # Compiled JavaScript
├── types/              # TypeScript type definitions
├── assets/             # Images and icons
├── manifest.json       # Extension manifest
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Development Guidelines
1. **Type Safety**
   - Use TypeScript interfaces for all data structures
   - Leverage Chrome extension type definitions
   - Maintain strict type checking

2. **Performance**
   - Implement debouncing for hover events
   - Use efficient DOM traversal
   - Optimize network request handling

3. **User Experience**
   - Instant feedback on interactions
   - Clean, intuitive UI
   - Responsive design
   - Keyboard shortcuts support

4. **Code Quality**
   - Modular architecture
   - Clear separation of concerns
   - Comprehensive comments
   - Error handling

## Chrome Extension Permissions
- `activeTab`: For accessing current tab
- `scripting`: For injecting content scripts
- `debugger`: For network monitoring
- `storage`: For saving user preferences

## Development Timeline
- **Day 1**: Project setup and Element Inspector
- **Day 2**: Responsive Design Preview
- **Day 3**: Network URL Tracking
- **Day 4**: Testing, optimization, and documentation

## Future Enhancements
- Custom CSS property filtering
- Network request filtering
- Custom device presets
- Theme customization
- Export/Import settings
- Performance metrics 