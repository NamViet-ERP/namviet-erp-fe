import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { ProjectWarehouseKeeperDto } from '../../types/wms';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface WarehouseKeeperMultiSelectProps {
  value: ProjectWarehouseKeeperDto[];
  onChange: (next: ProjectWarehouseKeeperDto[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function WarehouseKeeperMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Gõ tên thủ kho…',
}: WarehouseKeeperMultiSelectProps) {
  const [options, setOptions] = useState<ProjectWarehouseKeeperDto[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await apiClient.get<ProjectWarehouseKeeperDto[]>('/api/warehouse/keepers');
        if (!cancelled) setOptions(rows);
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIds = useMemo(() => new Set(value.map(v => v.userId)), [value]);

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(draft);
    return options.filter(o => {
      if (selectedIds.has(o.userId)) return false;
      if (!q) return true;
      return o.displayName.toLowerCase().includes(q);
    });
  }, [draft, options, selectedIds]);

  const updatePanel = () => {
    const anchor = rootRef.current;
    const input = inputRef.current;
    if (!anchor || !input || !isInputAnchoredVisible(input)) {
      setOpen(false);
      return;
    }
    // Neo theo ô chips (full width), không theo input nhỏ bên trong.
    const rect = anchor.getBoundingClientRect();
    const next = computeAnchoredPanelStyle(rect, false);
    setPanelStyle(next.style);
  };

  useEffect(() => {
    if (!open) return;
    updatePanel();
    const parents = collectScrollParents(inputRef.current);
    const onScrollOrResize = () => updatePanel();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    parents.forEach(p => p.addEventListener('scroll', onScrollOrResize, { passive: true }));
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      parents.forEach(p => p.removeEventListener('scroll', onScrollOrResize));
    };
  }, [open, filtered.length, value.length]);

  const add = (keeper: ProjectWarehouseKeeperDto) => {
    onChange([...value, keeper]);
    setDraft('');
    setHighlight(0);
    inputRef.current?.focus();
  };

  const remove = (userId: string) => {
    onChange(value.filter(v => v.userId !== userId));
  };

  const panel =
    open && filtered.length > 0
      ? createPortal(
          <ul
            id={listId}
            className="warehouse-keeper-multi__panel"
            style={panelStyle}
            role="listbox"
          >
            {filtered.slice(0, 12).map((opt, idx) => (
              <li key={opt.userId}>
                <button
                  type="button"
                  className={
                    idx === highlight
                      ? 'warehouse-keeper-multi__option is-active'
                      : 'warehouse-keeper-multi__option'
                  }
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => add(opt)}
                  role="option"
                  aria-selected={idx === highlight}
                >
                  {opt.displayName}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="warehouse-keeper-multi" ref={rootRef}>
      <div className="warehouse-keeper-multi__chips">
        {value.map(k => (
          <span key={k.userId} className="warehouse-keeper-chip">
            {k.displayName}
            {!disabled && (
              <button
                type="button"
                className="warehouse-keeper-chip__remove"
                aria-label={`Bỏ ${k.displayName}`}
                onClick={() => remove(k.userId)}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          className="warehouse-keeper-multi__input"
          value={draft}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : 'Thêm thủ kho…'}
          onChange={e => {
            setDraft(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight(h => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight(h => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && filtered[highlight]) {
              e.preventDefault();
              add(filtered[highlight]);
            } else if (e.key === 'Backspace' && !draft && value.length > 0) {
              remove(value[value.length - 1].userId);
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </div>
      {panel}
    </div>
  );
}
