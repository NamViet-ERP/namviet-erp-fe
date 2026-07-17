import { formatCurrencyInput, parseCurrencyInput } from '../../utils/currencyInput';

interface Props {
  value: string;
  onChange: (raw: string, numeric: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  suffix?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  className,
  placeholder = '',
  min = 0,
  suffix,
}: Props) {
  const display = value === '' ? '' : formatCurrencyInput(parseCurrencyInput(value));
  const inputClassName = suffix
    ? ['currency-input-group__input', 'tabular-nums', 'text-right', className].filter(Boolean).join(' ')
    : (className ?? 'form-input text-xs text-right input-no-spinner');

  const input = (
    <input
      type="text"
      inputMode="numeric"
      className={inputClassName}
      placeholder={placeholder}
      value={display}
      onChange={e => {
        const raw = e.target.value;
        const numeric = Math.max(min, parseCurrencyInput(raw));
        onChange(raw === '' ? '' : String(numeric), numeric);
      }}
      onBlur={() => {
        const numeric = parseCurrencyInput(value);
        onChange(numeric > 0 ? String(numeric) : '', numeric);
      }}
    />
  );

  if (!suffix) return input;

  return (
    <div className="currency-input-group">
      {input}
      <span className="currency-input-group__suffix" aria-hidden>
        {suffix}
      </span>
    </div>
  );
}
