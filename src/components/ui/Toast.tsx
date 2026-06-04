import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast, ToastType } from '../../types';
import type { LucideIcon } from 'lucide-react';

const icons: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

/* MD3 Snackbar uses inverse-surface for high contrast */
const snackbarStyle: React.CSSProperties = {
  background:  'var(--md-inverse-surface)',
  color:       'var(--md-inverse-on-surface)',
};

const iconColors: Record<ToastType, string> = {
  success: '#72D44C',   /* bright green on dark bg */
  error:   '#FFB4AB',   /* md error-container tone */
  warning: '#FFD170',   /* warm amber on dark */
  info:    '#A8C8FF',   /* light blue on dark */
};

const actionColors: Record<ToastType, string> = {
  success: '#72D44C',
  error:   '#FFB4AB',
  warning: '#FFD170',
  info:    '#A8C8FF',
};

// Suppress unused variable lint — actionColors is kept for reference/future use
void actionColors;

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const Icon = icons[toast.type] || icons.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        minWidth: '300px',
        maxWidth: '440px',
        borderRadius: '4px',
        ...snackbarStyle,
        boxShadow: 'var(--md-shadow-3)',
        transform: exiting ? 'translateY(16px)' : 'translateY(0)',
        opacity: exiting ? 0 : 1,
        transition: 'all 300ms var(--md-easing)',
        animation: 'mdSlideUp 300ms var(--md-easing) forwards',
      }}
    >
      <Icon
        size={18}
        style={{ color: iconColors[toast.type] || iconColors.info, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--md-inverse-on-surface)',
              marginBottom: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {toast.title}
          </p>
        )}
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--md-inverse-on-surface)',
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '9999px',
          border: 'none',
          background: 'transparent',
          color: 'var(--md-inverse-on-surface)',
          cursor: 'pointer',
          flexShrink: 0,
          opacity: 0.7,
          transition: 'opacity 200ms, background 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ─── Global toast state ─── */
let toastListeners: Array<(toast: Toast) => void> = [];
let toastId = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(type: ToastType, message: string, title = '', duration = 4000): void {
  const toast: Toast = { id: ++toastId, type, message, title, duration };
  toastListeners.forEach(fn => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => setToasts(prev => [...prev, toast]);
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>
  );
}
