type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private async logToStorage(level: LogLevel, message: string, details?: any) {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      level,
      message,
      details
    };

    try {
      const data = await chrome.storage.local.get('logs');
      const logs = data.logs || [];
      logs.push(logEntry);
      await chrome.storage.local.set({ logs });
    } catch (error) {
      console.error('Failed to save log:', error);
    }

    // Also log to console for development
    console[level](message, details || '');
  }

  info(message: string, details?: any) {
    this.logToStorage('info', message, details);
  }

  warn(message: string, details?: any) {
    this.logToStorage('warn', message, details);
  }

  error(message: string, details?: any) {
    this.logToStorage('error', message, details);
  }
}

export const logger = new Logger(); 