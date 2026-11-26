import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import TableShell from '../../../components/ui/TableShell';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { PurchaseEstimateApprovalApiDto } from '../../../types/api/purchasingApi';

interface EstimateApprovalsPanelProps {
  approvals: PurchaseEstimateApprovalApiDto[];
  nextApproval?: PurchaseEstimateApprovalApiDto;
  canDecide: boolean;
  latestVersion: number;
  decideNote: string;
  busy: boolean;
  onDecideNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function EstimateApprovalsPanel({
  approvals,
  nextApproval,
  canDecide,
  latestVersion,
  decideNote,
  busy,
  onDecideNoteChange,
  onApprove,
  onReject,
}: EstimateApprovalsPanelProps) {
  if (approvals.length === 0) return null;

  return (
    <div className="space-y-2">
      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={5}
        header={(
          <tr>
            <th className="table-header-cell">Cấp duyệt</th>
            <th className="table-header-cell">Người duyệt</th>
            <th className="table-header-cell">Trạng thái</th>
            <th className="table-header-cell">Thời điểm</th>
            <th className="table-header-cell">Ý kiến</th>
          </tr>
        )}
      >
        {approvals.map(a => (
          <tr key={a.id} className="table-row">
            <td className="table-cell">{a.name}</td>
            <td className="table-cell font-medium">{a.actionByName?.trim() || '-'}</td>
            <td className="table-cell">
              <span
                className={`badge ${
                  a.status === 'approved'
                    ? 'badge-success'
                    : a.status === 'rejected'
                      ? 'badge-error'
                      : 'badge-pending'
                }`}
              >
                {a.status === 'approved' ? 'Đã duyệt' : a.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
              </span>
            </td>
            <td className="table-cell">{a.actionAt ? formatDateTimeVi(a.actionAt) : '-'}</td>
            <td className="table-cell">{a.note || '-'}</td>
          </tr>
        ))}
      </TableShell>

      {canDecide && nextApproval ? (
        <div className="pur-estimate-decide" aria-label="Quyết định duyệt">
          <div className="pur-estimate-decide__head">
            <h3 className="pur-estimate-decide__title">Quyết định duyệt</h3>
            <p className="pur-estimate-decide__hint">
              {nextApproval.name} · Ver {latestVersion}
            </p>
          </div>
          <FormField label="Ý kiến (tuỳ chọn)">
            <textarea
              className="form-input"
              rows={3}
              value={decideNote}
              onChange={e => onDecideNoteChange(e.target.value)}
              placeholder="Nhập ý kiến duyệt…"
            />
          </FormField>
          <div className="pur-estimate-decide__actions">
            <Button type="button" variant="outlined" size="sm" disabled={busy} onClick={onReject}>
              Từ chối
            </Button>
            <Button type="button" variant="filled" size="sm" disabled={busy} onClick={onApprove}>
              Duyệt
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
