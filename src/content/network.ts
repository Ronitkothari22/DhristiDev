/// <reference types="chrome"/>

/**
 * DrishtiDev Network Monitoring Script
 * Captures and displays network requests in real-time via a floating overlay.
 */

// Interfaces for network request tracking
interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  type: string;
  status: number;
  statusText: string;
  size: number;
  time: number;
  initiator: string;
  timestamp: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

interface NetworkOverlayOptions {
  position: {
    x: number;
    y: number;
  };
}

// Type extension for XMLHttpRequest
interface XMLHttpRequest {
  _networkRequestData?: NetworkRequest;
  _requestMethod?: string;
  _requestUrl?: string;
}

// State management for network monitoring
let isNetworkMonitorActive = false;
let networkRequests: NetworkRequest[] = [];
let networkOverlay: HTMLElement | null = null;

// Ensure these variables are defined in one place
console.log('Network monitoring module initializing. Setting up state variables and overrides.');

// Capture network requests using the Fetch API
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  // Add a debug log to check if fetch override is being called
  console.log('Fetch override called, isNetworkMonitorActive:', isNetworkMonitorActive);
  
  if (!isNetworkMonitorActive) {
    return originalFetch.apply(window, [input, init]);
  }

  const startTime = performance.now();
  const url = typeof input === 'string' 
    ? input 
    : input instanceof Request 
      ? input.url 
      : input.toString();
  
  const method = init?.method || (input instanceof Request ? input.method : 'GET');
  
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`Network monitoring: Intercepted ${method} request to ${url}`);
  
  try {
    // Log the request
    const requestData: NetworkRequest = {
      id: requestId,
      url,
      method,
      type: 'fetch',
      status: 0,
      statusText: 'Pending',
      size: 0,
      time: 0,
      initiator: 'fetch',
      timestamp: Date.now(),
      requestHeaders: init?.headers ? convertHeadersToObject(init.headers) : {}
    };
    
    if (init?.body) {
      try {
        requestData.requestBody = init.body instanceof FormData 
          ? 'FormData (binary content)'
          : typeof init.body === 'string' 
            ? init.body 
            : JSON.stringify(init.body);
      } catch (e) {
        requestData.requestBody = 'Unable to parse request body';
      }
    }
    
    console.log('Network monitoring: Adding request to tracked requests:', requestData);
    addNetworkRequest(requestData);
    
    // Perform the actual fetch
    const response = await originalFetch.apply(window, [input, init]);
    const endTime = performance.now();
    
    console.log(`Network monitoring: ${method} request to ${url} completed with status ${response.status}`);
    
    // Clone the response to get its data without consuming it
    const responseClone = response.clone();
    
    try {
      const responseBody = await responseClone.text();
      const contentLength = responseBody.length;
      
      // Update the request with response data
      const updatedRequestData: Partial<NetworkRequest> = {
        status: response.status,
        statusText: response.statusText,
        size: contentLength,
        time: endTime - startTime,
        responseHeaders: convertHeadersToObject(response.headers),
        responseBody: responseBody.substring(0, 500) + (responseBody.length > 500 ? '...' : '')
      };
      
      console.log('Network monitoring: Updating request with response data');
      updateNetworkRequest(requestId, updatedRequestData);
    } catch (e) {
      console.error('Network monitoring: Error processing response:', e);
      updateNetworkRequest(requestId, {
        status: response.status,
        statusText: response.statusText,
        time: endTime - startTime,
        responseBody: 'Unable to parse response body'
      });
    }
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    console.error(`Network monitoring: Error in ${method} request to ${url}:`, error);
    
    // Update request with error information
    updateNetworkRequest(requestId, {
      status: 0,
      statusText: 'Failed',
      time: endTime - startTime,
      responseBody: error instanceof Error ? error.message : 'Network request failed'
    });
    
    throw error;
  }
};

