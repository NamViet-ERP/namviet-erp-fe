import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { getInteractiveRowProps, handleInteractiveRowKeyDown } from './interactiveRow';

function makeKeyboardEvent(
  key: string,
  target: Element,
  currentTarget: Element,
): KeyboardEvent<HTMLElement> {
  const preventDefault = vi.fn();
  return {
    key,
    target,
    currentTarget,
    preventDefault,
  } as unknown as KeyboardEvent<HTMLElement>;
}

describe('interactiveRow keyboard accessibility helper', () => {
  it('activates row and prevents default on Enter and Space when focused on row or non-interactive cell', () => {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = 'PO-2026-0142';
    row.appendChild(cell);

    const onActivate = vi.fn();
    const enterEvent = makeKeyboardEvent('Enter', row, row);
    handleInteractiveRowKeyDown(enterEvent, onActivate);
    expect(enterEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(1);

    const spaceEvent = makeKeyboardEvent(' ', cell, row);
    handleInteractiveRowKeyDown(spaceEvent, onActivate);
    expect(spaceEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('ignores non-activation keys such as Escape, Tab, and ArrowDown', () => {
    const row = document.createElement('tr');
    const onActivate = vi.fn();

    for (const key of ['Escape', 'Tab', 'ArrowDown']) {
      const event = makeKeyboardEvent(key, row, row);
      handleInteractiveRowKeyDown(event, onActivate);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('ignores Enter and Space when event originates from nested interactive controls', () => {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    row.appendChild(cell);

    const button = document.createElement('button');
    const buttonIcon = document.createElement('span');
    button.appendChild(buttonIcon);

    const link = document.createElement('a');
    link.href = '/purchasing/orders/PO-2026-0142';

    const input = document.createElement('input');
    const select = document.createElement('select');
    const textarea = document.createElement('textarea');

    const roleButton = document.createElement('div');
    roleButton.setAttribute('role', 'button');

    const roleSwitch = document.createElement('button');
    roleSwitch.setAttribute('role', 'switch');

    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');

    for (const nested of [button, buttonIcon, link, input, select, textarea, roleButton, roleSwitch, editable]) {
      if (!nested.parentElement) {
        cell.appendChild(nested);
      }
      const onActivate = vi.fn();

      for (const key of ['Enter', ' ']) {
        const event = makeKeyboardEvent(key, nested, row);
        handleInteractiveRowKeyDown(event, onActivate);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
      expect(onActivate).not.toHaveBeenCalled();
    }
  });

  it('builds tabIndex=0, onKeyDown, and optional aria-label without overriding tr role', () => {
    const onActivate = vi.fn();

    const withoutLabel = getInteractiveRowProps(onActivate);
    expect(withoutLabel.tabIndex).toBe(0);
    expect('role' in withoutLabel).toBe(false);
    expect('aria-label' in withoutLabel).toBe(false);

    const withLabel = getInteractiveRowProps(onActivate, 'Xem chi tiết đơn hàng PO-2026-0142');
    expect(withLabel.tabIndex).toBe(0);
    expect(withLabel['aria-label']).toBe('Xem chi tiết đơn hàng PO-2026-0142');
    expect('role' in withLabel).toBe(false);

    const row = document.createElement('tr');
    const event = makeKeyboardEvent('Enter', row, row);
    withLabel.onKeyDown(event);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
