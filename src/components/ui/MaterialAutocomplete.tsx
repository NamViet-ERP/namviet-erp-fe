import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { MaterialApiDto } from '../../services/materialsService';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface MaterialAutocompleteProps {
  value: string;
  onChange: (materialCode: string) => void;
  materials: MaterialApiDto[];
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
  /** Closed input label: full `code — name` (default) or name only. */
  displayLabel?: 'code-name' | 'name';
}

function materialLabel(m: MaterialApiDto, displayLabel: 'code-name' | 'name') {
  return displayLabel === 'name' ? m.materialName : `${m.materialCode} — ${m.materialName}`;
}

export default function MaterialAutocomplete({
  value,
  onChange,
  materials,
  placeholder = 'Gõ mã hoặc tên vật tư…',
  compact = false,
  disabled = false,
  displayLabel = 'code-name',
}: MaterialAutocompleteProps) {
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

  const selected = useMemo(
    () => materials.find(m => m.materialCode === value),
    [materials, value],
  );
  const closedLabel = selected ? materialLabel(selected, displayLabel) : '';
  const inputValue = open ? draft : closedLabel;

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    const list = q
      ? materials.filter(
          m =>
            m.materialName.toLowerCase().includes(q) ||
            m.materialCode.toLowerCase().includes(q),
        )
      : materials;
    return list;
  }, [filterQuery, materials, open]);

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
    setDraft(closedLabel);
    setFilterQuery('');
    const selectedIdx = value ? materials.findIndex(m => m.materialCode === value) : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const selectMaterial = (material: MaterialApiDto) => {
    onChange(material.materialCode);
    setDraft(materialLabel(material, displayLabel));
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
      selectMaterial(filtered[safeHighlight]);
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
      className={panelClass}
      style={panelStyle}
    >
      {filtered.map((m, i) => (
        <li
          key={m.materialCode}
          role="option"
          aria-selected={i === safeHighlight}
          className={`search-autocomplete__option${i === safeHighlight ? ' is-active' : ''}`}
          onMouseEnter={() => setHighlight(i)}
          onMouseDown={e => {
            e.preventDefault();
            selectMaterial(m);
          }}
        >
          <span className="search-autocomplete__name" title={m.materialName}>
            {m.materialName}
          </span>
          <span className="search-autocomplete__code" title={m.materialCode}>
            {m.materialCode}
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
      Không có vật tư khớp.
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
          value={inputValue}
          placeholder={placeholder}
          onChange={e => {
            const next = e.target.value;
            setDraft(next);
            setFilterQuery(next);
            setHighlight(0);
            if (!next.trim()) onChange('');
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
          aria-label={open ? 'Đóng gợi ý' : 'Mở gợi ý'}
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
