import { useRef, useState } from 'react';
import {
  formatCurrencyDraft,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currencyInput';

interface Props {
  id?: string;
  value: string;
  onChange: (raw: string, numeric: number) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  min?: number;
  max?: number;
  suffix?: string | false;
  allowDecimals?: boolean;
  maxDecimals?: number;
  compact?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

export default function CurrencyInput({
  id,
  value,
  onChange,
  className,
  placeholder = '',
  ariaLabel,
  min = 0,
  max,
  suffix = 'VNĐ',
  allowDecimals = true,
  maxDecimals = 2,
  compact = false,
  hasError = false,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const effectiveMaxDecimals = allowDecimals ? Math.max(0, maxDecimals) : 0;
  const showSuffix = suffix !== false && suffix !== '';

  const externalDisplay =
    value === '' ? '' : formatCurrencyInput(parseCurrencyInput(value), effectiveMaxDecimals);
  const displayed = isFocused ? draft : externalDisplay;

  const inputClassName = showSuffix
    ? 'currency-input-group__input tabular-nums text-right'
    : (className ?? 'form-input text-xs text-right input-no-spinner');

  const input = (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      disabled={disabled}
      className={inputClassName}
      placeholder={placeholder}
      value={displayed}
      onFocus={() => {
        setDraft(externalDisplay);
        setIsFocused(true);
      }}
      onChange={e => {
        const el = e.currentTarget;
        const rawInput = e.target.value;
        const selStart = el.selectionStart ?? rawInput.length;
        const beforeCaret = rawInput.slice(0, selStart);

        const next = formatCurrencyDraft(rawInput, displayed, {
          allowDecimals,
          maxDecimals: effectiveMaxDecimals,
          max,
        });

        const convertedDotToComma =
          allowDecimals
          && !displayed.includes(',')
          && rawInput.length === displayed.length + 1
          && selStart > 0
          && rawInput[selStart - 1] === '.'
          && next.display.includes(',');

        const sigCount =
          (beforeCaret.match(/[\d,]/g)?.length ?? 0) + (convertedDotToComma ? 1 : 0);

        let nextPos = 0;
        if (next.display === '0,' && (beforeCaret === ',' || (allowDecimals && beforeCaret === '.'))) {
          nextPos = 2;
        } else {
          let seen = 0;
          while (nextPos < next.display.length && seen < sigCount) {
            if (/[\d,]/.test(next.display[nextPos])) seen += 1;
            nextPos += 1;
          }
        }

        setDraft(next.display);

        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (node && document.activeElement === node) {
            node.setSelectionRange(nextPos, nextPos);
          }
        });

        onChange(next.canonical, next.numeric);
      }}
      onBlur={() => {
        const source = isFocused ? draft : value;
        const parsed = parseCurrencyInput(source);
        const factor = 10 ** effectiveMaxDecimals;
        let nextNum = Math.max(min, parsed);
        if (max != null) nextNum = Math.min(max, nextNum);
        nextNum = Math.round(nextNum * factor) / factor;

        setIsFocused(false);
        setDraft('');
        onChange(nextNum > 0 ? String(nextNum) : '', nextNum);
      }}
    />
  );

  if (!showSuffix) return input;

  const groupClassName = [
    'currency-input-group',
    compact && 'currency-input-group--sm',
    hasError && 'currency-input-group--error',
    disabled && 'opacity-60 pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={groupClassName}>
      {input}
      <span className="currency-input-group__suffix" aria-hidden>
        {suffix}
      </span>
    </div>
  );
}
