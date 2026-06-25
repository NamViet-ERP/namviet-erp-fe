import { useEffect, useState, useCallback, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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

const TOAST_SLOT_ID = 1;

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function restartProgressBar(el: HTMLDivElement | null) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const Icon = icons[toast.type] || icons.info;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(onDismiss, 280);
  }, [onDismiss]);

  useEffect(() => {
    setExiting(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(dismiss, toast.duration || 2500);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [toast.revision, toast.duration, dismiss]);

  useEffect(() => {
    restartProgressBar(progressRef.current);
  }, [toast.revision]);

  return (
    <div className={`nv-snackbar ${exiting ? 'nv-snackbar--out' : entered ? 'nv-snackbar--in' : ''}`}>
      <Icon size={18} className={`nv-snackbar__icon ${iconClass[toast.type] ?? iconClass.info}`} />
      <div className="nv-snackbar__content">
        {toast.title && <p className="nv-snackbar__title">{toast.title}</p>}
        <p className="nv-snackbar__message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="nv-snackbar__close"
        aria-label="Đóng thông báo"
        onClick={dismiss}
      >
        <X size={16} />
      </button>
      <div
        ref={progressRef}
        className={`nv-snackbar__progress nv-snackbar__progress--${toast.type}`}
        style={{ '--toast-duration': `${toast.duration || 2500}ms` } as CSSProperties}
      />
    </div>
  );
}

let activeToast: Toast | null = null;
const toastListeners = new Set<() => void>();

function emitToast(toast: Toast) {
  activeToast = toast;
  toastListeners.forEach(listener => listener());
}

function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function getToastSnapshot() {
  return activeToast;
}

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(type: ToastType, message: string, title = '', duration = 2500): void {
  emitToast({
    id: TOAST_SLOT_ID,
    type,
    message,
    title,
    duration,
    revision: Date.now(),
  });
}

export default function ToastContainer() {
  const toast = useSyncExternalStore(subscribeToasts, getToastSnapshot, getToastSnapshot);

  const handleDismiss = useCallback(() => {
    activeToast = null;
    toastListeners.forEach(listener => listener());
  }, []);

  if (!toast) return null;

  return createPortal(
    <div className="nv-snackbar-stack">
      <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
    </div>,
    document.body,
  );
}
