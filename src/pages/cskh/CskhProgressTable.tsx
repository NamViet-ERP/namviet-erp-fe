import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, FolderKanban, Pencil } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Pagination from '../../components/ui/Pagination';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  CSKH_PHASES,
  progressDelta,
  type CskhCommandProject,
} from '../../lib/cskh/commandCenter';

interface CskhProgressTableProps {
  projects: CskhCommandProject[];
  loading?: boolean;
  onOpen: (code: string) => void;
  onEdit?: (code: string) => void;
}

export default function CskhProgressTable({ projects, loading, onOpen, onEdit }: CskhProgressTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);

  const totalPages = Math.ceil(projects.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return projects.slice(start, start + pageSize);
  }, [projects, safePage, pageSize]);

  return (
    <div className="flex flex-col">
      <div className="wms-inventory-table-wrap cskh-desk__table">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell text-center" style={{ width: '2.75rem' }}>STT</th>
              <th className="table-header-cell whitespace-nowrap" style={{ width: '10rem', minWidth: '9.5rem' }}>Mã dự án</th>
              <th className="table-header-cell">Tên dự án & Khách hàng</th>
              <th className="table-header-cell whitespace-nowrap" style={{ width: '11rem' }}>Giai đoạn</th>
              <th className="table-header-cell cskh-col-pct text-right whitespace-nowrap" style={{ width: '5.5rem' }}>% Kế hoạch</th>
              <th className="table-header-cell cskh-col-pct text-right whitespace-nowrap" style={{ width: '5.5rem' }}>% Thực tế</th>
              <th className="table-header-cell text-right whitespace-nowrap" style={{ width: '5rem' }}>Chênh lệch</th>
              <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '5.5rem' }}>Điểm nghẽn</th>
              <th className="table-header-cell cskh-col-status whitespace-nowrap" style={{ width: '7.5rem' }}>Trạng thái</th>
              <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '6.5rem' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={10} rows={5} />
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState icon={FolderKanban} message="Không có dự án nào khớp với điều kiện lọc." />
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const delta = progressDelta(row.planPct, row.actualPct);
                const deltaLabel = `${delta >= 0 ? '+' : ''}${delta}%`;
                const phase = CSKH_PHASES.find(p => p.id === row.phaseId)?.label ?? row.phaseId;
                const hasBottleneck = row.bottleneckCount > 0;
                const stt = (safePage - 1) * pageSize + idx + 1;

                // Hệ thống phân loại ngữ nghĩa chuẩn ERP (Bình thường / Tốt / Chậm / Sai sót):
                // 1. TỐT (Green/Emerald): Đạt hoặc vượt kế hoạch (delta >= 0)
                // 2. BÌNH THƯỜNG (Blue/Info): Đang triển khai bình thường (lệch nhẹ <= 5% hoặc đang khảo sát thiết kế)
                // 3. CHẬM / CẦN THEO DÕI (Amber/Warning): Chậm từ -6% đến -15%
                // 4. SAI SÓT / SỰ CỐ / NGHẼN (Red/Danger): Có điểm nghẽn hoặc trễ nghiêm trọng (< -15%)
                let statusLabel: string;
                let statusBadgeClass: string;
                let deltaClass: string;

                if (hasBottleneck) {
                  statusLabel = `${row.bottleneckCount} điểm nghẽn`;
                  statusBadgeClass = 'cskh-status--danger';
                  deltaClass = 'text-rose-600 font-semibold';
                } else if (delta < -15) {
                  statusLabel = 'Trễ nghiêm trọng';
                  statusBadgeClass = 'cskh-status--danger';
                  deltaClass = 'text-rose-600 font-semibold';
                } else if (delta > 0) {
                  statusLabel = 'Vượt tiến độ';
                  statusBadgeClass = 'cskh-status--ok';
                  deltaClass = 'text-emerald-600 font-semibold';
                } else if (delta === 0) {
                  statusLabel = 'Đúng tiến độ';
                  statusBadgeClass = 'cskh-status--ok';
                  deltaClass = 'text-emerald-600 font-semibold';
                } else if (delta >= -5) {
                  // Lệch rất nhỏ (-1% đến -5%), đạt 95%+ tiến độ -> Bình thường / Đang triển khai
                  statusLabel = 'Đang triển khai';
                  statusBadgeClass = 'cskh-status--info';
                  deltaClass = 'text-slate-600 font-medium';
                } else if (row.phaseId === 'survey' && row.actualPct === 0) {
                  // Giai đoạn khảo sát thiết kế mới khởi động, chưa xuất kho vật tư -> Bình thường / Khảo sát
                  statusLabel = 'Đang khảo sát';
                  statusBadgeClass = 'cskh-status--info';
                  deltaClass = 'text-slate-600 font-medium';
                } else {
                  // Chậm từ -6% đến -15% -> Cần theo dõi / Chậm tiến độ
                  statusLabel = 'Cần theo dõi';
                  statusBadgeClass = 'cskh-status--warn';
                  deltaClass = 'text-amber-700 font-semibold';
                }

                return (
                  <tr key={row.code} className="table-row hover:bg-slate-50 transition-colors">
                    <td className="table-cell text-center text-slate-500 font-mono text-xs">{stt}</td>
                    <td className="table-cell font-medium whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 whitespace-nowrap shadow-xs"
                        onClick={() => onOpen(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => onOpen(row.code)}
                        >
                          {row.name}
                        </span>
                        {row.clientName && row.clientName !== '-' ? (
                          <span className="text-xs text-slate-500">CĐT: {row.clientName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden />
                        {phase}
                      </span>
                    </td>
                    <td className="table-cell text-right tabular-nums cskh-col-pct font-medium text-slate-600">
                      {row.planPct}%
                    </td>
                    <td className="table-cell text-right tabular-nums cskh-col-pct font-semibold text-slate-900">
                      {row.actualPct === 0 ? <span className="text-slate-400 font-normal">0%</span> : `${row.actualPct}%`}
                    </td>
                    <td className={`table-cell text-right tabular-nums ${deltaClass}`}>
                      {deltaLabel}
                    </td>
                    <td className="table-cell text-center whitespace-nowrap">
                      {hasBottleneck ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={12} className="text-rose-600" />
                          {row.bottleneckCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">0</span>
                      )}
                    </td>
                    <td className="table-cell cskh-col-status whitespace-nowrap">
                      <span className={`cskh-status ${statusBadgeClass}`}>
                        <span className="cskh-status__dot" aria-hidden />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="table-cell text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all shadow-xs active:scale-95"
                          onClick={() => onOpen(row.code)}
                        >
                          <span>Chi tiết</span>
                          <ChevronRight size={13} className="text-slate-400" />
                        </button>
                        {onEdit && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded text-slate-600 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all shadow-xs active:scale-95"
                            title="Chỉnh sửa thông tin dự án"
                            onClick={() => onEdit(row.code)}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        embedded
        itemLabel="dự án"
        currentPage={safePage}
        pageSize={pageSize}
        totalItems={projects.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
