import { logger } from './logger';

export async function initializeAlarms() {
  try {
    // Clear any existing alarms
    await chrome.alarms.clearAll();

    // Get scheduled time from storage
    const data = await chrome.storage.local.get('settings');
    const scheduleTime = data.settings?.schedule_time || '03:00';

    // Parse hours and minutes
    const [hours, minutes] = scheduleTime.split(':').map(Number);

    // Calculate when the alarm should next fire
    const now = new Date();
    let scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Create the alarm
    await chrome.alarms.create('dailyScrape', {
      when: scheduledTime.getTime(),
      periodInMinutes: 24 * 60 // Repeat daily
    });

    logger.info('Alarm scheduled successfully', {
      nextRun: scheduledTime.toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize alarms:', error);
    throw error;
  }
} 