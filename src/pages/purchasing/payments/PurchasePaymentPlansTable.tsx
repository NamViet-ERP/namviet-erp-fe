import type { ComponentProps } from 'react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import type { DropdownItem } from '../../../types';
import type {
  PurchasePaymentPlanRowApiDto,
  PurchasePaymentPlanStageApiDto,
} from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';

function stageStatusLabel(status: string): string {
  switch (status.trim().toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'đã thanh toán':
      return 'Đã thanh toán';
    case 'in_progress':
    case 'partial':
      return 'Chờ thanh toán';
    default:
      return 'Chưa lập DNTT';
  }
}

function stageTone(status: string): 'paid' | 'open' {
  const s = status.trim().toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'đã thanh toán') return 'paid';
  return 'open';
}

function stagePillClass(tone: 'paid' | 'open'): string {
  return tone === 'paid' ? 'pur-erp__pill pur-erp__pill--ok' : 'pur-erp__pill pur-erp__pill--warn';
}

function StageCell({ stage }: { stage: PurchasePaymentPlanStageApiDto }) {
  const tone = stageTone(stage.paymentStatus);
  return (
    <div className={`pur-pay-plan__stage pur-pay-plan__stage--${tone}`}>
      <div className="pur-pay-plan__stage-money">
        <span className="pur-pay-plan__stage-amt tabular-nums">
          {formatCurrency(stage.amount)}
        </span>
        <span
          className="pur-pay-plan__stage-pct tabular-nums"
          title={`${stage.percent}% giá trị PO`}
        >
          {stage.percent}%
        </span>
      </div>
      <span className={stagePillClass(tone)}>
        {stageStatusLabel(stage.paymentStatus)}
      </span>
    </div>
  );
}

function ProgressCell({
  completed,
  total,
  amount,
}: {
  completed: number;
  total: number;
  amount: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="pur-pay-plan__total">
      <span className="pur-pay-plan__total-amt tabular-nums">{formatCurrency(amount)}</span>
      <div className="pur-pay-plan__progress" aria-label={`Hoàn thành ${completed}/${total}`}>
        <div className="pur-pay-plan__progress-track">
          <div className="pur-pay-plan__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pur-pay-plan__progress-label tabular-nums">
          {completed}/{total} đợt
        </span>
      </div>
    </div>
  );
}

interface PurchasePaymentPlansTableProps {
  items: PurchasePaymentPlanRowApiDto[];
  stageHeaders: number[];
  isLoading: boolean;
  errorMessage: string | null;
  emptyMessage: string;
  onRetry: () => void;
  onOpenOrder: (poCode: string) => void;
  rowActions: (poCode: string) => DropdownItem[];
  pagination: ComponentProps<typeof Pagination>;
}

export default function PurchasePaymentPlansTable({
  items,
  stageHeaders,
  isLoading,
  errorMessage,
  emptyMessage,
  onRetry,
  onOpenOrder,
  rowActions,
  pagination,
}: PurchasePaymentPlansTableProps) {
  const colCount = 4 + stageHeaders.length;

  if (errorMessage) {
    return (
      <EmptyState
        message={errorMessage}
        action={(
          <Button type="button" variant="outlined" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      />
    );
  }

  return (
    <TableShell
      tableClassName="pur-erp__table pur-erp__table--po pur-erp__table--pay-plan"
      colSpan={colCount}
      loading={isLoading}
      skeletonRows={6}
      isEmpty={items.length === 0}
      emptyMessage={emptyMessage}
      pagination={pagination}
    >
      <table className="pur-erp__table pur-erp__table--po pur-erp__table--pay-plan">
        <colgroup>
          <col className="pur-pay-plan__col-po" />
          <col className="pur-pay-plan__col-project" />
          {stageHeaders.map(n => (
            <col key={n} className="pur-pay-plan__col-stage" />
          ))}
          <col className="pur-pay-plan__col-total" />
          <col className="pur-pay-plan__col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th className="pur-pay-plan__th-po">Mã PO</th>
            <th className="pur-pay-plan__th-project">Dự án</th>
            {stageHeaders.map(n => (
              <th key={n} className="pur-pay-plan__th-stage">Đợt {n}</th>
            ))}
            <th className="pur-pay-plan__th-total">Tổng</th>
            <th className="pur-pay-plan__th-actions">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.poCode}>
              <td className="pur-erp__td-code pur-pay-plan__td-po">
                <button
                  type="button"
                  className="pur-pay-plan__po-link"
                  onClick={() => onOpenOrder(row.poCode)}
                >
                  {row.poCode}
                </button>
              </td>
              <td className="pur-pay-plan__td-project">
                <div className="pur-pay-plan__project">
                  <span className="pur-pay-plan__project-code">
                    {row.projectCode || '—'}
                  </span>
                  {row.projectName ? (
                    <span className="pur-pay-plan__project-name" title={row.projectName}>
                      {row.projectName}
                    </span>
                  ) : null}
                </div>
              </td>
              {stageHeaders.map(n => {
                const stage = row.stages.find(s => s.stageNumber === n);
                return (
                  <td key={n} className="pur-pay-plan__td-stage">
                    {stage ? <StageCell stage={stage} /> : <span className="hrm-empty-cell">—</span>}
                  </td>
                );
              })}
              <td className="pur-pay-plan__td-total">
                <ProgressCell
                  completed={row.completedStages}
                  total={row.totalStages}
                  amount={row.poTotalAmount}
                />
              </td>
              <td className="text-center pur-pay-plan__td-actions">
                <Dropdown trigger="Tác vụ" items={rowActions(row.poCode)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}