// Capture XHR requests
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
  // Add debug logging
  console.log('XHR open override called, isNetworkMonitorActive:', isNetworkMonitorActive);
  
  if (isNetworkMonitorActive) {
    this._networkRequestData = {
      id: `xhr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: url.toString(),
      method,
      type: 'xhr',
      status: 0,
      statusText: 'Pending',
      size: 0,
      time: 0,
      initiator: 'xhr',
      timestamp: Date.now(),
      requestHeaders: {}
    };
    
    console.log(`Network monitoring: XHR open detected - ${method} ${url.toString()}`);
  }
  
  return originalXHROpen.apply(this, arguments as any);
};

XMLHttpRequest.prototype.send = function(body: Document | XMLHttpRequestBodyInit | null) {
  console.log('XHR send override called, isNetworkMonitorActive:', isNetworkMonitorActive);
  
  if (isNetworkMonitorActive && this._networkRequestData) {
    const startTime = performance.now();
    console.log(`Network monitoring: XHR send detected for ${this._networkRequestData.url}`);
    
    // Store the request body if present
    if (body) {
      try {
        this._networkRequestData.requestBody = body instanceof FormData 
          ? 'FormData (binary content)'
          : typeof body === 'string' 
            ? body 
            : JSON.stringify(body);
      } catch (e) {
        this._networkRequestData.requestBody = 'Unable to parse request body';
      }
    }
    
    console.log('Network monitoring: Adding XHR request to tracked requests');
    addNetworkRequest(this._networkRequestData);
    
    // Handle response
    this.addEventListener('load', () => {
      const endTime = performance.now();
      console.log(`Network monitoring: XHR request completed with status ${this.status}`);
      
      const responseHeaders = this.getAllResponseHeaders()
        .split('\r\n')
        .filter(Boolean)
        .reduce((acc, line) => {
          const [key, value] = line.split(': ');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      
      let responseSize = 0;
      let responseText = '';
      
      try {
        responseText = this.responseText;
        responseSize = responseText.length;
      } catch (e) {
        responseText = 'Binary data (cannot display)';
      }
      
      updateNetworkRequest(this._networkRequestData!.id, {
        status: this.status,
        statusText: this.statusText,
        size: responseSize,
        time: endTime - startTime,
        responseHeaders,
        responseBody: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
      });
    });
    
    this.addEventListener('error', () => {
      const endTime = performance.now();
      console.log(`Network monitoring: XHR request failed for ${this._networkRequestData!.url}`);
      
      updateNetworkRequest(this._networkRequestData!.id, {
        status: 0,
        statusText: 'Failed',
        time: endTime - startTime,
        responseBody: 'Network request failed'
      });
    });
  }
  
  return originalXHRSend.apply(this, arguments as any);
};

// Helper functions for network request management
function addNetworkRequest(request: NetworkRequest): void {
  try {
    console.log('Adding network request to monitoring:', request);
    
    // Verify the request has required properties
    if (!request || !request.id || !request.url) {
      console.error('Invalid request object, missing required properties:', request);
      return;
    }
    
    // Add to the beginning of the array for newest-first display
    networkRequests.unshift(request);
    console.log(`Request added successfully. Total requests: ${networkRequests.length}`);
    
    // Limit to 50 entries for performance
    if (networkRequests.length > 50) {
      networkRequests = networkRequests.slice(0, 50);
      console.log('Trimmed requests array to 50 entries');
    }
    
    // Update the UI to show the new request
    updateNetworkOverlay();
  } catch (error) {
    console.error('Error in addNetworkRequest:', error);
  }
}

function updateNetworkRequest(id: string, updates: Partial<NetworkRequest>): void {
  try {
    console.log(`Updating network request ${id} with:`, updates);
    
    if (!id) {
      console.error('Invalid request ID for update:', id);
      return;
    }
    
    const index = networkRequests.findIndex(req => req.id === id);
    
    if (index !== -1) {
      networkRequests[index] = { ...networkRequests[index], ...updates };
      console.log(`Request ${id} updated successfully at index ${index}`);
      updateNetworkOverlay();
    } else {
      console.warn(`Request ${id} not found for update`);
    }
  } catch (error) {
    console.error('Error in updateNetworkRequest:', error);
  }
}

function convertHeadersToObject(headers: HeadersInit): Record<string, string> {
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } else if (Array.isArray(headers)) {
    return headers.reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, string>);
  }
  return headers as Record<string, string>;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Network script received message:', message);
  
  // General ping to check if script is loaded
  if (message.action === 'ping') {
    console.log('Network script responding to general ping');
    sendResponse({ status: 'alive' });
    return true;
  }
  
  // Specific ping to check if network script is loaded
  if (message.action === 'ping_network') {
    console.log('Network script responding to network ping');
    sendResponse({ status: 'network_alive' });
    return true;
  }
  
  // Handle network-specific messages
  if (message.action === 'toggleNetwork') {
    console.log('Toggle network monitoring:', message.enabled);
    try {
      toggleNetworkMonitoring(message.enabled);
      sendResponse({ status: 'success', message: 'Network monitoring ' + (message.enabled ? 'enabled' : 'disabled') });
    } catch (error) {
      console.error('Error toggling network monitoring:', error);
      sendResponse({ status: 'error', message: 'Error toggling network monitoring' });
    }
    return true;
  }
  
  return false;
});

// Add PerformanceObserver to directly track network requests
function setupPerformanceObserver(): void {
  try {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported in this browser');
      return;
    }

    console.log('Setting up PerformanceObserver for resource timing');
    
    // Create observer for resource timing entries
    const observer = new PerformanceObserver((list) => {
      if (!isNetworkMonitorActive) return;
      
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          console.log('Performance observer detected resource:', resourceEntry);
          
          // Extract information from the resource timing entry
          const url = resourceEntry.name;
          const initiatorType = resourceEntry.initiatorType;
          
          // Only process certain types of resources (fetch, xmlhttprequest, etc.)
          if (['fetch', 'xmlhttprequest'].includes(initiatorType)) {
            // Create a unique ID for this resource
            const resourceId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Determine method - we can only guess from the context
            const method = 'GET'; // Default, we can't reliably determine this from PerformanceEntry
            
            // Create request object
            const requestData: NetworkRequest = {
              id: resourceId,
              url,
              method,
              type: initiatorType,
              status: 200, // We can't know for sure from PerformanceEntry
              statusText: 'OK',
              size: resourceEntry.transferSize || 0,
              time: resourceEntry.duration,
              initiator: initiatorType,
              timestamp: Date.now(),
              requestHeaders: {},
              responseHeaders: {}
            };
            
            console.log('Adding performance-tracked request:', requestData);
            addNetworkRequest(requestData);
          }
        }
      });
    });
    
    // Start observing resource timing entries
    observer.observe({ entryTypes: ['resource'] });
    
    console.log('PerformanceObserver setup complete');
  } catch (error) {
    console.error('Error setting up PerformanceObserver:', error);
  }
}

// Add a direct monitoring approach that doesn't rely on JavaScript hooks
function createDirectNetworkMonitor(): void {
  try {
    console.log('Setting up direct network request monitor');
    
    // Create a simple debug UI that will be visible even if the main overlay fails
    const debugPanel = document.createElement('div');
    debugPanel.id = 'drishti-network-debug';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.width = '300px';
    debugPanel.style.maxHeight = '200px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '2147483647';
    debugPanel.style.overflow = 'auto';
    debugPanel.innerHTML = '<h3>Network Debug (Latest Requests)</h3><div id="drishti-network-debug-content"></div>';
    
    document.body.appendChild(debugPanel);
    
    const debugContent = document.getElementById('drishti-network-debug-content');
    
    // Function to log a request to the debug panel
    function logRequest(method: string, url: string, type: string): void {
      if (!debugContent) return;
      
      const entry = document.createElement('div');
      entry.style.marginBottom = '5px';
      entry.style.borderBottom = '1px solid #444';
      entry.style.paddingBottom = '5px';
      entry.innerHTML = `
        <div><strong>${method}</strong> ${url.substring(0, 30)}${url.length > 30 ? '...' : ''}</div>
        <div>Type: ${type}</div>
        <div>Time: ${new Date().toLocaleTimeString()}</div>
      `;
      
      // Add to the debug content
      if (debugContent.children.length > 5) {
        debugContent.removeChild(debugContent.lastChild!);
      }
      
      debugContent.insertBefore(entry, debugContent.firstChild);
    }
    
    // Set up a more aggressive XMLHttpRequest interceptor
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      // Log this request
      const urlString = url.toString();
      console.log(`Direct monitor: XHR ${method} request to ${urlString}`);
      logRequest(method, urlString, 'XHR');
      
      // Pass through to original function
      return origXHROpen.apply(this, arguments as any);
    };
    
    // Set up a more aggressive fetch interceptor
    const origFetch = window.fetch;
    window.fetch = function(input, init) {
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      
      console.log(`Direct monitor: Fetch ${method} request to ${url}`);
      logRequest(method, url, 'fetch');
      
      return origFetch.apply(this, arguments as any);
    };
    
    console.log('Direct network request monitor setup complete');
  } catch (error) {
    console.error('Error setting up direct network monitor:', error);
  }
}

// Add a more aggressive direct capture approach for POST requests
function setupDirectPostCapture(): void {
  try {
    console.log('Setting up direct POST request capture');
    
    // Create more aggressive fetch override specifically targeting POST requests
    const originalFetchForPost = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof Request 
          ? input.url 
          : input.toString();
      
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      
      // Log all requests regardless of monitoring state for debugging
      console.log(`Fetch intercept: ${method} request to ${url}`, init);
      
      // Special handling for POST requests
      if (method === 'POST') {
        console.log('POST request detected:', { url, init });
        
        // If monitoring is active, capture this POST request
        if (isNetworkMonitorActive) {
          const requestId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const requestData: NetworkRequest = {
            id: requestId,
            url,
            method: 'POST',
            type: 'fetch',
            status: 0,
            statusText: 'Pending',
            size: 0,
            time: 0,
            initiator: 'fetch',
            timestamp: Date.now(),
            requestHeaders: init?.headers ? convertHeadersToObject(init.headers) : {}
          };
          
          // Capture request body for POST requests
          if (init?.body) {
            try {
              requestData.requestBody = init.body instanceof FormData 
                ? 'FormData (binary content)'
                : typeof init.body === 'string' 
                  ? init.body 
                  : JSON.stringify(init.body);
              console.log('Captured POST request body:', requestData.requestBody);
            } catch (e) {
              console.error('Error parsing POST request body:', e);
              requestData.requestBody = 'Unable to parse request body';
            }
          }
          
          console.log('Adding POST request to network monitor:', requestData);
          addNetworkRequest(requestData);
          
          // Perform actual fetch with timing
          const startTime = performance.now();
          try {
            const response = await originalFetchForPost.apply(window, [input, init]);
            const endTime = performance.now();
            
            // Clone response to get data
            const clonedResponse = response.clone();
            const responseText = await clonedResponse.text();
            
            // Update the request with response data
            updateNetworkRequest(requestId, {
              status: response.status,
              statusText: response.statusText,
              size: responseText.length,
              time: endTime - startTime,
              responseHeaders: convertHeadersToObject(response.headers),
              responseBody: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
            });
            
            return response;
          } catch (error) {
            const endTime = performance.now();
            console.error('Error in POST request:', error);
            
            // Update with error info
            updateNetworkRequest(requestId, {
              status: 0,
              statusText: 'Failed',
              time: endTime - startTime,
              responseBody: 'Request failed: ' + (error instanceof Error ? error.message : String(error))
            });
            
            throw error;
          }
        }
      }
      
      // Default handling for non-POST requests or when monitoring is inactive
      return originalFetchForPost.apply(window, [input, init]);
    };
    
    // Also create a more aggressive XMLHttpRequest override for POST
    const originalXHROpenForPost = XMLHttpRequest.prototype.open;
    const originalXHRSendForPost = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      // Store request info on the XHR object regardless of monitoring state
      this._requestMethod = method;
      this._requestUrl = url.toString();
      console.log(`XHR ${method} request opened to ${url.toString()}`);
      return originalXHROpenForPost.apply(this, arguments as any);
    };
    
    XMLHttpRequest.prototype.send = function(body: Document | XMLHttpRequestBodyInit | null) {
      // Special handling for POST requests
      if (this._requestMethod === 'POST') {
        console.log('XHR POST request detected:', { url: this._requestUrl, body });
        
        // If monitoring is active, capture this POST request
        if (isNetworkMonitorActive) {
          const requestId = `xhr_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const requestData: NetworkRequest = {
            id: requestId,
            url: this._requestUrl || 'unknown',  // Fix for TypeScript error - provide default value
            method: 'POST',
            type: 'xhr',
            status: 0,
            statusText: 'Pending',
            size: 0,
            time: 0,
            initiator: 'xhr',
            timestamp: Date.now(),
            requestHeaders: {}
          };
          
          // Capture request body for POST
          if (body) {
            try {
              requestData.requestBody = body instanceof FormData 
                ? 'FormData (binary content)'
                : typeof body === 'string' 
                  ? body 
                  : JSON.stringify(body);
              console.log('Captured XHR POST request body:', requestData.requestBody);
            } catch (e) {
              console.error('Error parsing XHR POST request body:', e);
              requestData.requestBody = 'Unable to parse request body';
            }
          }
          
          console.log('Adding XHR POST request to network monitor:', requestData);
          addNetworkRequest(requestData);
          
          // Track timing
          const startTime = performance.now();
          
          // Add response handlers
          this.addEventListener('load', () => {
            const endTime = performance.now();
            
            // Get response headers
            const responseHeaders = this.getAllResponseHeaders()
              .split('\r\n')
              .filter(Boolean)
              .reduce((acc, line) => {
                const [key, value] = line.split(': ');
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
            
            // Get response body
            let responseBody = '';
            try {
              responseBody = this.responseText;
            } catch (e) {
              responseBody = 'Binary response (cannot display)';
            }
            
            // Update the request with response data
            updateNetworkRequest(requestId, {
              status: this.status,
              statusText: this.statusText,
              size: responseBody.length,
              time: endTime - startTime,
              responseHeaders,
              responseBody: responseBody.substring(0, 500) + (responseBody.length > 500 ? '...' : '')
            });
          });
          
          // Handle errors
          this.addEventListener('error', () => {
            const endTime = performance.now();
            updateNetworkRequest(requestId, {
              status: 0,
              statusText: 'Failed',
              time: endTime - startTime,
              responseBody: 'XHR request failed'
            });
          });
        }
      }
      
      // Continue with the original send
      return originalXHRSendForPost.apply(this, arguments as any);
    };
    
    console.log('Direct POST request capture setup complete');
  } catch (error) {
    console.error('Error setting up direct POST capture:', error);
  }
}

