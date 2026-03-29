const STORAGE_KEY = 'careerpath_api_keys';

export const getStoredKeys = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load keys from localStorage", e);
    return [];
  }
};

export const saveKeys = (keys: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.filter(k => k.trim() !== '')));
};

let currentKeyIndex = 0;

export const getNextKey = (): string | null => {
  const keys = getStoredKeys();
  if (keys.length === 0) return null;
  
  // Basic rotation
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};
