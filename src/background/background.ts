import { db, initializeStorage } from '../storage/database';
import { ScrapeManager } from '../scripts/scrapeManager';
import { logger } from '../utils/logger';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await initializeStorage();
    logger.info('Extension successfully installed and initialized');
  } catch (error) {
    logger.error('Failed to initialize extension:', error);
  }
});

// Log when background script starts
logger.info('Background script started');

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScrape') {
    // Start scraping process
    handleScrape()
      .then(result => {
        logger.info('Scrape completed successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        logger.error('Scrape failed:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }
});

// Handle scrape requests
async function handleScrape() {
  try {
    const scraper = new ScrapeManager();
    await scraper.scrapeAllAddresses();
    return { success: true };
  } catch (error) {
    logger.error('Scrape failed:', error);
    throw error;
  }
} 