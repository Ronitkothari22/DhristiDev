"use strict";
/// <reference types="chrome"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const inspectorToggle = document.getElementById('inspectorToggle');
    const responsiveToggle = document.getElementById('responsiveToggle');
    const networkToggle = document.getElementById('networkToggle');
    const statusDisplay = document.getElementById('statusDisplay');
    // Element section containers
    const inspectorSection = inspectorToggle.closest('.tool-section');
    const responsiveSection = responsiveToggle.closest('.tool-section');
    // Track feature states
    let inspectorActive = false;
    let responsiveActive = false;
    // Initialize UI based on any previously stored state
    chrome.storage.local.get(['inspectorActive', 'responsiveActive'], (result) => {
        if (result.inspectorActive) {
            activateInspector(true);
        }
        if (result.responsiveActive) {
            activateResponsive(true);
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
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => __awaiter(void 0, void 0, void 0, function* () {
            const currentTab = tabs[0];
            if (!(currentTab === null || currentTab === void 0 ? void 0 : currentTab.id)) {
                showStatus('Error: No active tab found');
                return;
            }
            try {
                // Ensure the content script is loaded
                yield ensureContentScriptLoaded(currentTab.id);
                // Then send the message
                sendMessageToActiveTab({
                    action: 'toggleInspector',
                    enabled: inspectorActive
                });
            }
            catch (error) {
                console.error('Error with content script:', error);
                showStatus('Error: Cannot access page. Try refreshing.');
            }
        }));
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
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => __awaiter(void 0, void 0, void 0, function* () {
            const currentTab = tabs[0];
            if (!(currentTab === null || currentTab === void 0 ? void 0 : currentTab.id)) {
                showStatus('Error: No active tab found');
                return;
            }
            try {
                // Since responsive.js is now included in manifest.json, we don't need to inject it
                // Just make sure the content script (inspector.js) is loaded
                yield ensureContentScriptLoaded(currentTab.id);
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
            }
            catch (error) {
                console.error('Error with content script:', error);
                showStatus('Error: Cannot access page. Try refreshing.');
            }
        }));
    });
    // Helper function to ensure content script is loaded
    function ensureContentScriptLoaded(tabId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if we can communicate with the content script
                const isLoaded = yield new Promise((resolve) => {
                    // Set a timeout in case the message never gets a response
                    const timeout = setTimeout(() => {
                        console.log('Content script ping timed out, assuming not loaded');
                        resolve(false);
                    }, 300);
                    chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.log('Content script not detected, will inject it');
                            resolve(false);
                        }
                        else if (response && response.status === 'ok') {
                            console.log('Content script already loaded');
                            resolve(true);
                        }
                        else {
                            console.log('Unexpected response, will inject content script');
                            resolve(false);
                        }
                    });
                });
                // If not loaded, inject the content script
                if (!isLoaded) {
                    console.log('Injecting content script...');
                    try {
                        // Inject CSS first
                        yield chrome.scripting.insertCSS({
                            target: { tabId },
                            files: ['dist/content/styles.css']
                        });
                        // Then inject JavaScript
                        yield chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['dist/content/inspector.js']
                        });
                        console.log('Content script injection successful');
                        // Give it a moment to initialize
                        yield new Promise(resolve => setTimeout(resolve, 100));
                    }
                    catch (error) {
                        console.error('Failed to inject content script:', error);
                        throw new Error(`Content script injection failed: ${error}`);
                    }
                }
            }
            catch (error) {
                console.error('Error ensuring content script is loaded:', error);
                throw new Error('Unable to inject inspector script');
            }
        });
    }
    // Helper function to ensure responsive script is loaded
    function ensureResponsiveScriptLoaded(tabId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Ensuring responsive script is loaded for tab:', tabId);
                // Check if the content script is already loaded (inspector.js)
                yield ensureContentScriptLoaded(tabId);
                // Check if we can communicate with the responsive script
                const isLoaded = yield new Promise((resolve) => {
                    // Set a timeout in case the message never gets a response
                    const timeout = setTimeout(() => {
                        console.log('Responsive script ping timed out, assuming not loaded');
                        resolve(false);
                    }, 300);
                    chrome.tabs.sendMessage(tabId, { action: 'pingResponsive' }, response => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.log('Responsive script not detected, will inject it. Error:', chrome.runtime.lastError);
                            resolve(false);
                        }
                        else if (response && response.responsive === 'ok') {
                            console.log('Responsive script already loaded');
                            resolve(true);
                        }
                        else {
                            console.log('Unexpected response, will inject responsive script. Response:', response);
                            resolve(false);
                        }
                    });
                });
                // If not loaded and not declared in manifest (which it now is), inject the responsive script
                if (!isLoaded) {
                    console.log('Responsive script is now included in manifest.json, skipping dynamic injection');
                    /*
                    // This code is commented out to prevent duplicate loading since responsive.js is in manifest.json
                    console.log('Injecting responsive script...');
                    try {
                      // Then inject JavaScript (using content styles.css already loaded)
                      await chrome.scripting.executeScript({
                        target: { tabId },
                        files: ['dist/content/responsive.js']
                      });
                      
                      console.log('Responsive script injection successful');
                      
                      // Verify the responsive script was loaded successfully
                      const verifyLoad = await new Promise<boolean>((resolve) => {
                        const verifyTimeout = setTimeout(() => {
                          console.log('Verification timed out');
                          resolve(false);
                        }, 300);
                        
                        chrome.tabs.sendMessage(tabId, { action: 'pingResponsive' }, response => {
                          clearTimeout(verifyTimeout);
                          if (response && response.responsive === 'ok') {
                            console.log('Responsive script verified loaded');
                            resolve(true);
                          } else {
                            console.log('Responsive script verification failed, response:', response);
                            resolve(false);
                          }
                        });
                      });
                      
                      if (!verifyLoad) {
                        console.error('Responsive script verification failed');
                        throw new Error('Responsive script failed to load properly');
                      }
                      
                      // Give it a moment to initialize
                      await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                      console.error('Failed to inject responsive script:', error);
                      throw new Error(`Responsive script injection failed: ${error}`);
                    }
                    */
                }
            }
            catch (error) {
                console.error('Error ensuring responsive script is loaded:', error);
                throw new Error('Unable to inject responsive script');
            }
        });
    }
    // Helper function to show status
    function showStatus(message) {
        if (statusDisplay) {
            statusDisplay.textContent = message;
            statusDisplay.style.display = 'inline';
            setTimeout(() => {
                statusDisplay.style.display = 'none';
            }, 3000);
        }
    }
    // Helper function to activate/deactivate inspector in UI
    function activateInspector(active) {
        if (active) {
            inspectorToggle.textContent = 'Disable Inspector';
            inspectorToggle.classList.add('active');
            if (inspectorSection) {
                inspectorSection.classList.add('active');
            }
        }
        else {
            inspectorToggle.textContent = 'Enable Inspector';
            inspectorToggle.classList.remove('active');
            if (inspectorSection) {
                inspectorSection.classList.remove('active');
            }
        }
    }
    // Helper function to activate/deactivate responsive preview in UI
    function activateResponsive(active) {
        if (active) {
            responsiveToggle.textContent = 'Disable Responsive';
            responsiveToggle.classList.add('active');
            if (responsiveSection) {
                responsiveSection.classList.add('active');
            }
        }
        else {
            responsiveToggle.textContent = 'Enable Responsive';
            responsiveToggle.classList.remove('active');
            if (responsiveSection) {
                responsiveSection.classList.remove('active');
            }
        }
    }
    // Helper function to send messages to the active tab
    function sendMessageToActiveTab(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            var _a;
            if ((_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id) {
                try {
                    // Set a timeout to handle unresponsive content script
                    const messageTimeout = setTimeout(() => {
                        console.log('Message response timeout - this is normal for toggle operations');
                    }, 300);
                    chrome.tabs.sendMessage(tabs[0].id, message, response => {
                        clearTimeout(messageTimeout);
                        if (chrome.runtime.lastError) {
                            // Use a more specific error message without logging the entire object
                            const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                            // Common errors that shouldn't be treated as problems:
                            const expectedErrors = [
                                'Could not establish connection',
                                'The message port closed before a response was received',
                                'A listener indicated an asynchronous response'
                            ];
                            const isExpectedError = expectedErrors.some(expected => errorMessage.includes(expected));
                            if (!isExpectedError) {
                                console.error('Error sending message:', errorMessage);
                                showStatus('Connection error. Please refresh the page.');
                            }
                            else {
                                console.log('Expected messaging behavior:', errorMessage);
                            }
                        }
                        if (response) {
                            console.log('Response received:', response);
                        }
                    });
                }
                catch (error) {
                    console.error('Error sending message to tab:', error);
                    showStatus('Failed to communicate with page.');
                }
            }
        });
    }
});
// Keep popup open even when focus is lost
window.addEventListener('blur', (e) => {
    e.stopPropagation();
    e.preventDefault();
});
