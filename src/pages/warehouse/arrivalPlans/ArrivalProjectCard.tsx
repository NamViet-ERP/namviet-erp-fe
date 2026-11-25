import { useMemo } from 'react';
import TableShell from '../../../components/ui/TableShell';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { ArrivalPlanLineStatus, ArrivalPlanProjectApiDto } from '../../../services/arrivalPlansService';

const LINE_STATUS_META: Record<ArrivalPlanLineStatus, { label: string; className: string }> = {
  upcoming: { label: 'Sắp về', className: 'arrival-plans-pill--upcoming' },
  due_today: { label: 'Đến hạn', className: 'arrival-plans-pill--due-today' },
  overdue: { label: 'Quá hạn', className: 'arrival-plans-pill--overdue' },
};

function fmtArrivalQty(n: number) {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

interface ArrivalProjectCardProps {
  project: ArrivalPlanProjectApiDto;
  expanded: boolean;
  canViewPrices: boolean;
  onToggle: () => void;
}

export default function ArrivalProjectCard({
  project,
  expanded,
  canViewPrices,
  onToggle,
}: ArrivalProjectCardProps) {
  const planCodes = useMemo(
    () => Array.from(new Set(project.lines.map(l => l.planCode).filter(Boolean))),
    [project.lines],
  );

  return (
    <li className="arrival-plans-project is-highlight">
      <button type="button" className="arrival-plans-project__head" onClick={onToggle}>
        <div className="arrival-plans-project__title">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="arrival-plans-project__code font-mono">{project.projectCode}</span>
            {planCodes.length > 0 && (
              <span className="arrival-plans-pill font-mono text-[var(--md-primary)]">
                KHMH: {planCodes.join(', ')}
              </span>
            )}
          </div>
          <span className="arrival-plans-project__name">{project.projectName}</span>
        </div>
        <div className="arrival-plans-project__meta">
          <span className="arrival-plans-pill">{project.lineCount} dòng</span>
          <span className="arrival-plans-pill arrival-plans-pill--qty">
            SL {fmtArrivalQty(project.totalRemainingQty)}
          </span>
          {project.earliestExpectedDate && (
            <span className="arrival-plans-pill arrival-plans-pill--date tabular-nums">
              Sớm nhất {formatDateCell(project.earliestExpectedDate)}
            </span>
          )}
          {project.overdueCount > 0 && (
            <span className="arrival-plans-pill arrival-plans-pill--overdue">
              Quá hạn {project.overdueCount}
            </span>
          )}
          {project.dueTodayCount > 0 && (
            <span className="arrival-plans-pill arrival-plans-pill--due-today">
              Đến hạn {project.dueTodayCount}
            </span>
          )}
          <span className="arrival-plans-project__chevron" aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="arrival-plans-project__body">
          <TableShell
            tableClassName="wms-inventory-table arrival-plans-table"
            colSpan={canViewPrices ? 7 : 6}
            isEmpty={project.lines.length === 0}
            emptyMessage="Không có dòng hàng chờ nhận."
            header={
              <tr>
                <th className="table-header-cell">Mặt hàng</th>
                <th className="table-header-cell text-right">Còn lại</th>
                <th className="table-header-cell">ĐVT</th>
                <th className="table-header-cell whitespace-nowrap">Ngày dự kiến</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">NCC</th>
                {canViewPrices && <th className="table-header-cell text-right">Đơn giá</th>}
              </tr>
            }
          >
            {project.lines.map(line => (
              <tr key={line.lineId} className="table-row">
                <td className="table-cell">
                  <div className="font-semibold line-clamp-2" title={line.productName}>
                    {line.productName}
                  </div>
                  {line.materialCode && (
                    <div className="text-xs text-[var(--md-on-surface-variant)] font-mono">
                      {line.materialCode}
                    </div>
                  )}
                </td>
                <td className="table-cell text-right tabular-nums font-semibold">
                  {fmtArrivalQty(line.remainingQty)}
                </td>
                <td className="table-cell">{line.unit}</td>
                <td className="table-cell tabular-nums whitespace-nowrap">
                  {formatDateCell(line.expectedDeliveryDate)}
                </td>
                <td className="table-cell whitespace-nowrap">
                  <span className={`arrival-plans-pill ${LINE_STATUS_META[line.lineStatus as ArrivalPlanLineStatus].className}`}>
                    {LINE_STATUS_META[line.lineStatus as ArrivalPlanLineStatus].label}
                  </span>
                </td>
                <td className="table-cell max-w-[160px]">
                  <span className="line-clamp-2">{line.purchaseSupplierName || '—'}</span>
                </td>
                {canViewPrices && (
                  <td className="table-cell text-right tabular-nums">
                    {line.unitPrice != null ? formatCurrencyFull(line.unitPrice) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </TableShell>
          <p className="arrival-plans-hint">
            Khi nhận đủ trên phiếu nhập kho hoặc xuất thẳng (đã duyệt), dòng không còn trong kế hoạch hàng về.
          </p>
        </div>
      )}
    </li>
  );
}
