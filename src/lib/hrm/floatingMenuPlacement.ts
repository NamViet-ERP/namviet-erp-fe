export type FloatingPlacement = 'top' | 'bottom';

export type FloatingMenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: FloatingPlacement;
};

const GAP = 4;
const VIEWPORT_PADDING = 8;
const MIN_VISIBLE_HEIGHT = 160;

/** Luôn mở xuống; list cuộn khi không đủ chỗ. */
export function computeFloatingMenuLayout(
  triggerRect: DOMRect,
  menuHeight: number,
  triggerWidth: number,
): FloatingMenuLayout {
  const spaceBelow = window.innerHeight - triggerRect.bottom - GAP - VIEWPORT_PADDING;
  const placement: FloatingPlacement = 'bottom';
  const maxHeight = Math.min(
    Math.max(menuHeight || MIN_VISIBLE_HEIGHT, 120),
    Math.max(120, spaceBelow),
  );

  const top = triggerRect.bottom + GAP;

  const width = Math.min(triggerWidth, window.innerWidth - VIEWPORT_PADDING * 2);
  let left = triggerRect.left;
  if (left + width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - width;
  }
  left = Math.max(VIEWPORT_PADDING, left);

  return { top, left, width, maxHeight, placement };
}
