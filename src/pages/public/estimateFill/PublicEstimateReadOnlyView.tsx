import TableShell from '../../../components/ui/TableShell';
import type { PublicPurchaseEstimateApiDto } from '../../../types/api/purchasingApi';
import { groupPublicLines } from './estimateFillHelpers';

interface PublicEstimateReadOnlyViewProps {
  row: PublicPurchaseEstimateApiDto;
}

export default function PublicEstimateReadOnlyView({ row }: PublicEstimateReadOnlyViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-info">Chỉ xem</span>
        <span className="text-sm text-[var(--md-on-surface-variant)]">
          Ver mới nhất · {row.code} · {row.projectCode}
          {row.projectName ? ` - ${row.projectName}` : ''}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--md-on-surface)] m-0">{row.title}</h2>
      <TableShell
        colSpan={4}
        isEmpty={row.lines.length === 0}
        emptyMessage="Chưa có dòng vật tư."
        header={
          <tr>
            <th className="table-header-cell">Hạng mục</th>
            <th className="table-header-cell">Hàng hoá</th>
            <th className="table-header-cell">ĐVT</th>
            <th className="table-header-cell text-right">SL</th>
          </tr>
        }
      >
        {groupPublicLines(row).flatMap(([cat, lines]) =>
          lines.map(line => (
            <tr key={line.materialCode} className="table-row">
              <td className="table-cell">{cat}</td>
              <td className="table-cell">
                <span className="font-mono">{line.materialCode}</span>
                {' '}
                {line.materialName}
              </td>
              <td className="table-cell">{line.unit || '-'}</td>
              <td className="table-cell text-right tabular-nums">{line.qty}</td>
            </tr>
          )),
        )}
      </TableShell>
    </div>
  );
}
