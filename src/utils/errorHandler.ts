import { logger } from './logger';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ScrapingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScrapingError';
  }
}

export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    logger.error(`${error.name}: ${error.message}`);
    return error;
  }
  
  const genericError = new Error('An unknown error occurred');
  logger.error('Unknown error:', error);
  return genericError;
} 