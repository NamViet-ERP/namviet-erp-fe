import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast, ToastType } from '../../types';
import type { LucideIcon } from 'lucide-react';

const icons: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconClass: Record<ToastType, string> = {
  success: 'nv-snackbar__icon--success',
  error: 'nv-snackbar__icon--error',
  warning: 'nv-snackbar__icon--warning',
  info: 'nv-snackbar__icon--info',
};

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
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`nv-snackbar ${exiting ? 'nv-snackbar--out' : 'nv-snackbar--in'}`}>
      <Icon size={18} className={`nv-snackbar__icon ${iconClass[toast.type] ?? iconClass.info}`} />
      <div className="nv-snackbar__content">
        {toast.title && <p className="nv-snackbar__title">{toast.title}</p>}
        <p className="nv-snackbar__message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="nv-snackbar__close"
        aria-label="Đóng thông báo"
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 280); }}
      >
        <X size={16} />
      </button>
      <div
        className={`nv-snackbar__progress nv-snackbar__progress--${toast.type}`}
        style={{ '--toast-duration': `${toast.duration || 2500}ms` } as CSSProperties}
      />
    </div>
  );
}

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

  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <div className="nv-snackbar-stack">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>
  );
}
