import { Link } from 'react-router-dom';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import TableShell from '../../../components/ui/TableShell';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { SupplierPayableUpcomingApiDto } from '../../../types/api/purchasingApi';
import { ApBoard } from './PayablesBoard';

interface SupplierPayablesUpcomingTableProps {
  upcoming: SupplierPayableUpcomingApiDto[];
  canPay: boolean;
}

export default function SupplierPayablesUpcomingTable({
  upcoming,
  canPay,
}: SupplierPayablesUpcomingTableProps) {
  return (
    <ApBoard
      title="Lịch thanh toán sắp tới"
      desc="Khoản còn nợ chưa quá hạn trong 30 ngày - phục vụ kế hoạch dòng tiền."
    >
      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={6}
        header={(
          <tr>
            <th className="table-header-cell">Hạn TT</th>
            <th className="table-header-cell">Nhà cung cấp</th>
            <th className="table-header-cell">Dự án</th>
            <th className="table-header-cell">PO / DNTT</th>
            <th className="table-header-cell text-right">Còn nợ</th>
            <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
          </tr>
        )}
      >
        {upcoming.map(row => (
          <tr key={row.paymentCode} className="table-row">
            <td className="table-cell">
              {formatDateCell(row.dueDate)}
              <div className="sup-ap-meta">còn {row.daysUntilDue} ngày</div>
            </td>
            <td className="table-cell">{row.supplierName || '-'}</td>
            <td className="table-cell">
              {row.projectCode ? (
                <EntityCodeLink
                  code={row.projectCode}
                  to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                />
              ) : (
                <span className="entity-code">-</span>
              )}
            </td>
            <td className="table-cell">
              <EntityCodeLink
                code={row.poCode}
                to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
              />
              <div className="sup-ap-meta sup-ap-meta--mono">{row.paymentCode}</div>
            </td>
            <td className="table-cell text-right tabular-nums whitespace-nowrap">
              {formatCurrencyFull(row.outstanding)}
            </td>
            <td className="table-cell hrm-table-col-actions">
              {canPay ? (
                <Link className="btn btn-filled btn-sm" to={`/purchasing/payments/${encodeURIComponent(row.paymentCode)}`}>
                  Ghi nhận TT
                </Link>
              ) : null}
            </td>
          </tr>
        ))}
      </TableShell>
    </ApBoard>
  );
}
