import { useEffect } from 'react';
import { saveToCloud } from '../services/cloudSync';

export const useCloudAutoSave = (currentPage?: string) => {
  // Read current license code from localStorage (license_cache)
  const getLicenseCode = (): string | null => {
    try {
      const cachedStr = localStorage.getItem('license_cache');
      if (cachedStr) {
        const cache = JSON.parse(cachedStr);
        return cache.code || null;
      }
    } catch (e) {
      console.warn('Failed to read license code for autosave:', e);
    }
    return null;
  };

  // 1. Auto-save every 20 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const code = getLicenseCode();
      if (code) {
        await saveToCloud(code);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // 2. Auto-save when currentPage changes
  useEffect(() => {
    const triggerSave = async () => {
      const code = getLicenseCode();
      if (code) {
        await saveToCloud(code);
      }
    };
    triggerSave();
  }, [currentPage]);
};
