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
    console.log('Attempting to change address to:', targetAddress);
    
    // Click the address button
    const addressButton = document.querySelector('button[data-testid="addressTextButton"]');
    if (!addressButton) {
      throw new Error('Address button not found');
    }
    (addressButton as HTMLElement).click();
    console.log('Clicked address button');

    // Wait for dropdown to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Waited for dropdown');

    // Find address in dropdown using more specific selectors
    const addressItems = document.querySelectorAll('button[data-testid="AddressListItem"]');
    console.log('Found address items:', addressItems.length);
    
    let found = false;
    for (const item of addressItems) {
      // Look for the street name span specifically
      const streetSpan = item.querySelector('.Text-sc-1nm69d8-0.laMCcm');
      const cityStateSpan = item.querySelector('.Text-sc-1nm69d8-0.griaXr');
      
      if (streetSpan && cityStateSpan) {
        const streetText = streetSpan.textContent?.trim() || '';
        const cityStateText = cityStateSpan.textContent?.trim() || '';
        
        console.log('Checking address:', {
          street: streetText,
          cityState: cityStateText,
          target: targetAddress
        });

        // Split target address into components
        const [street, cityState] = targetAddress.split(',').map(s => s.trim());
        
        if (streetText.toLowerCase() === street.toLowerCase() && 
            cityStateText.toLowerCase().includes(cityState.toLowerCase())) {
          console.log('Found matching address, clicking...');
          (item as HTMLElement).click();
          found = true;
          
          // Wait for page to load after address change
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
        }
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