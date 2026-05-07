import { useCallback, useEffect, useState } from 'react';

export const useLocalStorage = <T>(key: string, initial: T) => {
  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  }, [key, initial]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode — ignore */
    }
  }, [key, value]);

  const remove = useCallback(() => {
    setValue(initial);
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  }, [key, initial]);

  return { value, setValue, remove } as const;
};
