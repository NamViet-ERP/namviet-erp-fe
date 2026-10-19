import { useState, useMemo } from 'react';
import { useMaterialBrands } from '../../hooks/useMaterialBrands';
import FormField from '../ui/FormField';

interface MaterialBrandSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  placeholder?: string;
  preserveUnknownValue?: boolean;
  variant?: 'form' | 'hrm';
}

const CUSTOM_OPTION_KEY = '__CUSTOM_BRAND__';

const DEFAULT_INDUSTRIAL_BRANDS = [
  'Hòa Phát',
  'Posco',
  'Wilo',
  'Ebara',
  'System Fan',
  'SeAH',
  'Hyundai',
  'Schneider',
  'Mitsubishi',
  'Siemens',
  'Grundfos',
  'Teco',
  'Tsurumi',
];

export default function MaterialBrandSelect({
  value,
  onChange,
  error,
  required,
  className,
  selectClassName,
  placeholder = '-- Chọn hãng / nhãn hiệu --',
  preserveUnknownValue = true,
  variant = 'form',
}: MaterialBrandSelectProps) {
  const { data: dbBrands = [] } = useMaterialBrands(true);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Gộp danh sách hãng từ DB và danh sách chuẩn hóa
  const brands = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addBrand = (name?: string | null) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(trimmed);
      }
    };

    dbBrands.forEach(b => addBrand(b.name));
    DEFAULT_INDUSTRIAL_BRANDS.forEach(b => addBrand(b));

    return list.sort((a, b) => a.localeCompare(b, 'vi'));
  }, [dbBrands]);

  const safeValue = (value ?? '').trim();
  const isValueInList = brands.some(b => b.toLowerCase() === safeValue.toLowerCase());
  const showLegacy = preserveUnknownValue && safeValue !== '' && !isValueInList;

  const resolvedSelectClass =
    selectClassName ??
    (variant === 'hrm'
      ? `hrm-field-select${error ? ' hrm-field-input--error' : ''}`
      : 'form-input w-full text-sm');

  const resolvedInputClass =
    variant === 'hrm'
      ? `hrm-field-input${error ? ' hrm-field-input--error' : ''}`
      : 'form-input w-full text-sm';

  const handleSelectChange = (val: string) => {
    if (val === CUSTOM_OPTION_KEY) {
      setIsCustomMode(true);
      onChange('');
    } else {
      setIsCustomMode(false);
      onChange(val);
    }
  };

  const handleBackToSelect = () => {
    setIsCustomMode(false);
    onChange('');
  };

  const content = isCustomMode ? (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        className={resolvedInputClass}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Nhập tên hãng/nhãn hiệu khác..."
        autoFocus
      />
      <button
        type="button"
        className="btn btn-outline btn-xs px-2 whitespace-nowrap text-xs text-slate-600 hover:text-slate-900 border-slate-300"
        onClick={handleBackToSelect}
        title="Quay lại danh sách chọn"
      >
        Chọn lại
      </button>
    </div>
  ) : (
    <select
      className={resolvedSelectClass}
      value={safeValue}
      onChange={e => handleSelectChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {brands.map(b => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
      {showLegacy && (
        <option key={safeValue} value={safeValue}>
          {safeValue}
        </option>
      )}
      <option value={CUSTOM_OPTION_KEY}>Khác (Nhập tay...)</option>
    </select>
  );

  if (variant === 'hrm') {
    return (
      <div className={['hrm-field', className].filter(Boolean).join(' ')}>
        <label className="hrm-field__label">
          Hãng / Nhãn hiệu
          {required && <span className="text-[var(--md-error)]"> *</span>}
        </label>
        {content}
        {error && <p className="hrm-field__error">{error}</p>}
      </div>
    );
  }

  return (
    <FormField label="Nhãn hiệu / Hãng" required={required} error={error} className={className}>
      {content}
    </FormField>
  );
}
