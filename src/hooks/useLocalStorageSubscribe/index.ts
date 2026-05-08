import { useEffect } from "react";

interface LocalStorageChangeEvent {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  storageArea: Storage;
}

export function useLocalStorageSubscribe(
  callback: (event: LocalStorageChangeEvent) => void
): void {
  useEffect(() => {
    // --- Handle changes from other tabs ---
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage) {
        callback({
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          storageArea: event.storageArea!,
        });
      }
    };
    window.addEventListener("storage", handleStorage);

    // --- Capture same-tab changes (storage event doesn’t fire here) ---
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    const triggerChange = (key: string | null, oldValue: string | null, newValue: string | null) => {
      callback({ key, oldValue, newValue, storageArea: localStorage });
    };

    localStorage.setItem = function (key: string, value: string): void {
      const oldValue = localStorage.getItem(key);
      originalSetItem.apply(this, [key, value]);
      triggerChange(key, oldValue, value);
    };

    localStorage.removeItem = function (key: string): void {
      const oldValue = localStorage.getItem(key);
      originalRemoveItem.apply(this, [key]);
      triggerChange(key, oldValue, null);
    };

    localStorage.clear = function (): void {
      originalClear.apply(this);
      triggerChange(null, null, null);
    };

    // --- Cleanup ---
    return () => {
      window.removeEventListener("storage", handleStorage);
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, [callback]);
}
