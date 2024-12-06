import { logger } from '../utils/logger';
import { Carousel } from './carouselAnalyzer';
import { storeScrapeData } from '../storage/firebase';

interface ScrapeResponse {
  success: boolean;
  data: Carousel[];
  error?: string;
  currentAddress?: string;
}

export class ScrapeManager {
  private addresses: string[] = [
    '363 E Wacker Dr, Chicago',
    '450 Fulton Street, San Francisco',
    '111 N Grand Ave, Los Angeles',
    '1001 Brickell Bay Dr, Miami'
  ];
  private tabId: number;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  public async scrapeAllAddresses() {
    logger.info('Starting scrape of all addresses');
    const today = new Date().toISOString().split('T')[0];
    
    for (const address of this.addresses) {
      try {
        logger.info(`Processing address: ${address}`);
        await this.changeAddress(address);
        await this.waitForPageLoad(5000);
        
        const results = await this.scrapeCurrentPage();
        
        // Store results in Firebase
        await storeScrapeData(today, address, results);
        
        logger.info(`Successfully scraped and stored data for address: ${address}`);
      } catch (error) {
        logger.error(`Failed to scrape address: ${address}`, error);
        continue;
      }
    }
    
    logger.info('Completed scraping all addresses');
  }

  private async changeAddress(targetAddress: string) {
    // Send message to content script to change address
    const response = await chrome.tabs.sendMessage(this.tabId, { 
      action: 'changeAddress',
      address: targetAddress
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to change address');
    }
  }

  private async waitForPageLoad(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async scrapeCurrentPage() {
    try {
      // Send message to content script to scrape using the stored tabId
      const response = await chrome.tabs.sendMessage<any, ScrapeResponse>(this.tabId, { 
        action: 'scrapeCarousels' 
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to scrape carousels');
      }

      // Log the current address first
      logger.info('=== SCRAPING ADDRESS ===');
      logger.info(`Current Address: ${response.currentAddress}`);
      logger.info('=====================');

      // Log the results
      this.logResults(response.data);

      logger.info('Successfully scraped page', { 
        address: response.currentAddress,
        totalCarousels: response.data.length,
        totalStores: response.data.reduce((sum: number, c: Carousel) => sum + c.stores.length, 0)
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to scrape page:', error);
      throw error;
    }
  }

  private logResults(carousels: Carousel[]) {
    logger.info('=== SCRAPING RESULTS ===');
    logger.info(`Total Carousels: ${carousels.length}`);
    
    carousels.forEach((carousel, index) => {
      logger.info(`\nCarousel ${index + 1}: ${carousel.title}`);
      logger.info(`Total Stores: ${carousel.stores.length}`);
      
      carousel.stores.forEach((store: any, storeIndex: number) => {
        logger.info(`\n  Store ${storeIndex + 1}: ${store.name}`);
        if (store.rating) {
          logger.info(`    Rating: ${store.rating} ${store.reviews}`);
        }
        logger.info(`    Distance: ${store.distance}`);
        logger.info(`    Delivery Time: ${store.delivery_time}`);
        logger.info(`    Delivery Fee: ${store.delivery_fee}`);
        if (store.dashpass_eligible) {
          logger.info('    DashPass Eligible: ✓');
        }
        if (store.promotions.length > 0) {
          logger.info(`    Promotions: ${store.promotions.join(', ')}`);
        }
      });
    });
    
    logger.info('\n=== END OF RESULTS ===');
  }
} 