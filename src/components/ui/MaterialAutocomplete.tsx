import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { MaterialApiDto } from '../../services/materialsService';
import EntityCombobox from './EntityCombobox';

interface MaterialAutocompleteProps {
  value: string;
  onChange: (materialCode: string) => void;
  materials: MaterialApiDto[];
  placeholder?: string;
  ariaLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  /** Closed input label: full `code — name` (default) or name only. */
  displayLabel?: 'code-name' | 'name';
  /** When value is not in materials list (vd. phiếu cũ), vẫn hiện nhãn này. */
  fallbackLabel?: string;
  hasError?: boolean;
  errorMessage?: string;
}

function materialLabel(m: MaterialApiDto, displayLabel: 'code-name' | 'name') {
  return displayLabel === 'name' ? m.materialName : `${m.materialCode} — ${m.materialName}`;
}

export default function MaterialAutocomplete({
  value,
  onChange,
  materials,
  placeholder = 'Gõ mã hoặc tên vật tư…',
  ariaLabel,
  compact = false,
  disabled = false,
  displayLabel = 'code-name',
  fallbackLabel,
  hasError = false,
  errorMessage,
}: MaterialAutocompleteProps) {
  const getKey = useCallback((m: MaterialApiDto) => m.materialCode, []);
  const getLabel = useCallback(
    (m: MaterialApiDto) => materialLabel(m, displayLabel),
    [displayLabel],
  );
  const filterItem = useCallback(
    (m: MaterialApiDto, q: string) =>
      m.materialName.toLowerCase().includes(q) || m.materialCode.toLowerCase().includes(q),
    [],
  );
  const resolveClosedLabel = useCallback(
    (selected: MaterialApiDto | undefined, fb?: string) =>
      selected
        ? materialLabel(selected, displayLabel)
        : value && fb
          ? displayLabel === 'name'
            ? fb
            : `${value} — ${fb}`
          : value || '',
    [displayLabel, value],
  );

  const defaultTooltip = `Mã vật tư '${value}' chưa có trong danh mục vật tư hệ thống. Cần tạo mã vật tư trước.`;

  return (
    <EntityCombobox<MaterialApiDto>
      items={materials}
      getKey={getKey}
      getLabel={getLabel}
      filterItem={filterItem}
      value={value}
      onChange={onChange}
      fallbackLabel={fallbackLabel}
      resolveClosedLabel={resolveClosedLabel}
      optionStacked
      clearOnEmptyInput
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? placeholder}
      emptyMessage="Không có vật tư khớp."
      compact={compact}
      disabled={disabled}
      hasError={hasError}
      errorMessage={hasError ? errorMessage || 'Chưa có trong danh mục' : undefined}
      errorTitle={hasError ? errorMessage || defaultTooltip : undefined}
      errorHintBadge={
        hasError ? (
          <span
            className="search-autocomplete__error-badge"
            title={errorMessage || defaultTooltip}
          >
            <AlertTriangle size={15} aria-hidden />
          </span>
        ) : undefined
      }
      getTitle={({ open, inputValue, hasError: err }) =>
        !open && inputValue
          ? err
            ? `${inputValue} (⚠️ Chưa có trong danh mục)`
            : inputValue
          : undefined
      }
      renderOption={m => (
        <>
          <span className="search-autocomplete__code" title={m.materialCode}>
            {m.materialCode}
          </span>
          <span className="search-autocomplete__name" title={m.materialName}>
            {m.materialName}
          </span>
        </>
      )}
    />
  );
}
