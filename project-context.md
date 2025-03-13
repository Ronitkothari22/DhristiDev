# DrishtiDev - Chrome Extension for Web Developers

## Project Overview
DrishtiDev is a Chrome browser extension designed to streamline web development by offering advanced inspection, responsive design preview, and network monitoring tools. The name "DrishtiDev" combines "Drishti" (Sanskrit for "vision") with "Dev" (developer), symbolizing clear insights into web development workflows. Unlike traditional extensions, DrishtiDev uses a persistent popup triggered by the extension icon and overlay popups that appear near clicked elements or features on the webpage for direct interaction and editing.

## Core Features

### 1. Element Inspector
- **Behavior**: Clicking the extension icon opens a persistent popup. Clicking any webpage element displays an overlay popup near the element with:
  - Full HTML tag, classes, ID, and computed CSS properties (e.g., margin, padding, color).
  - Real-time CSS editing options (e.g., input fields to modify styles).
  - One-click copy of element data.
- **Details**: Type-safe DOM access, persistent until dismissed.

### 2. Responsive Design Preview
- **Behavior**: From the persistent popup, toggle a responsive mode. Clicking a "Preview" button shows an overlay with multiple device viewports (e.g., iPhone, iPad, Desktop) near the clicked area.
  - Synchronized scrolling and clicking across viewports.
  - Option to add custom viewport sizes.
- **Details**: Real-time updates, scalable viewport management.

### 3. Network URL Tracking
- **Behavior**: From the persistent popup, enable network tracking. Clicking a "Network" option displays an overlay near the clicked area listing live network requests (URLs, status codes).
  - View request/response details in the overlay.
  - Filterable log with real-time updates.
- **Details**: Type-safe network data, integrated with Chrome’s debugger API.

## Technical Stack
- **Language**: TypeScript (compiled to vanilla JS)
- **Platform**: Chrome WebExtensions API
- **Build Tools**: TypeScript Compiler (`tsc`)
- **Dependencies**: 
  - `@types/chrome` (TypeScript definitions for Chrome APIs)
  - No external frameworks or paid services

## Project Structure

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