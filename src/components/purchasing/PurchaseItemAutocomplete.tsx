import type React from 'react';
import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, AlertTriangle, Package, Briefcase, Coins } from 'lucide-react';
import type { MaterialApiDto } from '../../services/materialsService';
import type { ServiceExpenseItemApiDto } from '../../types/api/serviceExpenseItem';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';
import { formatCurrency } from '../../utils/formatCurrency';
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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [placement, setPlacement] = useState<'below' | 'above'>('below');
  const [panelReady, setPanelReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLUListElement | HTMLDivElement>(null);
  const listId = useId();

  // Combine unified catalog items
  const allCatalogItems = useMemo<UnifiedPurchaseItem[]>(() => {
    const list: UnifiedPurchaseItem[] = [];

    // 1. Materials
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

    // 2. Service & Expense items
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

  const selectedItem = useMemo(() => {
    const v = value?.trim().toLowerCase();
    if (!v) return null;
    return allCatalogItems.find(i => i.code.toLowerCase() === v) ?? null;
  }, [allCatalogItems, value]);

  const closedLabel = selectedItem
    ? `${selectedItem.code} — ${selectedItem.name}`
    : (value && fallbackLabel
      ? `${value} — ${fallbackLabel}`
      : (value || ''));

  const inputValue = open ? draft : (selectedItem?.name ?? fallbackLabel ?? value ?? '');

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    if (!q) return allCatalogItems.slice(0, 100);

    return allCatalogItems
      .filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q),
      )
      .slice(0, 100);
  }, [allCatalogItems, filterQuery, open]);

  const safeHighlight =
    filtered.length === 0 ? 0 : Math.min(highlight, filtered.length - 1);

  const updatePanelPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    if (!isInputAnchoredVisible(el)) {
      setOpen(false);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const next = computeAnchoredPanelStyle(rect, compact);
    setPlacement(next.placement);
    setPanelStyle(next.style);
  }, [compact]);

  const openPanel = () => {
    setDraft(selectedItem?.name ?? closedLabel);
    setFilterQuery('');
    const selectedIdx = value
      ? filtered.findIndex(i => i.code.toLowerCase() === value.trim().toLowerCase())
      : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const handleSelectItem = (item: UnifiedPurchaseItem) => {
    onSelect(item);
    setDraft(item.name);
    setFilterQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();
    const raf = requestAnimationFrame(() => setPanelReady(true));

    const onReposition = () => {
      const el = inputRef.current;
      if (!el || !isInputAnchoredVisible(el)) {
        setOpen(false);
        return;
      }
      updatePanelPosition();
    };

    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    document.addEventListener('scroll', onReposition, true);

    const scrollParents = collectScrollParents(inputRef.current);
    scrollParents.forEach(node => node.addEventListener('scroll', onReposition, { passive: true }));

    return () => {
      cancelAnimationFrame(raf);
      setPanelReady(false);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      document.removeEventListener('scroll', onReposition, true);
      scrollParents.forEach(node => node.removeEventListener('scroll', onReposition));
    };
  }, [open, updatePanelPosition, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openPanel();
      setHighlight(i => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openPanel();
      setHighlight(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && open && filtered[safeHighlight]) {
      e.preventDefault();
      handleSelectItem(filtered[safeHighlight]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showEmpty = open && normalizeComboboxQuery(filterQuery).length > 0 && filtered.length === 0;
  const showList = open && filtered.length > 0;
  const chevronOpenClass =
    open && placement === 'below' ? 'search-autocomplete__chevron-icon--open' : '';

  const panelClass = `search-autocomplete__panel search-autocomplete__panel--${placement}${
    open && panelReady ? ' is-visible' : ''
  }`;

  const panel = showList ? (
    <ul
      id={listId}
      ref={node => { panelRef.current = node; }}
      role="listbox"
      className={`${panelClass} min-w-[360px] max-w-[540px]`}
      style={panelStyle}
    >
      {filtered.map((item, i) => {
        const isSelected = i === safeHighlight;
        const isService = item.lineType === 'service';
        const isExpense = item.lineType === 'expense';
        return (
          <li
            key={item.id}
            role="option"
            aria-selected={isSelected}
            className={`search-autocomplete__option search-autocomplete__option--stack !py-2.5 !px-3 cursor-pointer transition-colors ${
              isSelected ? 'is-active bg-[var(--md-surface-variant)]/60' : ''
            }`}
            onMouseEnter={() => setHighlight(i)}
            onMouseDown={e => {
              e.preventDefault();
              handleSelectItem(item);
            }}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    isExpense
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                      : isService
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
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
                <span className="font-mono font-semibold text-xs text-[var(--md-primary)]">
                  {item.code}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--md-on-surface-variant)] flex-shrink-0">
                {item.referencePrice != null && item.referencePrice > 0 && (
                  <span className="text-[11px] font-medium text-[var(--md-on-surface)]">
                    {formatCurrency(item.referencePrice)}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-[var(--md-surface-variant)]/40 font-medium text-[11px]">
                  {item.unit}
                </span>
              </div>
            </div>

            <div className="text-xs font-medium text-[var(--md-on-surface)] line-clamp-1 mt-1">
              {item.name}
            </div>
          </li>
        );
      })}
    </ul>
  ) : showEmpty ? (
    <div
      ref={node => { panelRef.current = node; }}
      className={`${panelClass} p-3 text-xs text-[var(--md-on-surface-variant)] text-center min-w-[320px]`}
      style={panelStyle}
    >
      Không tìm thấy vật tư hoặc dịch vụ nào phù hợp với &ldquo;{filterQuery}&rdquo;.
    </div>
  ) : null;

  return (
    <div className={`search-autocomplete${compact ? ' search-autocomplete--compact' : ''}`}>
      <div className="search-autocomplete__control">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-invalid={hasError ? 'true' : undefined}
          className={`form-input search-autocomplete__input${
            compact ? ' form-input-sm search-autocomplete__input--compact' : ' form-input-md'
          }${hasError ? ' is-invalid border-red-500 focus:border-red-600 focus:ring-red-200' : ''}`}
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onFocus={openPanel}
          onClick={openPanel}
          onChange={e => {
            setDraft(e.target.value);
            setFilterQuery(e.target.value);
            if (!open) setOpen(true);
            setHighlight(0);
            if (!e.target.value.trim() && onClear) {
              onClear();
            }
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Đóng gợi ý' : 'Mở gợi ý'}
          className={`search-autocomplete__chevron${
            compact ? ' search-autocomplete__chevron--compact' : ''
          }`}
          disabled={disabled}
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              inputRef.current?.focus();
              openPanel();
            }
          }}
        >
          <ChevronDown
            size={compact ? 14 : 16}
            aria-hidden
            className={`search-autocomplete__chevron-icon ${chevronOpenClass}`}
          />
        </button>
      </div>

      {hasError && errorMessage && (
        <p className="flex items-center gap-1 mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium" role="alert">
          <AlertTriangle size={12} className="flex-shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      )}

      {typeof document !== 'undefined' && panel && createPortal(panel, document.body)}
    </div>
  );
}
