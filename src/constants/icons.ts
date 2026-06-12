/**
 * Standard icon sizing scale (px) and default stroke width.
 *
 * Use these everywhere instead of ad-hoc numbers so icons stay visually
 * consistent. The default stroke width is enforced globally via the
 * `.lucide { stroke-width: var(--icon-stroke) }` rule in index.css, so you
 * normally only need to pick a SIZE.
 */
export const ICON_SIZE = {
  /** Dense UI: inline with small text, table cells, chips. */
  dense: 14,
  /** Default: most buttons, list rows, menu items. */
  base: 16,
  /** Prominent actions: header/toolbar buttons, primary CTAs. */
  action: 20,
  /** Empty states / large illustrative glyphs. */
  empty: 36,
} as const;

export type IconSizeToken = keyof typeof ICON_SIZE;

/** Default Lucide stroke width — also mirrored by `--icon-stroke` in CSS. */
export const ICON_STROKE = 1.75;
