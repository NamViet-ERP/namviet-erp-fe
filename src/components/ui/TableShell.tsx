import {
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import TableSkeletonRows from './TableSkeletonRows';

interface StickyHeaderMetrics {
  top: number;
  left: number;
  width: number;
  tableWidth: number;
  colWidths: number[];
}

function sameStickyMetrics(a: StickyHeaderMetrics | null, b: StickyHeaderMetrics | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    Math.abs(a.top - b.top) > 0.1 ||
    Math.abs(a.left - b.left) > 0.1 ||
    Math.abs(a.width - b.width) > 0.1 ||
    Math.abs(a.tableWidth - b.tableWidth) > 0.1 ||
    a.colWidths.length !== b.colWidths.length
  ) {
    return false;
  }
  for (let i = 0; i < a.colWidths.length; i += 1) {
    if (Math.abs(a.colWidths[i] - b.colWidths[i]) > 0.1) return false;
  }
  return true;
}

export interface TableShellProps {
  header?: ReactNode;
  colSpan?: number;
  loading?: boolean;
  skeletonRows?: number;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  tfoot?: ReactNode;
  caption?: ReactNode;
  pagination?: ComponentProps<typeof Pagination>;
  flushTop?: boolean;
  /** Pin table header below fixed `.nv-header` when scrolling down long pages. */
  stickyPageHeader?: boolean;
  tableClassName?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Canonical responsive data table container:
 * always guarantees horizontal scroll wrapper + loading skeleton + error alert + EmptyState + Pagination.
 */
export default function TableShell({
  header,
  colSpan = 1,
  loading = false,
  skeletonRows = 5,
  error = null,
  isEmpty = false,
  emptyMessage,
  emptyIcon,
  emptyAction,
  tfoot,
  caption,
  pagination,
  flushTop = false,
  stickyPageHeader = false,
  tableClassName = 'wms-inventory-table',
  className = '',
  children,
}: TableShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const cloneScrollRef = useRef<HTMLDivElement>(null);
  const cloneTheadRef = useRef<HTMLTableSectionElement>(null);
  const [stickyMetrics, setStickyMetrics] = useState<StickyHeaderMetrics | null>(null);

  const scrollCls = [
    'erp-table-shell__scroll',
    'hrm-table-wrap',
    'wms-inventory-table-wrap',
    flushTop ? 'wms-inventory-table-wrap--flush-top' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedTableCls = ['erp-table-shell__table', tableClassName].filter(Boolean).join(' ');
  const hasStructuredHeader = header !== undefined && header !== null;
  const wrapsOwnTable = !hasStructuredHeader && isValidElement(children) && children.type === 'table';
  const activeSticky = Boolean(stickyPageHeader && hasStructuredHeader && !loading && !error && !isEmpty);
  const showStickyHeader = activeSticky && stickyMetrics !== null;

  const measureStickyHeader = useCallback(() => {
    const scrollEl = scrollRef.current;
    const tableEl = tableRef.current;
    const theadEl = theadRef.current;
    if (!scrollEl || !tableEl || !theadEl) {
      setStickyMetrics(prev => (prev === null ? prev : null));
      return;
    }

    const headerEl = document.querySelector('.nv-header');
    const chromeTop =
      headerEl instanceof HTMLElement && getComputedStyle(headerEl).position === 'fixed'
        ? Math.max(0, Math.round(headerEl.getBoundingClientRect().bottom))
        : 0;

    const theadRect = theadEl.getBoundingClientRect();
    const bodyEl = tbodyRef.current ?? tableEl;
    const bodyBottom = bodyEl.getBoundingClientRect().bottom;

    const isVisible =
      theadRect.height > 0 &&
      theadRect.top < chromeTop - 1 &&
      bodyBottom > chromeTop + theadRect.height;

    if (!isVisible) {
      setStickyMetrics(prev => (prev === null ? prev : null));
      return;
    }

    const wrapRect = scrollEl.getBoundingClientRect();
    const tableWidth = tableEl.getBoundingClientRect().width;
    const firstRowThs = theadEl.querySelectorAll('tr:first-child > th');
    const thNodes = firstRowThs.length > 0 ? firstRowThs : theadEl.querySelectorAll('th');
    const colWidths = Array.from(thNodes, th => th.getBoundingClientRect().width);

    if (wrapRect.width <= 0 || tableWidth <= 0 || colWidths.length === 0) {
      setStickyMetrics(prev => (prev === null ? prev : null));
      return;
    }

    const next: StickyHeaderMetrics = {
      top: chromeTop,
      left: wrapRect.left,
      width: wrapRect.width,
      tableWidth,
      colWidths,
    };

    setStickyMetrics(prev => (sameStickyMetrics(prev, next) ? prev : next));
  }, []);

  useEffect(() => {
    if (!activeSticky) {
      setStickyMetrics(prev => (prev === null ? prev : null));
      return;
    }

    measureStickyHeader();

    const scrollEl = scrollRef.current;
    const tableEl = tableRef.current;
    const appMainEl = document.querySelector('.app-main');

    const syncHorizontalScroll = () => {
      if (cloneScrollRef.current && scrollEl) {
        cloneScrollRef.current.scrollLeft = scrollEl.scrollLeft;
      }
    };

    const handleScroll = () => {
      syncHorizontalScroll();
      measureStickyHeader();
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', measureStickyHeader, { passive: true });
    scrollEl?.addEventListener('scroll', syncHorizontalScroll, { passive: true });

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureStickyHeader();
      });
      if (scrollEl) resizeObserver.observe(scrollEl);
      if (tableEl) resizeObserver.observe(tableEl);
      if (appMainEl) resizeObserver.observe(appMainEl);
    }

    let transitionRafId = 0;
    let isTransitioning = false;
    const stopTransitionSync = () => {
      isTransitioning = false;
      if (transitionRafId) {
        cancelAnimationFrame(transitionRafId);
        transitionRafId = 0;
      }
      measureStickyHeader();
    };
    const tickTransitionSync = () => {
      if (!isTransitioning) return;
      measureStickyHeader();
      transitionRafId = requestAnimationFrame(tickTransitionSync);
    };
    const startTransitionSync = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      transitionRafId = requestAnimationFrame(tickTransitionSync);
    };

    if (appMainEl) {
      appMainEl.addEventListener('transitionrun', startTransitionSync);
      appMainEl.addEventListener('transitionend', stopTransitionSync);
      appMainEl.addEventListener('transitioncancel', stopTransitionSync);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', measureStickyHeader);
      scrollEl?.removeEventListener('scroll', syncHorizontalScroll);
      resizeObserver?.disconnect();
      if (appMainEl) {
        appMainEl.removeEventListener('transitionrun', startTransitionSync);
        appMainEl.removeEventListener('transitionend', stopTransitionSync);
        appMainEl.removeEventListener('transitioncancel', stopTransitionSync);
      }
      if (transitionRafId) {
        cancelAnimationFrame(transitionRafId);
      }
    };
  }, [activeSticky, measureStickyHeader]);

  useLayoutEffect(() => {
    if (!showStickyHeader || !stickyMetrics) return;
    const cloneScrollEl = cloneScrollRef.current;
    const realScrollEl = scrollRef.current;
    if (cloneScrollEl && realScrollEl) {
      cloneScrollEl.scrollLeft = realScrollEl.scrollLeft;
    }
    const cloneTheadEl = cloneTheadRef.current;
    if (cloneTheadEl) {
      const firstRowThs = cloneTheadEl.querySelectorAll<HTMLTableCellElement>('tr:first-child > th');
      const thNodes =
        firstRowThs.length > 0
          ? firstRowThs
          : cloneTheadEl.querySelectorAll<HTMLTableCellElement>('th');
      thNodes.forEach((th, idx) => {
        const w = stickyMetrics.colWidths[idx];
        if (w !== undefined) {
          const px = `${w}px`;
          th.style.width = px;
          th.style.minWidth = px;
          th.style.maxWidth = px;
        }
      });
    }
  }, [showStickyHeader, stickyMetrics, header]);

  const renderStructuredBody = () => {
    if (loading) {
      return <TableSkeletonRows colSpan={colSpan} rows={skeletonRows} />;
    }
    if (error) {
      return (
        <tr>
          <td colSpan={colSpan} className="table-cell erp-table-shell__error" role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (isEmpty) {
      return (
        <tr className="erp-table-shell__empty-row">
          <td colSpan={colSpan} className="erp-table-shell__empty-cell">
            <div className="erp-table-shell__sticky-center">
              <EmptyState message={emptyMessage} icon={emptyIcon} action={emptyAction} />
            </div>
          </td>
        </tr>
      );
    }
    return children;
  };

  const renderWrapperContent = () => {
    if (loading) {
      return (
        <table className={resolvedTableCls}>
          <tbody>
            <TableSkeletonRows colSpan={colSpan} rows={skeletonRows} />
          </tbody>
        </table>
      );
    }
    if (error) {
      return (
        <div className="erp-table-shell__error" role="alert">
          {error}
        </div>
      );
    }
    if (isEmpty) {
      return <EmptyState message={emptyMessage} icon={emptyIcon} action={emptyAction} />;
    }
    if (wrapsOwnTable) {
      return children;
    }
    return (
      <table className={resolvedTableCls}>
        {children}
        {tfoot ? <tfoot>{tfoot}</tfoot> : null}
      </table>
    );
  };

  const isStructuredEmpty = isEmpty && hasStructuredHeader && !loading && !error;

  return (
    <div
      className={[
        'erp-table-shell',
        isStructuredEmpty ? 'erp-table-shell--empty' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showStickyHeader && stickyMetrics && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-hidden="true"
              className="erp-table-shell__sticky-float"
              style={{
                top: `${stickyMetrics.top}px`,
                left: `${stickyMetrics.left}px`,
                width: `${stickyMetrics.width}px`,
              }}
            >
              <div ref={cloneScrollRef} className="erp-table-shell__sticky-scroll">
                <table
                  className={`${resolvedTableCls} erp-table-shell__sticky-table`}
                  style={{
                    width: `${stickyMetrics.tableWidth}px`,
                    minWidth: `${stickyMetrics.tableWidth}px`,
                  }}
                >
                  <colgroup>
                    {stickyMetrics.colWidths.map((w, idx) => (
                      <col key={idx} style={{ width: `${w}px` }} />
                    ))}
                  </colgroup>
                  <thead ref={cloneTheadRef}>{header}</thead>
                </table>
              </div>
            </div>,
            document.body,
          )
        : null}

      <div ref={scrollRef} className={scrollCls}>
        {hasStructuredHeader ? (
          <table ref={tableRef} className={resolvedTableCls}>
            <thead ref={theadRef}>{header}</thead>
            <tbody ref={tbodyRef}>{renderStructuredBody()}</tbody>
            {tfoot ? <tfoot>{tfoot}</tfoot> : null}
          </table>
        ) : (
          renderWrapperContent()
        )}
      </div>

      {caption ? <div className="erp-table-shell__caption">{caption}</div> : null}

      {pagination ? (
        <div className="erp-table-shell__footer">
          <Pagination {...pagination} embedded={pagination.embedded ?? true} />
        </div>
      ) : null}
    </div>
  );
}
