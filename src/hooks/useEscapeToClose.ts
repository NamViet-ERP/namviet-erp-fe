import { useEffect } from 'react';

const closers: Array<() => void> = [];
let attached = false;

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  const top = closers[closers.length - 1];
  if (!top) return;
  event.preventDefault();
  top();
}

/** Closes the topmost dialog on Escape. Nested dialogs pop in LIFO order. */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    closers.push(onClose);
    if (!attached) {
      document.addEventListener('keydown', onDocumentKeyDown);
      attached = true;
    }

    return () => {
      const index = closers.lastIndexOf(onClose);
      if (index >= 0) closers.splice(index, 1);
      if (closers.length === 0 && attached) {
        document.removeEventListener('keydown', onDocumentKeyDown);
        attached = false;
      }
    };
  }, [open, onClose]);
}
