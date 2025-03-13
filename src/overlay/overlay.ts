/// <reference types="chrome"/>

/**
 * DrishtiDev Overlay Module
 * This file will handle the overlay UI components for the extension.
 * Currently a placeholder for future development.
 */

// Export types for use in other modules
export interface OverlayOptions {
  position: {
    x: number;
    y: number;
  };
  title: string;
  content: string | HTMLElement;
  closeCallback?: () => void;
}

// Placeholder function for future development
export function createOverlay(options: OverlayOptions): HTMLElement {
  console.log('Overlay creation requested with options:', options);
  // This will be implemented in future tasks
  return document.createElement('div');
} 