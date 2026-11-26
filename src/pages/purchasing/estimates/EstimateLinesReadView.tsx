import StatusBadge from '../../../components/ui/StatusBadge';
import TableShell from '../../../components/ui/TableShell';
import type {
  PurchaseEstimateLineApiDto,
  PurchaseEstimateProposalApiDto,
} from '../../../types/api/purchasingApi';
import { formatCurrencyVnd } from '../../../utils/formatCurrency';

interface EstimateLinesReadViewProps {
  lines: PurchaseEstimateLineApiDto[];
  proposals: PurchaseEstimateProposalApiDto[];
  workflowLocked: boolean;
}

function groupLines(lines: PurchaseEstimateLineApiDto[]) {
  const groups = new Map<string, PurchaseEstimateLineApiDto[]>();
  for (const line of lines) {
    const key = line.categoryName?.trim() || 'Khác';
    const bucket = groups.get(key) ?? [];
    bucket.push(line);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export default function EstimateLinesReadView({
  lines,
  proposals,
  workflowLocked,
}: EstimateLinesReadViewProps) {
  const isEmpty = lines.length === 0 && proposals.length === 0;
  const emptyMessage = workflowLocked
    ? 'Chưa có dòng vật tư.'
    : 'Chưa có dòng. Bấm Sửa dòng vật tư để thêm.';

  return (
    <TableShell
      tableClassName="wms-inventory-table"
      colSpan={6}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      header={(
        <tr>
          <th className="table-header-cell">Hạng mục</th>
          <th className="table-header-cell">Hàng hoá</th>
          <th className="table-header-cell">ĐVT</th>
          <th className="table-header-cell">SL</th>
          <th className="table-header-cell">Giá dự toán</th>
          <th className="table-header-cell">Thành tiền</th>
        </tr>
      )}
    >
      {groupLines(lines).flatMap(([cat, catLines]) =>
        catLines.map(line => {
          const price = line.estimateUnitPrice;
          return (
            <tr key={line.id} className="table-row">
              <td className="table-cell">{cat}</td>
              <td className="table-cell">
                <span className="font-mono">{line.materialCode}</span>
                {' '}
                {line.materialName}
              </td>
              <td className="table-cell">{line.unit || '-'}</td>
              <td className="table-cell text-right tabular-nums">{line.newQty}</td>
              <td className="table-cell text-right tabular-nums">{formatCurrencyVnd(price)}</td>
              <td className="table-cell text-right tabular-nums font-medium">
                {formatCurrencyVnd(price * Number(line.newQty))}
              </td>
            </tr>
          );
        }),
      )}
      {proposals.map(p => (
        <tr key={p.id} className="table-row">
          <td className="table-cell">
            <StatusBadge tone="warning" label="Đề xuất mới" />
          </td>
          <td className="table-cell">
            <strong>{p.name}</strong>
            {p.spec ? ` - ${p.spec}` : ''}
          </td>
          <td className="table-cell">{p.unit || '-'}</td>
          <td className="table-cell text-right tabular-nums">{p.qty}</td>
          <td className="table-cell text-right tabular-nums">-</td>
          <td className="table-cell text-right tabular-nums">-</td>
        </tr>
      ))}
    </TableShell>
  );
}
