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
    // Element section container
    const inspectorSection = inspectorToggle.closest('.tool-section');
    // Track inspector state
    let inspectorActive = false;
    // Initialize UI based on any previously stored state
    chrome.storage.local.get(['inspectorActive'], (result) => {
        if (result.inspectorActive) {
            activateInspector(true);
        }
    });
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
    // Helper function to ensure content script is loaded
    function ensureContentScriptLoaded(tabId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if we can communicate with the content script
                yield new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
                        // If we get a lastError, it likely means the content script isn't loaded
                        if (chrome.runtime.lastError) {
                            console.log('Content script not loaded, injecting it now...');
                            // Inject CSS first
                            chrome.scripting.insertCSS({
                                target: { tabId },
                                files: ['dist/content/styles.css']
                            }).then(() => {
                                // Then inject JavaScript
                                return chrome.scripting.executeScript({
                                    target: { tabId },
                                    files: ['dist/content/inspector.js']
                                });
                            }).then(() => {
                                console.log('Successfully injected content script');
                                // Give it a moment to initialize
                                setTimeout(resolve, 100);
                            }).catch(error => {
                                console.error('Failed to inject content script:', error);
                                reject(error);
                            });
                        }
                        else {
                            // Content script already loaded and responded
                            console.log('Content script already loaded');
                            resolve();
                        }
                    });
                });
            }
            catch (error) {
                console.error('Error ensuring content script is loaded:', error);
                throw new Error('Unable to inject inspector script');
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
    // Helper function to send messages to the active tab
    function sendMessageToActiveTab(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            var _a;
            if ((_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, message, response => {
                        if (chrome.runtime.lastError) {
                            // Use a more specific error message without logging the entire object
                            const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                            console.error('Error sending message:', errorMessage);
                            // Only show a status message if it's not a connection-related error
                            // which is expected when the content script is not yet loaded
                            if (!errorMessage.includes('Could not establish connection')) {
                                showStatus('Connection error. Please refresh the page.');
                            }
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
