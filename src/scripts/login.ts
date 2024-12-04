import { logger } from '../utils/logger';
import { db } from '../storage/database';

export async function getApiKey(): Promise<string | undefined> {
  const settings = db.getSettings();
  return settings.apiKey;
} 