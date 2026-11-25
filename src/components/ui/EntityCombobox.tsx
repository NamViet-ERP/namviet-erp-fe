import type React from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { registerOverlay } from '../../lib/dialogStack';
import {
  collectScrollParents,
  computeAnchoredPanelStyle,
  isInputAnchoredVisible,
  normalizeComboboxQuery,
} from '../../lib/ui/anchoredCombobox';

export interface EntityComboboxProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  getOptionKey?: (item: T) => string;
  getLabel: (item: T) => string;
  matchValue?: (item: T, value: string) => boolean;
  filterItem?: (item: T, normalizedQuery: string) => boolean;
  value: string;
  onChange: (key: string) => void;
  onSelectItem?: (item: T) => void;
  maxOptions?: number;
  renderOption?: (item: T, highlighted: boolean) => ReactNode;
  optionStacked?: boolean;
  fallbackLabel?: string;
  resolveEditDraft?: (selected: T | undefined, closedLabel: string) => string;
  resolveClosedLabel?: (selected: T | undefined, fallbackLabel?: string) => string;
  allowFreeText?: boolean;
  clearOnEmptyInput?: boolean;
  clearOnBlurEmpty?: boolean;
  allowClearOption?: boolean;
  clearOptionLabel?: string;
  showEmptyWhenUnfiltered?: boolean;
  openOnClick?: boolean;
  selectOnFocus?: boolean;
  placeholder?: string;
  emptyMessage?: ReactNode | ((query: string) => ReactNode);
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
  emptyClassName?: string;
  hasError?: boolean;
  errorMessage?: string;
  errorTitle?: string;
  errorHintBadge?: ReactNode;
  ariaLabel?: string;
  openLabel?: string;
  closeLabel?: string;
  getTitle?: (ctx: { open: boolean; inputValue: string; hasError: boolean }) => string | undefined;
}

