import { describe, expect, it, afterEach } from 'vitest';
import { computeFloatingMenuLayout } from './floatingMenuPlacement';

function mockRect(top: number, bottom: number, left = 100, width = 280): DOMRect {
  return {
    top,
    bottom,
    left,
    right: left + width,
    width,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('computeFloatingMenuLayout', () => {
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('opens downward when there is room below', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const layout = computeFloatingMenuLayout(mockRect(200, 240), 280, 280);
    expect(layout.placement).toBe('bottom');
    expect(layout.top).toBe(244);
  });

  it('opens upward only when below is tight and above has more space', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    const layout = computeFloatingMenuLayout(mockRect(420, 460), 280, 280);
    expect(layout.placement).toBe('top');
  });
});
