import React, { useState, useEffect } from 'react';
import './Popup.css';
import { logger } from '../utils/logger';

// Define interface locally for now
interface IListing {
  id: string;
  timestamp: Date;
  zip_code: string;
  carousel_name: string;
  merchant_name: string;
  promotions: string[];
}

export const Popup: React.FC = () => {
  const [listings, setListings] = useState<IListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrapeClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending startScrape message...');
      
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Message timeout - no response from background script'));
        }, 60000);

        chrome.runtime.sendMessage({ action: 'startScrape' }, (response) => {
          clearTimeout(timeoutId);
          
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          console.log('Received response:', response);
          resolve(response);
        });
      });

      if (!response || (response as any).error) {
        throw new Error((response as any)?.error || 'Failed to start scrape');
      }

    } catch (error) {
      console.error('Scrape error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start scrape');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup">
      <h1>DoorDash Scraper</h1>
      
      {/* Scrape Button */}
      <button 
        className="scrape-btn"
        onClick={handleScrapeClick}
        disabled={loading}
      >
        {loading ? 'Scraping...' : 'Scrape Now'}
      </button>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Message about console */}
      <div className="info-message">
        Check the extension's service worker console for scraping results
      </div>
    </div>
  );
}; 