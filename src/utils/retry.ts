export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
  shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | unknown;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === options.maxAttempts || 
         (options.shouldRetry && !options.shouldRetry(error))) {
        break;
      }

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= options.backoffFactor;
    }
  }

  const errorMessage = lastError instanceof Error 
    ? lastError.message 
    : String(lastError);

  throw new Error(`Operation failed after ${options.maxAttempts} attempts. Last error: ${errorMessage}`);
} 