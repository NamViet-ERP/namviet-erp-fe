import { act, createElement, Fragment } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import HrmSelect from '../hr/HrmSelect';
import HrmDatePicker from '../hr/HrmDatePicker';

describe('dialog focus stack', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    // jsdom has no layout; expose rendered controls to the focus manager.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{} as DOMRect] as unknown as DOMRectList);
    vi.stubGlobal('scrollIntoView', vi.fn());
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function key(target: Element, value: string, shiftKey = false) {
    const event = new KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true });
    await act(() => target.dispatchEvent(event));
    return event;
  }

  it('keeps Tab focus inside a confirmation opened over a parent modal (review regression)', async () => {
    await act(() => root.render(createElement(Fragment, null,
      createElement(Modal, { isOpen: true, onClose: vi.fn(), title: 'Edit project', children: createElement('input') }),
      createElement(ConfirmDialog, {
        isOpen: true, onClose: vi.fn(), onConfirm: vi.fn(), title: 'Delete project', message: 'Confirm deletion',
      }),
    )));
    const confirm = document.querySelector('[role="alertdialog"]')!;
    const button = confirm.querySelector('button')!;
    button.focus();
    await key(button, 'Tab');
    expect(confirm.contains(document.activeElement)).toBe(true);
  });

  it.each(['modal', 'confirmation'])('traps only the top %s and restores each opener after Escape', async kind => {
    let parentOpen = false;
    let childOpen = false;
    let revision = 0;
    const parentClosed = vi.fn();
    const childClosed = vi.fn(() => {
      childOpen = false;
      render();
    });
    const render = () => root.render(createElement(Fragment, null,
      createElement('button', { id: 'open-parent', onClick: () => { parentOpen = true; render(); } }, 'Open parent'),
      createElement(Modal, {
        isOpen: parentOpen, title: 'Parent',
        // Deliberately changes identity while the child is open.
        onClose: () => { parentClosed(revision); parentOpen = false; render(); },
        children: createElement('button', { id: 'open-child', onClick: () => { childOpen = true; render(); } }, 'Open child'),
      }),
      kind === 'confirmation'
        ? createElement(ConfirmDialog, {
          isOpen: childOpen, title: 'Child', message: 'Confirm', onClose: childClosed, onConfirm: vi.fn(),
        })
        : createElement(Modal, {
          isOpen: childOpen, title: 'Child', onClose: childClosed,
          children: createElement('button', null, 'Last child control'),
        }),
    ));

    await act(render);
    const opener = document.getElementById('open-parent')!;
    opener.focus();
    await act(() => opener.click());
    const childOpener = document.getElementById('open-child')!;
    childOpener.focus();
    await act(() => childOpener.click());
    const dialogs = document.querySelectorAll<HTMLElement>('[data-modal-focus]');
    const child = dialogs[dialogs.length - 1];
    const buttons = child.querySelectorAll('button');
    expect(document.activeElement).toBe(buttons[0]);
    expect((await key(buttons[0], 'Tab', true)).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    await key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe(buttons[0]);

    revision = 2;
    await act(render);
    await key(document.activeElement!, 'Escape');
    expect(childClosed).toHaveBeenCalledTimes(1);
    expect(parentClosed).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(childOpener);
    await key(childOpener, 'Escape');
    expect(parentClosed).toHaveBeenCalledExactlyOnceWith(2);
    expect(document.activeElement).toBe(opener);
  });

  it('focuses the dialog itself and traps Tab when all confirmation actions are disabled', async () => {
    await act(() => root.render(createElement(ConfirmDialog, {
      isOpen: true, title: 'Saving', message: 'Please wait', onClose: vi.fn(), onConfirm: vi.fn(), isLoading: true,
    })));
    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(document.activeElement).toBe(dialog);
    expect((await key(dialog, 'Tab')).defaultPrevented).toBe(true);
    expect((await key(dialog, 'Tab', true)).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialog);
  });

  it('does not steal focus when a parent closes first and restores the surviving child to the page', async () => {
    const render = (parentOpen: boolean, childOpen: boolean) => root.render(createElement(Fragment, null,
      createElement('button', { id: 'page-opener' }, 'Open editor'),
      createElement(Modal, {
        isOpen: parentOpen, title: 'Parent', onClose: vi.fn(), children: createElement('button', { id: 'child-opener' }, 'Delete'),
      }),
      createElement(ConfirmDialog, {
        isOpen: childOpen, title: 'Delete', message: 'Confirm', onClose: vi.fn(), onConfirm: vi.fn(),
      }),
    ));
    await act(() => render(false, false));
    const opener = document.getElementById('page-opener')!;
    opener.focus();
    await act(() => render(true, false));
    document.getElementById('child-opener')!.focus();
    await act(() => render(true, true));
    const focusedAction = document.activeElement;
    await act(() => render(false, true));
    expect(document.activeElement).toBe(focusedAction);
    await act(() => render(false, false));
    expect(document.activeElement).toBe(opener);
  });

  it('gives simultaneous confirmations distinct accessible title and description references', async () => {
    await act(() => root.render(createElement(Fragment, null, ...['First', 'Second'].map(title =>
      createElement(ConfirmDialog, {
        key: title, isOpen: true, title, message: `${title} message`, onClose: vi.fn(), onConfirm: vi.fn(),
      }),
    ))));
    const dialogs = Array.from(document.querySelectorAll('[role="alertdialog"]'));
    const ids = dialogs.flatMap(dialog => ['aria-labelledby', 'aria-describedby'].map(attribute => dialog.getAttribute(attribute)!));
    expect(new Set(ids).size).toBe(4);
    expect(ids.map(id => document.getElementById(id)?.textContent)).toEqual(['First', 'First message', 'Second', 'Second message']);
  });

  it('lets a portaled select consume Escape, select with Enter and then close its modal on Escape', async () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    await act(() => root.render(createElement(Modal, {
      isOpen: true, title: 'Editor', onClose,
      children: createElement(HrmSelect, { value: '', options: ['HR A', 'HR B'], allowEmpty: false, onChange }),
    })));
    const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!;
    trigger.focus();
    await key(trigger, 'Enter');
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    await key(trigger, 'Escape');
    expect(onClose).not.toHaveBeenCalled();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await key(trigger, 'Enter');
    await key(trigger, 'ArrowDown');
    await key(trigger, 'Enter');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('HR B');
    expect(document.activeElement).toBe(trigger);
    await key(trigger, 'Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps a portaled date picker in the parent Tab sequence and lets it consume Escape', async () => {
    const onClose = vi.fn();
    await act(() => root.render(createElement(Modal, {
      isOpen: true, title: 'Editor', onClose,
      children: createElement(Fragment, null,
        createElement(HrmDatePicker, { id: 'date-trigger', value: '2026-10-29', onChange: vi.fn() }),
        createElement('button', { id: 'after-date' }, 'Next field'),
      ),
    })));
    const trigger = document.getElementById('date-trigger')!;
    trigger.focus();
    await act(() => trigger.click());
    const popup = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    const input = popup.querySelector('input')!;
    expect(document.activeElement).toBe(input);
    expect((await key(input, 'Tab')).defaultPrevented).toBe(false);
    await key(input, 'Tab', true);
    expect(document.activeElement).toBe(trigger);
    const actions = popup.querySelectorAll('button');
    const last = actions[actions.length - 1];
    last.focus();
    await key(last, 'Tab');
    expect(document.activeElement).toBe(document.getElementById('after-date'));
    input.focus();
    await key(input, 'Escape');
    expect(onClose).not.toHaveBeenCalled();
    expect(document.getElementById(popup.id)).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await key(trigger, 'Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
