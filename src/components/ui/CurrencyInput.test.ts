import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CurrencyInput from './CurrencyInput';

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('CurrencyInput', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders default VNĐ suffix, inputMode="decimal", and clean inner input without .form-input', async () => {
    await act(async () => {
      root.render(
        createElement(CurrencyInput, {
          value: '1000000',
          onChange: vi.fn(),
          ariaLabel: 'Đơn giá',
        }),
      );
    });

    const group = container.querySelector('.currency-input-group');
    const input = container.querySelector('input')!;
    const suffix = container.querySelector('.currency-input-group__suffix');

    expect(group).not.toBeNull();
    expect(suffix?.textContent).toBe('VNĐ');
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.value).toBe('1.000.000');
    expect(input.className).toContain('currency-input-group__input');
    expect(input.className).not.toContain('form-input');
  });

  it('supports suffix={false}, custom suffix, allowDecimals={false}, compact, and hasError outer classes', async () => {
    await act(async () => {
      root.render(
        createElement(
          'div',
          null,
          createElement(CurrencyInput, {
            id: 'no-suffix',
            value: '50000',
            suffix: false,
            allowDecimals: false,
            onChange: vi.fn(),
          }),
          createElement(CurrencyInput, {
            id: 'compact-err',
            value: '20000.75',
            compact: true,
            hasError: true,
            suffix: 'đ',
            onChange: vi.fn(),
          }),
        ),
      );
    });

    const noSuffixInput = container.querySelector('#no-suffix') as HTMLInputElement;
    expect(noSuffixInput.closest('.currency-input-group')).toBeNull();
    expect(noSuffixInput.getAttribute('inputmode')).toBe('numeric');
    expect(noSuffixInput.value).toBe('50.000');

    const compactErrInput = container.querySelector('#compact-err') as HTMLInputElement;
    const compactErrGroup = compactErrInput.closest('.currency-input-group') as HTMLElement;
    expect(compactErrGroup).not.toBeNull();
    expect(compactErrGroup.className).toContain('currency-input-group--sm');
    expect(compactErrGroup.className).toContain('currency-input-group--error');
    expect(compactErrInput.className).not.toContain('form-input');
    expect(compactErrInput.value).toBe('20.000,75');
    expect(compactErrGroup.querySelector('.currency-input-group__suffix')?.textContent).toBe('đ');
  });

  it('hydrates canonical decimal external value and formats typed integers & decimals with Numpad dot', async () => {
    const onChangeSpy = vi.fn();

    function Controlled() {
      const [val, setVal] = useState('20000.75');
      return createElement(CurrencyInput, {
        value: val,
        onChange: (raw, numeric) => {
          onChangeSpy(raw, numeric);
          setVal(raw);
        },
        ariaLabel: 'Giá dự toán',
      });
    }

    await act(async () => {
      root.render(createElement(Controlled));
    });

    const input = container.querySelector('input')!;
    expect(input.value).toBe('20.000,75');

    await act(async () => {
      input.focus();
    });
    await act(async () => {
      setInputValue(input, '1000,5');
    });
    expect(input.value).toBe('1.000,5');
    expect(onChangeSpy).toHaveBeenLastCalledWith('1000.5', 1000.5);

    await act(async () => {
      setInputValue(input, '1000');
    });
    expect(input.value).toBe('1.000');

    await act(async () => {
      setInputValue(input, '1.000.');
    });
    expect(input.value).toBe('1.000,');

    await act(async () => {
      setInputValue(input, '1.000,25');
    });
    expect(input.value).toBe('1.000,25');
    expect(onChangeSpy).toHaveBeenLastCalledWith('1000.25', 1000.25);
  });

  it('preserves intermediate 0 -> 0, -> 0,5 while focused when parent ignores numeric === 0, and cleans up trailing comma on blur', async () => {
    const onChangeSpy = vi.fn();

    function ParentIgnoringZero() {
      const [val, setVal] = useState('');
      return createElement(CurrencyInput, {
        value: val,
        onChange: (raw, numeric) => {
          onChangeSpy(raw, numeric);
          setVal(numeric > 0 ? String(numeric) : '');
        },
        ariaLabel: 'Số tiền',
      });
    }

    await act(async () => {
      root.render(createElement(ParentIgnoringZero));
    });

    const input = container.querySelector('input')!;
    await act(async () => {
      input.focus();
    });

    await act(async () => {
      setInputValue(input, '0');
    });
    expect(input.value).toBe('0');

    await act(async () => {
      setInputValue(input, '0,');
    });
    expect(input.value).toBe('0,');

    await act(async () => {
      setInputValue(input, '0,5');
    });
    expect(input.value).toBe('0,5');
    expect(onChangeSpy).toHaveBeenLastCalledWith('0.5', 0.5);

    // Trailing comma cleanup + min clamp on blur
    await act(async () => {
      setInputValue(input, '1.000,');
    });
    expect(input.value).toBe('1.000,');

    await act(async () => {
      input.blur();
    });
    expect(input.value).toBe('1.000');
    expect(onChangeSpy).toHaveBeenLastCalledWith('1000', 1000);
  });
});
