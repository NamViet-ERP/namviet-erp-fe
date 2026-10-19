import { useState, useMemo } from 'react';
import { COMMON_ORIGIN_COUNTRIES } from '../../constants/materialCategoryLevels';
import { useMaterialOrigins } from '../../hooks/useMaterialOrigins';
import FormField from '../ui/FormField';

interface MaterialCountrySelectProps {
  value?: string | null;
  onChange: (value: string, defaultRegion?: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  placeholder?: string;
  preserveUnknownValue?: boolean;
  variant?: 'form' | 'hrm';
}

const CUSTOM_OPTION_KEY = '__CUSTOM_COUNTRY__';

export default function MaterialCountrySelect({
  value,
  onChange,
  error,
  required,
  className,
  selectClassName,
  placeholder = '-- Chọn nước sản xuất --',
  preserveUnknownValue = true,
  variant = 'form',
}: MaterialCountrySelectProps) {
  const { data: dbOrigins = [] } = useMaterialOrigins(true);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Map quốc gia -> nhóm nước mặc định
  const originRegionMap = useMemo(() => {
    const map = new Map<string, string>();
    dbOrigins.forEach(o => {
      if (o.region) map.set(o.name.trim().toLowerCase(), o.region.trim());
    });
    const defaults: Record<string, string> = {
      'việt nam': 'ĐNA',
      'thái lan': 'ĐNA',
      'malaysia': 'ĐNA',
      'singapore': 'ĐNA',
      'indonesia': 'ĐNA',
      'đức': 'G7',
      'nhật bản': 'G7',
      'mỹ': 'G7',
      'anh': 'G7',
      'ý': 'EU',
      'pháp': 'EU',
      'hàn quốc': 'Châu Á',
      'trung quốc': 'Châu Á',
      'đài loan': 'Châu Á',
      'ấn độ': 'Châu Á',
      'thụy điển': 'EU',
      'thụy sĩ': 'EU',
      'tây ban nha': 'EU',
      'nga': 'Khác',
      'thổ nhĩ kỳ': 'Khác',
    };
    Object.entries(defaults).forEach(([k, v]) => {
      if (!map.has(k)) map.set(k, v);
    });
    return map;
  }, [dbOrigins]);

  // Gộp danh sách quốc gia từ DB và danh sách chuẩn hóa
  const countries = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addCountry = (name?: string | null) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(trimmed);
      }
    };

    dbOrigins.forEach(o => addCountry(o.name));
    COMMON_ORIGIN_COUNTRIES.forEach(c => addCountry(c));

    return list;
  }, [dbOrigins]);

  const safeValue = (value ?? '').trim();
  const isValueInList = countries.some(c => c.toLowerCase() === safeValue.toLowerCase());
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
      const defaultRegion = originRegionMap.get(val.toLowerCase());
      onChange(val, defaultRegion);
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
        placeholder="Nhập tên quốc gia khác..."
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
      {countries.map(c => (
        <option key={c} value={c}>
          {c}
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
          Nước sản xuất
          {required && <span className="text-[var(--md-error)]"> *</span>}
        </label>
        {content}
        {error && <p className="hrm-field__error">{error}</p>}
      </div>
    );
  }

  return (
    <FormField label="Nước sản xuất" required={required} error={error} className={className}>
      {content}
    </FormField>
  );
}
