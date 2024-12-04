import { DoorDashCarouselAnalyzer } from './carouselAnalyzer';
import { logger } from '../utils/logger';

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

// Add message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
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
    return true; // Keep the message channel open for async response
  }
});

console.log('DoorDash Scraper content script loaded'); 