import type React from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { computeFloatingMenuLayout, type FloatingMenuLayout } from '../../lib/hrm/floatingMenuPlacement';
import { hrmFieldClass } from './hrmFieldClass';

const ITEM_HEIGHT = 40;

export type HrmSelectTone = 'ok' | 'warn' | 'danger';

export type HrmSelectOption = string | { value: string; label: string; tone?: HrmSelectTone };

export interface HrmSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly HrmSelectOption[] | HrmSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
  /** When false, hide the empty "-- Chọn --" row. Default true. */
  allowEmpty?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

function toItem(option: HrmSelectOption): { value: string; label: string; tone?: HrmSelectTone } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

function OptionText({
  label,
  tone,
  muted,
}: {
  label: string;
  tone?: HrmSelectTone;
  muted?: boolean;
}) {
  return (
    <span className={muted ? 'hrm-select__placeholder' : 'hrm-select__value'}>
      {tone ? <span className={`hrm-select__swatch hrm-select__swatch--${tone}`} aria-hidden /> : null}
      {label}
    </span>
  );
}

export default function HrmSelect({
  value,
  onChange,
  onBlur,
  options,
  placeholder = '-- Chọn --',
  disabled = false,
  error = false,
  className = '',
  id,
  name,
  allowEmpty = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
}: HrmSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<FloatingMenuLayout | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const items = useMemo(() => options.map(toItem), [options]);
  const selected = items.find(item => item.value === value);
  const selectedLabel = selected?.label || placeholder;
  const isPlaceholder = !value;

  const close = useCallback(() => {
    setOpen(false);
    setLayout(null);
    setActiveIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const currentIndex = items.findIndex(item => item.value === value);
    setActiveIndex(currentIndex < 0 && !allowEmpty ? 0 : currentIndex);
    setOpen(true);
  }, [disabled, items, value, allowEmpty]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, listId]);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, [close, open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;

    const updateLayout = () => {
      if (!triggerRef.current || !menuRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuHeight = Math.min((items.length + 1) * ITEM_HEIGHT + 8, 320);
      setLayout(computeFloatingMenuLayout(triggerRect, menuHeight, triggerRect.width));
    };

    updateLayout();
    const selectedEl = menuRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open, items.length]);

  const pick = (next: string) => {
    onChange(next);
    close();
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else if (activeIndex >= 0 && items[activeIndex]) pick(items[activeIndex].value);
      else if (allowEmpty) pick('');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex(i => (i < items.length - 1 ? i + 1 : allowEmpty ? -1 : 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex(i => (i > (allowEmpty ? -1 : 0) ? i - 1 : items.length - 1));
      return;
    }
    if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? (allowEmpty ? -1 : 0) : items.length - 1);
    }
    if (event.key === 'Tab' && open) close();
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  const menu = open ? (
    <div
      ref={menuRef}
      id={listId}
      role="listbox"
      className={`hrm-select__menu hrm-select__menu--${layout?.placement ?? 'bottom'}`}
      style={
        layout
          ? {
              top: layout.top,
              left: layout.left,
              width: layout.width,
              maxHeight: layout.maxHeight,
            }
          : { visibility: 'hidden' }
      }
    >
      {allowEmpty ? (
        <button
          type="button"
          role="option"
          id={`${listId}-option--1`}
          tabIndex={-1}
          aria-selected={!value}
          className={`hrm-select__option${activeIndex === -1 ? ' hrm-select__option--active' : ''}`}
          onMouseEnter={() => setActiveIndex(-1)}
          onMouseDown={e => e.preventDefault()}
          onClick={() => pick('')}
        >
          {placeholder}
        </button>
      ) : null}
      {items.map((item, index) => (
        <button
          key={item.value}
          type="button"
          role="option"
          id={`${listId}-option-${index}`}
          tabIndex={-1}
          aria-selected={value === item.value}
          className={[
            'hrm-select__option',
            value === item.value && 'hrm-select__option--selected',
            activeIndex === index && 'hrm-select__option--active',
          ].filter(Boolean).join(' ')}
          onMouseDown={e => e.preventDefault()}
          onClick={() => pick(item.value)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          <OptionText label={item.label} tone={item.tone} />
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="hrm-select">
      <button
        ref={triggerRef}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        className={`hrm-select__trigger ${hrmFieldClass(error, 'hrm-field-select')}${className ? ` ${className}` : ''}${open ? ' hrm-select__trigger--open' : ''}`}
        aria-haspopup="listbox"
        role="combobox"
        aria-activedescendant={open && (activeIndex >= 0 || allowEmpty) ? `${listId}-option-${activeIndex}` : undefined}
        aria-invalid={error || undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <OptionText label={selectedLabel} tone={selected?.tone} muted={isPlaceholder} />
        <ChevronDown size={18} className="hrm-select__chevron" aria-hidden />
      </button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
}
