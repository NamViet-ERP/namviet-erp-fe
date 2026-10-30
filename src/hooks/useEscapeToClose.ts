import { useEffectEvent, useLayoutEffect } from 'react';
import { registerOverlay } from '../lib/dialogStack';

/** Closes the topmost dialog on Escape. Nested dialogs pop in LIFO order. */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useLayoutEffect(() => {
    if (!open) return;
    return registerOverlay(() => close());
  }, [open]);
}
