import { db, initializeStorage } from '../storage/database';
import { ScrapeManager } from '../scripts/scrapeManager';
import { logger } from '../utils/logger';
import { AlarmManager } from '../utils/alarmManager';
import { getCurrentUser } from '../services/auth';
import { setupTokenRefresh } from '../services/tokenRefresh';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await initializeStorage();
    await AlarmManager.setupAlarms();
    setupTokenRefresh();
    logger.info('Extension successfully installed and initialized');
  } catch (error) {
    logger.error('Failed to initialize extension:', error);
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  logger.info(`Alarm triggered: ${alarm.name}`);
  
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      logger.info('Skipping scheduled run: User not authenticated');
      return;
    }

    if (await AlarmManager.shouldRunToday()) {
      logger.info('Starting scheduled data collection');
      await runDataCollection();
      await AlarmManager.setLastRunDate(AlarmManager.getCurrentDate());
      logger.info('Scheduled data collection completed');
    } else {
      logger.info('Data already collected today, skipping');
    }
  } catch (error) {
    logger.error('Scheduled data collection failed:', error);
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScrape') {
    handleManualScrape()
      .then(result => {
        logger.info('Manual scrape completed successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        logger.error('Manual scrape failed:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (message.action === 'getLastRunDate') {
    AlarmManager.getLastRunDate()
      .then(date => sendResponse({ date }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'checkAuth') {
    getCurrentUser()
      .then(user => sendResponse({ user: user ? { email: user.email } : null }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function runDataCollection() {
  // Check authentication before running
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  let tab: chrome.tabs.Tab | undefined;
  try {
    // Create hidden tab
    const newTab = await chrome.tabs.create({
      url: 'https://www.doordash.com/home',
      active: false  // Make it hidden
    });

    if (!newTab?.id) {
      throw new Error('Failed to create tab');
    }

    const tabId = newTab.id;
    tab = newTab;

    logger.info('Created hidden tab, waiting for load...');

    // Wait for tab to complete loading with timeout
    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;
      
      function checkTab() {
        chrome.tabs.get(tabId, (updatedTab) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(`Failed to get tab: ${error.message}`));
            return;
          }

          logger.info(`Tab status: ${updatedTab.status}, URL: ${updatedTab.url}`);
          
          if (updatedTab.status === 'complete' && updatedTab.url?.includes('doordash.com')) {
            resolve();
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              reject(new Error('Timeout waiting for DoorDash page to load'));
            } else {
              setTimeout(checkTab, 1000);
            }
          }
        });
      }

      checkTab();
    });

    // Additional wait to ensure content script is loaded
    logger.info('Page loaded, waiting for content script...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify content script is ready with ping
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      logger.info('Content script responded to ping');
    } catch (error) {
      throw new Error('Content script not ready');
    }

    logger.info('Starting scrape...');
    const scraper = new ScrapeManager(tabId);
    await scraper.scrapeAllAddresses();
    
    logger.info('Scraping completed successfully');
  } catch (error) {
    logger.error('Data collection failed:', error);
    throw error;
  } finally {
    // Clean up: close the tab
    if (tab?.id) {
      try {
        await chrome.tabs.remove(tab.id);
        logger.info('Cleaned up tab');
      } catch (error) {
        logger.error('Failed to clean up tab:', error);
      }
    }
  }
}

async function handleManualScrape() {
  // Check authentication before running
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    await runDataCollection();
    await AlarmManager.setLastRunDate(AlarmManager.getCurrentDate());
    return { success: true };
  } catch (error) {
    logger.error('Manual scrape failed:', error);
    throw error;
  }
} 