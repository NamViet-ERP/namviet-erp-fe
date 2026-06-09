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

const toastStyles = `
@keyframes mdSlideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes mdSlideOutRight {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(100%); }
}
@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
`;

if (typeof document !== 'undefined') {
  const id = 'nv-toast-styles';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.appendChild(document.createTextNode(toastStyles));
    document.head.appendChild(style);
  }
}

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
      setTimeout(() => onDismiss(toast.id), 280);
    }, toast.duration || 2500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const animationName = exiting ? 'mdSlideOutRight' : 'mdSlideInRight';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px 14px',
        minWidth: '320px',
        maxWidth: '440px',
        borderRadius: '8px',
        ...snackbarStyle,
        boxShadow: 'var(--md-shadow-3)',
        position: 'relative',
        overflow: 'hidden',
        animation: `${animationName} 250ms var(--md-easing) forwards`,
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
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 280); }}
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

      {/* Countdown progress line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: iconColors[toast.type] || iconColors.info,
          animation: `toastProgress ${toast.duration || 2500}ms linear forwards`,
        }}
      />
    </div>
  );
}

/* ─── Global toast state ─── */
let toastListeners: Array<(toast: Toast) => void> = [];
let toastId = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(type: ToastType, message: string, title = '', duration = 2500): void {
  const toast: Toast = { id: ++toastId, type, message, title, duration };
  toastListeners.forEach(fn => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => setToasts(prev => [...prev, toast]);
    toastListeners = [listener];
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: 9999,
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
