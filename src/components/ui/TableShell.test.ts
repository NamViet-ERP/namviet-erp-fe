import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TableShell from './TableShell';

function makeRect(overrides: Partial<DOMRect>): DOMRect {
  const top = overrides.top ?? 0;
  const left = overrides.left ?? 0;
  const width = overrides.width ?? 0;
  const height = overrides.height ?? 0;
  const bottom = overrides.bottom ?? top + height;
  const right = overrides.right ?? left + width;
  return {
    x: left,
    y: top,
    top,
    left,
    right,
    bottom,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('TableShell stickyPageHeader', () => {
  let container: HTMLDivElement;
  let root: Root;
  let chromeHeader: HTMLElement;
  let appMain: HTMLElement;

  let chromeBottom = 60;
  let wrapLeft = 252;
  let wrapWidth = 1166;
  let tableWidth = 1420.5;
  let colWidths = [116, 184, 168, 224, 184, 100, 144, 188.5, 112];
  let theadTop = 240;
  let theadHeight = 42;
  let tbodyBottom = 900;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

    chromeBottom = 60;
    wrapLeft = 252;
    wrapWidth = 1166;
    tableWidth = 1420.5;
    colWidths = [116, 184, 168, 224, 184, 100, 144, 188.5, 112];
    theadTop = 240;
    theadHeight = 42;
    tbodyBottom = 900;

    chromeHeader = document.createElement('header');
    chromeHeader.className = 'nv-header';
    chromeHeader.style.position = 'fixed';
    chromeHeader.getBoundingClientRect = () => makeRect({ top: 0, left: 0, width: 1440, height: chromeBottom });
    document.body.append(chromeHeader);

    appMain = document.createElement('main');
    appMain.className = 'app-main';
    document.body.append(appMain);

    container = document.createElement('div');
    appMain.append(container);
    root = createRoot(container);

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this === chromeHeader) {
        return makeRect({ top: 0, left: 0, width: 1440, height: chromeBottom });
      }
      if (this.closest('.erp-table-shell__sticky-float')) {
        return makeRect({ top: chromeBottom, left: wrapLeft, width: wrapWidth, height: theadHeight });
      }
      if (this.classList.contains('erp-table-shell__scroll')) {
        return makeRect({ top: theadTop, left: wrapLeft, width: wrapWidth, height: tbodyBottom - theadTop });
      }
      if (this.tagName === 'TABLE') {
        return makeRect({ top: theadTop, left: wrapLeft, width: tableWidth, height: tbodyBottom - theadTop });
      }
      if (this.tagName === 'THEAD') {
        return makeRect({ top: theadTop, left: wrapLeft, width: tableWidth, height: theadHeight });
      }
      if (this.tagName === 'TBODY') {
        return makeRect({
          top: theadTop + theadHeight,
          left: wrapLeft,
          width: tableWidth,
          height: tbodyBottom - (theadTop + theadHeight),
          bottom: tbodyBottom,
        });
      }
      if (this.tagName === 'TH') {
        const row = this.parentElement;
        const idx = row ? Array.from(row.children).indexOf(this) : -1;
        const w = colWidths[idx] ?? 120;
        return makeRect({ top: theadTop, left: wrapLeft, width: w, height: theadHeight });
      }
      return makeRect({ top: 0, left: 0, width: 0, height: 0 });
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    chromeHeader.remove();
    appMain.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderSupplierSampleTable = async (props?: Partial<Parameters<typeof TableShell>[0]>) => {
    const headers = [
      'Mã NCC',
      'Tên nhà cung cấp',
      'Người liên hệ',
      'Nhóm ngành hàng',
      'Công nợ & Điều khoản',
      'Hạng',
      'Trạng thái',
      'Doanh số & Đánh giá',
      'Tác vụ',
    ];
    await act(async () => {
      root.render(
        createElement(
          TableShell,
          {
            tableClassName: 'w-full border-collapse hrm-table ncc-master-table',
            colSpan: 9,
            stickyPageHeader: true,
            header: createElement(
              'tr',
              null,
              ...headers.map(label =>
                createElement('th', { key: label, className: 'table-header-cell' }, label),
              ),
            ),
            ...props,
          },
          createElement(
            'tr',
            { className: 'table-row' },
            createElement('td', { className: 'table-cell' }, 'NCC-001'),
            createElement('td', { className: 'table-cell' }, 'Công ty TNHH Thép Hòa Phát Miền Nam'),
            createElement('td', { className: 'table-cell' }, 'Nguyễn Minh Tuấn'),
            createElement('td', { className: 'table-cell' }, 'Thép hình'),
            createElement('td', { className: 'table-cell' }, '30 ngày · 500.000.000 VNĐ'),
            createElement('td', { className: 'table-cell' }, 'Hạng B'),
            createElement('td', { className: 'table-cell' }, 'Đã duyệt'),
            createElement('td', { className: 'table-cell' }, '1.250.000.000 VNĐ'),
            createElement('td', { className: 'table-cell' }, 'Tác vụ'),
          ),
        ),
      );
    });
  };

  it('stays hidden when stickyPageHeader is false even if scrolled past thead', async () => {
    theadTop = 20;
    await renderSupplierSampleTable({ stickyPageHeader: false });
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();
  });

  it('pins aligned floating header via document.body portal below .nv-header while scrolled inside tbody, syncs scrollLeft, and hides past tbody', async () => {
    await renderSupplierSampleTable();
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();

    const realScroll = container.querySelector<HTMLDivElement>('.erp-table-shell__scroll')!;
    realScroll.scrollLeft = 180;

    // Scroll down so thead moves under fixed .nv-header (bottom=60), tbody still visible
    theadTop = 24;
    tbodyBottom = 720;
    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
    });

    const floatEl = document.body.querySelector<HTMLDivElement>('.erp-table-shell__sticky-float')!;
    expect(floatEl).not.toBeNull();
    expect(floatEl.parentElement).toBe(document.body);
    expect(container.querySelector('.erp-table-shell__sticky-float')).toBeNull();
    expect(floatEl.getAttribute('aria-hidden')).toBe('true');
    expect(floatEl.style.top).toBe('60px');
    expect(floatEl.style.left).toBe('252px');
    expect(floatEl.style.width).toBe('1166px');

    const cloneScroll = floatEl.querySelector<HTMLDivElement>('.erp-table-shell__sticky-scroll')!;
    expect(cloneScroll.scrollLeft).toBe(180);

    const cloneTable = floatEl.querySelector<HTMLTableElement>('table.erp-table-shell__sticky-table')!;
    expect(cloneTable.style.width).toBe('1420.5px');
    expect(cloneTable.style.minWidth).toBe('1420.5px');

    const cols = [...cloneTable.querySelectorAll('colgroup col')].map(c => (c as HTMLElement).style.width);
    expect(cols).toEqual(colWidths.map(w => `${w}px`));

    const cloneThs = [...cloneTable.querySelectorAll<HTMLTableCellElement>('thead th')];
    expect(cloneThs).toHaveLength(9);
    cloneThs.forEach((th, idx) => {
      const expected = `${colWidths[idx]}px`;
      expect(th.style.width).toBe(expected);
      expect(th.style.minWidth).toBe(expected);
      expect(th.style.maxWidth).toBe(expected);
    });

    // Horizontal scroll updates mirror scrollLeft immediately
    realScroll.scrollLeft = 240;
    await act(async () => {
      realScroll.dispatchEvent(new Event('scroll'));
    });
    expect(cloneScroll.scrollLeft).toBe(240);

    // Sidebar collapse or viewport resize re-aligns left & width
    wrapLeft = 68;
    wrapWidth = 1350;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(floatEl.style.left).toBe('68px');
    expect(floatEl.style.width).toBe('1350px');

    // Scroll past tbody bottom (<= chromeBottom + theadHeight = 102) -> hides floating header
    tbodyBottom = 96;
    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();
  });

  it('hides floating header when loading, error, or empty even when scrolled past top', async () => {
    theadTop = 20;
    tbodyBottom = 720;
    await renderSupplierSampleTable();
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).not.toBeNull();

    await renderSupplierSampleTable({ loading: true });
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();

    await renderSupplierSampleTable({ isEmpty: true });
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();

    await renderSupplierSampleTable({ error: 'Không tải được dữ liệu nhà cung cấp.' });
    expect(document.body.querySelector('.erp-table-shell__sticky-float')).toBeNull();
  });
});
