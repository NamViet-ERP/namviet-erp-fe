import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { DropdownItem } from '../../types';
import type { ReactNode, CSSProperties } from 'react';

/**
 * MD3 Menu / Dropdown
 * Trigger: Tonal button · Menu: surface-container, shadow-3
 * Placement: always opens downward and follows the trigger on scroll.
 * Stacking: --z-dropdown (below app header) so menu slides under header when scrolling.
 */

interface DropdownProps {
  trigger?: ReactNode;
  items: DropdownItem[];
  className?: string;
}

export default function Dropdown({ trigger, items, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    // Trigger left the viewport → close (do not pin menu to header).
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }

    const gap = 4;
    // Always follow the trigger downward — never clamp/stick under the header.
    const top = rect.bottom + gap;
    const right = Math.max(8, window.innerWidth - rect.right);
    const spaceBelow = Math.max(48, window.innerHeight - top - 8);

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: 'auto',
      right: `${right}px`,
      bottom: 'auto',
      minWidth: `${Math.max(rect.width, 200)}px`,
      maxHeight: `${Math.min(320, spaceBelow)}px`,
      overflowY: 'auto',
      transformOrigin: 'top right',
      // Below .nv-header (--z-sidebar-flyout: 50) so scroll tucks menu under header.
      zIndex: 'var(--z-dropdown)',
    });
  }, []);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    calculatePosition();
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    calculatePosition();
  }, [open, calculatePosition]);

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
    if (!open) return;
    const onReposition = () => calculatePosition();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open, calculatePosition]);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="btn btn-tonal nv-dropdown__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
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
          role="menu"
          data-placement="bottom"
        >
          {items.map((item, i) => (
            item.divider ? (
              <div key={i} className="nv-dropdown__divider" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
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
