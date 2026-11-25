import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import TableSkeletonRows from './TableSkeletonRows';

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
  tableClassName = 'wms-inventory-table',
  className = '',
  children,
}: TableShellProps) {
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
        <tr>
          <td colSpan={colSpan}>
            <EmptyState message={emptyMessage} icon={emptyIcon} action={emptyAction} />
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

  return (
    <div className={['erp-table-shell', className].filter(Boolean).join(' ')}>
      <div className={scrollCls}>
        {hasStructuredHeader ? (
          <table className={resolvedTableCls}>
            <thead>{header}</thead>
            <tbody>{renderStructuredBody()}</tbody>
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
