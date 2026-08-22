/** Shared UI-only types — re-exported from types/index for gradual migration. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'wide';
/** `branded` = navy header, for document dialogs (phiếu, chứng từ). */
export type ModalVariant = 'plain' | 'branded';
export type CardAccent =
  | 'amber'
  | 'blue'
  | 'teal'
  | 'purple'
  | 'warning'
  | 'danger'
  | 'success'
  | 'info'
  | 'primary'
  | 'neutral'
  | 'stone';
