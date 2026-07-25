import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { PurchaseOrderApiDto } from '../../types/api/purchasingApi';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface PoAutocompleteProps {
  value: string;
  onChange: (poCode: string) => void;
  orders: PurchaseOrderApiDto[];
  placeholder?: string;
  disabled?: boolean;
}

function poLabel(o: PurchaseOrderApiDto) {
  const supplier = o.supplierName?.trim() || '—';
  return `${o.code} · ${supplier} · ${formatCurrency(o.totalAmount)} đ`;
}

/** Combobox chọn PO — không cho nhập mã tự do. */
export default function PoAutocomplete({
  value,
  onChange,
  orders,
  placeholder = 'Chọn đơn hàng PO…',
  disabled = false,
}: PoAutocompleteProps) {
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

  const selected = useMemo(() => orders.find(o => o.code === value), [orders, value]);
  const closedLabel = selected ? poLabel(selected) : '';
  const inputValue = open ? draft : closedLabel;

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    if (!q) return orders;
    return orders.filter(o =>
      o.code.toLowerCase().includes(q)
      || (o.supplierName?.toLowerCase().includes(q) ?? false)
      || (o.planCode?.toLowerCase().includes(q) ?? false)
      || (o.projectCode?.toLowerCase().includes(q) ?? false),
    );
  }, [filterQuery, orders, open]);

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
    const next = computeAnchoredPanelStyle(rect, false);
    setPlacement(next.placement);
    setPanelStyle(next.style);
  }, []);

  const openPanel = () => {
    setDraft(closedLabel);
    setFilterQuery('');
    const selectedIdx = value ? orders.findIndex(o => o.code === value) : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const selectOrder = (order: PurchaseOrderApiDto) => {
    onChange(order.code);
    setDraft(poLabel(order));
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
      setDraft(closedLabel);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, closedLabel]);

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
      selectOrder(filtered[safeHighlight]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setDraft(closedLabel);
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
      className={panelClass}
      style={panelStyle}
    >
      {filtered.map((o, i) => (
        <li
          key={o.code}
          role="option"
          aria-selected={i === safeHighlight}
          className={`search-autocomplete__option${i === safeHighlight ? ' is-active' : ''}`}
          onMouseEnter={() => setHighlight(i)}
          onMouseDown={e => {
            e.preventDefault();
            selectOrder(o);
          }}
        >
          <span className="search-autocomplete__name" title={o.supplierName ?? o.code}>
            {o.supplierName || '—'}
          </span>
          <span className="search-autocomplete__code" title={o.code}>
            {o.code} · {formatCurrency(o.totalAmount)} đ
          </span>
        </li>
      ))}
    </ul>
  ) : showEmpty ? (
    <div
      ref={node => { panelRef.current = node; }}
      className={`${panelClass} search-autocomplete__empty`}
      style={panelStyle}
    >
      Không có PO khớp.
    </div>
  ) : null;

  return (
    <div className="search-autocomplete">
      <div className="search-autocomplete__control">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          className="form-input search-autocomplete__input"
          value={inputValue}
          placeholder={placeholder}
          onChange={e => {
            const next = e.target.value;
            setDraft(next);
            setFilterQuery(next);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => {
            openPanel();
            requestAnimationFrame(() => inputRef.current?.select());
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          className="search-autocomplete__chevron"
          aria-label={open ? 'Đóng danh sách PO' : 'Mở danh sách PO'}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            if (open) setOpen(false);
            else openPanel();
            inputRef.current?.focus();
          }}
        >
          <ChevronDown size={14} className={chevronOpenClass} />
        </button>
      </div>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}
