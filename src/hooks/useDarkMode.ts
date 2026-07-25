import { useLayoutEffect } from 'react';

const STORAGE_KEY = 'nv-dark';

/** App is light-mode only — strip any leftover dark preference. */
export function applyDarkMode(_dark?: boolean): void {
  const root = document.documentElement;
  root.classList.remove('dark');
  root.style.colorScheme = 'light';
  try {
    localStorage.setItem(STORAGE_KEY, 'false');
  } catch {
    /* ignore */
  }
}

export function useDarkMode() {
  useLayoutEffect(() => {
    applyDarkMode(false);
  }, []);

  return {
    dark: false,
    setDark: (_value?: boolean | ((prev: boolean) => boolean)) => {},
    toggleDark: () => {},
  };
}
