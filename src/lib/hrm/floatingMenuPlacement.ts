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

/** Ưu tiên mở xuống; chỉ mở lên khi phía dưới không đủ chỗ và phía trên rộng hơn. */
export function computeFloatingMenuLayout(
  triggerRect: DOMRect,
  menuHeight: number,
  triggerWidth: number,
): FloatingMenuLayout {
  const spaceBelow = window.innerHeight - triggerRect.bottom - GAP - VIEWPORT_PADDING;
  const spaceAbove = triggerRect.top - GAP - VIEWPORT_PADDING;
  const estimatedHeight = menuHeight || MIN_VISIBLE_HEIGHT;

  const openDown =
    spaceBelow >= MIN_VISIBLE_HEIGHT
    || spaceBelow >= estimatedHeight
    || spaceBelow >= spaceAbove;

  const placement: FloatingPlacement = openDown ? 'bottom' : 'top';
  const maxHeight = Math.max(120, placement === 'bottom' ? spaceBelow : spaceAbove);

  const top =
    placement === 'bottom'
      ? triggerRect.bottom + GAP
      : Math.max(VIEWPORT_PADDING, triggerRect.top - GAP - Math.min(estimatedHeight, maxHeight));

  const width = Math.min(triggerWidth, window.innerWidth - VIEWPORT_PADDING * 2);
  let left = triggerRect.left;
  if (left + width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - width;
  }
  left = Math.max(VIEWPORT_PADDING, left);

  return { top, left, width, maxHeight, placement };
}
