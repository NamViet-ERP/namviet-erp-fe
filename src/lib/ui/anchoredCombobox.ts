import type { CSSProperties } from 'react';

/** Cao đủ ~7–8 dòng option trong bảng ERP; không nuốt hết viewport. */
export const COMBOBOX_PANEL_MAX_H = 320;
export const COMBOBOX_PANEL_MIN_H = 140;
export const COMBOBOX_VIEWPORT_PAD = 8;
export const COMBOBOX_GAP = 6;

export function normalizeComboboxQuery(q: string) {
  return q.trim().toLowerCase();
}

export function collectScrollParents(el: HTMLElement | null) {
  const nodes: HTMLElement[] = [];
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    const o = style.overflow;
    if (/(auto|scroll|overlay)/.test(`${oy} ${o}`) && node.scrollHeight > node.clientHeight + 1) {
      nodes.push(node);
    }
    node = node.parentElement;
  }
  return nodes;
}

/** Ô input còn nhìn thấy trong viewport và vùng scroll cha (modal). */
export function isInputAnchoredVisible(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;

  const inset = 6;
  if (
    rect.bottom < inset ||
    rect.top > window.innerHeight - inset ||
    rect.right < inset ||
    rect.left > window.innerWidth - inset
  ) {
    return false;
  }

  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay|hidden)/.test(`${style.overflowY} ${style.overflow}`)) {
      const clip = node.getBoundingClientRect();
      if (rect.bottom < clip.top + inset || rect.top > clip.bottom - inset) {
        return false;
      }
    }
    node = node.parentElement;
  }
  return true;
}

export type ComboboxPlacement = 'below' | 'above';

export function computeAnchoredPanelStyle(
  rect: DOMRect,
  compact: boolean,
): { placement: ComboboxPlacement; style: CSSProperties } {
  const spaceBelow = window.innerHeight - rect.bottom - COMBOBOX_GAP - COMBOBOX_VIEWPORT_PAD;
  const spaceAbove = rect.top - COMBOBOX_GAP - COMBOBOX_VIEWPORT_PAD;
  /* Ưu tiên phía còn nhiều chỗ — tránh list chỉ 1–2 dòng khi ô gần đáy trang */
  const placement: ComboboxPlacement = spaceAbove > spaceBelow + 24 ? 'above' : 'below';
  const room = placement === 'below' ? spaceBelow : spaceAbove;
  const available = Math.max(COMBOBOX_PANEL_MIN_H, room);
  const maxHeight = Math.min(COMBOBOX_PANEL_MAX_H, available);

  const minPanelWidth = compact ? 300 : 340;
  const maxPanelWidth = window.innerWidth - COMBOBOX_VIEWPORT_PAD * 2;
  const width = Math.min(Math.max(rect.width, minPanelWidth), maxPanelWidth);

  let left = rect.left;
  if (left + width > window.innerWidth - COMBOBOX_VIEWPORT_PAD) {
    left = Math.max(
      COMBOBOX_VIEWPORT_PAD,
      window.innerWidth - COMBOBOX_VIEWPORT_PAD - width,
    );
  }

  const style: CSSProperties = {
    position: 'fixed',
    left,
    width,
    maxHeight,
    transform: 'none',
    zIndex: 1200,
    ...(placement === 'below'
      ? { top: rect.bottom + COMBOBOX_GAP, bottom: 'auto' }
      : { top: 'auto', bottom: window.innerHeight - rect.top + COMBOBOX_GAP }),
  };

  return { placement, style };
}
