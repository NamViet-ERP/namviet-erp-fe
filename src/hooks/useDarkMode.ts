import { useCallback, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const STORAGE_KEY = 'nv-dark';
const THEME_ANIM_MS = 450;

function readDarkPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    /* ignore */
  }
  return false;
}

export function applyDarkMode(dark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  try {
    localStorage.setItem(STORAGE_KEY, String(dark));
  } catch {
    /* ignore */
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canUseViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

function runThemeTransition(commit: () => void): void {
  const root = document.documentElement;

  if (canUseViewTransition() && !prefersReducedMotion()) {
    document.startViewTransition(commit);
    return;
  }

  root.classList.add('nv-theme-animating');
  commit();
  window.setTimeout(() => {
    root.classList.remove('nv-theme-animating');
  }, THEME_ANIM_MS);
}

export function useDarkMode() {
  const [dark, setDarkState] = useState<boolean>(readDarkPreference);

  useLayoutEffect(() => {
    applyDarkMode(dark);
  }, [dark]);

  const setDark = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setDarkState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      return next;
    });
  }, []);

  const toggleDark = useCallback(() => {
    const next = !dark;
    runThemeTransition(() => {
      flushSync(() => {
        setDarkState(next);
      });
    });
  }, [dark]);

  return { dark, setDark, toggleDark };
}
