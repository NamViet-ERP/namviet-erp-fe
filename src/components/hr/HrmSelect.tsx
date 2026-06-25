import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { computeFloatingMenuLayout, type FloatingMenuLayout } from '../../lib/hrm/floatingMenuPlacement';
import { hrmFieldClass } from './HrmFieldLabel';

const ITEM_HEIGHT = 40;

export interface HrmSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[] | string[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
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
  'aria-label': ariaLabel,
}: HrmSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<FloatingMenuLayout | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedLabel = value || placeholder;
  const isPlaceholder = !value;

  const close = useCallback(() => {
    setOpen(false);
    setLayout(null);
    setActiveIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const currentIndex = options.findIndex(o => o === value);
    setActiveIndex(currentIndex);
    setOpen(true);
  }, [disabled, options, value]);

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
      const menuHeight = Math.min(options.length * ITEM_HEIGHT + 8, 320);
      setLayout(computeFloatingMenuLayout(triggerRect, menuHeight, triggerRect.width));
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open, options.length]);

  const pick = (option: string) => {
    onChange(option);
    close();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex(i => (i < options.length - 1 ? i + 1 : 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex(i => (i > 0 ? i - 1 : options.length - 1));
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
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
      <button
        type="button"
        role="option"
        aria-selected={!value}
        className={`hrm-select__option${!value ? ' hrm-select__option--active' : ''}`}
        onMouseDown={e => e.preventDefault()}
        onClick={() => pick('')}
      >
        {placeholder}
      </button>
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          role="option"
          aria-selected={value === option}
          className={[
            'hrm-select__option',
            value === option && 'hrm-select__option--selected',
            activeIndex === index && 'hrm-select__option--active',
          ].filter(Boolean).join(' ')}
          onMouseDown={e => e.preventDefault()}
          onClick={() => pick(option)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {option}
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
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={isPlaceholder ? 'hrm-select__placeholder' : 'hrm-select__value'}>
          {selectedLabel}
        </span>
        <ChevronDown size={18} className="hrm-select__chevron" aria-hidden />
      </button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
}
