import { formatCurrencyInput, parseCurrencyInput } from '../../utils/currencyInput';

interface Props {
  value: string;
  onChange: (raw: string, numeric: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  className,
  placeholder = '',
  min = 0,
  max,
  suffix,
  disabled = false,
}: Props) {
  const display = value === '' ? '' : formatCurrencyInput(parseCurrencyInput(value));
  const inputClassName = suffix
    ? ['currency-input-group__input', 'tabular-nums', 'text-right', className].filter(Boolean).join(' ')
    : (className ?? 'form-input text-xs text-right input-no-spinner');

  const clamp = (n: number) => {
    let next = Math.max(min, n);
    if (max != null) next = Math.min(max, next);
    return next;
  };

  const input = (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      className={inputClassName}
      placeholder={placeholder}
      value={display}
      onChange={e => {
        const raw = e.target.value;
        const numeric = clamp(parseCurrencyInput(raw));
        onChange(raw === '' ? '' : String(numeric), numeric);
      }}
      onBlur={() => {
        const numeric = clamp(parseCurrencyInput(value));
        onChange(numeric > 0 ? String(numeric) : '', numeric);
      }}
    />
  );

  if (!suffix) return input;

  return (
    <div className={`currency-input-group${disabled ? ' opacity-60 pointer-events-none' : ''}`}>
      {input}
      <span className="currency-input-group__suffix" aria-hidden>
        {suffix}
      </span>
    </div>
  );
}
