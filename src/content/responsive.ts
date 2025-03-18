/// <reference types="chrome"/>

/**
 * DrishtiDev Responsive Design Preview
 * Content script that adds responsive design preview functionality to any webpage.
 * When enabled, it allows viewing the page in different device dimensions.
 */

// Predefined device viewport sizes
interface DeviceViewport {
  name: string;
  width: number;
  height: number;
  devicePixelRatio?: number;
}

// Custom viewport interface
interface CustomViewport {
  width: number;
  height: number;
}

// Interface for DOM element references
interface DOMElements {
  previewContainer: HTMLDivElement;
  viewportContainer: HTMLDivElement;
  iframe: HTMLIFrameElement;
  frameContainer: HTMLDivElement;
  dimensionDisplay: HTMLDivElement;
}

// Store predefined device viewports
const DEVICE_VIEWPORTS: DeviceViewport[] = [
  { name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2 },
  { name: 'iPhone XR/11', width: 414, height: 896, devicePixelRatio: 2 },
  { name: 'iPhone 12/13/14', width: 390, height: 844, devicePixelRatio: 3 },
  { name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2 },
  { name: 'iPad Pro', width: 1024, height: 1366, devicePixelRatio: 2 },
  { name: 'MacBook Air', width: 1280, height: 800, devicePixelRatio: 2 },
  { name: 'Desktop HD', width: 1920, height: 1080 }
];

// Store currently active viewport overlay
let activeViewportOverlay: HTMLElement | null = null;
// Track if responsive mode is active
let responsivePreviewActive = false;
// Store custom viewports set by the user
let customViewports: CustomViewport[] = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  console.log('Responsive script received message:', message);
  
  if (message.action === 'toggleResponsive') {
    console.log('Toggle responsive mode:', message.enabled);
    // Handle toggle immediately without any delay
    toggleResponsiveMode(message.enabled);
    // Send response after toggle
    sendResponse({ success: true });
  } else if (message.action === 'setCustomViewport') {
    addCustomViewport(message.width, message.height);
    sendResponse({ success: true });
  } else if (message.action === 'showViewportPreview') {
    console.log('Show viewport preview at:', message.clientX, message.clientY);
    showResponsivePreview(message.clientX, message.clientY);
    sendResponse({ success: true });
  } else if (message.action === 'pingResponsive') {
    console.log('Ping responsive received');
    sendResponse({ responsive: 'ok' });
  } else if (message.action === 'ping') {
    sendResponse({ status: 'ok' });
  }
  
  return true; // Keep the message channel open for async response
});

/**
 * Toggle responsive preview mode on/off
 */
function toggleResponsiveMode(enabled: boolean): void {
  console.log('Toggling responsive mode:', enabled);
  responsivePreviewActive = enabled;
  
  if (enabled) {
    try {
      // Remove any existing overlay first
      removeViewportOverlay();
      
      // Show the responsive preview immediately
      const centerX = Math.floor(window.innerWidth / 2);
      const centerY = Math.floor(window.innerHeight / 2);
      
      // Create and add backdrop immediately
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
      
      // Add backdrop to body immediately
      document.body.appendChild(backdrop);
      console.log('Backdrop added to document body');
      
      // Show responsive preview
      showResponsivePreview(centerX, centerY);
      console.log('Responsive preview shown at:', centerX, centerY);
    } catch (error) {
      console.error('Error showing responsive preview:', error);
    }
  } else {
    try {
      removeViewportOverlay();
      console.log('Responsive preview removed');
    } catch (error) {
      console.error('Error removing responsive preview:', error);
    }
  }
}

/**
 * Add a custom viewport size
 */
function addCustomViewport(width: number, height: number): void {
  if (width > 0 && height > 0) {
    // Check if this viewport already exists
    const exists = customViewports.some(
      viewport => viewport.width === width && viewport.height === height
    );
    
    if (!exists) {
      customViewports.push({ width, height });
    }
  }
}

/**
 * Display responsive preview overlay at the specified coordinates
 */
