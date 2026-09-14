import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus } from 'lucide-react';
import { useProjectPersonnel, type ProjectPersonnelItem } from '../../hooks/useProjectPersonnel';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

interface ProjectMemberMultiSelectProps {
  value: string[];
  onChange: (members: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: ProjectPersonnelItem[];
  excludeNames?: string[];
}

export default function ProjectMemberMultiSelect({
  value,
  onChange,
  placeholder = 'Chọn thành viên SC từ danh sách…',
  disabled = false,
  options: overrideOptions,
  excludeNames,
}: ProjectMemberMultiSelectProps) {
  const { data: fetchedPersonnel = [] } = useProjectPersonnel();
  const personnelList = overrideOptions ?? fetchedPersonnel;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selectedNamesLower = useMemo(
    () => new Set(value.map(v => v.trim().toLowerCase()).filter(Boolean)),
    [value],
  );

  const excludedNamesSet = useMemo(() => {
    const set = new Set<string>();
    (excludeNames ?? []).forEach(e => {
      const t = e.trim().toLowerCase();
      if (t) set.add(t);
    });
    return set;
  }, [excludeNames]);

  const allExcludedLower = useMemo(() => {
    const set = new Set<string>(selectedNamesLower);
    excludedNamesSet.forEach(name => set.add(name));
    return set;
  }, [selectedNamesLower, excludedNamesSet]);

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(draft);
    return personnelList.filter(p => {
      if (allExcludedLower.has(p.name.trim().toLowerCase())) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    });
  }, [draft, personnelList, allExcludedLower]);

  // Kiểm tra xem draft có trùng khít với 1 option nào đó hoặc bị loại trừ không
  const trimmedDraft = draft.trim();
  const isDraftExcluded = excludedNamesSet.has(trimmedDraft.toLowerCase());
  const hasExactMatch = useMemo(() => {
    if (!trimmedDraft) return true;
    return (
      allExcludedLower.has(trimmedDraft.toLowerCase()) ||
      filtered.some(p => p.name.toLowerCase() === trimmedDraft.toLowerCase())
    );
  }, [trimmedDraft, allExcludedLower, filtered]);

  // Tổng số mục có thể chọn = filtered.length + (trimmedDraft && !hasExactMatch && !isDraftExcluded ? 1 : 0)
  const canAddNewDraft = Boolean(trimmedDraft && !hasExactMatch && !isDraftExcluded);
  const totalSelectableCount = filtered.length + (canAddNewDraft ? 1 : 0);

  const updatePanel = useCallback(() => {
    const anchor = rootRef.current;
    const input = inputRef.current;
    if (!anchor || !input || !isInputAnchoredVisible(input)) {
      setOpen(false);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const next = computeAnchoredPanelStyle(rect, false, 'below');
    setPanelStyle(next.style);
  }, []);

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
  }, [open, filtered.length, value.length, updatePanel]);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (excludedNamesSet.has(trimmed.toLowerCase())) return;
    if (!selectedNamesLower.has(trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setDraft('');
    setHighlight(0);
    inputRef.current?.focus();
  };

  const remove = (nameToRemove: string) => {
    onChange(value.filter(v => v.trim().toLowerCase() !== nameToRemove.trim().toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight(h => Math.min(h + 1, Math.max(totalSelectableCount - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open && canAddNewDraft) {
        add(trimmedDraft);
        return;
      }
      if (filtered.length > 0 && highlight < filtered.length) {
        add(filtered[highlight].name);
      } else if (canAddNewDraft) {
        add(trimmedDraft);
      }
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const panel = open ? (
    <ul
      id={listId}
      className="warehouse-keeper-multi__panel"
      style={panelStyle}
      role="listbox"
    >
      {canAddNewDraft && (
        <li>
          <button
            type="button"
            className={
              highlight === filtered.length
                ? 'warehouse-keeper-multi__option is-active flex items-center gap-1.5'
                : 'warehouse-keeper-multi__option flex items-center gap-1.5'
            }
            style={{ fontWeight: 600, color: 'var(--md-primary, #006874)' }}
            onMouseDown={e => e.preventDefault()}
            onClick={() => add(trimmedDraft)}
            role="option"
            aria-selected={highlight === filtered.length}
          >
            <UserPlus size={14} />
            <span>Thêm thành viên: <strong>{trimmedDraft}</strong></span>
          </button>
        </li>
      )}

      {trimmedDraft && isDraftExcluded && (
        <li className="warehouse-keeper-multi__empty text-amber-600 font-medium" role="presentation">
          "{trimmedDraft}" đã được chọn làm PIC / Quản lý của dự án.
        </li>
      )}

      {filtered.length === 0 && !canAddNewDraft && !isDraftExcluded ? (
        <li className="warehouse-keeper-multi__empty" role="presentation">
          {personnelList.length === 0
            ? 'Chưa có danh sách nhân sự. Bạn có thể tự gõ tên và bấm Enter.'
            : allExcludedLower.size >= personnelList.length
              ? 'Đã chọn tất cả thành viên trong danh sách.'
              : 'Không tìm thấy thành viên phù hợp.'}
        </li>
      ) : (
        filtered.slice(0, 15).map((person, idx) => (
          <li key={person.id || person.name}>
            <button
              type="button"
              className={
                idx === highlight
                  ? 'warehouse-keeper-multi__option is-active'
                  : 'warehouse-keeper-multi__option'
              }
              onMouseDown={e => e.preventDefault()}
              onClick={() => add(person.name)}
              role="option"
              aria-selected={idx === highlight}
            >
              <div className="flex flex-col text-left">
                <span className="font-medium text-[var(--md-on-surface)]">{person.name}</span>
                {(person.code || person.email) && (
                  <span className="text-xs text-[var(--md-outline)]">
                    {[person.code, person.email].filter(Boolean).join(' • ')}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))
      )}
    </ul>
  ) : null;

  return (
    <div className="warehouse-keeper-multi" ref={rootRef}>
      <div
        className="warehouse-keeper-multi__chips cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(name => (
          <span key={name} className="warehouse-keeper-chip">
            {name}
            {!disabled && (
              <button
                type="button"
                className="warehouse-keeper-chip__remove"
                aria-label={`Bỏ ${name}`}
                onClick={e => {
                  e.stopPropagation();
                  remove(name);
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
          placeholder={value.length === 0 ? placeholder : 'Thêm thành viên SC…'}
          onChange={e => {
            setDraft(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </div>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}
