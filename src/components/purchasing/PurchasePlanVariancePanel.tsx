import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../lib/apiClient';
import { usePurchasePlanVariance } from '../../hooks/usePurchasePlans';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PurchasePlanVarianceStatus } from '../../types/api/purchasePlanVarianceApi';

const STATUS_META: Record<PurchasePlanVarianceStatus, { label: string; pillClass: string }> = {
  on_track: { label: 'Đúng tiến độ', pillClass: 'pur-erp__pill--ok' },
  under_ordered: { label: 'Đặt thiếu', pillClass: 'pur-erp__pill--warn' },
  over_received: { label: 'Nhận vượt', pillClass: 'pur-erp__pill--danger' },
  delayed: { label: 'Trễ tiến độ', pillClass: 'pur-erp__pill--danger' },
};

function statusMeta(status: string) {
  return STATUS_META[status as PurchasePlanVarianceStatus] ?? { label: status, pillClass: 'pur-erp__pill--warn' };
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

interface PurchasePlanVariancePanelProps {
  planCode?: string;
  projectCode?: string;
}

/** Cảnh báo lệch KHMH — số lượng đặt/nhận so với kế hoạch. */
export default function PurchasePlanVariancePanel({ planCode, projectCode }: PurchasePlanVariancePanelProps) {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError, error } = usePurchasePlanVariance({ planCode, projectCode });

  const lines = useMemo(() => {
    const all = (data ?? []).flatMap(group => group.lines);
    return showAll ? all : all.filter(l => l.status !== 'on_track');
  }, [data, showAll]);

  const alertCount = useMemo(
    () => (data ?? []).flatMap(group => group.lines).filter(l => l.status !== 'on_track').length,
    [data],
  );

  return (
    <section className="pur-erp__filter-card" aria-label="Cảnh báo lệch KHMH">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} strokeWidth={1.75} className="text-[var(--md-error,#b3261e)]" aria-hidden />
          <strong className="text-sm">Cảnh báo lệch KHMH</strong>
          {alertCount > 0 ? (
            <span className="pur-erp__pill pur-erp__pill--danger">{alertCount} dòng lệch</span>
          ) : null}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          Hiện tất cả
        </label>
      </div>

      {isError ? (
        <EmptyState message={getApiErrorMessage(error, 'Không tải được dữ liệu lệch KHMH.')} />
      ) : isLoading ? (
        <div className="overflow-x-auto table-scroll">
          <table className="pur-erp__table"><tbody><TableSkeletonRows rows={3} colSpan={7} /></tbody></table>
        </div>
      ) : lines.length === 0 ? (
        <EmptyState
          message={showAll ? 'Chưa có dữ liệu KHMH.' : 'Không có dòng lệch tiến độ - mọi KHMH đều đúng kế hoạch.'}
        />
      ) : (
        <div className="overflow-x-auto table-scroll">
          <table className="pur-erp__table">
            <thead>
              <tr>
                <th>KHMH</th>
                <th>Dự án</th>
                <th>Mặt hàng</th>
                <th className="pur-erp__th-num">KH</th>
                <th className="pur-erp__th-num">Đặt</th>
                <th className="pur-erp__th-num">Nhận</th>
                <th className="pur-erp__th-num">% lệch đặt</th>
                <th className="pur-erp__th-num">% lệch nhận</th>
                <th className="pur-erp__th-status">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const meta = statusMeta(line.status);
                return (
                  <tr key={`${line.planCode}-${line.materialCode ?? line.productName}-${i}`}>
                    <td className="pur-erp__td-code">{line.planCode}</td>
                    <td>{line.projectCode}</td>
                    <td>{line.productName}</td>
                    <td className="pur-erp__td-num">{formatCurrency(line.plannedQty)}</td>
                    <td className="pur-erp__td-num">{formatCurrency(line.orderedQty)}</td>
                    <td className="pur-erp__td-num">{formatCurrency(line.receivedQty)}</td>
                    <td className="pur-erp__td-num">{fmtPct(line.varianceOrderedPct)}</td>
                    <td className="pur-erp__td-num">{fmtPct(line.varianceReceivedPct)}</td>
                    <td className="pur-erp__td-status">
                      <span className={`pur-plan-status pur-erp__pill ${meta.pillClass}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