/** Canonical portaled searchable combobox built on `anchoredCombobox` and `dialogStack`. */
export default function EntityCombobox<T>({
  items,
  getKey,
  getOptionKey,
  getLabel,
  matchValue,
  filterItem,
  value,
  onChange,
  onSelectItem,
  maxOptions,
  renderOption,
  optionStacked = false,
  fallbackLabel,
  resolveEditDraft,
  resolveClosedLabel,
  allowFreeText = false,
  clearOnEmptyInput = false,
  clearOnBlurEmpty = false,
  allowClearOption = false,
  clearOptionLabel = '— Bỏ chọn —',
  showEmptyWhenUnfiltered = false,
  openOnClick = false,
  selectOnFocus = true,
  placeholder = 'Chọn…',
  emptyMessage = 'Không có dữ liệu khớp.',
  compact = false,
  disabled = false,
  className = '',
  panelClassName = '',
  emptyClassName = '',
  hasError = false,
  errorMessage,
  errorTitle,
  errorHintBadge,
  ariaLabel,
  openLabel = 'Mở gợi ý',
  closeLabel = 'Đóng gợi ý',
  getTitle,
}: EntityComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [placement, setPlacement] = useState<'below' | 'above'>('below');
  const [panelReady, setPanelReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const draftRef = useRef('');
  const skipNextBlurCommitRef = useRef(false);
  const listId = useId();

  const selected = useMemo(() => {
    if (matchValue) return items.find(item => matchValue(item, value));
    return items.find(item => getKey(item) === value);
  }, [items, matchValue, getKey, value]);

  const closedLabel = resolveClosedLabel
    ? resolveClosedLabel(selected, fallbackLabel)
    : selected
      ? getLabel(selected)
      : fallbackLabel || value || '';

  const closedLabelRef = useRef(closedLabel);
  useEffect(() => {
    closedLabelRef.current = closedLabel;
  }, [closedLabel]);

  const inputValue = open ? draft : closedLabel;

  const filtered = useMemo(() => {
    const q = normalizeComboboxQuery(open ? filterQuery : '');
    const list = q
      ? items.filter(item =>
          filterItem
            ? filterItem(item, q)
            : getLabel(item).toLowerCase().includes(q) || getKey(item).toLowerCase().includes(q),
        )
      : items;
    return maxOptions !== undefined ? list.slice(0, maxOptions) : list;
  }, [filterQuery, items, open, filterItem, getLabel, getKey, maxOptions]);

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

  const closePanel = useCallback(() => {
    setOpen(false);
    draftRef.current = closedLabelRef.current;
    setDraft(closedLabelRef.current);
  }, []);

  const clearSelection = useCallback(() => {
    onChange('');
    draftRef.current = '';
    setDraft('');
    setFilterQuery('');
    setOpen(false);
  }, [onChange]);

  const commitFreeText = useCallback(
    (raw: string) => {
      const next = raw.trim();
      if (next !== value.trim()) onChange(next);
    },
    [value, onChange],
  );

  const openPanel = () => {
    const initialDraft = resolveEditDraft
      ? resolveEditDraft(selected, closedLabel)
      : closedLabel;
    draftRef.current = initialDraft;
    setDraft(initialDraft);
    setFilterQuery('');
    const baseItems = maxOptions !== undefined ? items.slice(0, maxOptions) : items;
    const selectedIdx = value
      ? baseItems.findIndex(item =>
          matchValue ? matchValue(item, value) : getKey(item) === value,
        )
      : -1;
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    updatePanelPosition();
  };

  const selectItem = (item: T) => {
    const key = getKey(item);
    const nextLabel = resolveClosedLabel
      ? resolveClosedLabel(item, fallbackLabel)
      : getLabel(item);
    const nextDraft = resolveEditDraft
      ? resolveEditDraft(item, nextLabel)
      : nextLabel;
    skipNextBlurCommitRef.current = true;
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    setFilterQuery('');
    setOpen(false);
    onChange(key);
    onSelectItem?.(item);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!open) return;
    return registerOverlay(() => {
      closePanel();
    });
  }, [open, closePanel]);

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
      if (allowFreeText) {
        commitFreeText(draftRef.current);
        setOpen(false);
        return;
      }
      if (clearOnBlurEmpty && !normalizeComboboxQuery(draftRef.current)) {
        clearSelection();
        return;
      }
      closePanel();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, allowFreeText, clearOnBlurEmpty, commitFreeText, clearSelection, closePanel]);

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
        selectItem(filtered[safeHighlight]);
      } else if (allowFreeText && draftRef.current.trim()) {
        skipNextBlurCommitRef.current = true;
        commitFreeText(draftRef.current);
        setOpen(false);
      } else if (clearOnBlurEmpty && !normalizeComboboxQuery(draftRef.current)) {
        clearSelection();
      }
      return;
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    }
  };

  const hasQuery = normalizeComboboxQuery(filterQuery).length > 0;
  const showEmpty = open && filtered.length === 0 && (showEmptyWhenUnfiltered || hasQuery);
  const showList = open && filtered.length > 0;
  const chevronOpenClass =
    open && placement === 'below' ? 'search-autocomplete__chevron-icon--open' : '';

  const panelClass = [
    `search-autocomplete__panel search-autocomplete__panel--${placement}`,
    open && panelReady ? 'is-visible' : '',
    panelClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedEmpty =
    typeof emptyMessage === 'function' ? emptyMessage(filterQuery) : emptyMessage;

  const panel = showList ? (
    <ul
      id={listId}
      ref={node => {
        panelRef.current = node;
      }}
      role="listbox"
      className={panelClass}
      style={panelStyle}
    >
      {allowClearOption ? (
        <li
          role="option"
          aria-selected={!value}
          className="search-autocomplete__option search-autocomplete__clear-option"
          onMouseDown={e => {
            e.preventDefault();
            skipNextBlurCommitRef.current = true;
            clearSelection();
            inputRef.current?.blur();
          }}
        >
          <span className="search-autocomplete__name search-autocomplete__clear-label">
            {clearOptionLabel}
          </span>
        </li>
      ) : null}
      {filtered.map((item, i) => {
        const optionKey = getOptionKey ? getOptionKey(item) : getKey(item);
        const isHighlighted = i === safeHighlight;
        return (
          <li
            key={optionKey}
            id={`${listId}-option-${i}`}
            role="option"
            aria-selected={isHighlighted}
            className={[
              'search-autocomplete__option',
              optionStacked ? 'search-autocomplete__option--stack' : '',
              isHighlighted ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onMouseEnter={() => setHighlight(i)}
            onMouseDown={e => {
              e.preventDefault();
              selectItem(item);
            }}
          >
            {renderOption ? (
              renderOption(item, isHighlighted)
            ) : (
              <span className="search-autocomplete__name" title={getLabel(item)}>
                {getLabel(item)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  ) : showEmpty ? (
    <div
      ref={node => {
        panelRef.current = node;
      }}
      className={[panelClass, 'search-autocomplete__empty', emptyClassName]
        .filter(Boolean)
        .join(' ')}
      style={panelStyle}
    >
      {allowClearOption ? (
        <div
          role="button"
          tabIndex={0}
          className="search-autocomplete__clear-empty"
          onMouseDown={e => {
            e.preventDefault();
            skipNextBlurCommitRef.current = true;
            clearSelection();
            inputRef.current?.blur();
          }}
        >
          <span className="search-autocomplete__clear-label">{clearOptionLabel}</span>
        </div>
      ) : null}
      {resolvedEmpty}
    </div>
  ) : null;

  const computedTitle = getTitle ? getTitle({ open, inputValue, hasError }) : undefined;

  return (
    <div
      className={[
        'search-autocomplete',
        compact ? 'search-autocomplete--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'search-autocomplete__control',
          hasError ? 'search-autocomplete__control--error' : '',
          hasError && errorHintBadge ? 'search-autocomplete__control--has-badge' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && showList && filtered[safeHighlight]
              ? `${listId}-option-${safeHighlight}`
              : undefined
          }
          aria-label={ariaLabel}
          aria-invalid={hasError ? 'true' : undefined}
          disabled={disabled}
          className={[
            'form-input search-autocomplete__input',
            compact ? 'form-input-sm search-autocomplete__input--compact' : 'form-input-md',
            hasError ? 'is-invalid search-autocomplete__input--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={inputValue}
          title={computedTitle}
          placeholder={placeholder}
          onChange={e => {
            const next = e.target.value;
            draftRef.current = next;
            setDraft(next);
            setFilterQuery(next);
            setHighlight(0);
            if (allowFreeText) {
              onChange(next);
            } else if (clearOnEmptyInput && !next.trim()) {
              onChange('');
            }
            setOpen(true);
          }}
          onFocus={() => {
            skipNextBlurCommitRef.current = false;
            openPanel();
            if (selectOnFocus) {
              requestAnimationFrame(() => inputRef.current?.select());
            }
          }}
          onClick={() => {
            if (openOnClick && !disabled && !open) openPanel();
          }}
          onBlur={() => {
            if (!allowFreeText) return;
            if (skipNextBlurCommitRef.current) {
              skipNextBlurCommitRef.current = false;
              return;
            }
            commitFreeText(draftRef.current);
          }}
          onKeyDown={onKeyDown}
        />
        {hasError ? errorHintBadge : null}
        <button
          type="button"
          tabIndex={-1}
          className={`search-autocomplete__chevron${
            compact ? ' search-autocomplete__chevron--compact' : ''
          }`}
          aria-label={open ? closeLabel : openLabel}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            if (open) closePanel();
            else openPanel();
            inputRef.current?.focus();
          }}
        >
          <ChevronDown
            size={14}
            aria-hidden
            className={`search-autocomplete__chevron-icon ${chevronOpenClass}`.trim()}
          />
        </button>
      </div>
      {hasError && errorMessage ? (
        <p
          className="search-autocomplete__error"
          role="alert"
          title={errorTitle ?? errorMessage}
        >
          <AlertTriangle size={12} className="search-autocomplete__error-icon" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      ) : null}
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
