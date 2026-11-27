import { useCallback } from 'react';
import type { SupplierApiDto } from '../../services/suppliersService';
import { findSupplierByName } from '../../services/suppliersService';
import EntityCombobox from './EntityCombobox';

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suppliers: SupplierApiDto[];
  placeholder?: string;
  ariaLabel?: string;
  compact?: boolean;
  disabled?: boolean;
}

export default function SupplierAutocomplete({
  value,
  onChange,
  suppliers,
  placeholder = 'Chọn nhà cung cấp…',
  ariaLabel,
  compact = false,
  disabled = false,
}: SupplierAutocompleteProps) {
  const getKey = useCallback((s: SupplierApiDto) => s.supplierName, []);
  const getOptionKey = useCallback((s: SupplierApiDto) => String(s.id), []);
  const matchValue = useCallback(
    (s: SupplierApiDto, val: string) => findSupplierByName([s], val) !== undefined,
    [],
  );
  const filterItem = useCallback(
    (s: SupplierApiDto, q: string) =>
      s.supplierName.toLowerCase().includes(q) || s.supplierCode.toLowerCase().includes(q),
    [],
  );
  /** Cho phép tên NCC tự do (import Excel) — không khớp danh mục vẫn hiện. */
  const resolveClosedLabel = useCallback(
    (selected: SupplierApiDto | undefined) => selected?.supplierName || value,
    [value],
  );

  return (
    <EntityCombobox<SupplierApiDto>
      items={suppliers}
      getKey={getKey}
      getOptionKey={getOptionKey}
      getLabel={getKey}
      matchValue={matchValue}
      filterItem={filterItem}
      value={value}
      onChange={onChange}
      resolveClosedLabel={resolveClosedLabel}
      allowFreeText
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? placeholder}
      emptyMessage="Không có NCC khớp — có thể giữ tên đã gõ, hoặc thêm mới tại Thiết lập → Danh mục NCC."
      compact={compact}
      disabled={disabled}
      renderOption={s => (
        <>
          <span className="search-autocomplete__name" title={s.supplierName}>
            {s.supplierName}
          </span>
          <span className="search-autocomplete__code" title={s.supplierCode}>
            {s.supplierCode}
          </span>
        </>
      )}
    />
  );
}
