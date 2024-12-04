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

// Function to change address
async function changeAddress(targetAddress: string): Promise<boolean> {
  try {
    // Click the address button
    const addressButton = document.querySelector('button[data-testid="addressTextButton"]');
    if (!addressButton) {
      throw new Error('Address button not found');
    }
    (addressButton as HTMLElement).click();

    // Wait for dropdown
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find address in dropdown
    const addressItems = document.querySelectorAll('button[data-testid="AddressListItem"]');
    let found = false;

    for (const item of addressItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes(targetAddress.toLowerCase())) {
        (item as HTMLElement).click();
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Address not found in list: ${targetAddress}`);
    }

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