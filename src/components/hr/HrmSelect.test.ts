import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HrmSelect from './HrmSelect';

describe('HrmSelect keyboard selection', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    Element.prototype.scrollIntoView = vi.fn();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('commits the highlighted HR with Enter and returns focus to the trigger', async () => {
    const onChange = vi.fn();
    await act(() => root.render(createElement(HrmSelect, { value: '', options: ['HR A', 'HR B'], onChange })));
    const trigger = container.querySelector('button')!;
    trigger.focus();
    for (const key of ['Enter', 'ArrowDown', 'ArrowDown', 'Enter']) {
      await act(() => trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
    }
    expect(onChange).toHaveBeenCalledExactlyOnceWith('HR B');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape dismisses the list without committing or closing its containing modal', async () => {
    const onChange = vi.fn();
    const outerKeyDown = vi.fn();
    container.addEventListener('keydown', outerKeyDown);
    await act(() => root.render(createElement(HrmSelect, { value: 'HR A', options: ['HR A', 'HR B'], onChange })));
    const trigger = container.querySelector('button')!;
    await act(() => trigger.click());
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    await act(() => trigger.dispatchEvent(event));
    expect(onChange).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
