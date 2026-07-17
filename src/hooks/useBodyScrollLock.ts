import { useEffect } from 'react';

/**
 * Locks document scroll while any dialog is open.
 * Reference-counted so nested modals don't unlock early.
 */
let lockCount = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedBodyPaddingRight = '';

function applyLock() {
  const body = document.body;
  const html = document.documentElement;
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  savedBodyOverflow = body.style.overflow;
  savedHtmlOverflow = html.style.overflow;
  savedBodyPaddingRight = body.style.paddingRight;

  body.style.overflow = 'hidden';
  html.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
  html.classList.add('modal-scroll-locked');
}

function releaseLock() {
  const body = document.body;
  const html = document.documentElement;
  body.style.overflow = savedBodyOverflow;
  html.style.overflow = savedHtmlOverflow;
  body.style.paddingRight = savedBodyPaddingRight;
  html.classList.remove('modal-scroll-locked');
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) applyLock();
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
}
