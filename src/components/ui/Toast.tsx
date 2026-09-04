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

const MAX_TOASTS = 3;
const DEFAULT_DURATION_MS = 2500;
const ERROR_DURATION_MS = 6000;

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
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
  const duration = toast.duration || (toast.type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => onDismiss(toast.id), 280);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(dismiss, duration);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [toast.revision, duration, dismiss]);

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
        style={{ '--toast-duration': `${duration}ms` } as CSSProperties}
      />
    </div>
  );
}

let activeToasts: Toast[] = [];
let nextToastId = 1;
const toastListeners = new Set<() => void>();

function emitToasts() {
  toastListeners.forEach(listener => listener());
}

function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function getToastsSnapshot() {
  return activeToasts;
}

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(type: ToastType, message: string, title = '', duration?: number): void {
  const resolvedDuration =
    duration ?? (type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);

  const toast: Toast = {
    id: nextToastId++,
    type,
    message,
    title,
    duration: resolvedDuration,
    revision: Date.now(),
  };

  activeToasts = [...activeToasts, toast].slice(-MAX_TOASTS);
  emitToasts();
}

export default function ToastContainer() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsSnapshot);

  const handleDismiss = useCallback((id: number) => {
    activeToasts = activeToasts.filter(t => t.id !== id);
    emitToasts();
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="nv-snackbar-stack">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>,
    document.body,
  );
}