// Toggle network monitoring on/off
function toggleNetworkMonitoring(enabled: boolean): void {
  console.log(`Setting network monitoring to: ${enabled}`);
  
  try {
    // Store the previous state for debugging
    const previousState = isNetworkMonitorActive;
    isNetworkMonitorActive = enabled;
    
    console.log(`Network monitoring changed from ${previousState} to ${isNetworkMonitorActive}`);
    
    if (enabled) {
      console.log('Network monitoring enabled, creating overlay');
      // Clear previous requests when enabling
      networkRequests = [];
      
      // Set up performance observer
      setupPerformanceObserver();
      
      // Set up direct network monitor for debugging
      createDirectNetworkMonitor();
      
      // Set up specific POST request capture
      setupDirectPostCapture();
      
      // Create or show the network overlay
      createNetworkOverlay({ position: { x: window.innerWidth / 2 - 400, y: 100 } });
      
      // Attempt to trigger a test request to check if monitoring works
      setTimeout(() => {
        console.log('Sending test fetch request to verify monitoring...');
        fetch('https://jsonplaceholder.typicode.com/todos/1')
          .then(response => response.json())
          .then(data => console.log('Test request completed:', data))
          .catch(err => console.error('Test request failed:', err));
      }, 1000);
      
      // Force display style in case something is preventing visibility
      if (networkOverlay) {
        networkOverlay.style.display = 'block';
        networkOverlay.style.visibility = 'visible';
        networkOverlay.style.opacity = '1';
        
        // Move to the top of the z-index stack
        const highestZ = Math.max(
          ...Array.from(document.querySelectorAll('body *'))
            .map(el => parseInt(getComputedStyle(el).zIndex) || 0)
        );
        networkOverlay.style.zIndex = `${highestZ + 10}`;
        
        console.log(`Forced network overlay visibility with z-index: ${highestZ + 10}`);
      }
      
      // Log that we're now monitoring
      console.log('Network monitoring active, overlay created');
    } else {
      console.log('Network monitoring disabled, removing overlay');
      // Hide the network overlay
      removeNetworkOverlay();
    }
  } catch (error) {
    console.error('Error in toggleNetworkMonitoring:', error);
    throw error; // Re-throw to allow proper error handling
  }
}

