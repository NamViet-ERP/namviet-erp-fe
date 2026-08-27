import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import {
  progressDelta,
  progressStatus,
  progressStatusCopy,
  progressTone,
  type CskhCommandProject,
} from '../../lib/cskh/commandCenter';
import { FolderKanban } from 'lucide-react';

interface CskhProgressTableProps {
  projects: CskhCommandProject[];
  loading?: boolean;
  onOpen: (code: string) => void;
}

export default function CskhProgressTable({ projects, loading, onOpen }: CskhProgressTableProps) {
  return (
    <div className="wms-inventory-table-wrap cskh-desk__table">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Dự án</th>
            <th className="table-header-cell cskh-col-pct">% Kế hoạch</th>
            <th className="table-header-cell cskh-col-pct">% Thực tế</th>
            <th className="table-header-cell">Chênh lệch</th>
            <th className="table-header-cell cskh-col-status">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={5} rows={6} />
          ) : projects.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={FolderKanban} message="Chưa có dự án trên bảng. Bấm Thêm dự án để tạo thẻ." />
              </td>
            </tr>
          ) : (
            projects.map(row => {
              const status = progressStatus(row);
              const copy = progressStatusCopy(status);
              const tone = progressTone(status);
              const delta = progressDelta(row.planPct, row.actualPct);
              const deltaLabel = `${delta >= 0 ? '+' : ''}${delta}%`;
              return (
                <tr key={row.code} className="table-row">
                  <td className="table-cell">
                    <button type="button" className="cskh-link-btn" onClick={() => onOpen(row.code)}>
                      <span className="font-mono">{row.code}</span>
                      <span className="cskh-link-btn__name">{row.name}</span>
                    </button>
                  </td>
                  <td className="table-cell text-right tabular-nums cskh-col-pct">{row.planPct}%</td>
                  <td className={`table-cell text-right tabular-nums cskh-col-pct cskh-tone-${tone}`}>
                    {row.actualPct}%
                  </td>
                  <td className={`table-cell text-right tabular-nums cskh-tone-${tone}`}>
                    {deltaLabel}
                  </td>
                  <td className="table-cell cskh-col-status">
                    <span className={`cskh-status cskh-status--${tone}`}>
                      <span className="cskh-status__dot" aria-hidden />
                      {copy.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
