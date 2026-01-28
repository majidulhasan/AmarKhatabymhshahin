import { StorageData } from '../types';

const STORAGE_KEY = 'amar_khata_data_v2';

const DEFAULT_DATA: StorageData = {
  settings: {
    language: 'bn',
    theme: 'light',
    themeColor: 'indigo',
    reminderEnabled: false,
    reminderTime: '20:00',
  },
  khata: {
    id: 'default-khata',
    name: 'Primary Khata',
    transactions: [],
    loans: [],
    notes: [],
    categories: [
      { id: 'c1', label: 'বেতন', type: 'INCOME' },
      { id: 'c2', label: 'বোনাস', type: 'INCOME' },
      { id: 'c3', label: 'খাবার', type: 'EXPENSE' },
      { id: 'c4', label: 'ভাড়া', type: 'EXPENSE' },
      { id: 'c5', label: 'যাতায়াত', type: 'EXPENSE' },
      { id: 'c6', label: 'স্বাস্থ্য', type: 'EXPENSE' },
      { id: 'c7', label: 'বিল', type: 'EXPENSE' },
      { id: 'c8', label: 'অন্যান্য', type: 'EXPENSE' },
    ],
  },
};

export const storage = {
  getData: (): StorageData => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse stored data", e);
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  },

  saveData: (data: StorageData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  exportToJSON: () => {
    const data = storage.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amar-khata-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importFromJSON: async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          storage.saveData(data);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  }
};