// Create the network monitoring overlay
function createNetworkOverlay(options: NetworkOverlayOptions): void {
  try {
    console.log('Creating network overlay with options:', options);
    
    // Remove any existing overlay first
    removeNetworkOverlay();
    
    // Create the network overlay container
    networkOverlay = document.createElement('div');
    networkOverlay.className = 'drishti-network-overlay';
    networkOverlay.style.position = 'fixed';
    networkOverlay.style.top = `${options.position.y}px`;
    networkOverlay.style.left = `${options.position.x}px`;
    networkOverlay.style.width = '800px';
    networkOverlay.style.maxHeight = '600px';
    networkOverlay.style.overflowY = 'auto';
    networkOverlay.style.backgroundColor = '#ffffff';
    networkOverlay.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    networkOverlay.style.border = '2px solid #4f46e5';
    networkOverlay.style.borderRadius = '8px';
    networkOverlay.style.zIndex = '2147483647'; // Maximum z-index
    networkOverlay.style.fontFamily = 'Arial, sans-serif';
    networkOverlay.style.fontSize = '14px';
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'drishti-network-header';
    header.style.padding = '12px 16px';
    header.style.borderBottom = '1px solid #f0f0f0';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.background = 'linear-gradient(to right, #4f46e5, #8b5cf6)';
    header.style.color = 'white';
    header.style.borderTopLeftRadius = '8px';
    header.style.borderTopRightRadius = '8px';
    
    const title = document.createElement('h3');
    title.textContent = 'Network Monitor (Active)';
    title.style.margin = '0';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';
    title.style.color = 'white';
    
    const controls = document.createElement('div');
    controls.className = 'drishti-network-controls';
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.padding = '4px 10px';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    clearButton.style.color = 'white';
    clearButton.style.cursor = 'pointer';
    clearButton.onclick = () => {
      networkRequests = [];
      updateNetworkOverlay();
      console.log('Network requests cleared');
    };
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '4px 10px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
      toggleNetworkMonitoring(false);
      console.log('Network monitoring disabled via close button');
    };
    
    controls.appendChild(clearButton);
    controls.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    // Create the request list container
    const requestList = document.createElement('div');
    requestList.className = 'drishti-network-list';
    requestList.style.padding = '0';
    
    // Create the table to display requests
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#f8f8f8';
    thead.style.position = 'sticky';
    thead.style.top = '0';
    
    const headerRow = document.createElement('tr');
    
    const headers = ['Method', 'URL', 'Status', 'Type', 'Size', 'Time', 'Actions'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.padding = '8px 12px';
      th.style.textAlign = 'left';
      th.style.fontWeight = 'bold';
      th.style.borderBottom = '1px solid #e0e0e0';
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body (will be populated in updateNetworkOverlay)
    const tbody = document.createElement('tbody');
    tbody.id = 'drishti-network-tbody';
    table.appendChild(tbody);
    
    requestList.appendChild(table);
    
    // Add a status message for empty requests
    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'drishti-empty-message';
    emptyMessage.textContent = 'No network requests captured yet. Interact with the page to generate requests.';
    emptyMessage.style.padding = '20px';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#666';
    emptyMessage.style.fontStyle = 'italic';
    emptyMessage.style.display = 'none'; // Initially hidden
    
    requestList.appendChild(emptyMessage);
    
    // Assemble the overlay
    networkOverlay.appendChild(header);
    networkOverlay.appendChild(requestList);
    
    // Add the overlay to the page
    document.body.appendChild(networkOverlay);
    
    // Make the overlay draggable
    makeElementDraggable(networkOverlay, header);
    
    // Initial update
    updateNetworkOverlay();
    
    console.log('Network overlay created and added to page');
  } catch (error) {
    console.error('Error creating network overlay:', error);
    
    // Try to create a fallback minimal overlay to at least show something
    try {
      const fallbackOverlay = document.createElement('div');
      fallbackOverlay.style.position = 'fixed';
      fallbackOverlay.style.top = '20px';
      fallbackOverlay.style.right = '20px';
      fallbackOverlay.style.background = '#ff5252';
      fallbackOverlay.style.color = 'white';
      fallbackOverlay.style.padding = '10px 20px';
      fallbackOverlay.style.borderRadius = '5px';
      fallbackOverlay.style.zIndex = '2147483647';
      fallbackOverlay.textContent = 'Network monitoring active (Error with main UI)';
      
      document.body.appendChild(fallbackOverlay);
      networkOverlay = fallbackOverlay;
      
      console.log('Fallback network indicator created due to error');
    } catch (fallbackError) {
      console.error('Even fallback overlay failed:', fallbackError);
    }
  }
}

