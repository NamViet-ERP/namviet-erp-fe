interface OverlayEntry {
  onClose: () => void;
  dialog?: HTMLElement;
  previousFocus: HTMLElement | null;
}

// Dialogs and other Escape-dismissable overlays share the same opening order.
const overlays: OverlayEntry[] = [];
const focusableSelector = 'button, input:not([type="hidden"]), select, textarea, a[href], [tabindex]';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled')
      && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0);
}

function controlledPopup(dialog: HTMLElement, target: Element | null) {
  for (const owner of dialog.querySelectorAll<HTMLElement>('[aria-controls]')) {
    for (const id of (owner.getAttribute('aria-controls') ?? '').split(/\s+/)) {
      const popup = document.getElementById(id);
      if (popup?.contains(target)) return { owner, popup };
    }
  }
  return null;
}

function containsFocus(dialog: HTMLElement, target: Element | null) {
  return dialog.contains(target) || controlledPopup(dialog, target) !== null;
}

function focus(element: HTMLElement) {
  element.focus({ preventScroll: true });
}

function focusInitial(dialog: HTMLElement) {
  focus(focusableElements(dialog)[0] ?? dialog);
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  const top = overlays[overlays.length - 1];
  if (!top) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    top.onClose();
    return;
  }

  if (event.key !== 'Tab' || !top.dialog) return;
  const dialog = top.dialog;
  const elements = focusableElements(dialog);
  const first = elements[0] ?? dialog;
  const last = elements[elements.length - 1] ?? dialog;
  const active = document.activeElement;
  const controlled = controlledPopup(dialog, active);

  // Portaled pickers remain part of their owning dialog's keyboard sequence.
  if (controlled) {
    const popupElements = focusableElements(controlled.popup);
    const edge = event.shiftKey ? popupElements[0] : popupElements[popupElements.length - 1];
    if (!popupElements.length || active === edge) {
      event.preventDefault();
      const next = elements[elements.indexOf(controlled.owner) + 1] ?? first;
      focus(event.shiftKey ? controlled.owner : next);
    }
    return;
  }

  if (!elements.length || !dialog.contains(active) || (event.shiftKey ? active === first : active === last)) {
    event.preventDefault();
    focus(event.shiftKey ? last : first);
  }
}

export function registerOverlay(onClose: () => void, dialog?: HTMLElement) {
  const entry: OverlayEntry = {
    onClose,
    dialog,
    previousFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
  };
  if (overlays.length === 0) document.addEventListener('keydown', onDocumentKeyDown);
  overlays.push(entry);
  if (dialog) focusInitial(dialog);

  return () => {
    const index = overlays.indexOf(entry);
    if (index < 0) return;
    const wasTop = index === overlays.length - 1;
    overlays.splice(index, 1);
    if (overlays.length === 0) document.removeEventListener('keydown', onDocumentKeyDown);
    if (!dialog) return;

    // If a parent disappears first, its children must restore to the parent's
    // opener when they eventually close, rather than to a detached control.
    for (const overlay of overlays.slice(index)) {
      if (containsFocus(dialog, overlay.previousFocus)) overlay.previousFocus = entry.previousFocus;
    }
    if (!wasTop) return;

    const parent = overlays[overlays.length - 1]?.dialog;
    const previous = entry.previousFocus;
    if (previous?.isConnected && (!parent || containsFocus(parent, previous))) {
      focus(previous);
      if (document.activeElement === previous) return;
    }
    if (parent) focusInitial(parent);
  };
}
