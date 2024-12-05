import { DoorDashCarouselAnalyzer } from './carouselAnalyzer';
import { logger } from '../utils/logger';

// Add this at the top of the file
console.log('Content script loading on:', window.location.href);

// Filter console noise
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorString = args.join(' ');
  if (
    !errorString.includes('React') && 
    !errorString.includes('Permissions policy') &&
    !errorString.includes('CORS') &&
    !errorString.includes('Apollo DevTools') &&
    !errorString.includes('Sentry') &&
    !errorString.includes('beacon script') &&
    !errorString.includes('Minified React error')
  ) {
    originalConsoleError.apply(console, args);
  }
};

const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  const warnString = args.join(' ');
  if (
    !warnString.includes('beacon script') &&
    !warnString.includes('Permissions policy')
  ) {
    originalConsoleWarn.apply(console, args);
  }
};

// Function to get current address
function getCurrentAddress(): string {
  const addressButton = document.querySelector('button[data-testid="addressTextButton"]');
  const addressText = addressButton?.querySelector('.Text-sc-1nm69d8-0.bhEuhh')?.textContent;
  return addressText || 'Address not found';
}

// Helper function to normalize address text
function normalizeAddress(address: string): string {
  return address.toLowerCase()
    .replace('street', 'st')
    .replace('avenue', 'ave')
    .replace('boulevard', 'blvd')
    .replace('drive', 'dr')
    .replace('lane', 'ln')
    .replace(/\s+/g, ' ')
    .trim();
}

// Function to find address button in dropdown
function findAddressButton(addressText: string): Element | null {
  console.log('Starting findAddressButton for:', addressText);
  
  // First, find the address list container
  const addressList = document.querySelector('[role="radiogroup"][data-anchor-id="AddressList"]');
  
  if (!addressList) {
    console.warn('Address list container not found');
    return null;
  }
  console.log('Found address list container');

  // Get the normalized target street name
  const targetStreet = normalizeAddress(addressText.split(',')[0]);
  console.log('Looking for normalized street:', targetStreet);

  // Log all text content in the address list for debugging
  const addressButtons = Array.from(addressList.querySelectorAll('[role="radio"]'));
  const addresses = addressButtons.map(btn => {
    const text = btn.textContent?.trim() || '';
    const normalized = normalizeAddress(text);
    console.log('Address in list:', { original: text, normalized });
    return { button: btn, text: normalized };
  });

  // Find matching button
  const matchingButton = addressButtons.find(btn => {
    const btnText = normalizeAddress(btn.textContent || '');
    const isMatch = btnText.includes(targetStreet);
    console.log('Comparing:', {
      target: targetStreet,
      buttonText: btnText,
      isMatch
    });
    return isMatch;
  });

  if (matchingButton) {
    console.log('Found matching button:', matchingButton.textContent);
    return matchingButton;
  }

  console.log('No matching address found');
  return null;
}

// Function to change address
async function changeAddress(targetAddress: string): Promise<boolean> {
  try {
    console.log('Attempting to change address to:', targetAddress);
    
    // Click the address button to open dropdown
    const addressButton = document.querySelector('button[data-testid="addressTextButton"]');
    if (!addressButton) {
      throw new Error('Address button not found');
    }
    (addressButton as HTMLElement).click();
    console.log('Clicked address button');

    // Wait for dropdown to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Waited for dropdown');

    // Find and click the address button in the dropdown
    const addressItemButton = findAddressButton(targetAddress);
    
    if (!addressItemButton) {
      throw new Error(`Address not found in list: ${targetAddress}`);
    }

    console.log('Found matching address, clicking...');
    (addressItemButton as HTMLElement).click();
    
    // Wait for page to load after address change
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.error('Failed to change address:', error);
    return false;
  }
}

// Add message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message, 'on page:', window.location.href);
  
  if (message.action === 'changeAddress') {
    (async () => {
      const success = await changeAddress(message.address);
      sendResponse({ 
        success,
        error: success ? undefined : 'Failed to change address'
      });
    })();
    return true;
  }
  
  if (message.action === 'scrapeCarousels') {
    try {
      // Get current address first
      const currentAddress = getCurrentAddress();
      
      // Get the HTML content from the current page
      const htmlContent = document.documentElement.outerHTML;
      
      // Create analyzer and process the content
      const analyzer = new DoorDashCarouselAnalyzer(htmlContent);
      const results = analyzer.analyze();
      
      console.log('Analysis complete, sending results');
      
      // Send results back with address
      sendResponse({ 
        success: true, 
        data: results,
        currentAddress
      });
    } catch (error) {
      console.error('Failed to analyze page:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    return true;
  }
  
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
});

console.log('DoorDash Scraper content script loaded'); 