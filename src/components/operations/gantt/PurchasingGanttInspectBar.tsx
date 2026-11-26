import { purchasingProgressMeta } from '../../../lib/wms/purchasingProgressStatus';
import { fmt, formatQty, type GanttNode } from './purchasingGanttModel';

interface PurchasingGanttInspectBarProps {
  hovered: GanttNode | null;
}

export default function PurchasingGanttInspectBar({ hovered }: PurchasingGanttInspectBarProps) {
  const hoveredMeta = hovered ? purchasingProgressMeta(hovered.status) : null;

  return (
    <p className="ops-gantt__inspect" role="status">
      {hovered && hoveredMeta ? (
        <>
          <span className={`badge ${hoveredMeta.badgeClass}`}>{hoveredMeta.label}</span>
          <strong>{hovered.title}</strong>
          <span>Kế hoạch {fmt(hovered.plannedStart)} - {fmt(hovered.plannedEnd)}</span>
          {hovered.kind === 'nk' ? (
            <>
              <span className="tabular-nums">SL {formatQty(hovered.ordered ?? 0)}</span>
              <span>
                {hovered.actualEnd
                  ? `Nhập thực tế ${fmt(hovered.actualEnd)}`
                  : 'Chưa duyệt - không tính đã nhận'}
              </span>
            </>
          ) : (
            <>
              <span>
                {hovered.actualEnd && (hovered.status === 'completed' || (hovered.percentComplete ?? 0) >= 100)
                  ? `Nhập kho ${fmt(hovered.actualEnd)}`
                  : hovered.status === 'late'
                    ? 'Quá hạn giao, chưa nhập đủ'
                    : hovered.actualEnd
                      ? `Đã nhập một phần ${fmt(hovered.actualEnd)}`
                      : 'Chưa nhập kho'}
              </span>
              {hovered.ordered != null ? (
                <span className="tabular-nums">
                  Đã nhận {hovered.received}/{hovered.ordered} ({hovered.percentComplete}%)
                </span>
              ) : null}
            </>
          )}
        </>
      ) : (
        <span>Rê chuột vào thanh để xem ngày. Bấm mũi tên để sổ KHMH/MHPS, PO, phiếu NK và vật tư.</span>
      )}
    </p>
  );
}
