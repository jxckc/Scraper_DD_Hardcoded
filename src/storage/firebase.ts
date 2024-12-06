import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { Carousel } from '../scripts/carouselAnalyzer';

// Firebase configuration (as you have it)
const firebaseConfig = {
  apiKey: "AIzaSyBHLjc4-uLKDakn4CXlE7J6EKui0wjR4QA",
  authDomain: "dd-data-f2401.firebaseapp.com",
  projectId: "dd-data-f2401",
  storageBucket: "dd-data-f2401.firebasestorage.app",
  messagingSenderId: "980317809063",
  appId: "1:980317809063:web:68d5ebff1a7f705eaf2e82",
  measurementId: "G-80N2XSZHRC"
};

// Initialize Firebase and export app
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function storeScrapeData(date: string, address: string, carousels: Carousel[]) {
  try {
    // Create scrape document for the day if it doesn't exist
    const scrapeRef = doc(db, 'scrapes', date);
    
    // Create address document
    const addressId = address.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const addressRef = doc(scrapeRef, 'addresses', addressId);
    
    // Calculate total stores with explicit type
    const totalStores = carousels.reduce<number>((sum, carousel) => {
      return sum + (carousel.stores?.length || 0);
    }, 0);
    
    // Store address data
    await setDoc(addressRef, {
      address,
      totalCarousels: carousels.length,
      totalStores,
      timestamp: Timestamp.now()
    });

    // Store each carousel and its stores
    for (const carousel of carousels) {
      const carouselId = carousel.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const carouselRef = doc(addressRef, 'carousels', carouselId);
      
      // Store carousel data
      await setDoc(carouselRef, {
        title: carousel.title,
        storeCount: carousel.stores.length,
        timestamp: Timestamp.now()
      });

      // Store each store
      for (const store of carousel.stores) {
        const storeId = store.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const storeRef = doc(carouselRef, 'stores', storeId);
        
        await setDoc(storeRef, {
          name: store.name,
          rating: store.rating,
          reviews: store.reviews,
          distance: store.distance,
          delivery_time: store.delivery_time,
          delivery_fee: store.delivery_fee,
          dashpass_eligible: store.dashpass_eligible,
          promotions: store.promotions,
          timestamp: Timestamp.now()
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error storing data in Firebase:', error);
    throw error;
  }
} 