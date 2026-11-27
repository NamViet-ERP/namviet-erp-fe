import Button from '../../../components/ui/Button';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
import type { PublicPurchaseEstimateApiDto } from '../../../types/api/purchasingApi';
import { groupPublicLines, type ProposalDraft } from './estimateFillHelpers';

interface PublicEstimateEditStepProps {
  row: PublicPurchaseEstimateApiDto;
  preparerName: string;
  qtyByCode: Record<string, string>;
  proposals: ProposalDraft[];
  onPreparerNameChange: (value: string) => void;
  onQtyChange: (materialCode: string, value: string) => void;
  onUpdateProposal: (key: string, field: keyof Omit<ProposalDraft, 'key'>, value: string) => void;
  onRemoveProposal: (key: string) => void;
  onAddProposal: () => void;
  onGoReview: () => void;
}

export default function PublicEstimateEditStep({
  row,
  preparerName,
  qtyByCode,
  proposals,
  onPreparerNameChange,
  onQtyChange,
  onUpdateProposal,
  onRemoveProposal,
  onAddProposal,
  onGoReview,
}: PublicEstimateEditStepProps) {
  const preparerOptions = (row.preparers ?? []).map(p => {
    const label = `${p.name} - ${p.roleLabel}`;
    return { value: label, label };
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--md-on-surface-variant)]">
        Chọn người lập (Phòng Dự án / Sản xuất), điền số lượng, sau đó bấm &quot;Xem lại trước khi gửi (Double check)&quot;.
      </p>

      <SelectField
        variant="form"
        label="Người lập dự toán"
        required
        placeholder="Chọn người lập…"
        aria-label="Người lập dự toán"
        value={preparerName}
        onChange={onPreparerNameChange}
        options={preparerOptions}
        preserveUnknownValue
      />

      {(row.preparers ?? []).length === 0 ? (
        <p className="text-sm text-[var(--md-error)]">
          Chưa có người được gán vai trò Phòng Dự án / Sản xuất. Nhờ Admin cấp vai trò ở Thiết lập người dùng.
        </p>
      ) : null}

      {groupPublicLines(row).map(([cat, lines]) => (
        <div key={cat} className="space-y-2">
          <div className="text-sm font-semibold">{cat}</div>
          <TableShell
            colSpan={4}
            header={
              <tr>
                <th className="table-header-cell">Mã hàng</th>
                <th className="table-header-cell">Tên hàng</th>
                <th className="table-header-cell">ĐVT</th>
                <th className="table-header-cell">Số lượng cần dùng</th>
              </tr>
            }
          >
            {lines.map(line => (
              <tr key={line.materialCode} className="table-row">
                <td className="table-cell font-mono">{line.materialCode}</td>
                <td className="table-cell">{line.materialName}</td>
                <td className="table-cell">{line.unit}</td>
                <td className="table-cell">
                  <input
                    className="form-input"
                    inputMode="decimal"
                    min={0}
                    value={qtyByCode[line.materialCode] ?? '0'}
                    onChange={e => onQtyChange(line.materialCode, e.target.value)}
                    aria-label={`Số lượng ${line.materialCode}`}
                  />
                </td>
              </tr>
            ))}
          </TableShell>
        </div>
      ))}

      <div className="space-y-2">
        <div className="text-sm font-semibold">Đề xuất mua thêm / yêu cầu thông số đặc thù</div>
        <p className="text-sm text-[var(--md-on-surface-variant)]">
          Nếu hàng cần mua chưa có mã ở trên, điền vào đây. Phòng Cung ứng sẽ xem xét bổ sung mã trước khi mua.
        </p>
        <TableShell
          colSpan={6}
          isEmpty={proposals.length === 0}
          emptyMessage="Chưa có đề xuất nào."
          header={
            <tr>
              <th className="table-header-cell">Tên hàng đề xuất</th>
              <th className="table-header-cell">Thông số / quy cách</th>
              <th className="table-header-cell">ĐVT</th>
              <th className="table-header-cell">Số lượng</th>
              <th className="table-header-cell">Lý do / mô tả</th>
              <th className="table-header-cell"> </th>
            </tr>
          }
        >
          {proposals.map((p, idx) => (
            <tr key={p.key} className="table-row">
              <td className="table-cell">
                <input className="form-input" value={p.name} placeholder="Tên hàng đề xuất" aria-label={`Tên hàng đề xuất dòng ${idx + 1}`} onChange={e => onUpdateProposal(p.key, 'name', e.target.value)} />
              </td>
              <td className="table-cell">
                <input className="form-input" value={p.spec} placeholder="Thông số / quy cách" aria-label={`Thông số quy cách dòng ${idx + 1}`} onChange={e => onUpdateProposal(p.key, 'spec', e.target.value)} />
              </td>
              <td className="table-cell">
                <input className="form-input" value={p.unit} placeholder="ĐVT" aria-label={`Đơn vị tính dòng ${idx + 1}`} onChange={e => onUpdateProposal(p.key, 'unit', e.target.value)} />
              </td>
              <td className="table-cell">
                <input className="form-input" inputMode="decimal" value={p.qty} aria-label={`Số lượng đề xuất dòng ${idx + 1}`} onChange={e => onUpdateProposal(p.key, 'qty', e.target.value)} />
              </td>
              <td className="table-cell">
                <input className="form-input" value={p.note} placeholder="Lý do / mô tả thêm" aria-label={`Lý do đề xuất dòng ${idx + 1}`} onChange={e => onUpdateProposal(p.key, 'note', e.target.value)} />
              </td>
              <td className="table-cell">
                <Button type="button" variant="text" size="sm" onClick={() => onRemoveProposal(p.key)}>
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </TableShell>
        <Button type="button" variant="outlined" size="sm" onClick={onAddProposal}>
          Thêm dòng đề xuất
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="filled" size="sm" onClick={onGoReview}>
          Xem lại trước khi gửi (Double check)
        </Button>
      </div>
    </div>
  );
}
