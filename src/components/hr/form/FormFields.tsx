import type { ReactNode } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import HrmSelect from '../HrmSelect';

export function FormTextField({
  label,
  registration,
  error,
  type = 'text',
  placeholder,
  className = '',
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`hrm-field-input${error ? ' hrm-field-input--error' : ''}${className ? ` ${className}` : ''}`}
        {...registration}
      />
      {error?.message && <p className="hrm-field__error">{error.message}</p>}
    </div>
  );
}

export function FormSelectField({
  label,
  value,
  registration,
  error,
  options,
  placeholder = '-- Chọn --',
  className = '',
}: {
  label: string;
  value: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  options: readonly string[] | string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      <HrmSelect
        className={`h-11${className ? ` ${className}` : ''}`}
        value={value}
        onChange={v => registration.onChange({ target: { name: registration.name, value: v } })}
        onBlur={registration.onBlur}
        name={registration.name}
        options={options}
        placeholder={placeholder}
        error={Boolean(error)}
      />
      {error?.message && <p className="hrm-field__error">{error.message}</p>}
    </div>
  );
}

export function FormControlledSelect({
  label,
  value,
  onChange,
  error,
  options,
  placeholder = '-- Chọn --',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  options: readonly string[] | string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      <HrmSelect
        className="h-11"
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        error={Boolean(error)}
      />
      {error?.message && <p className="hrm-field__error">{error.message}</p>}
    </div>
  );
}

export function FormRadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly T[] | T[];
  value?: T;
  onChange: (value: T) => void;
  error?: FieldError;
}) {
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      <div className="hrm-radio-row">
        {options.map(option => (
          <label key={option}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
      {error?.message && <p className="hrm-field__error">{error.message}</p>}
    </div>
  );
}

export function FormFieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="hrm-field__error">{message}</p>;
}

export function FormFieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      {children}
    </div>
  );
}