// Update the network overlay with the latest requests
function updateNetworkOverlay(): void {
  try {
    if (!networkOverlay) {
      console.warn('Cannot update network overlay - overlay is null');
      return;
    }
    
    const tbody = networkOverlay.querySelector('#drishti-network-tbody');
    const emptyMessage = networkOverlay.querySelector('#drishti-empty-message') as HTMLElement | null;
    
    if (!tbody) {
      console.warn('Cannot update network overlay - tbody not found');
      return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Show empty message if no requests
    if (emptyMessage) {
      if (networkRequests.length === 0) {
        emptyMessage.style.display = 'block';
      } else {
        emptyMessage.style.display = 'none';
      }
    }
    
    // Log all requests for debugging
    console.log('All captured requests:', networkRequests);
    
    // Add a row for each request
    networkRequests.forEach(request => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #f0f0f0';
      row.style.backgroundColor = request.status >= 400 ? '#fff0f0' : 'transparent';
      
      // Method cell with enhanced styling and better contrast
      const methodCell = document.createElement('td');
      methodCell.textContent = request.method;
      methodCell.style.padding = '8px 12px';
      methodCell.style.fontWeight = 'bold';
      methodCell.style.backgroundColor = '#f5f5f5'; // Light background for contrast
      
      // Change color based on method with enhanced visibility
      if (request.method === 'GET') {
        methodCell.style.color = '#4caf50';
        methodCell.style.backgroundColor = '#e8f5e9'; // Light green background
      } else if (request.method === 'POST') {
        methodCell.style.color = '#2196f3';
        methodCell.style.backgroundColor = '#e3f2fd'; // Light blue background
      } else if (request.method === 'DELETE') {
        methodCell.style.color = '#f44336';
        methodCell.style.backgroundColor = '#ffebee'; // Light red background
      } else if (request.method === 'PUT' || request.method === 'PATCH') {
        methodCell.style.color = '#ff9800';
        methodCell.style.backgroundColor = '#fff3e0'; // Light orange background
      }
      
      // URL cell (truncated with tooltip) with improved visibility
      const urlCell = document.createElement('td');
      urlCell.style.backgroundColor = '#f8f8f8'; // Light background for contrast
      const urlText = document.createElement('div');
      
      try {
        const url = new URL(request.url);
        urlText.textContent = url.pathname;
      } catch (e) {
        urlText.textContent = request.url.split('?')[0] || request.url;
      }
      
      urlText.title = request.url;
      urlText.style.maxWidth = '250px';
      urlText.style.whiteSpace = 'nowrap';
      urlText.style.overflow = 'hidden';
      urlText.style.textOverflow = 'ellipsis';
      urlText.style.color = '#333333'; // Dark text for visibility
      urlCell.appendChild(urlText);
      urlCell.style.padding = '8px 12px';
      
      // Status cell with color coding and improved visibility
      const statusCell = document.createElement('td');
      const statusText = request.status ? `${request.status} ${request.statusText}` : 'Pending';
      statusCell.textContent = statusText;
      statusCell.style.padding = '8px 12px';
      statusCell.style.backgroundColor = '#f5f5f5'; // Light background for contrast
      
      // Color code by status with enhanced visibility
      if (request.status >= 200 && request.status < 300) {
        statusCell.style.color = '#4caf50'; // Success - green
        statusCell.style.backgroundColor = '#e8f5e9'; // Light green background
      } else if (request.status >= 400) {
        statusCell.style.color = '#f44336'; // Error - red
        statusCell.style.backgroundColor = '#ffebee'; // Light red background
      } else if (request.status >= 300) {
        statusCell.style.color = '#ff9800'; // Redirect - orange
        statusCell.style.backgroundColor = '#fff3e0'; // Light orange background
      }
      
      // Type cell with improved visibility
      const typeCell = document.createElement('td');
      typeCell.textContent = request.type;
      typeCell.style.padding = '8px 12px';
      typeCell.style.color = '#333333'; // Dark text for visibility
      typeCell.style.backgroundColor = '#f5f5f5'; // Light background for contrast
      
      // Size cell with improved visibility
      const sizeCell = document.createElement('td');
      sizeCell.textContent = formatSize(request.size);
      sizeCell.style.padding = '8px 12px';
      sizeCell.style.color = '#333333'; // Dark text for visibility
      sizeCell.style.backgroundColor = '#f8f8f8'; // Light background for contrast
      
      // Time cell with improved visibility
      const timeCell = document.createElement('td');
      timeCell.textContent = request.time ? `${Math.round(request.time)}ms` : '-';
      timeCell.style.padding = '8px 12px';
      timeCell.style.backgroundColor = '#f5f5f5'; // Light background for contrast
      
      // Color code time cell with enhanced visibility
      if (request.time) {
        if (request.time < 100) {
          timeCell.style.color = '#4caf50'; // Fast - green
          timeCell.style.backgroundColor = '#e8f5e9'; // Light green background
        } else if (request.time < 500) {
          timeCell.style.color = '#ff9800'; // Medium - orange
          timeCell.style.backgroundColor = '#fff3e0'; // Light orange background
        } else {
          timeCell.style.color = '#f44336'; // Slow - red
          timeCell.style.backgroundColor = '#ffebee'; // Light red background
        }
      }
      
      // Actions cell with improved visibility
      const actionsCell = document.createElement('td');
      actionsCell.style.padding = '8px 12px';
      actionsCell.style.backgroundColor = '#f8f8f8'; // Light background for contrast
      
      const detailsButton = document.createElement('button');
      detailsButton.textContent = 'Details';
      detailsButton.style.padding = '4px 10px';
      detailsButton.style.border = '1px solid #4f46e5';
      detailsButton.style.borderRadius = '4px';
      detailsButton.style.backgroundColor = '#6366F1';
      detailsButton.style.color = 'white';
      detailsButton.style.cursor = 'pointer';
      detailsButton.style.fontWeight = 'bold';
      detailsButton.onclick = () => showRequestDetails(request);
      
      // Add hover effect for better interactivity
      detailsButton.addEventListener('mouseover', () => {
        detailsButton.style.backgroundColor = '#4f46e5';
      });
      detailsButton.addEventListener('mouseout', () => {
        detailsButton.style.backgroundColor = '#6366F1';
      });
      
      actionsCell.appendChild(detailsButton);
      
      // Add cells to row
      row.appendChild(methodCell);
      row.appendChild(urlCell);
      row.appendChild(statusCell);
      row.appendChild(typeCell);
      row.appendChild(sizeCell);
      row.appendChild(timeCell);
      row.appendChild(actionsCell);
      
      // Add row to tbody
      tbody.appendChild(row);
    });
    
    console.log(`Network overlay updated with ${networkRequests.length} requests`);
  } catch (error) {
    console.error('Error updating network overlay:', error);
  }
}

