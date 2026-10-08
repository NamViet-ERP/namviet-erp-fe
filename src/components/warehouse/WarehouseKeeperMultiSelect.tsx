import type React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { projectPersonnelService } from '../../services/projectPersonnelService';
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
  placeholder = 'Chọn ≥1 thủ kho…',
}: WarehouseKeeperMultiSelectProps) {
  const [options, setOptions] = useState<ProjectWarehouseKeeperDto[]>([]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      try {
        const rows = await apiClient.get<ProjectWarehouseKeeperDto[]>('/api/warehouse/keepers');
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setOptions(rows);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback below
      }

      try {
        const personnel = await projectPersonnelService.getPersonnel();
        if (!cancelled && Array.isArray(personnel) && personnel.length > 0) {
          const mapped: ProjectWarehouseKeeperDto[] = personnel
            .filter(p => Boolean(p.id))
            .map(p => ({
              userId: p.id!,
              displayName: p.name,
            }));
          if (mapped.length > 0) {
            setOptions(mapped);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore fallback failure
      }

      if (!cancelled) {
        setOptions([]);
        setLoading(false);
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
    open
      ? createPortal(
          <ul
            id={listId}
            className="warehouse-keeper-multi__panel"
            style={panelStyle}
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="warehouse-keeper-multi__empty" role="presentation">
                {loading
                  ? 'Đang tải danh sách người dùng…'
                  : options.length === 0
                    ? 'Chưa có tài khoản người dùng phù hợp.'
                    : selectedIds.size === options.length
                      ? 'Đã chọn hết người phụ trách trong danh sách.'
                      : 'Không tìm thấy người dùng phù hợp.'}
              </li>
            ) : (
              filtered.slice(0, 50).map((opt, idx) => (
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
              ))
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="warehouse-keeper-multi" ref={rootRef}>
      <div
        className="warehouse-keeper-multi__chips cursor-text"
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
      >
        {value.map(k => (
          <span key={k.userId} className="warehouse-keeper-chip">
            {k.displayName}
            {!disabled && (
              <button
                type="button"
                className="warehouse-keeper-chip__remove"
                aria-label={`Bỏ ${k.displayName}`}
                onClick={e => {
                  e.stopPropagation();
                  remove(k.userId);
                }}
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
            window.setTimeout(() => setOpen(false), 200);
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
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        <button
          type="button"
          tabIndex={-1}
          className="warehouse-keeper-multi__toggle text-neutral-400 hover:text-neutral-600 p-1 flex-shrink-0 cursor-pointer"
          aria-label="Mở danh sách người phụ trách"
          disabled={disabled}
          onClick={e => {
            e.stopPropagation();
            if (!disabled) {
              setOpen(prev => {
                const next = !prev;
                if (next) inputRef.current?.focus();
                return next;
              });
            }
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-neutral-400" />
          ) : (
            <ChevronDown
              size={18}
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </button>
      </div>
      {panel}
    </div>
  );
}
