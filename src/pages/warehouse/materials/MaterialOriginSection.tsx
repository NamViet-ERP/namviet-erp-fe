import { useMemo } from 'react';
import SelectField from '../../../components/ui/SelectField';
import MaterialBrandSelect from '../../../components/warehouse/MaterialBrandSelect';
import MaterialCountrySelect from '../../../components/warehouse/MaterialCountrySelect';
import { useMaterialRegions } from '../../../hooks/useMaterialRegions';
import { formatOriginString, REGION_OPTIONS } from '../../../constants/materialCategoryLevels';

export interface MaterialOriginSectionProps {
  brand: string;
  country: string;
  region: string;
  onChange: (next: { brand: string; country: string; region: string; composed: string }) => void;
  variant?: 'form' | 'hrm';
  title?: string;
  className?: string;
  /** When true, only fills region from country default if region is currently empty. */
  preserveExistingRegion?: boolean;
}

export default function MaterialOriginSection({
  brand,
  country,
  region,
  onChange,
  variant = 'form',
  title = 'Xuất xứ & Nhãn hiệu',
  className = '',
  preserveExistingRegion = false,
}: MaterialOriginSectionProps) {
  const { data: dbRegions = [] } = useMaterialRegions(true);

  const regionOptions = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const add = (name?: string | null) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(trimmed);
      }
    };
    dbRegions.forEach(item => {
      add(typeof item === 'string' ? item : item?.name);
    });
    REGION_OPTIONS.forEach(r => add(r));
    return list;
  }, [dbRegions]);

  const composed = formatOriginString(brand, country, region);

  const emit = (nextBrand: string, nextCountry: string, nextRegion: string) => {
    onChange({
      brand: nextBrand,
      country: nextCountry,
      region: nextRegion,
      composed: formatOriginString(nextBrand, nextCountry, nextRegion),
    });
  };

  return (
    <div className={['mat-form-card', className].filter(Boolean).join(' ')}>
      <div className="mat-form-card__header">
        <span className="mat-form-card__title">{title}</span>
        {composed ? (
          <span className="mat-form-card__preview" title={composed}>
            Chuỗi: {composed}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <MaterialBrandSelect
          value={brand}
          onChange={nextBrand => emit(nextBrand, country, region)}
          variant={variant}
        />
        <MaterialCountrySelect
          value={country}
          onChange={(nextCountry, defaultRegion) => {
            const nextRegion = defaultRegion
              ? (preserveExistingRegion ? region || defaultRegion : defaultRegion)
              : region;
            emit(brand, nextCountry, nextRegion);
          }}
          variant={variant}
        />
        <SelectField
          label="Nhóm nước"
          value={region}
          onChange={nextRegion => emit(brand, country, nextRegion)}
          options={regionOptions}
          placeholder="-- Chọn nhóm nước --"
          preserveUnknownValue
          variant={variant}
        />
      </div>
    </div>
  );
}
