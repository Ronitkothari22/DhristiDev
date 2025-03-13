/// <reference types="chrome"/>

/**
 * DrishtiDev Element Inspector
 * Content script that adds element inspection functionality to any webpage.
 * When enabled, it allows clicking on elements to show their properties in an overlay.
 */

// Type definitions for element data
interface ElementData {
  tagName: string;
  id: string;
  classList: string[];
  attributes: { [key: string]: string };
  computedStyles: { [key: string]: string };
  xpath: string;
  textContent?: string;
}

// CSS properties that can be edited in the overlay
const EDITABLE_CSS_PROPERTIES = [
  'color',
  'background-color',
  'margin',
  'padding',
  'font-size',
  'border',
  'width',
  'height',
  'display',
  'position'
];

// Store the currently active overlay element
let activeOverlay: HTMLElement | null = null;
// Store the currently inspected element
let inspectedElement: HTMLElement | null = null;
// Track if inspector mode is active
let inspectorActive = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  if (message.action === 'toggleInspector') {
    toggleInspectorMode(message.enabled);
    // Immediately send a response to prevent channel closed error
    sendResponse({ success: true });
  } else if (message.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ status: 'ok' });
  }
  
  // Return false since we're handling responses synchronously
  return false;
});

/**
 * Toggle inspector mode on/off
 */
function toggleInspectorMode(enabled: boolean): void {
  inspectorActive = enabled;
  
  if (enabled) {
    // Add inspector class to body to change cursor
    document.body.classList.add('drishti-inspector-active');
    // Add click listener
    document.addEventListener('click', handleElementClick, true);
    // Add mouseover for highlighting
    document.addEventListener('mouseover', handleElementMouseOver, true);
    document.addEventListener('mouseout', handleElementMouseOut, true);
  } else {
    // Remove inspector class from body
    document.body.classList.remove('drishti-inspector-active');
    // Remove event listeners
    document.removeEventListener('click', handleElementClick, true);
    document.removeEventListener('mouseover', handleElementMouseOver, true);
    document.removeEventListener('mouseout', handleElementMouseOut, true);
    // Remove any active overlay
    removeOverlay();
  }
}

/**
 * Handle element click in inspector mode
 */
function handleElementClick(event: MouseEvent): void {
  if (!inspectorActive) return;
  
  // Prevent default action (e.g., following links)
  event.preventDefault();
  event.stopPropagation();
  
  // Check if we clicked inside the overlay - if so, don't do anything
  let target = event.target as HTMLElement;
  let isOverlayClick = false;
  
  while (target && target !== document.body) {
    if (target.classList.contains('drishti-overlay-container')) {
      isOverlayClick = true;
      break;
    }
    target = target.parentElement as HTMLElement;
  }
  
  if (isOverlayClick) {
    return; // Don't process clicks inside the overlay
  }
  
  // Get the clicked element
  const element = event.target as HTMLElement;
  if (!element) return;
  
  // Store as inspected element
  inspectedElement = element;
  
  // Extract element data
  const elementData = extractElementData(element);
  
  // Show overlay with element data
  showOverlay(element, elementData, event);
}

/**
 * Handle element mouseover in inspector mode
 */
function handleElementMouseOver(event: MouseEvent): void {
  if (!inspectorActive) return;
  
  const element = event.target as HTMLElement;
  if (!element) return;
  
  // Highlight hovered element
  element.classList.add('drishti-element-highlight');
}

/**
 * Handle element mouseout in inspector mode
 */
function handleElementMouseOut(event: MouseEvent): void {
  if (!inspectorActive) return;
  
  const element = event.target as HTMLElement;
  if (!element) return;
  
  // Remove highlight
  element.classList.remove('drishti-element-highlight');
}

/**
 * Extract element data for inspection
 */
