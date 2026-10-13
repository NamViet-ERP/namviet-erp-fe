import { MATERIAL_SELECT_PLACEHOLDER } from '../../constants/materialCategoryLevels';
import FormField from '../ui/FormField';
import { useMaterialUnits } from '../../hooks/useMaterialUnits';

interface MaterialUnitSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  /** Giữ hiển thị đơn vị cũ khi không còn trong danh mục active (chế độ sửa). */
  preserveUnknownValue?: boolean;
  variant?: 'form' | 'hrm';
}

export default function MaterialUnitSelect({
  value,
  onChange,
  error,
  required,
  className,
  selectClassName,
  preserveUnknownValue = false,
  variant = 'form',
}: MaterialUnitSelectProps) {
  const { data: units = [], isLoading } = useMaterialUnits(true);
  const safeValue = (value ?? '').trim();
  const showLegacy =
    preserveUnknownValue && safeValue !== '' && !units.some(u => u.name === safeValue);

  const resolvedSelectClass =
    selectClassName ??
    (variant === 'hrm'
      ? `hrm-field-select${error ? ' hrm-field-input--error' : ''}`
      : 'form-select w-full text-sm');

  const select = (
    <select
      className={resolvedSelectClass}
      value={value ?? ''}
      disabled={isLoading}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{MATERIAL_SELECT_PLACEHOLDER}</option>
      {units.map(u => (
        <option key={u.id} value={u.name}>{u.name}</option>
      ))}
      {showLegacy && <option value={safeValue}>{safeValue}</option>}
    </select>
  );

  if (variant === 'hrm') {
    return (
      <div className={['hrm-field', className].filter(Boolean).join(' ')}>
        <label className="hrm-field__label">
          Đơn vị tính
          {required && <span className="text-[var(--md-error)]"> *</span>}
        </label>
        {select}
        {error && <p className="hrm-field__error">{error}</p>}
      </div>
    );
  }

  return (
    <FormField label="Đơn vị tính" required={required} error={error} className={className}>
      {select}
    </FormField>
  );
}
