import { useCallback } from 'react';
import type { PurchasePlanApiDto } from '../../types/api/purchasingApi';
import EntityCombobox from '../ui/EntityCombobox';

interface PlanAutocompleteProps {
  value: string;
  onChange: (planCode: string) => void;
  plans: PurchasePlanApiDto[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  /** aria-label khi không có selection */
  ariaLabel?: string;
}

function planLabel(p: PurchasePlanApiDto) {
  const project = p.projectName?.trim()
    ? `${p.projectCode} - ${p.projectName}`
    : p.projectCode;
  return `${p.code} - ${project}`;
}

/** Combobox chọn KHMH / MHPS — tìm theo mã hoặc dự án. */
export default function PlanAutocomplete({
  value,
  onChange,
  plans,
  placeholder = 'Chọn kế hoạch…',
  disabled = false,
  emptyMessage = 'Không có kế hoạch khớp.',
  ariaLabel = 'Chọn kế hoạch mua hàng',
}: PlanAutocompleteProps) {
  const getKey = useCallback((p: PurchasePlanApiDto) => p.code, []);
  const filterItem = useCallback(
    (p: PurchasePlanApiDto, q: string) =>
      p.code.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      (p.projectName?.toLowerCase().includes(q) ?? false) ||
      (p.note?.toLowerCase().includes(q) ?? false),
    [],
  );
  const resolveClosedLabel = useCallback(
    (selected: PurchasePlanApiDto | undefined) => (selected ? planLabel(selected) : value || ''),
    [value],
  );

  const resolvedEmptyMessage =
    plans.length === 0 ? 'Không còn kế hoạch nào còn SL đặt được.' : emptyMessage;

  return (
    <EntityCombobox<PurchasePlanApiDto>
      items={plans}
      getKey={getKey}
      getLabel={planLabel}
      filterItem={filterItem}
      value={value}
      onChange={onChange}
      resolveClosedLabel={resolveClosedLabel}
      showEmptyWhenUnfiltered
      placeholder={placeholder}
      emptyMessage={resolvedEmptyMessage}
      disabled={disabled}
      ariaLabel={ariaLabel}
      openLabel="Mở danh sách kế hoạch"
      closeLabel="Đóng danh sách kế hoạch"
      renderOption={p => (
        <>
          <span className="search-autocomplete__name" title={p.projectName ?? p.projectCode}>
            {p.projectName?.trim() || p.projectCode}
          </span>
          <span className="search-autocomplete__code" title={p.code}>
            {p.code}
          </span>
        </>
      )}
    />
  );
}
