import { useId } from 'react';
import FormField from './FormField';

export type SelectFieldOption =
  | string
  | { value: string; label: string; disabled?: boolean };

export interface SelectFieldProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly SelectFieldOption[];
  placeholder?: string;
  /** Keep displaying an existing value even when it is absent from active options. */
  preserveUnknownValue?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  variant?: 'form' | 'hrm';
  className?: string;
  selectClassName?: string;
  'aria-label'?: string;
}

function normalizeOption(opt: SelectFieldOption) {
  return typeof opt === 'string' ? { value: opt, label: opt, disabled: false } : opt;
}

/** Canonical labeled `<select>` control supporting standard form (`FormField`) and HRM (`.hrm-field`) layouts. */
export default function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  preserveUnknownValue = false,
  disabled = false,
  loading = false,
  required = false,
  error,
  hint,
  variant = 'form',
  className = '',
  selectClassName,
  'aria-label': ariaLabel,
}: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;

  const normalized = options.map(normalizeOption);
  const currentValue = value ?? '';
  const safeTrimmed = currentValue.trim();
  const showLegacy =
    preserveUnknownValue &&
    safeTrimmed !== '' &&
    !normalized.some(opt => opt.value === currentValue || opt.value === safeTrimmed);

  const defaultSelectClass =
    variant === 'hrm'
      ? `hrm-field-select${error ? ' hrm-field-input--error' : ''}`
      : `form-select w-full${error ? ' form-input--error' : ''}`;

  const resolvedSelectClass = selectClassName ?? defaultSelectClass;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const selectControl = (
    <select
      id={selectId}
      name={name}
      className={resolvedSelectClass}
      value={currentValue}
      disabled={disabled || loading}
      required={required}
      aria-label={ariaLabel}
      aria-invalid={error ? 'true' : undefined}
      aria-required={required || undefined}
      aria-busy={loading || undefined}
      aria-describedby={describedBy}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {normalized.map(opt => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
      {showLegacy ? <option value={safeTrimmed}>{safeTrimmed}</option> : null}
    </select>
  );

  if (variant === 'hrm') {
    return (
      <div className={['hrm-field', className].filter(Boolean).join(' ')}>
        {label ? (
          <label
            htmlFor={selectId}
            className={`hrm-field__label${required ? ' hrm-field__label--required' : ''}`}
          >
            {label}
          </label>
        ) : null}
        {selectControl}
        {hint && !error ? (
          <p id={hintId} className="erp-select-field__hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="hrm-field__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      required={required}
      error={error}
      className={className}
    >
      {selectControl}
      {hint && !error ? (
        <p id={hintId} className="erp-select-field__hint">
          {hint}
        </p>
      ) : null}
    </FormField>
  );
}
