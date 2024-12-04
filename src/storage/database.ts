// For now, we'll just have a simple interface for settings
export interface Settings {
  apiKey?: string;
}

// Temporary in-memory storage
class DoorDashDatabase {
  settings: Settings = {};

  // Add missing methods
  async initializeStorage() {
    // No-op for now
    return;
  }

  async updateSettings(settings: Partial<Settings>) {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings(): Settings {
    return this.settings;
  }
}

export const db = new DoorDashDatabase();
export const initializeStorage = () => db.initializeStorage(); 