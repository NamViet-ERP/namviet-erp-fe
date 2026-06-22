import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { DropdownItem } from '../../types';
import type { ReactNode } from 'react';

/**
 * MD3 Menu / Dropdown
 * Trigger: Tonal button · Menu: surface-container, shadow-3
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
        type="button"
        onClick={handleToggle}
        className="btn btn-tonal nv-dropdown__trigger"
      >
        {trigger || 'TÁC VỤ'}
        <ChevronDown
          size={16}
          className={`nv-dropdown__chevron${open ? ' nv-dropdown__chevron--open' : ''}`}
        />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="nv-dropdown__menu animate-scale-in"
        >
          {items.map((item, i) => (
            item.divider ? (
              <div key={i} className="nv-dropdown__divider" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`nv-dropdown__item${item.danger ? ' nv-dropdown__item--danger' : ''}`}
              >
                {item.icon && (
                  <item.icon size={18} className="nv-dropdown__item-icon" />
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
