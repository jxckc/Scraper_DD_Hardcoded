import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { app } from '../storage/firebase';
import { AuthError, handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export const auth = getAuth(app);

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    logger.info('Login successful:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Login failed');
  }
}

export async function logout() {
  try {
    await signOut(auth);
    logger.info('Logout successful');
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Logout failed');
  }
}

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
} 