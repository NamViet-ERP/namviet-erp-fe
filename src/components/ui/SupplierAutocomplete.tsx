import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { SupplierApiDto } from '../../services/suppliersService';
import { findSupplierByName } from '../../services/suppliersService';
import {
  COMBOBOX_MAX_SUGGESTIONS,
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suppliers: SupplierApiDto[];
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
}

export default function SupplierAutocomplete({
  value,
  onChange,
  suppliers,
  placeholder = 'Chọn nhà cung cấp…',
  compact = false,
  disabled = false,
}: SupplierAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [placement, setPlacement] = useState<'below' | 'above'>('below');
  const [panelShown, setPanelShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const listId = useId();

  const selected = useMemo(() => findSupplierByName(suppliers, value), [suppliers, value]);

  useEffect(() => {
    if (!open) {
      setText(selected?.supplierName ?? '');
    }
  }, [open, selected]);

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(text);
    const list = q
      ? suppliers.filter(
          s =>
            s.supplierName.toLowerCase().includes(q) ||
            s.supplierCode.toLowerCase().includes(q),
        )
      : suppliers;
    return list.slice(0, COMBOBOX_MAX_SUGGESTIONS);
  }, [text, suppliers]);

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

  const selectSupplier = (supplier: SupplierApiDto) => {
    onChange(supplier.supplierName);
    setText(supplier.supplierName);
    setOpen(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!open) {
      setPanelShown(false);
      return;
    }

    updatePanelPosition();
    const raf = requestAnimationFrame(() => setPanelShown(true));

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

  useEffect(() => {
    setHighlight(0);
  }, [text, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight(i => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && open && filtered[highlight]) {
      e.preventDefault();
      selectSupplier(filtered[highlight]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showEmpty = open && normalizeComboboxQuery(text).length > 0 && filtered.length === 0;
  const showList = open && filtered.length > 0;
  const chevronOpenClass =
    open && placement === 'below' ? 'search-autocomplete__chevron-icon--open' : '';

  const panelClass = `search-autocomplete__panel search-autocomplete__panel--${placement}${
    panelShown ? ' is-visible' : ''
  }`;

  const panel = showList ? (
    <ul
      id={listId}
      ref={panelRef}
      role="listbox"
      className={panelClass}
      style={panelStyle}
    >
      {filtered.map((s, i) => (
        <li
          key={s.id}
          role="option"
          aria-selected={i === highlight}
          className={`search-autocomplete__option${i === highlight ? ' is-active' : ''}`}
          onMouseEnter={() => setHighlight(i)}
          onMouseDown={e => {
            e.preventDefault();
            selectSupplier(s);
          }}
        >
          <span className="search-autocomplete__name" title={s.supplierName}>
            {s.supplierName}
          </span>
          <span className="search-autocomplete__code" title={s.supplierCode}>
            {s.supplierCode}
          </span>
        </li>
      ))}
    </ul>
  ) : showEmpty ? (
    <div
      ref={panelRef}
      className={`${panelClass} search-autocomplete__empty`}
      style={panelStyle}
    >
      Không có NCC khớp — thêm mới tại Thiết lập → Danh mục NCC.
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
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          className="form-input search-autocomplete__input"
          value={text}
          placeholder={placeholder}
          onChange={e => {
            setText(e.target.value);
            if (!e.target.value.trim()) onChange('');
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            updatePanelPosition();
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          className="search-autocomplete__chevron"
          aria-label={open ? 'Đóng gợi ý' : 'Mở gợi ý'}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            setOpen(prev => !prev);
            updatePanelPosition();
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
