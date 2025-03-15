"use strict";
/// <reference types="chrome"/>
// Store predefined device viewports
const DEVICE_VIEWPORTS = [
    { name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2 },
    { name: 'iPhone XR/11', width: 414, height: 896, devicePixelRatio: 2 },
    { name: 'iPhone 12/13/14', width: 390, height: 844, devicePixelRatio: 3 },
    { name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2 },
    { name: 'iPad Pro', width: 1024, height: 1366, devicePixelRatio: 2 },
    { name: 'MacBook Air', width: 1280, height: 800, devicePixelRatio: 2 },
    { name: 'Desktop HD', width: 1920, height: 1080 }
];
// Store currently active viewport overlay
let activeViewportOverlay = null;
// Track if responsive mode is active
let responsivePreviewActive = false;
// Store custom viewports set by the user
let customViewports = [];
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Responsive script received message:', message);
    if (message.action === 'toggleResponsive') {
        console.log('Toggle responsive mode:', message.enabled);
        toggleResponsiveMode(message.enabled);
        // Immediately send a response to prevent channel closed error
        sendResponse({ success: true });
    }
    else if (message.action === 'setCustomViewport') {
        addCustomViewport(message.width, message.height);
        sendResponse({ success: true });
    }
    else if (message.action === 'showViewportPreview') {
        console.log('Show viewport preview at:', message.clientX, message.clientY);
        showResponsivePreview(message.clientX, message.clientY);
        sendResponse({ success: true });
    }
    else if (message.action === 'pingResponsive') {
        console.log('Ping responsive received');
        // Respond to ping to indicate responsive script is loaded
        sendResponse({ responsive: 'ok' });
    }
    else if (message.action === 'ping') {
        // Also respond to general ping for content script detection
        sendResponse({ status: 'ok' });
    }
    // Return false since we're handling responses synchronously
    return false;
});
/**
 * Toggle responsive preview mode on/off
 */
function toggleResponsiveMode(enabled) {
    responsivePreviewActive = enabled;
    if (enabled) {
        // Automatically show the responsive preview when enabled
        // Use setTimeout to ensure this happens after the response is sent
        setTimeout(() => {
            try {
                // Show preview in the center of the screen
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                showResponsivePreview(centerX, centerY);
                // Log for debugging
                console.log('Responsive preview enabled and shown');
            }
            catch (error) {
                console.error('Error showing responsive preview:', error);
            }
        }, 50);
    }
    else if (activeViewportOverlay) {
        try {
            removeViewportOverlay();
            console.log('Responsive preview removed');
        }
        catch (error) {
            console.error('Error removing responsive preview:', error);
        }
    }
}
/**
 * Add a custom viewport size
 */
function addCustomViewport(width, height) {
    if (width > 0 && height > 0) {
        // Check if this viewport already exists
        const exists = customViewports.some(viewport => viewport.width === width && viewport.height === height);
        if (!exists) {
            customViewports.push({ width, height });
        }
    }
}
/**
 * Display responsive preview overlay at the specified coordinates
 */
