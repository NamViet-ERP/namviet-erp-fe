import type React from 'react';
import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { PurchasePlanApiDto } from '../../types/api/purchasingApi';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

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

  const selected = useMemo(() => plans.find(p => p.code === value), [plans, value]);
  const closedLabel = selected ? planLabel(selected) : value ? value : '';
  const inputValue = open ? draft : closedLabel;

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    if (!q) return plans;
    return plans.filter(p =>
      p.code.toLowerCase().includes(q)
      || p.projectCode.toLowerCase().includes(q)
      || (p.projectName?.toLowerCase().includes(q) ?? false)
      || (p.note?.toLowerCase().includes(q) ?? false),
    );
  }, [filterQuery, plans, open]);

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
    const selectedIdx = value ? plans.findIndex(p => p.code === value) : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const selectPlan = (plan: PurchasePlanApiDto) => {
    onChange(plan.code);
    setDraft(planLabel(plan));
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
      selectPlan(filtered[safeHighlight]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setDraft(closedLabel);
    }
  };

  const showEmpty = open && filtered.length === 0;
  const showList = open && filtered.length > 0;
  const chevronOpenClass =
    open && placement === 'below' ? 'search-autocomplete__chevron-icon--open' : '';
  const panelClass = `search-autocomplete__panel search-autocomplete__panel--${placement}${
    open && panelReady ? ' is-visible' : ''
  }`;

  const emptyText = plans.length === 0
    ? 'Không còn kế hoạch nào còn SL đặt được.'
    : emptyMessage;

  const panel = showList ? (
    <ul
      id={listId}
      ref={node => { panelRef.current = node; }}
      role="listbox"
      className={panelClass}
      style={panelStyle}
    >
      {filtered.map((p, i) => (
        <li
          key={p.code}
          role="option"
          aria-selected={i === safeHighlight}
          className={`search-autocomplete__option${i === safeHighlight ? ' is-active' : ''}`}
          onMouseEnter={() => setHighlight(i)}
          onMouseDown={e => {
            e.preventDefault();
            selectPlan(p);
          }}
        >
          <span className="search-autocomplete__name" title={p.projectName ?? p.projectCode}>
            {p.projectName?.trim() || p.projectCode}
          </span>
          <span className="search-autocomplete__code" title={p.code}>
            {p.code}
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
      {emptyText}
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
          aria-label={ariaLabel}
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
          aria-label={open ? 'Đóng danh sách kế hoạch' : 'Mở danh sách kế hoạch'}
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
