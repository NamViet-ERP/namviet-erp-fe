import type { ModalSize } from '../../types';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * MD3 Dialog component
 * Props: isOpen, onClose, title, children, size, footer
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeMap: Record<ModalSize, string> = {
    sm: '440px',
    md: '560px',
    lg: '720px',
    xl: '900px',
    full: '1100px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28, 27, 31, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog container */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          background: 'var(--md-surface-container)',
          borderRadius: '28px',
          boxShadow: 'var(--md-shadow-4)',
          width: '100%',
          maxWidth: sizeMap[size] || sizeMap.md,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 24px 0',
          }}
        >
          <h3
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: 1.3,
              color: 'var(--md-on-surface)',
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              color: 'var(--md-on-surface-variant)',
              cursor: 'pointer',
              transition: 'background 200ms var(--md-easing)',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '16px 0 0' }} />

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <>
            <div style={{ height: '1px', background: 'var(--md-outline-variant)' }} />
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
