declare namespace Chrome {
  export type StorageArea = {
    get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
    get(key: string): Promise<{ [key: string]: any }>;
    get(callback: (items: { [key: string]: any }) => void): void;
    get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
    set(items: object): Promise<void>;
  }

  export type Storage = {
    local: StorageArea;
  }

  export type Alarms = {
    create(name: string, alarmInfo: {
      when?: number;
      delayInMinutes?: number;
      periodInMinutes?: number;
    }): void;
    clearAll(): Promise<void>;
    onAlarm: {
      addListener(callback: (alarm: { name: string }) => void): void;
    };
  }

  export type Runtime = {
    onInstalled: {
      addListener(callback: () => void): void;
    };
  }
}

declare const chrome: {
  storage: Chrome.Storage;
  alarms: Chrome.Alarms;
  runtime: Chrome.Runtime;
};

export {}; 