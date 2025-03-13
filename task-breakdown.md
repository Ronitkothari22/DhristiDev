# DrishtiDev - 4-Day Development Plan

## Day 1: Project Setup and Element Inspector
**Goal**: Set up the extension and implement a click-based inspector with an overlay.

### Task 1: Project Setup
- [ ] Create `drishtidev` folder and initialize `package.json` (`npm init -y`).
- [ ] Install TypeScript (`npm install -g typescript`) and `@types/chrome` (`npm install --save-dev @types/chrome`).
- [ ] Write `tsconfig.json`: Target ES6, strict mode, output to `dist/`.
- [ ] Create `manifest.json`: Name "DrishtiDev", permissions (`"activeTab"`, `"scripting"`, `"debugger"`), popup as `popup.html`.
- [ ] Test loading in Chrome (`chrome://extensions`, Load unpacked).

### Task 2: Persistent Popup Foundation
- [ ] Create `popup.html`: Basic UI with buttons for "Inspector," "Responsive," "Network."
- [ ] Write `popup.ts`: Toggle states for each feature (e.g., `inspectorActive: boolean`).
- [ ] Add `styles.css`: Fixed popup (e.g., 300px wide, persistent until closed).
- [ ] Compile and test popup visibility.

### Task 3: Element Inspector Core
- [ ] Write `inspector.ts`: Listen for clicks on webpage elements, send data to overlay.
- [ ] Create `overlay.ts`: Generate dynamic overlay div, position near clicked element (e.g., `getBoundingClientRect`).
- [ ] Extract tag, classes, ID, and all CSS properties (`getComputedStyle`).
- [ ] Display data in overlay with copy button (`navigator.clipboard`).

### Task 4: Inspector Editing
- [ ] Add editable input fields in overlay for key CSS (e.g., `margin`, `color`).
- [ ] Update element styles live via `element.style` in `inspector.ts`.
- [ ] Define TS interface (e.g., `interface ElementData { tag: string; css: CSSStyleDeclaration; }`).
- [ ] Test clicking and editing on a simple site.

## Day 2: Responsive Design Preview
**Goal**: Add click-triggered responsive overlay with synced viewports.

### Task 5: Responsive Preview Setup
- [ ] Update `popup.html`: Add "Responsive" toggle button.
- [ ] Write `responsive.ts`: On click, send tab URL to overlay.
- [ ] Modify `overlay.ts`: Create iframe-based overlay with two viewports (e.g., iPhone: 375x667, Desktop: 1440x900).
- [ ] Style overlay in `styles.css`: Side-by-side iframes, absolute positioning.

### Task 6: Responsive Functionality
- [ ] Implement scroll sync: Broadcast scroll events via `postMessage` between iframes.
- [ ] Add click sync: Relay click coordinates across viewports.
- [ ] Define TS interface (e.g., `interface Viewport { width: number; height: number; }`).
- [ ] Test sync on a long page (e.g., a blog).

### Task 7: Responsive Scalability
- [ ] Add custom viewport input in `popup.ts` (e.g., width/height fields).
- [ ] Store custom sizes in `chrome.storage` with TS type checking.
- [ ] Update overlay to reflect custom viewports.
- [ ] Debug positioning and sync issues.

## Day 3: Network URL Tracking
**Goal**: Implement click-triggered network overlay with live data.

### Task 8: Network Monitoring Setup
- [ ] Update `manifest.json`: Enable `"debugger"` permission.
- [ ] Write `network.ts`: Attach `chrome.debugger` and listen for `Network.requestWillBeSent`.
- [ ] Define TS interface (e.g., `interface NetworkRequest { url: string; status: number; }`).
- [ ] Send request data to overlay via `chrome.runtime`.

### Task 9: Network Overlay UI
- [ ] Update `popup.html`: Add "Network" toggle button.
- [ ] Modify `overlay.ts`: Create network log overlay (table: URL, status).
- [ ] Write `popup.ts`: Display real-time updates from `network.ts`.
- [ ] Style overlay: Scrollable log, fixed near click point.

### Task 10: Network Features
- [ ] Add request/response details toggle in overlay (e.g., headers via `Network.getResponseBody`).
- [ ] Implement basic filter (e.g., show failed requests, status ≥ 400).
- [ ] Test on a site with API calls (e.g., a news site).

## Day 4: Testing, Optimization, and Polish
**Goal**: Ensure functionality, optimize, and document.

### Task 11: Testing
- [ ] Test inspector overlay on static and dynamic sites (e.g., React app).
- [ ] Verify responsive sync on long and interactive pages.
- [ ] Check network log on API-heavy sites.
- [ ] Debug overlay positioning (e.g., stays on-screen).

### Task 12: Optimization
- [ ] Add debounce to click events (e.g., 100ms) in `inspector.ts`.
- [ ] Limit network log to 50 entries for performance.
- [ ] Reduce compiled JS size (check `dist/` output).
- [ ] Compile and test performance in Chrome.

### Task 13: Documentation and Polish
- [ ] Write `README.md`: Install instructions, usage (e.g., "Click extension, then elements").
- [ ] Add TS comments for key functions (e.g., overlay positioning).
- [ ] Final test: No console errors, overlays work as expected.

## Daily Checklist
- [ ] Morning: Review progress, compile TS
- [ ] Midday: Test in Chrome, fix bugs
- [ ] Evening: Update docs, commit changes

## Quality Assurance
- TypeScript strict mode enabled
- No console errors in DevTools
- Overlay popups stay near clicked elements
- Fast response (<1s) on clicks
- Error handling for API failures

## Success Criteria
- Persistent popup opens on extension click
- Overlay appears on element click with editable CSS
- Responsive overlay syncs viewports
- Network overlay shows live requests
- Stable on typical sites

## Notes
- Use git for commits (e.g., `git commit -m "Task 3: Inspector overlay"`)
- Test overlay positioning on edge cases (e.g., page bottom)
- Log Chrome API limits (e.g., `debugger` quirks)
- Plan future overlay enhancements (e.g., drag)