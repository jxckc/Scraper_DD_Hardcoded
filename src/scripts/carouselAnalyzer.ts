// Export the interfaces
export interface StoreInfo {
  name: string;
  rating: string | null;
  reviews: string | null;
  distance: string | null;
  delivery_time: string | null;
  delivery_fee: string | null;
  promotions: string[];
  dashpass_eligible: boolean;
}

export interface Carousel {
  title: string;
  total_stores: number;
  stores: StoreInfo[];
}

export class DoorDashCarouselAnalyzer {
  private document: Document;

  constructor(htmlContent: string) {
    const parser = new DOMParser();
    this.document = parser.parseFromString(htmlContent, 'text/html');
  }

  public analyze(): Carousel[] {
    const carouselContainers = this.document.querySelectorAll('div[data-anchor-id="CarouselStoreContainer"]');
    const allCarousels: Carousel[] = [];

    carouselContainers.forEach((container) => {
      const titleSpan = container.querySelector('span.ifRNUd');
      const carouselTitle = titleSpan?.textContent || "Untitled Carousel";

      const legoContainer = container.querySelector('div[data-testid="LegoStandardCarouselContainer"]');
      if (!legoContainer) return;

      const storeCards = legoContainer.querySelectorAll('div[data-testid="card.store"]');
      const stores: StoreInfo[] = [];

      storeCards.forEach((card) => {
        const storeInfo = this.extractStoreInfo(card);
        if (storeInfo) {
          stores.push(storeInfo);
        }
      });

      allCarousels.push({
        title: carouselTitle,
        total_stores: stores.length,
        stores: stores
      });
    });

    return allCarousels;
  }

  private extractStoreInfo(card: Element): StoreInfo | null {
    let name = "Unknown";
    try {
      // Basic store info
      const storeName = card.querySelector('span[data-telemetry-id="store.name"]');
      name = storeName?.textContent || "Unknown";

      // Rating info
      const ratingElement = card.querySelector('span.fRCMLg');
      const rating = ratingElement?.textContent || null;

      // Reviews count
      const reviewsElements = card.querySelectorAll('span.fRCMLg');
      const reviews = Array.from(reviewsElements)
        .find(el => el.textContent?.includes('('))?.textContent || null;

      // Distance and time
      const descElements = card.querySelectorAll('span.buvHZf');
      const distance = Array.from(descElements)
        .find(el => el.textContent?.includes('mi'))?.textContent || null;
      const delivery_time = Array.from(descElements)
        .find(el => el.textContent?.includes('min'))?.textContent || null;

      // Delivery fee
      const feeElement = Array.from(card.querySelectorAll('span'))
        .find(el => el.textContent?.match(/\$.*delivery fee/));
      const delivery_fee = feeElement?.textContent || null;

      // Promotions/badges
      const promoElements = card.querySelectorAll('span.kkryia');
      const promotions = Array.from(promoElements)
        .map(el => el.textContent?.trim())
        .filter((text): text is string => !!text);

      // DashPass status
      const hasDashpass = !!card.querySelector('path[fill="var(--usage-color-brand-dashpass)"]');

      return {
        name,
        rating,
        reviews,
        distance,
        delivery_time,
        delivery_fee,
        promotions,
        dashpass_eligible: hasDashpass
      };
    } catch (e) {
      console.error(`Error extracting store info for ${name}:`, e);
      return null;
    }
  }

  public static printCarouselAnalysis(carousels: Carousel[]): void {
    console.log("\nDoorDash Carousel Analysis");
    console.log("=".repeat(50));

    carousels.forEach(carousel => {
      console.log(`\nCarousel: ${carousel.title}`);
      console.log(`Total Stores: ${carousel.total_stores}`);
      console.log("\nStores:");
      console.log("-".repeat(40));

      carousel.stores.forEach(store => {
        console.log(`\n• ${store.name}`);
        if (store.rating) {
          console.log(`  Rating: ${store.rating} ${store.reviews}`);
        }
        console.log(`  Distance: ${store.distance}`);
        console.log(`  Delivery Time: ${store.delivery_time}`);
        console.log(`  Delivery Fee: ${store.delivery_fee}`);
        if (store.dashpass_eligible) {
          console.log("  DashPass Eligible: ✓");
        }
        if (store.promotions.length > 0) {
          console.log("  Promotions:", store.promotions.join(", "));
        }
      });
    });
  }
} 