// Show detailed information about a request
function showRequestDetails(request: NetworkRequest): void {
  // Create the details overlay
  const detailsOverlay = document.createElement('div');
  detailsOverlay.className = 'drishti-details-overlay';
  detailsOverlay.style.position = 'fixed';
  detailsOverlay.style.top = '50%';
  detailsOverlay.style.left = '50%';
  detailsOverlay.style.transform = 'translate(-50%, -50%)';
  detailsOverlay.style.width = '800px';
  detailsOverlay.style.maxHeight = '80vh';
  detailsOverlay.style.backgroundColor = '#ffffff';
  detailsOverlay.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
  detailsOverlay.style.borderRadius = '8px';
  detailsOverlay.style.zIndex = '2147483647'; // Maximum z-index
  detailsOverlay.style.display = 'flex';
  detailsOverlay.style.flexDirection = 'column';
  detailsOverlay.style.overflow = 'hidden';
  
  // Header
  const header = document.createElement('div');
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid #f0f0f0';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.backgroundColor = '#4f46e5'; // Changed to purple for better consistency with main UI
  header.style.color = '#ffffff'; // White text for contrast
  
  const title = document.createElement('h3');
  try {
    const url = new URL(request.url);
    title.textContent = `${request.method} ${url.pathname}`;
  } catch (e) {
    title.textContent = `${request.method} ${request.url}`;
  }
  title.style.margin = '0';
  title.style.fontWeight = 'bold';
  title.style.color = '#ffffff'; // Ensure white text
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#ffffff'; // White text for visibility
  closeButton.onclick = () => {
    // More compatible way to remove the overlay
    if (detailsOverlay.parentNode) {
      detailsOverlay.parentNode.removeChild(detailsOverlay);
      console.log('Details overlay closed via button');
    }
  };
  
  // Add an escape key handler for better usability
  const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (detailsOverlay.parentNode) {
        detailsOverlay.parentNode.removeChild(detailsOverlay);
        document.removeEventListener('keydown', handleEscKey);
        console.log('Details overlay closed via ESC key');
      }
    }
  };
  
  // Add the key listener
  document.addEventListener('keydown', handleEscKey);
  
  // Add a function to handle removal and cleanup
  const removeDetailsOverlay = () => {
    if (detailsOverlay.parentNode) {
      detailsOverlay.parentNode.removeChild(detailsOverlay);
      document.removeEventListener('keydown', handleEscKey);
      console.log('Details overlay closed and cleaned up');
    }
  };
  
  // Update the close button to use the cleanup function
  closeButton.onclick = removeDetailsOverlay;
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Tabs
  const tabs = document.createElement('div');
  tabs.style.display = 'flex';
  tabs.style.borderBottom = '1px solid #e0e0e0';
  tabs.style.backgroundColor = '#f5f5f5'; // Light background for tabs
  
  const tabLabels = ['Overview', 'Request Headers', 'Response Headers', 'Request Body', 'Response Body'];
  const tabElements: HTMLElement[] = [];
  
  tabLabels.forEach((label, index) => {
    const tab = document.createElement('button');
    tab.textContent = label;
    tab.style.padding = '12px 16px';
    tab.style.border = 'none';
    tab.style.background = 'none';
    tab.style.cursor = 'pointer';
    tab.style.color = '#333333'; // Dark text for visibility
    tab.style.borderBottom = index === 0 ? '2px solid #4f46e5' : '2px solid transparent';
    tab.style.fontWeight = index === 0 ? 'bold' : 'normal';
    tab.onclick = () => {
      tabElements.forEach((t, i) => {
        t.style.borderBottom = i === index ? '2px solid #4f46e5' : '2px solid transparent';
        t.style.fontWeight = i === index ? 'bold' : 'normal';
      });
      
      const contentDivs = detailsOverlay.querySelectorAll('.tab-content');
      contentDivs.forEach((div, i) => {
        (div as HTMLElement).style.display = i === index ? 'block' : 'none';
      });
    };
    
    tabElements.push(tab);
    tabs.appendChild(tab);
  });
  
  // Content area
  const content = document.createElement('div');
  content.style.padding = '16px';
  content.style.overflowY = 'auto';
  content.style.flex = '1';
  content.style.backgroundColor = '#ffffff'; // Ensure white background
  
  // Overview tab
  const overviewTab = document.createElement('div');
  overviewTab.className = 'tab-content';
  overviewTab.style.display = 'block';
  
  const overviewItems = [
    { label: 'URL', value: request.url },
    { label: 'Method', value: request.method },
    { label: 'Status', value: `${request.status} ${request.statusText}` },
    { label: 'Type', value: request.type },
    { label: 'Size', value: formatSize(request.size) },
    { label: 'Time', value: `${Math.round(request.time)}ms` },
    { label: 'Initiated by', value: request.initiator },
    { label: 'Timestamp', value: new Date(request.timestamp).toLocaleString() }
  ];
  
  overviewItems.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.marginBottom = '12px';
    row.style.padding = '8px';
    row.style.borderRadius = '4px';
    row.style.backgroundColor = '#f9f9f9'; // Light background for each row
    
    const label = document.createElement('div');
    label.textContent = item.label + ':';
    label.style.width = '120px';
    label.style.fontWeight = 'bold';
    label.style.color = '#333333'; // Dark text for visibility
    
    const value = document.createElement('div');
    value.textContent = item.value;
    value.style.flex = '1';
    value.style.color = '#333333'; // Dark text for visibility
    
    row.appendChild(label);
    row.appendChild(value);
    overviewTab.appendChild(row);
  });
  
  // Request Headers tab
  const requestHeadersTab = document.createElement('div');
  requestHeadersTab.className = 'tab-content';
  requestHeadersTab.style.display = 'none';
  
  if (request.requestHeaders && Object.keys(request.requestHeaders).length > 0) {
    const headerTable = createHeadersTable(request.requestHeaders);
    requestHeadersTab.appendChild(headerTable);
  } else {
    const noHeadersMsg = document.createElement('div');
    noHeadersMsg.textContent = 'No request headers available.';
    noHeadersMsg.style.padding = '16px';
    noHeadersMsg.style.color = '#666666'; // Medium gray text
    requestHeadersTab.appendChild(noHeadersMsg);
  }
  
  // Response Headers tab
  const responseHeadersTab = document.createElement('div');
  responseHeadersTab.className = 'tab-content';
  responseHeadersTab.style.display = 'none';
  
  if (request.responseHeaders && Object.keys(request.responseHeaders).length > 0) {
    const headerTable = createHeadersTable(request.responseHeaders);
    responseHeadersTab.appendChild(headerTable);
  } else {
    const noHeadersMsg = document.createElement('div');
    noHeadersMsg.textContent = 'No response headers available.';
    noHeadersMsg.style.padding = '16px';
    noHeadersMsg.style.color = '#666666'; // Medium gray text
    responseHeadersTab.appendChild(noHeadersMsg);
  }
  
  // Request Body tab
  const requestBodyTab = document.createElement('div');
  requestBodyTab.className = 'tab-content';
  requestBodyTab.style.display = 'none';
  
  if (request.requestBody) {
    const pre = document.createElement('pre');
    pre.style.margin = '0';
    pre.style.padding = '12px';
    pre.style.backgroundColor = '#f8f8f8';
    pre.style.color = '#333333'; // Dark text for visibility
    pre.style.borderRadius = '4px';
    pre.style.overflowX = 'auto';
    pre.style.border = '1px solid #e0e0e0'; // Add border for better visibility
    pre.textContent = request.requestBody;
    requestBodyTab.appendChild(pre);
  } else {
    const noBodyMsg = document.createElement('div');
    noBodyMsg.textContent = 'No request body available.';
    noBodyMsg.style.padding = '16px';
    noBodyMsg.style.color = '#666666'; // Medium gray text
    requestBodyTab.appendChild(noBodyMsg);
  }
  
  // Response Body tab
  const responseBodyTab = document.createElement('div');
  responseBodyTab.className = 'tab-content';
  responseBodyTab.style.display = 'none';
  
  if (request.responseBody) {
    const pre = document.createElement('pre');
    pre.style.margin = '0';
    pre.style.padding = '12px';
    pre.style.backgroundColor = '#f8f8f8';
    pre.style.color = '#333333'; // Dark text for visibility
    pre.style.borderRadius = '4px';
    pre.style.overflowX = 'auto';
    pre.style.border = '1px solid #e0e0e0'; // Add border for better visibility
    pre.textContent = request.responseBody;
    responseBodyTab.appendChild(pre);
  } else {
    const noBodyMsg = document.createElement('div');
    noBodyMsg.textContent = 'No response body available.';
    noBodyMsg.style.padding = '16px';
    noBodyMsg.style.color = '#666666'; // Medium gray text
    responseBodyTab.appendChild(noBodyMsg);
  }
  
  // Add tabs to content
  content.appendChild(overviewTab);
  content.appendChild(requestHeadersTab);
  content.appendChild(responseHeadersTab);
  content.appendChild(requestBodyTab);
  content.appendChild(responseBodyTab);
  
  // Assemble the overlay
  detailsOverlay.appendChild(header);
  detailsOverlay.appendChild(tabs);
  detailsOverlay.appendChild(content);
  
  // Add to document
  document.body.appendChild(detailsOverlay);
}

