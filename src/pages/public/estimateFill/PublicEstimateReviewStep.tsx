import Button from '../../../components/ui/Button';
import TableShell from '../../../components/ui/TableShell';
import type { PublicPurchaseEstimateApiDto } from '../../../types/api/purchasingApi';
import { groupPublicLines, type ProposalDraft } from './estimateFillHelpers';

interface PublicEstimateReviewStepProps {
  row: PublicPurchaseEstimateApiDto;
  preparerName: string;
  filled: PublicPurchaseEstimateApiDto['lines'];
  qtyByCode: Record<string, string>;
  readyProposals: ProposalDraft[];
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export default function PublicEstimateReviewStep({
  row,
  preparerName,
  filled,
  qtyByCode,
  readyProposals,
  isSubmitting,
  onBack,
  onSubmit,
}: PublicEstimateReviewStepProps) {
  return (
    <div className="space-y-3">
      <span className="badge badge-info">Bước 2 - Double check trước khi gửi</span>
      <p>
        Người lập dự toán: <strong>{preparerName.trim()}</strong>
      </p>
      <p className="text-sm text-[var(--md-on-surface-variant)]">
        Chỉ hiển thị {filled.length + readyProposals.length} dòng đã có số lượng / đề xuất, trên tổng{' '}
        {row.lines.length} mã hàng của mẫu.
      </p>
      <TableShell
        colSpan={3}
        isEmpty={filled.length === 0 && readyProposals.length === 0}
        emptyMessage="Chưa có dòng nào được điền."
        header={
          <tr>
            <th className="table-header-cell">Hạng mục</th>
            <th className="table-header-cell">Hàng hoá</th>
            <th className="table-header-cell">Số lượng</th>
          </tr>
        }
      >
        {groupPublicLines({ ...row, lines: filled }).flatMap(([cat, lines]) =>
          lines.map(line => (
            <tr key={line.materialCode} className="table-row">
              <td className="table-cell">{cat}</td>
              <td className="table-cell">
                <span className="font-mono">{line.materialCode}</span>
                {' '}
                {line.materialName}
              </td>
              <td className="table-cell text-right tabular-nums">
                {Number(qtyByCode[line.materialCode] ?? 0).toLocaleString('vi-VN')} {line.unit}
              </td>
            </tr>
          )),
        )}
        {readyProposals.map(p => (
          <tr key={p.key} className="table-row">
            <td className="table-cell">Đề xuất mới</td>
            <td className="table-cell">
              <strong>{p.name}</strong>
              {p.spec ? ` - ${p.spec}` : ''}
              {p.note ? <div className="text-[var(--md-on-surface-variant)]">{p.note}</div> : null}
            </td>
            <td className="table-cell text-right tabular-nums">
              {Number(p.qty).toLocaleString('vi-VN')} {p.unit}
            </td>
          </tr>
        ))}
      </TableShell>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outlined" size="sm" onClick={onBack}>
          Quay lại chỉnh sửa
        </Button>
        <Button type="button" variant="filled" size="sm" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Đang gửi…' : 'Xác nhận gửi dự toán'}
        </Button>
      </div>
    </div>
  );
}
