import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { DropdownItem } from '../../types';
import type { ReactNode } from 'react';

/**
 * MD3 Menu / Dropdown
 * Trigger: Tonal button · Menu: surface-container, 28px radius, shadow-3
 */

interface DropdownProps {
  trigger?: ReactNode;
  items: DropdownItem[];
  className?: string;
}

export default function Dropdown({ trigger, items, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!ref.current || !open) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(items.length * 48 + 16, 300);
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      top: openUp ? 'auto' : `${rect.bottom + 4}px`,
      bottom: openUp ? `${window.innerHeight - rect.top + 4}px` : 'auto',
      right: `${window.innerWidth - rect.right}px`,
      minWidth: `${Math.max(rect.width, 200)}px`,
      zIndex: 99999,
    });
  }, [open, items.length]);

  const handleToggle = () => {
    if (!open) calculatePosition();
    setOpen(!open);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [open, calculatePosition]);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        onClick={handleToggle}
        className="btn btn-tonal"
        style={{ gap: '6px', fontSize: '0.8125rem', height: '36px', padding: '0 16px' }}
      >
        {trigger || 'TÁC VỤ'}
        <ChevronDown
          size={16}
          style={{
            transition: 'transform 200ms var(--md-easing)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            ...menuStyle,
            background: 'var(--md-surface-container)',
            borderRadius: '4px',
            boxShadow: 'var(--md-shadow-3)',
            padding: '4px 0',
            overflow: 'hidden',
          }}
          className="animate-scale-in"
        >
          {items.map((item, i) => (
            item.divider ? (
              <div
                key={i}
                style={{
                  height: '1px',
                  background: 'var(--md-outline-variant)',
                  margin: '4px 0',
                }}
              />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: item.danger ? 'var(--md-error)' : 'var(--md-on-surface)',
                  cursor: 'pointer',
                  transition: 'background 200ms var(--md-easing)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = item.danger
                    ? 'var(--tint-error-soft)'
                    : 'var(--tint-primary-hover)';
                }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {item.icon && (
                  <item.icon
                    size={18}
                    style={{ color: item.danger ? 'var(--md-error)' : 'var(--md-on-surface-variant)' }}
                  />
                )}
                {item.label}
              </button>
            )
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
