import { DoorDashCarouselAnalyzer } from './carouselAnalyzer';
import { logger } from '../utils/logger';

// Filter console noise (keep this as it helps reduce DoorDash's own console noise)
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
  const addressList = document.querySelector('[role="radiogroup"][data-anchor-id="AddressList"]');
  
  if (!addressList) {
    return null;
  }

  const targetStreet = normalizeAddress(addressText.split(',')[0]);
  const addressButtons = Array.from(addressList.querySelectorAll('[role="radio"]'));

  return addressButtons.find(btn => {
    const btnText = normalizeAddress(btn.textContent || '');
    return btnText.includes(targetStreet);
  }) || null;
}

// Function to change address
async function changeAddress(targetAddress: string): Promise<boolean> {
  try {
    const addressButton = document.querySelector('button[data-testid="addressTextButton"]');
    if (!addressButton) {
      throw new Error('Address button not found');
    }
    (addressButton as HTMLElement).click();

    // Wait for dropdown to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find and click the address button in the dropdown
    const addressItemButton = findAddressButton(targetAddress);
    
    if (!addressItemButton) {
      throw new Error(`Address not found in list: ${targetAddress}`);
    }

    (addressItemButton as HTMLElement).click();
    
    // Wait for page to load after address change
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    return false;
  }
}

// Add message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
      const currentAddress = getCurrentAddress();
      const htmlContent = document.documentElement.outerHTML;
      const analyzer = new DoorDashCarouselAnalyzer(htmlContent);
      const results = analyzer.analyze();
      
      sendResponse({ 
        success: true, 
        data: results,
        currentAddress
      });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    return true;
  }
  
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
}); 