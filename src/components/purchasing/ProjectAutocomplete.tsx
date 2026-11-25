import { useCallback } from 'react';
import type { WarehouseProjectApiDto } from '../../types/wms';
import EntityCombobox from '../ui/EntityCombobox';

interface ProjectAutocompleteProps {
  value: string;
  onChange: (projectCode: string) => void;
  projects: WarehouseProjectApiDto[];
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

function projectLabel(p: WarehouseProjectApiDto) {
  return `[${p.projectCode}] ${p.projectName}`;
}

/** Combobox chọn dự án theo mã/tên — value = projectCode. */
export default function ProjectAutocomplete({
  value,
  onChange,
  projects,
  placeholder = 'Chọn dự án…',
  disabled = false,
  compact = false,
  className,
}: ProjectAutocompleteProps) {
  const getKey = useCallback((p: WarehouseProjectApiDto) => p.projectCode, []);
  const filterItem = useCallback(
    (p: WarehouseProjectApiDto, q: string) =>
      p.projectCode.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q) ||
      Boolean(p.clientName && p.clientName.toLowerCase().includes(q)),
    [],
  );
  const resolveClosedLabel = useCallback(
    (selected: WarehouseProjectApiDto | undefined) => (selected ? projectLabel(selected) : value),
    [value],
  );

  return (
    <EntityCombobox<WarehouseProjectApiDto>
      items={projects}
      getKey={getKey}
      getLabel={projectLabel}
      filterItem={filterItem}
      value={value}
      onChange={onChange}
      resolveClosedLabel={resolveClosedLabel}
      optionStacked
      clearOnEmptyInput
      clearOnBlurEmpty
      placeholder={placeholder}
      emptyMessage="Không có dự án khớp."
      compact={compact}
      disabled={disabled}
      className={className}
      openLabel="Mở danh sách dự án"
      closeLabel="Đóng danh sách dự án"
      getTitle={({ inputValue }) => inputValue}
      renderOption={p => (
        <>
          <div className="flex items-center gap-1.5 w-full">
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
              [{p.projectCode}]
            </span>
          </div>
          <div className="text-xs text-[var(--md-on-surface)] truncate w-full" title={p.projectName}>
            <span className="font-medium">{p.projectName}</span>
            {p.clientName ? (
              <span className="text-xs text-[var(--md-on-surface-variant)] ml-1.5 font-normal">
                — {p.clientName}
              </span>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
