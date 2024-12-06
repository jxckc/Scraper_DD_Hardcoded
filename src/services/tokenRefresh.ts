import { auth } from './auth';
import { onAuthStateChanged } from 'firebase/auth';
import { logger } from '../utils/logger';

export function setupTokenRefresh() {
  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Force token refresh if it's close to expiring (1 hour buffer)
        const tokenResult = await user.getIdTokenResult();
        const expirationTime = new Date(tokenResult.expirationTime).getTime();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (expirationTime - now < oneHour) {
          await user.getIdToken(true);
          logger.info('Token refreshed successfully');
        }
      } catch (error) {
        logger.error('Token refresh failed:', error);
      }
    }
  });
}

// Function to get a fresh token when needed
export async function getFreshToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken(true);
  } catch (error) {
    logger.error('Failed to get fresh token:', error);
    return null;
  }
} 