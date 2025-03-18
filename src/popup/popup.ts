/// <reference types="chrome"/>

/**
 * DrishtiDev Popup Script
 * Handles user interactions in the extension popup and communicates
 * with content scripts to toggle different inspection modes.
 */

// Interface for message passing between popup and content scripts
interface InspectorMessage {
  action: string;
  mode?: string;
  enabled?: boolean;
  clientX?: number;
  clientY?: number;
  width?: number;
  height?: number;
}

// Interface for storage results
interface StorageResult {
  inspectorActive?: boolean;
  responsiveActive?: boolean;
  networkActive?: boolean;
}

document.addEventListener('DOMContentLoaded', () => {
  // Get UI elements
  const inspectorToggle = document.getElementById('inspectorToggle') as HTMLButtonElement;
  const responsiveToggle = document.getElementById('responsiveToggle') as HTMLButtonElement;
  const networkToggle = document.getElementById('networkToggle') as HTMLButtonElement;
  const statusDisplay = document.getElementById('statusDisplay') as HTMLSpanElement;
  
  // Element section containers
  const inspectorSection = inspectorToggle.closest('.tool-section');
  const responsiveSection = responsiveToggle.closest('.tool-section');
  const networkSection = networkToggle.closest('.tool-section');
  
  // Track feature states
  let inspectorActive = false;
  let responsiveActive = false;
  let networkActive = false;
  
  // Initialize UI based on any previously stored state
  chrome.storage.local.get(['inspectorActive', 'responsiveActive', 'networkActive'], (result: StorageResult) => {
    if (result.inspectorActive) {
      activateInspector(true);
    }
    
    if (result.responsiveActive) {
      activateResponsive(true);
    }
    
    if (result.networkActive) {
      activateNetwork(true);
    }
  });
  
  // Enable the responsive button that was previously disabled
  if (responsiveToggle.disabled) {
    responsiveToggle.disabled = false;
    if (responsiveSection) {
      responsiveSection.classList.remove('disabled');
    }
  }
  
  // Inspector toggle click handler
  inspectorToggle.addEventListener('click', () => {
    // Toggle state
    inspectorActive = !inspectorActive;
    
    // Update UI
    activateInspector(inspectorActive);
    
    // Save state
    chrome.storage.local.set({ inspectorActive });
    
    // First, check if we can inject script into active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs[0];
      if (!currentTab?.id) {
        showStatus('Error: No active tab found');
        return;
      }
      
      try {
        // Ensure the content script is loaded
        await ensureContentScriptLoaded(currentTab.id);
        
        // Then send the message
        sendMessageToActiveTab({
          action: 'toggleInspector',
          enabled: inspectorActive
        });
      } catch (error) {
        console.error('Error with content script:', error);
        showStatus('Error: Cannot access page. Try refreshing.');
      }
    });
  });
  
  // Responsive toggle click handler
  responsiveToggle.addEventListener('click', () => {
    // Toggle state
    responsiveActive = !responsiveActive;
    
    // Update UI
    activateResponsive(responsiveActive);
    
    // Save state
    chrome.storage.local.set({ responsiveActive });
    
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs[0];
      if (!currentTab?.id) {
        showStatus('Error: No active tab found');
        return;
      }
      
      try {
        // Since responsive.js is now included in manifest.json, we don't need to inject it
        // Just make sure the content script (inspector.js) is loaded
        await ensureContentScriptLoaded(currentTab.id);
        
        // Send the toggle message
        sendMessageToActiveTab({
          action: 'toggleResponsive',
          enabled: responsiveActive
        });
        
        // If enabled, also show the responsive preview in the center of the screen
        if (responsiveActive) {
          // The responsive.js script will auto-display when toggled on, no need for extra messaging
          console.log('Responsive mode enabled, preview will be shown automatically');
        }
      } catch (error) {
        console.error('Error with content script:', error);
        showStatus('Error: Cannot access page. Try refreshing.');
      }
    });
  });
  
  // Network toggle click handler
  networkToggle.addEventListener('click', () => {
    // Toggle state
    networkActive = !networkActive;
    
    // Update UI
    activateNetwork(networkActive);
    
    // Save state
    chrome.storage.local.set({ networkActive });
    
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs[0];
      if (!currentTab?.id) {
        showStatus('Error: No active tab found');
        return;
      }
      
      try {
        // Ensure both content script and network script are loaded
        await ensureContentScriptLoaded(currentTab.id);
        await ensureNetworkScriptLoaded(currentTab.id);
        
        // Send the toggle message
        sendMessageToActiveTab({
          action: 'toggleNetwork',
          enabled: networkActive
        });
        
        if (networkActive) {
          console.log('Network monitoring enabled');
        }
      } catch (error) {
        console.error('Error with content script:', error);
        showStatus('Error: Cannot access page. Try refreshing.');
      }
    });
  });
  
  // Helper function to ensure content script is loaded
  async function ensureContentScriptLoaded(tabId: number): Promise<void> {
    try {
      // Check if we can communicate with the content script
      const isLoaded = await new Promise<boolean>((resolve) => {
        // Set a timeout in case the message never gets a response
        const timeout = setTimeout(() => {
          console.log('Content script ping timed out, assuming not loaded');
          resolve(false);
        }, 300);
        
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            console.log('Error pinging content script:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          
          if (response?.status === 'alive') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
      
      if (!isLoaded) {
        console.log('Content script not loaded, injecting...');
        
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['dist/content/inspector.js']
        });
        
        console.log('Content script injected');
      }
    } catch (error) {
      console.error('Error ensuring content script loaded:', error);
      throw error;
    }
  }
  
  async function ensureResponsiveScriptLoaded(tabId: number): Promise<void> {
    try {
      // The responsive.js is already included via manifest.json content_scripts,
      // but we may need to explicitly inject it if for some reason it's not loaded
      // This is a fallback mechanism
      
      // Try to send a ping to check if responsive functionality exists
      const isResponsiveAvailable = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 300);
        
        chrome.tabs.sendMessage(tabId, { action: 'ping_responsive' }, response => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          
          if (response?.status === 'responsive_alive') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
      
      if (!isResponsiveAvailable) {
        console.log('Responsive script not detected, injecting...');
        
        // Inject the responsive script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['dist/content/responsive.js']
        });
        
        console.log('Responsive script injected');
      }
    } catch (error) {
      console.error('Error ensuring responsive script loaded:', error);
      throw error;
    }
  }
  
  async function ensureNetworkScriptLoaded(tabId: number): Promise<void> {
    try {
      // The network.js is included via manifest.json content_scripts,
      // but we may need to explicitly inject it if for some reason it's not loaded
      
      // Try to send a ping to check if network functionality exists
      const isNetworkAvailable = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 300);
        
        chrome.tabs.sendMessage(tabId, { action: 'ping_network' }, response => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          
          if (response?.status === 'network_alive') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
      
      if (!isNetworkAvailable) {
        console.log('Network script not detected, injecting...');
        
        // Inject the network script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['dist/content/network.js']
        });
        
        console.log('Network script injected');
      }
    } catch (error) {
      console.error('Error ensuring network script loaded:', error);
      throw error;
    }
  }
  
  // Helper function to show status messages
  function showStatus(message: string): void {
    statusDisplay.textContent = message;
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      statusDisplay.textContent = '';
    }, 3000);
  }
  
  // Helper function to update UI for inspector toggle
  function activateInspector(active: boolean): void {
    inspectorActive = active;
    
    if (active) {
      inspectorToggle.textContent = 'Disable Inspector';
      inspectorToggle.classList.add('active');
      if (inspectorSection) {
        inspectorSection.classList.add('active-tool');
      }
    } else {
      inspectorToggle.textContent = 'Enable Inspector';
      inspectorToggle.classList.remove('active');
      if (inspectorSection) {
        inspectorSection.classList.remove('active-tool');
      }
    }
  }
  
  // Helper function to update UI for responsive toggle
  function activateResponsive(active: boolean): void {
    responsiveActive = active;
    
    if (active) {
      responsiveToggle.textContent = 'Disable Responsive';
      responsiveToggle.classList.add('active');
      if (responsiveSection) {
        responsiveSection.classList.add('active-tool');
      }
    } else {
      responsiveToggle.textContent = 'Enable Responsive';
      responsiveToggle.classList.remove('active');
      if (responsiveSection) {
        responsiveSection.classList.remove('active-tool');
      }
    }
  }
  
  // Helper function to update UI for network toggle
  function activateNetwork(active: boolean): void {
    networkActive = active;
    
    if (active) {
      networkToggle.textContent = 'Disable Network';
      networkToggle.classList.add('active');
      if (networkSection) {
        networkSection.classList.add('active-tool');
      }
    } else {
      networkToggle.textContent = 'Enable Network';
      networkToggle.classList.remove('active');
      if (networkSection) {
        networkSection.classList.remove('active-tool');
      }
    }
  }
  
  // Helper function to send a message to the active tab
  function sendMessageToActiveTab(message: InspectorMessage): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, response => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            return;
          }
          
          console.log('Message sent successfully:', response);
        });
      }
    });
  }
});

// Keep popup open even when focus is lost
window.addEventListener('blur', (e) => {
  e.stopPropagation();
  e.preventDefault();
}); 