function showResponsivePreview(clientX, clientY) {
    // Remove any existing overlay
    removeViewportOverlay();
    // Create backdrop to prevent background interaction
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'rgba(0, 0, 0, 0.85)';
    backdrop.style.backdropFilter = 'blur(8px)';
    backdrop.style.zIndex = '2147483646';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.padding = '20px';
    document.body.appendChild(backdrop);
    // Create viewport overlay container - now with a different layout
    const overlay = document.createElement('div');
    overlay.className = 'drishti-responsive-overlay';
    // Apply modern and GenZ style with inline styles
    overlay.style.position = 'relative';
    overlay.style.background = '#ffffff';
    overlay.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
    overlay.style.borderRadius = '20px';
    overlay.style.width = '95%';
    overlay.style.maxWidth = '1600px';
    overlay.style.height = '85vh';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.overflow = 'hidden';
    // Add title and close button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '16px 20px';
    header.style.background = 'linear-gradient(to right, #4f46e5, #8b5cf6)';
    header.style.color = 'white';
    header.style.borderTopLeftRadius = '20px';
    header.style.borderTopRightRadius = '20px';
    const title = document.createElement('h3');
    title.textContent = 'Responsive Preview';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';
    title.style.color = 'white';
    header.appendChild(title);
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'rgba(255, 255, 255, 0.25)';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.fontSize = '22px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.lineHeight = '1';
    closeButton.style.transition = 'background 0.2s';
    closeButton.addEventListener('mouseover', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.4)';
    });
    closeButton.addEventListener('mouseout', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.25)';
    });
    closeButton.addEventListener('click', removeViewportOverlay);
    header.appendChild(closeButton);
    overlay.appendChild(header);
    // Create a flex container for the main content (sidebar + preview)
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.flex = '1';
    mainContent.style.overflow = 'hidden';
    // Create left sidebar for device selection
    const sidebar = document.createElement('div');
    sidebar.style.width = '250px';
    sidebar.style.borderRight = '1px solid #e1e7ef';
    sidebar.style.background = '#f8fafc';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.overflow = 'auto';
    sidebar.style.padding = '20px 15px';
    // Create sidebar section title
    const sidebarTitle = document.createElement('h4');
    sidebarTitle.textContent = 'Device Presets';
    sidebarTitle.style.margin = '0 0 15px 0';
    sidebarTitle.style.fontSize = '15px';
    sidebarTitle.style.fontWeight = '600';
    sidebarTitle.style.color = '#4f46e5';
    sidebar.appendChild(sidebarTitle);
    // Create device selection buttons group
    const deviceButtonsGroup = document.createElement('div');
    deviceButtonsGroup.style.display = 'flex';
    deviceButtonsGroup.style.flexDirection = 'column';
    deviceButtonsGroup.style.gap = '10px';
    deviceButtonsGroup.style.marginBottom = '25px';
    const deviceFrames = {
        // iPhone frame - completely redesigned to avoid overlapping
        iPhone: `<svg viewBox="0 0 375 667" style="position:absolute;width:100%;height:100%;top:0;left:0;pointer-events:none;z-index:0">
      <defs>
        <mask id="iphone-screen-mask">
          <rect x="0" y="0" width="375" height="667" fill="white"/>
          <rect x="16" y="16" width="343" height="635" rx="26" ry="26" fill="black"/>
        </mask>
      </defs>
      <rect x="0" y="0" width="375" height="667" rx="40" ry="40" fill="#333" mask="url(#iphone-screen-mask)" />
      <rect x="16" y="16" width="343" height="635" rx="26" ry="26" fill="none" stroke="#666" stroke-width="1" />
      <circle cx="187.5" cy="40" r="8" fill="#444" />
      <rect x="167.5" y="635" width="40" height="6" rx="3" ry="3" fill="#444" />
    </svg>`,
        // iPad frame - completely redesigned to avoid overlapping
        iPad: `<svg viewBox="0 0 768 1024" style="position:absolute;width:100%;height:100%;top:0;left:0;pointer-events:none;z-index:0">
      <defs>
        <mask id="ipad-screen-mask">
          <rect x="0" y="0" width="768" height="1024" fill="white"/>
          <rect x="16" y="16" width="736" height="992" rx="26" ry="26" fill="black"/>
        </mask>
      </defs>
      <rect x="0" y="0" width="768" height="1024" rx="40" ry="40" fill="#333" mask="url(#ipad-screen-mask)" />
      <rect x="16" y="16" width="736" height="992" rx="26" ry="26" fill="none" stroke="#666" stroke-width="1" />
      <circle cx="384" cy="36" r="8" fill="#444" />
      <circle cx="384" cy="988" r="30" stroke="#444" stroke-width="2" fill="none" />
    </svg>`,
        // Desktop frame - completely redesigned to avoid overlapping
        Desktop: `<svg viewBox="0 0 1440 900" style="position:absolute;width:100%;height:100%;top:0;left:0;pointer-events:none;z-index:0">
      <defs>
        <mask id="desktop-screen-mask">
          <rect x="0" y="0" width="1440" height="900" fill="white"/>
          <rect x="0" y="35" width="1440" height="865" fill="black"/>
        </mask>
      </defs>
      <rect x="0" y="0" width="1440" height="900" rx="6" ry="6" fill="#333" mask="url(#desktop-screen-mask)" />
      <rect x="0" y="0" width="1440" height="35" rx="6" ry="6" fill="#222" />
      <circle cx="18" cy="18" r="6" fill="#ff5f57" />
      <circle cx="38" cy="18" r="6" fill="#febc2e" />
      <circle cx="58" cy="18" r="6" fill="#28c840" />
    </svg>`,
        // Add a blank frame for custom sizes
        custom: ''
    };
    // Add device buttons in the sidebar
    DEVICE_VIEWPORTS.forEach(device => {
        const deviceButton = document.createElement('button');
        deviceButton.textContent = device.name;
        deviceButton.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
        deviceButton.style.border = '1px solid #d0d5dd';
        deviceButton.style.borderRadius = '12px';
        deviceButton.style.padding = '12px 15px';
        deviceButton.style.fontSize = '14px';
        deviceButton.style.fontWeight = '500';
        deviceButton.style.cursor = 'pointer';
        deviceButton.style.textAlign = 'left';
        deviceButton.style.transition = 'all 0.2s ease';
        deviceButton.style.color = '#333';
        deviceButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        deviceButton.style.position = 'relative';
        // Add device dimension as a subtitle
        const dimensionSpan = document.createElement('span');
        dimensionSpan.textContent = `${device.width} × ${device.height}`;
        dimensionSpan.style.display = 'block';
        dimensionSpan.style.fontSize = '12px';
        dimensionSpan.style.color = '#666';
        dimensionSpan.style.marginTop = '4px';
        deviceButton.appendChild(dimensionSpan);
        deviceButton.addEventListener('mouseover', () => {
            deviceButton.style.background = 'linear-gradient(to bottom, #ffffff, #e6e6e6)';
            deviceButton.style.transform = 'translateY(-1px)';
            deviceButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        });
        deviceButton.addEventListener('mouseout', () => {
            if (!deviceButton.classList.contains('active')) {
                deviceButton.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
                deviceButton.style.transform = 'translateY(0)';
                deviceButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
            }
        });
        deviceButton.addEventListener('click', () => {
            // Get the type of device for frame selection
            let deviceType = 'Desktop';
            if (device.name.includes('iPhone'))
                deviceType = 'iPhone';
            if (device.name.includes('iPad'))
                deviceType = 'iPad';
            updateViewport(device.width, device.height, deviceType);
            // Mark this button as active and others as inactive
            const allButtons = deviceButtonsGroup.querySelectorAll('button');
            allButtons.forEach(btn => {
                btn.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
                btn.style.color = '#333';
                btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btn.style.transform = 'translateY(0)';
                btn.style.borderLeft = '1px solid #d0d5dd';
                btn.classList.remove('active');
            });
            deviceButton.style.background = 'linear-gradient(to right, #4f46e5, #8b5cf6)';
            deviceButton.style.color = 'white';
            deviceButton.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.4)';
            deviceButton.style.transform = 'translateY(-1px)';
            deviceButton.style.borderLeft = '4px solid #4338ca';
            deviceButton.classList.add('active');
            // Make child span white when active
            const span = deviceButton.querySelector('span');
            if (span) {
                span.style.color = 'rgba(255, 255, 255, 0.8)';
            }
        });
        deviceButtonsGroup.appendChild(deviceButton);
    });
    sidebar.appendChild(deviceButtonsGroup);
    // Add custom size section to sidebar
    const customSizeTitle = document.createElement('h4');
    customSizeTitle.textContent = 'Custom Size';
    customSizeTitle.style.margin = '0 0 15px 0';
    customSizeTitle.style.fontSize = '15px';
    customSizeTitle.style.fontWeight = '600';
    customSizeTitle.style.color = '#4f46e5';
    sidebar.appendChild(customSizeTitle);
    // Create custom viewport inputs
    const customInputsContainer = document.createElement('div');
    customInputsContainer.style.display = 'flex';
    customInputsContainer.style.flexDirection = 'column';
    customInputsContainer.style.gap = '15px';
    // Width input with label
    const widthGroup = document.createElement('div');
    widthGroup.style.display = 'flex';
    widthGroup.style.flexDirection = 'column';
    widthGroup.style.gap = '5px';
    const widthLabel = document.createElement('label');
    widthLabel.textContent = 'Width';
    widthLabel.style.fontSize = '13px';
    widthLabel.style.fontWeight = '500';
    widthLabel.style.color = '#555';
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.placeholder = 'e.g. 375';
    widthInput.style.width = '100%';
    widthInput.style.padding = '10px 12px';
    widthInput.style.border = '1px solid #ddd';
    widthInput.style.borderRadius = '10px';
    widthInput.style.fontSize = '14px';
    widthInput.style.outline = 'none';
    widthInput.style.transition = 'border-color 0.2s';
    widthInput.addEventListener('focus', () => {
        widthInput.style.borderColor = '#6366F1';
    });
    widthInput.addEventListener('blur', () => {
        widthInput.style.borderColor = '#ddd';
    });
    widthGroup.appendChild(widthLabel);
    widthGroup.appendChild(widthInput);
    customInputsContainer.appendChild(widthGroup);
    // Height input with label
    const heightGroup = document.createElement('div');
    heightGroup.style.display = 'flex';
    heightGroup.style.flexDirection = 'column';
    heightGroup.style.gap = '5px';
    const heightLabel = document.createElement('label');
    heightLabel.textContent = 'Height';
    heightLabel.style.fontSize = '13px';
    heightLabel.style.fontWeight = '500';
    heightLabel.style.color = '#555';
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.placeholder = 'e.g. 667';
    heightInput.style.width = '100%';
    heightInput.style.padding = '10px 12px';
    heightInput.style.border = '1px solid #ddd';
    heightInput.style.borderRadius = '10px';
    heightInput.style.fontSize = '14px';
    heightInput.style.outline = 'none';
    heightInput.style.transition = 'border-color 0.2s';
    heightInput.addEventListener('focus', () => {
        heightInput.style.borderColor = '#6366F1';
    });
    heightInput.addEventListener('blur', () => {
        heightInput.style.borderColor = '#ddd';
    });
    heightGroup.appendChild(heightLabel);
    heightGroup.appendChild(heightInput);
    customInputsContainer.appendChild(heightGroup);
    // Apply button
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Custom Size';
    applyButton.style.background = 'linear-gradient(to right, #6366F1, #8B5CF6)';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.borderRadius = '10px';
    applyButton.style.padding = '12px 16px';
    applyButton.style.fontSize = '14px';
    applyButton.style.fontWeight = '500';
    applyButton.style.cursor = 'pointer';
    applyButton.style.transition = 'all 0.2s ease';
    applyButton.style.marginTop = '5px';
    applyButton.addEventListener('mouseover', () => {
        applyButton.style.transform = 'translateY(-1px)';
        applyButton.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
    });
    applyButton.addEventListener('mouseout', () => {
        applyButton.style.transform = 'translateY(0)';
        applyButton.style.boxShadow = 'none';
    });
    applyButton.addEventListener('click', () => {
        const width = parseInt(widthInput.value, 10);
        const height = parseInt(heightInput.value, 10);
        if (width > 0 && height > 0) {
            updateViewport(width, height, 'custom');
            addCustomViewport(width, height);
            // Clear active state from device buttons
            const allButtons = deviceButtonsGroup.querySelectorAll('button');
            allButtons.forEach(btn => {
                btn.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
                btn.style.color = '#333';
                btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btn.style.transform = 'translateY(0)';
                btn.style.borderLeft = '1px solid #d0d5dd';
                btn.classList.remove('active');
                // Reset span color
                const span = btn.querySelector('span');
                if (span) {
                    span.style.color = '#666';
                }
            });
        }
    });
    customInputsContainer.appendChild(applyButton);
    sidebar.appendChild(customInputsContainer);
    // Create main preview area
    const previewContainer = document.createElement('div');
    previewContainer.style.flex = '1';
    previewContainer.style.display = 'flex';
    previewContainer.style.justifyContent = 'center';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.background = '#f0f0f0';
    previewContainer.style.position = 'relative';
    previewContainer.style.overflow = 'auto';
    previewContainer.style.padding = '30px';
    // Create viewport display container with frame support
    const viewportContainer = document.createElement('div');
    viewportContainer.style.position = 'relative';
    viewportContainer.style.overflow = 'hidden';
    viewportContainer.style.transition = 'width 0.3s, height 0.3s';
    viewportContainer.style.margin = '0 auto';
    viewportContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    viewportContainer.style.background = '#fff';
    viewportContainer.style.display = 'flex';
    viewportContainer.style.alignItems = 'stretch';
    viewportContainer.style.justifyContent = 'center';
    // Create device frame container for SVG (add BEFORE the iframe to be behind it)
    const frameContainer = document.createElement('div');
    frameContainer.style.position = 'absolute';
    frameContainer.style.top = '0';
    frameContainer.style.left = '0';
    frameContainer.style.right = '0';
    frameContainer.style.bottom = '0';
    frameContainer.style.zIndex = '0';
    frameContainer.style.pointerEvents = 'none';
    frameContainer.style.display = 'flex';
    frameContainer.style.alignItems = 'stretch';
    // Add the frame container first (behind)
    viewportContainer.appendChild(frameContainer);
    // Create iframe to display the page
    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.display = 'block';
    iframe.style.position = 'relative';
    iframe.style.zIndex = '1';
    iframe.style.background = 'white';
    iframe.style.flexGrow = '1';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.boxSizing = 'border-box';
    // Add proper security attributes
    iframe.referrerPolicy = 'same-origin';
    // Add the iframe after (in front)
    viewportContainer.appendChild(iframe);
    // Set the source URL
    try {
        iframe.src = window.location.href;
        console.log('Set iframe source to:', window.location.href);
    }
    catch (error) {
        console.error('Error setting iframe source:', error);
        iframe.src = 'about:blank';
    }
    // Setup scroll sync when iframe loads
    iframe.addEventListener('load', () => {
        console.log('Iframe loaded');
        try {
            setupScrollSync(iframe);
        }
        catch (error) {
            console.error('Error setting up scroll sync:', error);
        }
    });
    // Add the viewport container to the preview container
    previewContainer.appendChild(viewportContainer);
    // Add dimension display
    const dimensionDisplay = document.createElement('div');
    dimensionDisplay.style.position = 'absolute';
    dimensionDisplay.style.bottom = '15px';
    dimensionDisplay.style.left = '50%';
    dimensionDisplay.style.transform = 'translateX(-50%)';
    dimensionDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
    dimensionDisplay.style.color = 'white';
    dimensionDisplay.style.padding = '8px 15px';
    dimensionDisplay.style.borderRadius = '20px';
    dimensionDisplay.style.fontSize = '13px';
    dimensionDisplay.style.fontWeight = '500';
    dimensionDisplay.style.zIndex = '10';
    dimensionDisplay.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    previewContainer.appendChild(dimensionDisplay);
    // Add sidebar and preview area to main content
    mainContent.appendChild(sidebar);
    mainContent.appendChild(previewContainer);
    // Add main content to overlay
    overlay.appendChild(mainContent);
    // Add the overlay to the backdrop
    backdrop.appendChild(overlay);
    // Set initial viewport size (default to iPhone 12)
    const defaultDevice = DEVICE_VIEWPORTS.find(device => device.name === 'iPhone 12/13/14') || DEVICE_VIEWPORTS[0];
    // Set initial device (will be iPhone)
    let deviceType = 'Desktop';
    if (defaultDevice.name.includes('iPhone'))
        deviceType = 'iPhone';
    if (defaultDevice.name.includes('iPad'))
        deviceType = 'iPad';
    // Set initial size with device frame
    updateViewport(defaultDevice.width, defaultDevice.height, deviceType);
    // Highlight the default device button
    setTimeout(() => {
        const allButtons = deviceButtonsGroup.querySelectorAll('button');
        allButtons.forEach(btn => {
            const btnText = btn.textContent || '';
            if (btnText.includes(defaultDevice.name)) {
                btn.style.background = 'linear-gradient(to right, #4f46e5, #8b5cf6)';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.4)';
                btn.style.transform = 'translateY(-1px)';
                btn.style.borderLeft = '4px solid #4338ca';
                btn.classList.add('active');
                // Make child span white when active
                const span = btn.querySelector('span');
                if (span) {
                    span.style.color = 'rgba(255, 255, 255, 0.8)';
                }
            }
        });
    }, 0);
    // Store references to elements for cleanup
    activeViewportOverlay = backdrop;
    // Function to update viewport size and frame
    function updateViewport(width, height, deviceType = 'custom') {
        console.log(`Updating viewport to ${width}x${height} with device type ${deviceType}`);
        if (!viewportContainer || !iframe || !frameContainer)
            return;
        // Update container style to fixed dimensions
        viewportContainer.style.width = `${width}px`;
        viewportContainer.style.height = `${height}px`;
        // Update device frame based on device type
        if (deviceFrames[deviceType]) {
            frameContainer.innerHTML = deviceFrames[deviceType];
            frameContainer.style.display = 'flex';
            // Fill the entire frame with the content by adjusting padding and clip paths
            if (deviceType === 'iPhone') {
                iframe.style.width = 'calc(100% - 32px)';
                iframe.style.height = 'calc(100% - 32px)';
                iframe.style.margin = '16px';
                iframe.style.borderRadius = '25px';
                iframe.style.clipPath = 'none';
            }
            else if (deviceType === 'iPad') {
                iframe.style.width = 'calc(100% - 32px)';
                iframe.style.height = 'calc(100% - 32px)';
                iframe.style.margin = '16px';
                iframe.style.borderRadius = '24px';
                iframe.style.clipPath = 'none';
            }
            else if (deviceType === 'Desktop') {
                iframe.style.width = '100%';
                iframe.style.height = 'calc(100% - 35px)';
                iframe.style.margin = '35px 0 0 0';
                iframe.style.borderRadius = '0';
                iframe.style.clipPath = 'none';
            }
            // Reset border when using device frames
            viewportContainer.style.border = 'none';
            viewportContainer.style.borderRadius = '0px';
        }
        else {
            frameContainer.innerHTML = '';
            frameContainer.style.display = 'none';
            // Reset iframe styles for custom sizes
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.margin = '0';
            iframe.style.borderRadius = '0';
            iframe.style.clipPath = 'none';
            // Add border for custom sizes
            viewportContainer.style.border = '1px solid #ddd';
            viewportContainer.style.borderRadius = '4px';
        }
        // Update dimension display
        if (dimensionDisplay) {
            dimensionDisplay.textContent = `${width} × ${height}${deviceType !== 'custom' ? ` - ${deviceType}` : ''}`;
        }
    }
}
/**
 * Position the viewport overlay near the specified coordinates
 */
