export class AlarmManager {
  private static ALARM_TIMES = [
    { name: '9AM', hour: 9 },
    { name: '11AM', hour: 11 },
    { name: '1PM', hour: 13 },
    { name: '3PM', hour: 15 },
    { name: '5PM', hour: 17 },
    { name: '7PM', hour: 19 },
    { name: '9PM', hour: 21 },
    { name: '11PM', hour: 23 }
  ];

  static async setupAlarms() {
    // Clear any existing alarms
    await chrome.alarms.clearAll();

    // Create alarms for each time
    for (const time of this.ALARM_TIMES) {
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        time.hour,
        0,
        0
      );

      // If the time has passed today, schedule for tomorrow
      if (scheduledTime.getTime() < now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await chrome.alarms.create(time.name, {
        when: scheduledTime.getTime(),
        periodInMinutes: 24 * 60 // Repeat daily
      });
    }

    console.log('Alarms set up successfully');
  }

  static async getLastRunDate(): Promise<string | null> {
    const result = await chrome.storage.local.get('lastRunDate');
    return result.lastRunDate || null;
  }

  static async setLastRunDate(date: string) {
    await chrome.storage.local.set({ lastRunDate: date });
  }

  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  static async shouldRunToday(): Promise<boolean> {
    const lastRunDate = await this.getLastRunDate();
    const today = this.getCurrentDate();
    return !lastRunDate || lastRunDate !== today;
  }
} 