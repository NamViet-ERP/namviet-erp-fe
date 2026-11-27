import type { KeyboardEvent } from 'react';

const INTERACTIVE_CHILD_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="switch"], [contenteditable="true"]';

/**
 * Keyboard handler for clickable `<tr>` rows that keeps native `<tr>` semantics intact
 * while ignoring key presses originating inside nested interactive controls.
 */
export function handleInteractiveRowKeyDown(
  e: KeyboardEvent<HTMLElement>,
  onActivate: () => void,
): void {
  const target = e.target as Element | null;
  const closestInteractive =
    target && typeof target.closest === 'function'
      ? target.closest(INTERACTIVE_CHILD_SELECTOR)
      : null;

  if (closestInteractive && closestInteractive !== e.currentTarget) return;

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onActivate();
  }
}

/**
 * Returns keyboard accessibility props (`tabIndex` + `onKeyDown` + optional `aria-label`)
 * for interactive `<tr>` rows without overriding native table row semantics.
 */
export function getInteractiveRowProps(onActivate: () => void, ariaLabel?: string) {
  return {
    tabIndex: 0 as const,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => handleInteractiveRowKeyDown(e, onActivate),
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
  };
}
