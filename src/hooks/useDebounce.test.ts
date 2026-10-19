import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useDebounce } from './useDebounce';

function TestComponent({ value, delayMs }: { value: string; delayMs?: number }) {
  const debounced = useDebounce(value, delayMs);
  return React.createElement('div', { 'data-testid': 'result' }, debounced);
}

describe('useDebounce hook', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('initially returns the initial value', () => {
    const root = createRoot(container);
    act(() => {
      root.render(React.createElement(TestComponent, { value: 'hello', delayMs: 300 }));
    });

    const el = container.querySelector('[data-testid="result"]');
    expect(el?.textContent).toBe('hello');
  });

  it('delays updating until after delayMs has passed', () => {
    const root = createRoot(container);
    act(() => {
      root.render(React.createElement(TestComponent, { value: 'first', delayMs: 300 }));
    });

    const el = container.querySelector('[data-testid="result"]');
    expect(el?.textContent).toBe('first');

    act(() => {
      root.render(React.createElement(TestComponent, { value: 'second', delayMs: 300 }));
    });

    // Before timer fires, should still be 'first'
    expect(el?.textContent).toBe('first');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // After timer fires, should update to 'second'
    expect(el?.textContent).toBe('second');
  });
});