function extractElementData(element: HTMLElement): ElementData {
  // Get computed styles
  const computedStyle = window.getComputedStyle(element);
  const computedStyles: { [key: string]: string } = {};
  
  // Extract editable CSS properties
  EDITABLE_CSS_PROPERTIES.forEach(prop => {
    computedStyles[prop] = computedStyle.getPropertyValue(prop);
  });
  
  // Get attributes
  const attributes: { [key: string]: string } = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  
  // Get the element's class list but filter out our highlight class
  const classList = Array.from(element.classList).filter(
    cls => cls !== 'drishti-element-highlight'
  );
  
  // Extract text content (trimmed and limited to a reasonable length)
  let textContent = '';
  if (element.textContent) {
    textContent = element.textContent.trim();
    if (textContent.length > 100) {
      textContent = textContent.substring(0, 100) + '...';
    }
  }
  
  // Create element data
  const elementData: ElementData = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || '',
    classList,
    attributes,
    computedStyles,
    xpath: getXPath(element),
    textContent
  };
  
  return elementData;
}

/**
 * Create and show overlay with element data
 */
function showOverlay(
  element: HTMLElement, 
  elementData: ElementData, 
  event: MouseEvent
): void {
  // Remove any existing overlay
  removeOverlay();
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'drishti-overlay-container';
  
  // Add header
  const header = document.createElement('div');
  header.className = 'drishti-overlay-header';
  
  const title = document.createElement('h3');
  title.textContent = 'Element Inspector';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'drishti-overlay-close';
  closeButton.textContent = '×';
  closeButton.type = 'button';
  
  // Fix: Make sure the close button works by using a direct function reference
  closeButton.addEventListener('click', () => {
    removeOverlay();
  }, false);
  
  header.appendChild(title);
  header.appendChild(closeButton);
  overlay.appendChild(header);
  
  // Add body
  const body = document.createElement('div');
  body.className = 'drishti-overlay-body';
  
  // Element info section
  const infoSection = document.createElement('div');
  infoSection.className = 'drishti-element-info';
  
  // Tag info
  const tagInfo = document.createElement('div');
  tagInfo.className = 'drishti-element-tag';
  
  // Format the tag with id and classes
  let tagText = `<${elementData.tagName}`;
  if (elementData.id) {
    tagText += ` id="${elementData.id}"`;
  }
  if (elementData.classList.length > 0) {
    tagText += ` class="${elementData.classList.join(' ')}"`;
  }
  tagText += '>';
  
  // Add a header for the element info section
  const elementInfoHeader = document.createElement('h4');
  elementInfoHeader.textContent = 'Element Information';
  elementInfoHeader.style.marginBottom = '10px';
  infoSection.appendChild(elementInfoHeader);
  
  // Create an editable tag display
  const tagDisplay = document.createElement('div');
  tagDisplay.className = 'drishti-tag-display';
  
  // Element Type with edit option
  const elementTypeSection = document.createElement('div');
  elementTypeSection.className = 'drishti-element-property';
  
  const typeLabel = document.createElement('strong');
  typeLabel.textContent = 'Element Type: ';
  typeLabel.style.marginRight = '8px';
  
  const typeValue = document.createElement('span');
  typeValue.textContent = elementData.tagName;
  typeValue.style.fontFamily = 'Courier New, monospace';
  
  elementTypeSection.appendChild(typeLabel);
  elementTypeSection.appendChild(typeValue);
  tagDisplay.appendChild(elementTypeSection);
  
  // Text Content (if available)
  if (elementData.textContent) {
    const contentSection = document.createElement('div');
    contentSection.className = 'drishti-element-property';
    
    const contentLabel = document.createElement('strong');
    contentLabel.textContent = 'Text Content: ';
    contentLabel.style.marginRight = '8px';
    
    // Replace span with textarea for editing
    const contentInput = document.createElement('textarea');
    contentInput.value = elementData.textContent;
    contentInput.className = 'drishti-element-textarea';
    contentInput.rows = 2;
    contentInput.style.width = '100%';
    
    // Update the element's text content when the input changes
    contentInput.addEventListener('input', () => {
      if (inspectedElement) {
        // Preserve child elements by only updating text nodes
        updateElementTextContent(inspectedElement, contentInput.value);
      }
    });
    
    contentSection.appendChild(contentLabel);
    contentSection.appendChild(contentInput);
    tagDisplay.appendChild(contentSection);
  }
  
  // ID with edit option
  if (elementData.id) {
    const idSection = document.createElement('div');
    idSection.className = 'drishti-element-property';
    
    const idLabel = document.createElement('strong');
    idLabel.textContent = 'ID: ';
    idLabel.style.marginRight = '8px';
    
    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.value = elementData.id;
    idInput.className = 'drishti-element-input';
    idInput.addEventListener('change', () => {
      if (inspectedElement) {
        inspectedElement.id = idInput.value;
      }
    });
    
    idSection.appendChild(idLabel);
    idSection.appendChild(idInput);
    tagDisplay.appendChild(idSection);
  }
  
  // Classes with edit option
  if (elementData.classList.length > 0) {
    const classSection = document.createElement('div');
    classSection.className = 'drishti-element-property';
    
    const classLabel = document.createElement('strong');
    classLabel.textContent = 'Classes: ';
    classLabel.style.marginRight = '8px';
    
    const classInput = document.createElement('input');
    classInput.type = 'text';
    classInput.value = elementData.classList.join(' ');
    classInput.className = 'drishti-element-input';
    classInput.addEventListener('change', () => {
      if (inspectedElement) {
        // Remove all existing classes
        elementData.classList.forEach(cls => {
          inspectedElement?.classList.remove(cls);
        });
        
        // Add new classes
        const newClasses = classInput.value.split(' ').filter(c => c.trim() !== '');
        newClasses.forEach(cls => {
          inspectedElement?.classList.add(cls);
        });
      }
    });
    
    classSection.appendChild(classLabel);
    classSection.appendChild(classInput);
    tagDisplay.appendChild(classSection);
  }
  
  // Original tag format for reference (read-only)
  const originalTag = document.createElement('div');
  originalTag.className = 'drishti-original-tag';
  originalTag.textContent = tagText;
  originalTag.style.marginTop = '8px';
  originalTag.style.padding = '6px 10px';
  originalTag.style.background = '#f0f0f0';
  originalTag.style.borderRadius = '4px';
  originalTag.style.fontSize = '12px';
  originalTag.style.fontFamily = 'Courier New, monospace';
  
  tagDisplay.appendChild(originalTag);
  infoSection.appendChild(tagDisplay);
  
  // Add the original tag display for reference (hidden by default)
  tagInfo.textContent = tagText;
  tagInfo.style.display = 'none';
  infoSection.appendChild(tagInfo);
  
  // Attributes section with improved styling
  if (Object.keys(elementData.attributes).length > 0) {
    const attrSection = document.createElement('div');
    attrSection.className = 'drishti-element-attributes';
    
    const attrTitle = document.createElement('h4');
    attrTitle.textContent = 'Other Attributes:';
    attrTitle.style.margin = '12px 0 8px 0';
    attrSection.appendChild(attrTitle);
    
    const attrTable = document.createElement('table');
    attrTable.className = 'drishti-attr-table';
    attrTable.style.width = '100%';
    attrTable.style.borderCollapse = 'collapse';
    
    for (const [key, value] of Object.entries(elementData.attributes)) {
      if (key !== 'id' && key !== 'class') {
        const row = document.createElement('tr');
        
        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        keyCell.style.padding = '4px 8px';
        keyCell.style.fontWeight = 'bold';
        keyCell.style.width = '30%';
        
        const valueCell = document.createElement('td');
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.value = value;
        valueInput.className = 'drishti-element-input';
        valueInput.style.width = '100%';
        valueInput.addEventListener('change', () => {
          if (inspectedElement) {
            inspectedElement.setAttribute(key, valueInput.value);
          }
        });
        
        valueCell.appendChild(valueInput);
        valueCell.style.padding = '4px 0';
        
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        attrTable.appendChild(row);
      }
    }
    
    attrSection.appendChild(attrTable);
    infoSection.appendChild(attrSection);
  }
  
  body.appendChild(infoSection);
  
  // CSS editor section
  const cssEditor = document.createElement('div');
  cssEditor.className = 'drishti-css-editor';
  
  const cssTitle = document.createElement('h4');
  cssTitle.textContent = 'Edit CSS Properties:';
  cssEditor.appendChild(cssTitle);
  
  // Create editable property fields
  EDITABLE_CSS_PROPERTIES.forEach(prop => {
    const propContainer = document.createElement('div');
    propContainer.className = 'drishti-css-property';
    
    const label = document.createElement('label');
    label.textContent = prop + ':';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = elementData.computedStyles[prop] || '';
    input.dataset.property = prop;
    
    // For color properties, add a color indicator
    if (prop === 'color' || prop === 'background-color') {
      // Add a small color swatch before the input
      const colorValue = elementData.computedStyles[prop];
      if (colorValue && colorValue !== 'transparent' && colorValue !== 'rgba(0, 0, 0, 0)') {
        const colorSwatch = document.createElement('span');
        colorSwatch.style.position = 'absolute';
        colorSwatch.style.width = '16px';
        colorSwatch.style.height = '16px';
        colorSwatch.style.backgroundColor = colorValue;
        colorSwatch.style.borderRadius = '3px';
        colorSwatch.style.left = '10px';
        colorSwatch.style.top = '50%';
        colorSwatch.style.transform = 'translateY(-50%)';
        colorSwatch.style.border = '1px solid rgba(0,0,0,0.1)';
        
        // Wrap input in a container for positioning
        const inputWrapper = document.createElement('div');
        inputWrapper.style.position = 'relative';
        inputWrapper.style.flex = '1';
        inputWrapper.appendChild(colorSwatch);
        inputWrapper.appendChild(input);
        
        propContainer.appendChild(label);
        propContainer.appendChild(inputWrapper);
      } else {
        propContainer.appendChild(label);
        propContainer.appendChild(input);
      }
    } else {
      propContainer.appendChild(label);
      propContainer.appendChild(input);
    }
    
    // Always add the property container to the CSS editor
    cssEditor.appendChild(propContainer);
    
    // Update CSS on input with debouncing for better performance
    let debounceTimeout: number | null = null;
    input.addEventListener('input', () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(() => {
        if (inspectedElement) {
          try {
            // Update the element style
            inspectedElement.style.setProperty(prop, input.value);
            
            // For color properties, update the color swatch
            if ((prop === 'color' || prop === 'background-color') && 
                input.parentElement?.querySelector('span')) {
              const colorSwatch = input.parentElement.querySelector('span');
              if (colorSwatch) {
                colorSwatch.style.backgroundColor = input.value;
              }
            }
          } catch (error) {
            console.error(`Failed to set ${prop}:`, error);
          }
        }
      }, 150); // Small delay for smoother experience
    });
  });
  
  body.appendChild(cssEditor);
  
  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'drishti-actions';
  
  // Copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'drishti-button';
  copyButton.textContent = 'Copy Element Data';
  copyButton.addEventListener('click', () => {
    try {
      // Clean the data to make it more readable
      const cleanData = {
        tagName: elementData.tagName,
        id: elementData.id,
        classes: elementData.classList,
        textContent: elementData.textContent,
        computedStyles: elementData.computedStyles
      };
      
      const dataStr = JSON.stringify(cleanData, null, 2);
      
      // Use a more reliable clipboard copy method
      const textArea = document.createElement('textarea');
      textArea.value = dataStr;
      textArea.style.position = 'fixed';  // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        // Show feedback (change button text temporarily)
        copyButton.textContent = 'Copied!';
        copyButton.style.backgroundColor = '#4caf50';
        setTimeout(() => {
          copyButton.textContent = 'Copy Element Data';
          copyButton.style.backgroundColor = '';
        }, 2000);
      } else {
        throw new Error('Copy command was unsuccessful');
      }
    } catch (error) {
      console.error('Failed to copy data:', error);
      copyButton.textContent = 'Copy Failed';
      copyButton.style.backgroundColor = '#f44336';
      setTimeout(() => {
        copyButton.textContent = 'Copy Element Data';
        copyButton.style.backgroundColor = '';
      }, 2000);
    }
  });
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.className = 'drishti-button secondary';
  resetButton.textContent = 'Reset Changes';
  resetButton.addEventListener('click', () => {
    if (inspectedElement) {
      try {
        // Store original element for reference
        const originalElement = inspectedElement;
        
        // Reset inline styles
        inspectedElement.removeAttribute('style');
        
        // Visual feedback
        resetButton.textContent = 'Reset Complete!';
        setTimeout(() => {
          resetButton.textContent = 'Reset Changes';
          
          // Refresh overlay with updated data if the element still exists in DOM
          if (document.contains(originalElement)) {
            const updatedData = extractElementData(originalElement);
            showOverlay(originalElement, updatedData, event);
          }
        }, 1000);
      } catch (error) {
        console.error('Error resetting styles:', error);
        resetButton.textContent = 'Reset Failed';
        setTimeout(() => {
          resetButton.textContent = 'Reset Changes';
        }, 1000);
      }
    }
  });
  
  actions.appendChild(copyButton);
  actions.appendChild(resetButton);
  body.appendChild(actions);
  
  overlay.appendChild(body);
  
  // Position the overlay near the element
  positionOverlay(overlay, event);
  
  // Add to document
  document.body.appendChild(overlay);
  
  // Store active overlay
  activeOverlay = overlay;
}