// Helper function to create a table for headers
function createHeadersTable(headers: Record<string, string>): HTMLElement {
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.border = '1px solid #e0e0e0'; // Add border for better visibility
  
  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  const nameHeader = document.createElement('th');
  nameHeader.textContent = 'Name';
  nameHeader.style.padding = '10px 12px';
  nameHeader.style.textAlign = 'left';
  nameHeader.style.backgroundColor = '#4f46e5'; // Match header style
  nameHeader.style.color = '#ffffff'; // White text for contrast
  nameHeader.style.width = '30%';
  
  const valueHeader = document.createElement('th');
  valueHeader.textContent = 'Value';
  valueHeader.style.padding = '10px 12px';
  valueHeader.style.textAlign = 'left';
  valueHeader.style.backgroundColor = '#4f46e5'; // Match header style
  valueHeader.style.color = '#ffffff'; // White text for contrast
  
  headerRow.appendChild(nameHeader);
  headerRow.appendChild(valueHeader);
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Table body
  const tbody = document.createElement('tbody');
  
  Object.entries(headers).forEach(([name, value], index) => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #e0e0e0';
    // Alternate row colors for better readability
    row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
    
    const nameCell = document.createElement('td');
    nameCell.textContent = name;
    nameCell.style.padding = '8px 12px';
    nameCell.style.fontWeight = 'bold';
    nameCell.style.color = '#333333'; // Dark text for visibility
    
    const valueCell = document.createElement('td');
    valueCell.textContent = value;
    valueCell.style.padding = '8px 12px';
    valueCell.style.wordBreak = 'break-all';
    valueCell.style.color = '#333333'; // Dark text for visibility
    
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  return table;
}

// Helper function to format size in bytes to readable format
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!bytes) return '-';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove the network overlay from the page
function removeNetworkOverlay(): void {
  if (networkOverlay && networkOverlay.parentNode) {
    networkOverlay.parentNode.removeChild(networkOverlay);
    networkOverlay = null;
  }
}