function showResponsivePreview(clientX: number, clientY: number): void {
  console.log('Showing responsive preview at:', clientX, clientY);
  
  // Remove any existing overlay first
  removeViewportOverlay();
  
  // Create backdrop with improved visibility
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
  
  // Ensure the backdrop is added to the document
  document.body.appendChild(backdrop);
  console.log('Backdrop added to document body');
  
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
  
  // Create main content area with improved layout
  const mainContent = document.createElement('div');
  mainContent.style.display = 'flex';
  mainContent.style.height = 'calc(100% - 60px)'; // Account for header height
  mainContent.style.overflow = 'hidden';
  mainContent.style.position = 'relative';
  
  // Create sidebar with improved scrolling and containment
  const sidebar = document.createElement('div');
  sidebar.style.width = '280px';
  sidebar.style.borderRight = '1px solid #e5e7eb';
  sidebar.style.background = '#ffffff';
  sidebar.style.padding = '20px';
  sidebar.style.display = 'flex';
  sidebar.style.flexDirection = 'column';
  sidebar.style.height = '100%';
  sidebar.style.overflowY = 'auto';
  sidebar.style.overflowX = 'hidden';
  sidebar.style.position = 'relative';
  sidebar.style.boxSizing = 'border-box';
  
  // Create sidebar section title
  const sidebarTitle = document.createElement('h4');
  sidebarTitle.textContent = 'Device Presets';
  sidebarTitle.style.margin = '0 0 15px 0';
  sidebarTitle.style.fontSize = '15px';
  sidebarTitle.style.fontWeight = '600';
  sidebarTitle.style.color = '#4f46e5';
  sidebar.appendChild(sidebarTitle);
  
  // Create device buttons group with improved layout
  const deviceButtonsGroup = document.createElement('div');
  deviceButtonsGroup.style.display = 'flex';
  deviceButtonsGroup.style.flexDirection = 'column';
  deviceButtonsGroup.style.gap = '8px';
  deviceButtonsGroup.style.marginBottom = '20px';
  deviceButtonsGroup.style.width = '100%';
  deviceButtonsGroup.style.boxSizing = 'border-box';
  
  // Define device SVG frames with proper typing
  interface DeviceFrames {
    iPhone: string;
    iPad: string;
    Desktop: string;
    [key: string]: string; // Allow string indexing
  }

  const deviceFrames: DeviceFrames = {
    // iPhone frame - completely redesigned to avoid overlapping
    iPhone: `
      <svg viewBox="0 0 375 667" style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1">
        <rect x="0" y="0" width="375" height="667" rx="40" fill="#1a1a1a"/>
        <rect x="16" y="16" width="343" height="635" rx="32" fill="#ffffff"/>
        <path d="M156 12h63a4 4 0 010 8h-63a4 4 0 010-8z" fill="#0a0a0a"/>
        <circle cx="187.5" cy="38" r="8" fill="#0a0a0a"/>
        <rect x="167.5" y="633" width="40" height="6" rx="3" fill="#0a0a0a"/>
      </svg>
    `,
    
    // iPad frame - completely redesigned to avoid overlapping
    iPad: `
      <svg viewBox="0 0 768 1024" style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1">
        <rect x="0" y="0" width="768" height="1024" rx="40" fill="#1a1a1a"/>
        <rect x="16" y="16" width="736" height="992" rx="32" fill="#ffffff"/>
        <circle cx="384" cy="36" r="8" fill="#0a0a0a"/>
        <circle cx="384" cy="988" r="30" stroke="#0a0a0a" stroke-width="2" fill="none"/>
      </svg>
    `,
    
    // Desktop frame - completely redesigned to avoid overlapping
    Desktop: `
      <svg viewBox="0 0 1440 900" style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1">
        <rect x="0" y="0" width="1440" height="900" rx="6" fill="#1a1a1a"/>
        <rect x="0" y="35" width="1440" height="865" fill="#ffffff"/>
        <rect x="0" y="0" width="1440" height="35" rx="6" fill="#0a0a0a"/>
        <circle cx="18" cy="18" r="6" fill="#ff5f57"/>
        <circle cx="38" cy="18" r="6" fill="#febc2e"/>
        <circle cx="58" cy="18" r="6" fill="#28c840"/>
      </svg>
    `,
    
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
    deviceButton.style.transition = 'all 0.3s ease';
    deviceButton.style.color = '#333';
    deviceButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    deviceButton.style.position = 'relative';
    deviceButton.style.width = '100%';
    deviceButton.style.boxSizing = 'border-box';
    deviceButton.style.overflow = 'hidden';
    deviceButton.style.textOverflow = 'ellipsis';
    deviceButton.style.whiteSpace = 'nowrap';
    deviceButton.style.marginBottom = '4px';
    
    // Add device dimension as a subtitle
    const dimensionSpan = document.createElement('span');
    dimensionSpan.textContent = `${device.width} × ${device.height}`;
    dimensionSpan.style.display = 'block';
    dimensionSpan.style.fontSize = '12px';
    dimensionSpan.style.color = '#666';
    dimensionSpan.style.marginTop = '4px';
    deviceButton.appendChild(dimensionSpan);
    
    deviceButton.addEventListener('mouseover', () => {
      if (!deviceButton.classList.contains('active')) {
        deviceButton.style.background = 'linear-gradient(to bottom, #ffffff, #e6e6e6)';
        deviceButton.style.transform = 'translateY(-2px)';
        deviceButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      }
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
      if (device.name.includes('iPhone')) deviceType = 'iPhone';
      if (device.name.includes('iPad')) deviceType = 'iPad';
      
      updateViewport(device.width, device.height, deviceType, elements);
      
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
  customInputsContainer.style.width = '100%';
  customInputsContainer.style.boxSizing = 'border-box';
  customInputsContainer.style.marginBottom = '20px';
  
  // Width input with label
  const widthGroup = document.createElement('div');
  widthGroup.style.display = 'flex';
  widthGroup.style.flexDirection = 'column';
  widthGroup.style.gap = '5px';
  widthGroup.style.width = '100%';
  widthGroup.style.boxSizing = 'border-box';
  
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
  widthInput.style.boxSizing = 'border-box';
  
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
  heightGroup.style.width = '100%';
  heightGroup.style.boxSizing = 'border-box';
  
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
  heightInput.style.boxSizing = 'border-box';
  
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
      updateViewport(width, height, 'custom', elements);
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
  previewContainer.style.overflow = 'hidden';
  previewContainer.style.padding = '30px';
  previewContainer.style.boxSizing = 'border-box';
  previewContainer.style.minWidth = '0'; // Allow container to shrink below content size
  
  // Create viewport display container with frame support
  const viewportContainer = document.createElement('div');
  viewportContainer.className = 'drishti-viewport-container';
  viewportContainer.style.position = 'relative';
  viewportContainer.style.overflow = 'hidden';
  viewportContainer.style.transition = 'width 0.3s, height 0.3s';
  viewportContainer.style.margin = '0 auto';
  viewportContainer.style.background = '#fff';
  viewportContainer.style.display = 'flex';
  viewportContainer.style.alignItems = 'center';
  viewportContainer.style.justifyContent = 'center';
  viewportContainer.style.maxWidth = '100%';
  viewportContainer.style.maxHeight = '100%';
  viewportContainer.style.boxSizing = 'border-box';
  viewportContainer.style.transformOrigin = 'center center';
  
  // Create device frame container for SVG
  const frameContainer = document.createElement('div');
  frameContainer.className = 'drishti-frame-container';
  frameContainer.style.position = 'absolute';
  frameContainer.style.top = '0';
  frameContainer.style.left = '0';
  frameContainer.style.right = '0';
  frameContainer.style.bottom = '0';
  frameContainer.style.zIndex = '1';
  frameContainer.style.pointerEvents = 'none';
  frameContainer.style.display = 'flex';
  frameContainer.style.alignItems = 'stretch';
  frameContainer.style.justifyContent = 'center';
  
  // Add the frame container first (behind)
  viewportContainer.appendChild(frameContainer);
  
  // Create iframe with improved containment
  const iframe = document.createElement('iframe');
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.display = 'block';
  iframe.style.position = 'relative';
  iframe.style.zIndex = '2';
  iframe.style.background = 'white';
  iframe.style.margin = '0';
  iframe.style.padding = '0';
  iframe.style.boxSizing = 'border-box';
  iframe.style.overflow = 'auto';
  iframe.style.transform = 'translate3d(0,0,0)';
  
  // Add proper security attributes
  iframe.referrerPolicy = 'same-origin';
  
  // Add the iframe after (in front)
  viewportContainer.appendChild(iframe);
  
  // Set the source URL
  try {
    iframe.src = window.location.href;
    console.log('Set iframe source to:', window.location.href);
  } catch (error) {
    console.error('Error setting iframe source:', error);
    iframe.src = 'about:blank';
  }
  
  // Setup scroll sync when iframe loads
  iframe.addEventListener('load', () => {
    console.log('Iframe loaded');
    try {
      setupScrollSync(iframe);
    } catch (error) {
      console.error('Error setting up scroll sync:', error);
    }
  });
  
  // Add the viewport container to the preview container
  previewContainer.appendChild(viewportContainer);
  
  // Add dimension display
  const dimensionDisplay = document.createElement('div');
  dimensionDisplay.className = 'drishti-dimension-display';
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
  dimensionDisplay.style.opacity = '0';
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
  if (defaultDevice.name.includes('iPhone')) deviceType = 'iPhone';
  if (defaultDevice.name.includes('iPad')) deviceType = 'iPad';
  
  // Store direct references to DOM elements needed for updates
  const elements: DOMElements = {
    previewContainer,
    viewportContainer,
    iframe,
    frameContainer,
    dimensionDisplay
  };
  
  // Set initial size with device frame
  updateViewport(defaultDevice.width, defaultDevice.height, deviceType, elements);
  
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
  function updateViewport(width: number, height: number, deviceType: string = 'custom', elements: DOMElements): void {
    // Add a delay to ensure DOM elements are fully rendered
    setTimeout(() => {
      console.log(`Attempting to update viewport to ${width}x${height} with device type ${deviceType}`);
      
      const { previewContainer, viewportContainer, iframe, frameContainer, dimensionDisplay } = elements;
      
      // Check if all required elements exist
      if (!previewContainer || !viewportContainer || !iframe || !frameContainer) {
        console.error('Required elements not found for viewport update:', {
          previewContainer: !!previewContainer,
          viewportContainer: !!viewportContainer,
          iframe: !!iframe,
          frameContainer: !!frameContainer
        });
        return;
      }

      try {
        // Force dimensions to be exactly as specified
        viewportContainer.style.width = `${width}px`;
        viewportContainer.style.height = `${height}px`;
        viewportContainer.style.maxWidth = '100%';
        viewportContainer.style.maxHeight = 'calc(100vh - 200px)';
        viewportContainer.style.transform = 'scale(1)';
        viewportContainer.style.transformOrigin = 'center center';
        viewportContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        viewportContainer.style.overflow = 'hidden';
        
        // Calculate and apply scaling if needed
        const containerWidth = previewContainer.clientWidth - 60;
        const containerHeight = previewContainer.clientHeight - 60;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        if (scale < 1) {
          viewportContainer.style.transform = `scale(${scale})`;
        }
        
        // Update device frame with improved positioning and content containment
        if (deviceFrames[deviceType]) {
          frameContainer.innerHTML = deviceFrames[deviceType];
          frameContainer.style.display = 'flex';
          frameContainer.style.opacity = '1';
          
          // Adjust iframe dimensions with proper padding and containment
          if (deviceType === 'iPhone') {
            iframe.style.width = 'calc(100% - 32px)';
            iframe.style.height = 'calc(100% - 32px)';
            iframe.style.margin = '16px';
            iframe.style.borderRadius = '28px';
            iframe.style.overflow = 'auto';
            viewportContainer.style.padding = '0';
          } else if (deviceType === 'iPad') {
            iframe.style.width = 'calc(100% - 32px)';
            iframe.style.height = 'calc(100% - 32px)';
            iframe.style.margin = '16px';
            iframe.style.borderRadius = '24px';
            iframe.style.overflow = 'auto';
            viewportContainer.style.padding = '0';
          } else if (deviceType === 'Desktop') {
            iframe.style.width = '100%';
            iframe.style.height = 'calc(100% - 35px)';
            iframe.style.margin = '35px 0 0 0';
            iframe.style.borderRadius = '0';
            iframe.style.overflow = 'auto';
            viewportContainer.style.padding = '0';
          }
          
          // Common iframe styles for device frames with improved containment
          iframe.style.position = 'relative';
          iframe.style.zIndex = '2';
          iframe.style.background = '#ffffff';
          iframe.style.boxSizing = 'border-box';
          iframe.style.transform = 'translate3d(0,0,0)';
          
          // Reset container styles for device frames
          viewportContainer.style.border = 'none';
          viewportContainer.style.borderRadius = '0';
          viewportContainer.style.overflow = 'hidden';
        } else {
          // Custom size styling with improved containment
          frameContainer.innerHTML = '';
          frameContainer.style.display = 'none';
          
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.margin = '0';
          iframe.style.borderRadius = '8px';
          iframe.style.position = 'relative';
          iframe.style.zIndex = '2';
          iframe.style.overflow = 'auto';
          iframe.style.transform = 'translate3d(0,0,0)';
          
          viewportContainer.style.border = '1px solid #ddd';
          viewportContainer.style.borderRadius = '8px';
          viewportContainer.style.padding = '0';
          viewportContainer.style.overflow = 'hidden';
        }
        
        // Update dimension display with improved styling
        if (dimensionDisplay) {
          dimensionDisplay.textContent = `${width} × ${height}${deviceType !== 'custom' ? ` - ${deviceType}` : ''}`;
          dimensionDisplay.style.opacity = '1';
        }
        
        // Force a reflow and ensure proper containment
        viewportContainer.offsetHeight;
        
        // Add scroll event listener to handle content overflow
        iframe.contentWindow?.addEventListener('scroll', () => {
          iframe.style.pointerEvents = 'auto';
        });
        
        console.log('Viewport updated successfully with content containment');
      } catch (error) {
        console.error('Error updating viewport:', error);
      }
    }, 50); // 50ms delay to ensure DOM elements are ready
  }

  // Add responsive media queries for better mobile layout
  const style = document.createElement('style');
  style.textContent = `
      @media (max-width: 768px) {
          .drishti-responsive-overlay {
              width: 100% !important;
              height: 100% !important;
              border-radius: 0 !important;
              margin: 0 !important;
          }
          
          ${mainContent.className} {
              flex-direction: column;
          }
          
          ${sidebar.className} {
              width: 100% !important;
              height: auto !important;
              max-height: 40vh;
              border-right: none;
              border-bottom: 1px solid #e5e7eb;
          }
          
          ${previewContainer.className} {
              height: 60vh !important;
          }
      }
  `;
  document.head.appendChild(style);
}

/**
 * Position the viewport overlay near the specified coordinates
 */
function positionViewportOverlay(overlay: HTMLElement, clientX: number, clientY: number): void {
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
function removeViewportOverlay(): void {
  console.log('Attempting to remove viewport overlay');
  try {
    // Remove the main overlay backdrop which contains all elements
    if (activeViewportOverlay && activeViewportOverlay.parentNode) {
      activeViewportOverlay.parentNode.removeChild(activeViewportOverlay);
      activeViewportOverlay = null;
      console.log('Successfully removed viewport overlay');
    } else {
      console.log('No active viewport overlay to remove');
    }
    
    // Enable scrolling on body in case it was disabled
    document.body.style.overflow = '';
  } catch (error) {
    console.error('Error removing viewport overlay:', error);
  }
}

/**
 * Setup scroll synchronization between the main page and the iframe
 * This handles the case when cross-origin restrictions prevent accessing iframe content
 */
function setupScrollSync(iframe: HTMLIFrameElement): void {
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
          if (isScrolling) return;
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
          } catch (error) {
            console.warn('Error during iframe scroll sync:', error);
          }
          
          // Reset flag after a small delay
          setTimeout(() => {
            isScrolling = false;
          }, 50);
        });
        
        // Sync main page scroll to iframe
        window.addEventListener('scroll', () => {
          if (isScrolling) return;
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
          } catch (error) {
            console.warn('Error during main page scroll sync:', error);
          }
          
          // Reset flag after a small delay
          setTimeout(() => {
            isScrolling = false;
          }, 50);
        });
        
        console.log('Scroll sync setup successfully');
      } catch (error) {
        // This is expected on cross-origin iframes
        console.warn('Could not set up scroll sync due to cross-origin restrictions:', error);
      }
    }, 300); // Give iframe time to load
  } catch (error) {
    // This is expected on cross-origin iframes
    console.warn('Could not set up scroll sync due to cross-origin restrictions');
  }
}

// Add initialization check
document.addEventListener('DOMContentLoaded', () => {
  console.log('DrishtiDev responsive module initialized');
});

// Add error boundary around message handling
window.addEventListener('error', (event) => {
  console.error('DrishtiDev responsive error:', event.error);
});

// Add visibility change handler to ensure proper cleanup
document.addEventListener('visibilitychange', () => {
  if (document.hidden && responsivePreviewActive) {
    console.log('Page hidden, cleaning up responsive preview');
    removeViewportOverlay();
    responsivePreviewActive = false;
  }
}); 