import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ trigger, items, className = '' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const ref = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!ref.current || !open) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = Math.min(items.length * 40 + 20, 300); // estimate based on items
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      top: openUp ? 'auto' : `${rect.bottom + 4}px`,
      bottom: openUp ? `${window.innerHeight - rect.top + 4}px` : 'auto',
      right: `${window.innerWidth - rect.right}px`,
      minWidth: '192px',
      zIndex: 99999,
    });
  }, [open, items.length]);

  const handleToggle = () => {
    if (!open) calculatePosition();
    setOpen(!open);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Recalculate on scroll and resize
  useEffect(() => {
    if (open) {
      calculatePosition();
      const handleScroll = () => calculatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [open, calculatePosition]);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        onClick={handleToggle}
        className="btn btn-action text-xs gap-1"
      >
        {trigger || 'TÁC VỤ'}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-white rounded-xl shadow-dropdown border border-gray-100 py-1.5 animate-scale-in"
        >
          {items.map((item, i) => (
            item.divider ? (
              <div key={i} className="border-t border-gray-100 my-1.5" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[13px] flex items-center gap-2.5 transition-colors
                  ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-navy-700 hover:bg-gray-50'}`}
              >
                {item.icon && <item.icon size={15} strokeWidth={2} />}
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
