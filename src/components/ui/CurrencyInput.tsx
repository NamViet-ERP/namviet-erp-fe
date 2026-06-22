import { formatCurrencyInput, parseCurrencyInput } from '../../utils/currencyInput';

interface Props {
  value: string;
  onChange: (raw: string, numeric: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
}

export default function CurrencyInput({
  value,
  onChange,
  className = 'form-input text-xs text-right input-no-spinner',
  placeholder = '0',
  min = 0,
}: Props) {
  const display = value === '' ? '' : formatCurrencyInput(parseCurrencyInput(value));

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
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
}
