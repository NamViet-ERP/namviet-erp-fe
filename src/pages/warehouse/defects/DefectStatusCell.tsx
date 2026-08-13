import Badge from '../../../components/ui/Badge';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import { nameInitials, statusLabel, toStatusKey } from './defectUtils';

/** Trạng thái phiếu — khớp hình dáng PoApprovalStatusCell (purchasing) khi đã duyệt/đang xử lý/đã xử lý. */
export default function DefectStatusCell({ row }: { row: PurchaseDefectApiDto }) {
  if (row.status !== 'approved') {
    return <Badge status={toStatusKey(row.status)} label={statusLabel(row.status)} />;
  }

  if (row.processingPhase === 'processing') {
    return <Badge status="pending" label="Đang xử lý" />;
  }

  if (row.processingPhase === 'processed') {
    const name = row.processedByName?.trim() || '—';
    return (
      <div className="pur-erp--po defect-status-cell">
        <div className="pur-erp__approve">
          <Badge status="approved" label="Đã xử lý" />
          <div className="pur-erp__approve-user">
            <span className="pur-erp__approve-avatar" title={name}>{nameInitials(name)}</span>
            <span className="pur-erp__approve-name" title={name}>{name}</span>
          </div>
        </div>
      </div>
    );
  }

  const approver = row.approvedByName?.trim() || '—';
  return (
    <div className="pur-erp--po defect-status-cell">
      <div className="pur-erp__approve">
        <Badge status="approved" label="Đã duyệt" />
        <div className="pur-erp__approve-user">
          <span className="pur-erp__approve-avatar" title={approver}>{nameInitials(approver)}</span>
          <span className="pur-erp__approve-name" title={approver}>{approver}</span>
        </div>
      </div>
    </div>
  );
}