/**
 * Position the overlay based on click position
 */
function positionOverlay(overlay: HTMLElement, event: MouseEvent): void {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Initial position at click point
  let left = event.clientX + 10; // 10px to the right of cursor
  let top = event.clientY + 10; // 10px below cursor
  
  // Add overlay to the document temporarily to get its dimensions
  overlay.style.visibility = 'hidden';
  document.body.appendChild(overlay);
  const overlayWidth = overlay.offsetWidth;
  const overlayHeight = overlay.offsetHeight;
  document.body.removeChild(overlay);
  overlay.style.visibility = 'visible';
  
  // Adjust if overlay would go outside viewport
  if (left + overlayWidth > viewportWidth) {
    left = Math.max(0, event.clientX - overlayWidth - 10);
  }
  
  if (top + overlayHeight > viewportHeight) {
    top = Math.max(0, event.clientY - overlayHeight - 10);
  }
  
  // Set position
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
}

/**
 * Remove the active overlay
 */
function removeOverlay(): void {
  if (activeOverlay && activeOverlay.parentNode) {
    // Ensure we're removing the overlay from its parent
    try {
      activeOverlay.parentNode.removeChild(activeOverlay);
    } catch (e) {
      console.error('Error removing overlay:', e);
    }
    activeOverlay = null;
    
    // Log for debugging
    console.log('Overlay removed');
  } else {
    console.log('No active overlay to remove');
  }
}

