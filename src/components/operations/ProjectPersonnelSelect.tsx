import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useProjectPersonnel, type ProjectPersonnelItem } from '../../hooks/useProjectPersonnel';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface ProjectPersonnelSelectProps {
  value: string;
  onChange: (name: string, item?: ProjectPersonnelItem) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: ProjectPersonnelItem[];
  excludeNames?: string[];
}

export default function ProjectPersonnelSelect({
  value,
  onChange,
  placeholder = 'Chọn hoặc nhập PIC / Quản lý…',
  disabled = false,
  options: overrideOptions,
  excludeNames,
}: ProjectPersonnelSelectProps) {
  const { data: fetchedPersonnel = [] } = useProjectPersonnel();
  const personnelList = overrideOptions ?? fetchedPersonnel;

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

  const closedLabel = value || '';
  const inputValue = open ? draft : closedLabel;

  const excludedSet = useMemo(
    () => new Set((excludeNames ?? []).map(n => n.trim().toLowerCase()).filter(Boolean)),
    [excludeNames],
  );

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    return personnelList.filter(p => {
      if (excludedSet.has(p.name.trim().toLowerCase())) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    });
  }, [filterQuery, personnelList, open, excludedSet]);

  const safeHighlight =
    filtered.length === 0 ? 0 : Math.min(highlight, filtered.length - 1);

  const updatePanelPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el || !isInputAnchoredVisible(el)) {
      setOpen(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const next = computeAnchoredPanelStyle(rect, false, 'below');
    setPlacement(next.placement);
    setPanelStyle(next.style);
  }, []);

  const openPanel = () => {
    setDraft(closedLabel);
    setFilterQuery('');
    const selectedIdx = value
      ? personnelList.findIndex(p => p.name.toLowerCase() === value.toLowerCase().trim())
      : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const commitFreeText = (raw: string) => {
    const next = raw.trim();
    if (next !== value.trim()) onChange(next);
  };

  const selectPerson = (person: ProjectPersonnelItem) => {
    onChange(person.name, person);
    setDraft(person.name);
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
      commitFreeText(draft);
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, draft, value]);

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
    if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (filtered[safeHighlight]) {
        selectPerson(filtered[safeHighlight]);
      } else if (draft.trim()) {
        commitFreeText(draft);
        setOpen(false);
      }
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
      {filtered.map((person, i) => (
        <li
          key={person.id || person.name}
          role="option"
          aria-selected={i === safeHighlight}
          className={`search-autocomplete__option search-autocomplete__option--stack${i === safeHighlight ? ' is-active' : ''}`}
          onMouseEnter={() => setHighlight(i)}
          onMouseDown={e => {
            e.preventDefault();
            selectPerson(person);
          }}
        >
          <span className="search-autocomplete__name" title={person.name}>
            {person.name}
          </span>
          {(person.code || person.email) && (
            <span className="search-autocomplete__code" title={person.code || person.email}>
              {[person.code, person.email].filter(Boolean).join(' • ')}
            </span>
          )}
        </li>
      ))}
    </ul>
  ) : showEmpty ? (
    <div
      ref={node => { panelRef.current = node; }}
      className={`${panelClass} search-autocomplete__empty`}
      style={panelStyle}
    >
      Nhấn Enter để dùng tên "{draft.trim()}" nếu nhân sự chưa có trong danh sách.
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
            onChange(next);
            setOpen(true);
          }}
          onFocus={() => {
            openPanel();
            requestAnimationFrame(() => inputRef.current?.select());
          }}
          onBlur={() => {
            commitFreeText(draft);
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
