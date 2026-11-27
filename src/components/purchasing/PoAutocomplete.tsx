import { useCallback } from 'react';
import type { PurchaseOrderApiDto } from '../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import EntityCombobox from '../ui/EntityCombobox';

interface PoAutocompleteProps {
  value: string;
  onChange: (poCode: string) => void;
  orders: PurchaseOrderApiDto[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

function poLabel(o: PurchaseOrderApiDto) {
  const supplier = o.supplierName?.trim() || '—';
  return `${o.code} · ${supplier} · ${formatCurrencyFull(o.totalAmount)}`;
}

/** Combobox chọn PO — không cho nhập mã tự do. */
export default function PoAutocomplete({
  value,
  onChange,
  orders,
  placeholder = 'Chọn đơn hàng PO…',
  disabled = false,
  allowClear = false,
}: PoAutocompleteProps) {
  const getKey = useCallback((o: PurchaseOrderApiDto) => o.code, []);
  const filterItem = useCallback(
    (o: PurchaseOrderApiDto, q: string) =>
      o.code.toLowerCase().includes(q) ||
      (o.supplierName?.toLowerCase().includes(q) ?? false) ||
      (o.planCode?.toLowerCase().includes(q) ?? false) ||
      (o.projectCode?.toLowerCase().includes(q) ?? false),
    [],
  );
  const resolveClosedLabel = useCallback(
    (selected: PurchaseOrderApiDto | undefined) => (selected ? poLabel(selected) : ''),
    [],
  );

  return (
    <EntityCombobox<PurchaseOrderApiDto>
      items={orders}
      getKey={getKey}
      getLabel={poLabel}
      filterItem={filterItem}
      value={value}
      onChange={onChange}
      resolveClosedLabel={resolveClosedLabel}
      clearOnEmptyInput
      clearOnBlurEmpty
      allowClearOption={allowClear}
      clearOptionLabel="— Không gắn PO (Bỏ chọn) —"
      placeholder={placeholder}
      emptyMessage="Không có PO khớp."
      disabled={disabled}
      openLabel="Mở danh sách PO"
      closeLabel="Đóng danh sách PO"
      renderOption={o => (
        <>
          <span className="search-autocomplete__name" title={o.supplierName ?? o.code}>
            {o.supplierName || '—'}
          </span>
          <span className="search-autocomplete__code" title={o.code}>
            {o.code} · {formatCurrencyFull(o.totalAmount)}
          </span>
        </>
      )}
    />
  );
}