/**
 * Get XPath for an element
 */
function getXPath(element: HTMLElement): string {
  if (!element) return '';
  
  try {
    let xpath = '';
    let currentElement: HTMLElement | null = element;
    
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let currentPath = currentElement.tagName.toLowerCase();
      
      // Add id if available
      if (currentElement.id) {
        xpath = `//${currentPath}[@id="${currentElement.id}"]` + xpath;
        break;
      }
      
      // Get index among siblings
      let count = 1;
      let sibling = currentElement.previousElementSibling;
      
      while (sibling) {
        if (sibling.tagName === currentElement.tagName) {
          count++;
        }
        sibling = sibling.previousElementSibling;
      }
      
      // Add position if needed
      if (count > 1) {
        currentPath += `[${count}]`;
      }
      
      xpath = `/${currentPath}` + xpath;
      currentElement = currentElement.parentElement;
    }
    
    return xpath;
  } catch (error) {
    console.error('Error generating XPath:', error);
    return '';
  }
}

/**
 * Update an element's text content while preserving its child elements
 * This is a smarter way to update text without destroying child elements
 */
function updateElementTextContent(element: HTMLElement, newText: string): void {
  try {
    // If the element has no children, we can simply update textContent
    if (element.childNodes.length === 0 || (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE)) {
      element.textContent = newText;
      return;
    }
    
    // For elements with children, we need to find just the text nodes
    let textNode = null;
    
    // Find the first text node
    for (let i = 0; i < element.childNodes.length; i++) {
      if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
        textNode = element.childNodes[i];
        break;
      }
    }
    
    // If there's a text node, update it, otherwise create one
    if (textNode) {
      textNode.nodeValue = newText;
    } else {
      // No text node found, create one at the beginning
      textNode = document.createTextNode(newText);
      if (element.firstChild) {
        element.insertBefore(textNode, element.firstChild);
      } else {
        element.appendChild(textNode);
      }
    }
  } catch (error) {
    console.error('Error updating text content:', error);
  }
} 