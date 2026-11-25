import FormField from '../../../components/ui/FormField';
import {
  MATERIAL_CATEGORY_LEVELS,
  MATERIAL_SELECT_PLACEHOLDER,
} from '../../../constants/materialCategoryLevels';
import type { MaterialCategoryApiDto } from '../../../types/wms';
import { isRequiredCategoryLevel, type CategorySelection } from './materialFormHelpers';

export interface MaterialCategoryCascadeFieldsProps {
  selection: CategorySelection;
  optionsByLevel: MaterialCategoryApiDto[][];
  isLoading: boolean;
  errors: Record<string, string>;
  onSelectLevel: (levelIndex: number, value: number | '') => void;
  variant?: 'form' | 'hrm';
}

export default function MaterialCategoryCascadeFields({
  selection,
  optionsByLevel,
  isLoading,
  errors,
  onSelectLevel,
  variant = 'form',
}: MaterialCategoryCascadeFieldsProps) {
  const gridClass = variant === 'hrm'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3';

  return (
    <div className={gridClass}>
      {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => {
        const disabled = isLoading || (idx > 0 && selection[idx - 1] === '');
        const options = optionsByLevel[idx]?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED') ?? [];
        const error = errors[`level${lvl.level}`];
        const required = isRequiredCategoryLevel(lvl.level);

        const selectEl = (
          <select
            className={variant === 'hrm' ? 'hrm-field-select' : 'form-input form-input-md w-full'}
            disabled={disabled}
            value={selection[idx]}
            onChange={e => onSelectLevel(idx, e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{MATERIAL_SELECT_PLACEHOLDER}</option>
            {options.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        );

        if (variant === 'hrm') {
          return (
            <label key={lvl.key} className="hrm-field">
              <span className="hrm-field__label">
                {lvl.label}
                {required && <span className="text-[var(--md-error)]"> *</span>}
              </span>
              {selectEl}
              {error && <p className="hrm-field__error">{error}</p>}
            </label>
          );
        }

        return (
          <FormField key={lvl.key} label={lvl.label} required={required} error={error}>
            {selectEl}
          </FormField>
        );
      })}
    </div>
  );
}