function positionViewportOverlay(overlay, clientX, clientY) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const overlayWidth = 800; // Estimated initial width
    const overlayHeight = 600; // Estimated initial height
    // Try to position it centered on screen
    let left = Math.max(0, (windowWidth - overlayWidth) / 2);
    let top = Math.max(0, (windowHeight - overlayHeight) / 2);
    // Ensure the overlay stays within the viewport
    left = Math.min(left, windowWidth - overlayWidth);
    top = Math.min(top, windowHeight - overlayHeight);
    // Apply positioning
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
}
/**
 * Remove the viewport overlay
 */
function removeViewportOverlay() {
    // Remove the main overlay backdrop which contains all elements
    if (activeViewportOverlay && activeViewportOverlay.parentNode) {
        activeViewportOverlay.parentNode.removeChild(activeViewportOverlay);
        activeViewportOverlay = null;
    }
    // Enable scrolling on body in case it was disabled
    document.body.style.overflow = '';
    console.log('Responsive preview removed successfully');
}
/**
 * Setup scroll synchronization between the main page and the iframe
 * This handles the case when cross-origin restrictions prevent accessing iframe content
 */
function setupScrollSync(iframe) {
    try {
        // Check if we can access the iframe content (this will throw an error if cross-origin)
        const contentWindow = iframe.contentWindow;
        if (!contentWindow) {
            console.warn('Cannot access iframe contentWindow - scroll sync disabled');
            return;
        }
        // Give time for content to fully load
        setTimeout(() => {
            try {
                // Attempt to access the document (this will throw if cross-origin)
                const iframeDoc = iframe.contentDocument || contentWindow.document;
                if (!iframeDoc) {
                    console.warn('Cannot access iframe document - scroll sync disabled');
                    return;
                }
                // Ensure iframe content is visible by forcing a refresh
                contentWindow.dispatchEvent(new Event('resize'));
                // Since we can access the document, proceed with scroll sync
                console.log('Setting up scroll sync for iframe');
                // Flag to prevent infinite scroll loops
                let isScrolling = false;
                // Sync iframe scroll to main page
                contentWindow.addEventListener('scroll', () => {
                    if (isScrolling)
                        return;
                    isScrolling = true;
                    try {
                        // Calculate relative scroll position (percentage)
                        const iframeScrollHeight = iframeDoc.documentElement.scrollHeight - contentWindow.innerHeight;
                        if (iframeScrollHeight <= 0) {
                            isScrolling = false;
                            return; // Avoid division by zero
                        }
                        const scrollPercentage = contentWindow.scrollY / iframeScrollHeight;
                        // Apply same percentage to main page
                        const mainScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                        if (mainScrollHeight > 0) {
                            window.scrollTo({
                                top: mainScrollHeight * scrollPercentage,
                                behavior: 'auto'
                            });
                        }
                    }
                    catch (error) {
                        console.warn('Error during iframe scroll sync:', error);
                    }
                    // Reset flag after a small delay
                    setTimeout(() => {
                        isScrolling = false;
                    }, 50);
                });
                // Sync main page scroll to iframe
                window.addEventListener('scroll', () => {
                    if (isScrolling)
                        return;
                    isScrolling = true;
                    try {
                        // Calculate relative scroll position (percentage)
                        const mainScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                        if (mainScrollHeight <= 0) {
                            isScrolling = false;
                            return; // Avoid division by zero
                        }
                        const scrollPercentage = window.scrollY / mainScrollHeight;
                        // Apply same percentage to iframe
                        const iframeScrollHeight = iframeDoc.documentElement.scrollHeight - contentWindow.innerHeight;
                        if (iframeScrollHeight > 0) {
                            contentWindow.scrollTo({
                                top: iframeScrollHeight * scrollPercentage,
                                behavior: 'auto'
                            });
                        }
                    }
                    catch (error) {
                        console.warn('Error during main page scroll sync:', error);
                    }
                    // Reset flag after a small delay
                    setTimeout(() => {
                        isScrolling = false;
                    }, 50);
                });
                console.log('Scroll sync setup successfully');
            }
            catch (error) {
                // This is expected on cross-origin iframes
                console.warn('Could not set up scroll sync due to cross-origin restrictions:', error);
            }
        }, 300); // Give iframe time to load
    }
    catch (error) {
        // This is expected on cross-origin iframes
        console.warn('Could not set up scroll sync due to cross-origin restrictions');
    }
}
