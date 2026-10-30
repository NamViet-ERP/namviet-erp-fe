import { useEffectEvent, useLayoutEffect, type RefObject } from 'react';
import { registerOverlay } from '../lib/dialogStack';

/** Registers one modal layer for initial focus, keyboard trapping and restore. */
export function useDialogFocus(open: boolean, dialogRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useLayoutEffect(() => {
    if (!open || !dialogRef.current) return;
    return registerOverlay(() => close(), dialogRef.current);
  }, [open, dialogRef]);
}