// Make an element draggable
function makeElementDraggable(element: HTMLElement, handle: HTMLElement): void {
  let offsetX = 0;
  let offsetY = 0;
  
  handle.style.cursor = 'move';
  
  handle.addEventListener('mousedown', startDrag);
  
  function startDrag(e: MouseEvent): void {
    e.preventDefault();
    
    // Get the initial mouse position
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    // Add event listeners for moving and stopping the drag
    document.addEventListener('mousemove', dragElement);
    document.addEventListener('mouseup', stopDrag);
  }
  
  function dragElement(e: MouseEvent): void {
    e.preventDefault();
    
    // Calculate the new position
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Apply constraints to keep the element in viewport
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    // Update the element's position
    element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
  }
  
  function stopDrag(): void {
    // Remove the event listeners
    document.removeEventListener('mousemove', dragElement);
    document.removeEventListener('mouseup', stopDrag);
  }
}

// Add initialization code to run when the script loads
(function initializeNetworkMonitoring() {
  console.log('Network monitoring script initialized');
  console.log('Original fetch and XHR methods overridden for monitoring');
  
  // Listen for page unload to clean up
  window.addEventListener('beforeunload', () => {
    // Clean up any resources if needed
    if (networkOverlay) {
      removeNetworkOverlay();
    }
  });
})(); 