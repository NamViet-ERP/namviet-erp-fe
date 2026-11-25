import { useCallback, useMemo } from 'react';
import { Briefcase, Coins, Package } from 'lucide-react';
import type { MaterialApiDto } from '../../services/materialsService';
import type { ServiceExpenseItemApiDto } from '../../types/api/serviceExpenseItem';
import { formatCurrency } from '../../utils/formatCurrency';
import EntityCombobox from '../ui/EntityCombobox';
import type { PurchasePlanLineType } from './createPurchasePlanDraft';

export interface UnifiedPurchaseItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  lineType: PurchasePlanLineType;
  referencePrice?: number | null;
}

interface PurchaseItemAutocompleteProps {
  value: string;
  materials: MaterialApiDto[];
  serviceItems?: ServiceExpenseItemApiDto[];
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
  fallbackLabel?: string;
  hasError?: boolean;
  errorMessage?: string;
  onSelect: (item: UnifiedPurchaseItem) => void;
  onClear?: () => void;
}

export default function PurchaseItemAutocomplete({
  value,
  materials,
  serviceItems = [],
  placeholder = 'Gõ mã hoặc tên vật tư, dịch vụ, chi phí…',
  compact = true,
  disabled = false,
  fallbackLabel,
  hasError = false,
  errorMessage,
  onSelect,
  onClear,
}: PurchaseItemAutocompleteProps) {
  const allCatalogItems = useMemo<UnifiedPurchaseItem[]>(() => {
    const list: UnifiedPurchaseItem[] = [];

    for (const m of materials) {
      if (m.materialCode) {
        list.push({
          id: `mat:${m.materialCode.trim()}`,
          code: m.materialCode.trim(),
          name: m.materialName,
          unit: m.unit || '',
          lineType: 'material',
          referencePrice: m.ceilingPrice,
        });
      }
    }

    for (const s of serviceItems) {
      if (s.code && s.isActive) {
        list.push({
          id: `svc:${s.code.trim()}`,
          code: s.code.trim(),
          name: s.name,
          unit: s.unit || '',
          lineType: s.type === 'expense' ? 'expense' : 'service',
          referencePrice: s.referencePrice,
        });
      }
    }

    return list;
  }, [materials, serviceItems]);

  const getKey = useCallback((item: UnifiedPurchaseItem) => item.code, []);
  const getOptionKey = useCallback((item: UnifiedPurchaseItem) => item.id, []);
  const getLabel = useCallback((item: UnifiedPurchaseItem) => item.name, []);
  const matchValue = useCallback(
    (item: UnifiedPurchaseItem, val: string) =>
      item.code.toLowerCase() === val.trim().toLowerCase(),
    [],
  );
  const filterItem = useCallback(
    (item: UnifiedPurchaseItem, q: string) =>
      item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q),
    [],
  );
  const resolveClosedLabel = useCallback(
    (selected: UnifiedPurchaseItem | undefined) =>
      selected?.name ?? fallbackLabel ?? value ?? '',
    [fallbackLabel, value],
  );
  const resolveEditDraft = useCallback(
    (selected: UnifiedPurchaseItem | undefined) =>
      selected
        ? selected.name
        : value && fallbackLabel
          ? `${value} — ${fallbackLabel}`
          : value || '',
    [fallbackLabel, value],
  );

  const handleChange = useCallback(
    (nextKey: string) => {
      if (!nextKey && onClear) onClear();
    },
    [onClear],
  );

  return (
    <EntityCombobox<UnifiedPurchaseItem>
      items={allCatalogItems}
      getKey={getKey}
      getOptionKey={getOptionKey}
      getLabel={getLabel}
      matchValue={matchValue}
      filterItem={filterItem}
      value={value}
      onChange={handleChange}
      onSelectItem={onSelect}
      maxOptions={100}
      optionStacked
      openOnClick
      selectOnFocus={false}
      clearOnEmptyInput
      fallbackLabel={fallbackLabel}
      resolveClosedLabel={resolveClosedLabel}
      resolveEditDraft={resolveEditDraft}
      placeholder={placeholder}
      emptyMessage={q => `Không tìm thấy vật tư hoặc dịch vụ nào phù hợp với “${q}”.`}
      compact={compact}
      disabled={disabled}
      panelClassName="search-autocomplete__panel--wide"
      emptyClassName="search-autocomplete__empty--wide"
      hasError={hasError}
      errorMessage={hasError ? errorMessage : undefined}
      renderOption={item => {
        const isService = item.lineType === 'service';
        const isExpense = item.lineType === 'expense';
        return (
          <>
            <div className="pur-item-option__head">
              <div className="pur-item-option__left">
                <span
                  className={`pur-item-badge ${
                    isExpense
                      ? 'pur-item-badge--expense'
                      : isService
                        ? 'pur-item-badge--service'
                        : 'pur-item-badge--material'
                  }`}
                >
                  {isExpense ? (
                    <>
                      <Coins size={10} aria-hidden />
                      <span>Chi phí ngoài</span>
                    </>
                  ) : isService ? (
                    <>
                      <Briefcase size={10} aria-hidden />
                      <span>Dịch vụ</span>
                    </>
                  ) : (
                    <>
                      <Package size={10} aria-hidden />
                      <span>Vật tư kho</span>
                    </>
                  )}
                </span>
                <span className="pur-item-option__code">{item.code}</span>
              </div>

              <div className="pur-item-option__meta">
                {item.referencePrice != null && item.referencePrice > 0 ? (
                  <span className="pur-item-option__price">
                    {formatCurrency(item.referencePrice)}
                  </span>
                ) : null}
                <span className="pur-item-option__unit">{item.unit}</span>
              </div>
            </div>

            <div className="pur-item-option__name">{item.name}</div>
          </>
        );
      }}
    />
  );
}
