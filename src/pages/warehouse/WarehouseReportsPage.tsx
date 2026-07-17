import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import PermissionGate from '../../components/auth/PermissionGate';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrency } from '../../utils/formatCurrency';
import { reportsService } from '../../services/reportsService';
import { useProjects } from '../../hooks/useProjects';

const KIND_LABELS: Record<string, string> = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  transfer: 'Chuyển kho',
  stocktake: 'Kiểm kê',
};

export default function WarehouseReportsPage() {
  const [searchParams] = useSearchParams();
  const focusPending = searchParams.get('section') === 'pending';
  const pendingSectionRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const projects = projectsPage?.items ?? [];

  const movementQuery = useQuery({
    queryKey: ['wms-reports', 'movement', dateFrom, dateTo],
    queryFn: () => reportsService.movementSummary({ dateFrom, dateTo }),
  });

  const stockQuery = useQuery({
    queryKey: ['wms-reports', 'stock', projectCode],
    queryFn: () => reportsService.stock(projectCode || undefined),
  });

  const pendingQuery = useQuery({
    queryKey: ['wms-reports', 'pending'],
    queryFn: () => reportsService.pending(),
  });

  const handleExport = async (kind: 'movement' | 'stock' | 'pending') => {
    setExporting(kind);
    try {
      if (kind === 'movement') {
        await reportsService.downloadMovementSummary({ dateFrom, dateTo });
      } else if (kind === 'stock') {
        await reportsService.downloadStock(projectCode || undefined);
      } else {
        await reportsService.downloadPending();
      }
      showToast('success', 'Đã tải báo cáo Excel');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất báo cáo'));
    } finally {
      setExporting(null);
    }
  };

  const movement = movementQuery.data;
  const stockRows = stockQuery.data ?? [];
  const pending = pendingQuery.data;

  useEffect(() => {
    if (!focusPending || pendingQuery.isLoading) return;
    pendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusPending, pendingQuery.isLoading]);

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        eyebrow="Kho hàng"
        title={focusPending ? 'Phiếu chờ duyệt' : 'Báo cáo kho'}
        subtitle={
          focusPending
            ? 'Danh sách phiếu nhập, xuất, chuyển và kiểm kê đang chờ duyệt.'
            : 'Tổng hợp nhập–xuất, tồn kho theo dự án và phiếu chờ duyệt.'
        }
      />

      <HrmPanel title="Nhập – xuất theo kỳ" subtitle="Lọc theo ngày chứng từ">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <VoucherDateFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
              onReset={() => {
                setDateFrom('');
                setDateTo('');
              }}
            />
            <PermissionGate permission="wms.reports.export">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={exporting === 'movement'}
                onClick={() => handleExport('movement')}
              >
                <Download size={14} />
                {exporting === 'movement' ? 'Đang xuất…' : 'Xuất Excel'}
              </button>
            </PermissionGate>
          </div>

          {movementQuery.isLoading ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Đang tải…</p>
          ) : movementQuery.isError ? (
            <p className="text-sm text-[var(--md-error)]">{WMS_ERROR.loadDefault}</p>
          ) : movement ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Phiếu nhập', value: movement.importCount },
                { label: 'Giá trị nhập', value: `${formatCurrency(movement.importValue)} đ` },
                { label: 'Phiếu xuất', value: movement.exportCount },
                { label: 'Giá trị xuất', value: `${formatCurrency(movement.exportValue)} đ` },
                { label: 'Phiếu chuyển', value: movement.transferCount },
              ].map(tile => (
                <div key={tile.label} className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--md-on-surface-variant)]">{tile.label}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[var(--md-on-surface)]">{tile.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </HrmPanel>

      <HrmPanel title="Tồn kho theo dự án" subtitle="Chỉ hiển thị vật tư còn tồn">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              className="form-select w-64"
              value={projectCode}
              onChange={e => setProjectCode(e.target.value)}
            >
              <option value="">Tất cả dự án</option>
              {projects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
            <PermissionGate permission="wms.reports.export">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={exporting === 'stock'}
                onClick={() => handleExport('stock')}
              >
                <Download size={14} />
                {exporting === 'stock' ? 'Đang xuất…' : 'Xuất Excel'}
              </button>
            </PermissionGate>
          </div>

          <div className="overflow-x-auto table-scroll">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Dự án</th>
                  <th className="table-header-cell">Mã vật tư</th>
                  <th className="table-header-cell">Tên vật tư</th>
                  <th className="table-header-cell text-center">ĐVT</th>
                  <th className="table-header-cell text-right">SL tồn</th>
                </tr>
              </thead>
              <tbody>
                {stockQuery.isLoading ? (
                  <TableSkeletonRows colSpan={5} />
                ) : stockQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-[var(--md-error)]">
                      {WMS_ERROR.loadDefault}
                    </td>
                  </tr>
                ) : stockRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="Không có vật tư nào còn tồn theo bộ lọc hiện tại." />
                    </td>
                  </tr>
                ) : (
                  stockRows.slice(0, 100).map(row => (
                    <tr key={`${row.projectCode}-${row.materialCode}`} className="table-row">
                      <td className="table-cell">
                        <span className="font-medium">{row.projectName}</span>
                        <span className="block text-[11px] font-mono text-[var(--md-on-surface-variant)]">{row.projectCode}</span>
                      </td>
                      <td className="table-cell font-mono text-xs">{row.materialCode}</td>
                      <td className="table-cell">{row.materialName}</td>
                      <td className="table-cell text-center">{row.unit}</td>
                      <td className="table-cell text-right tabular-nums font-semibold">{row.qty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {stockRows.length > 100 && (
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Hiển thị 100/{stockRows.length} dòng — xuất Excel để xem đầy đủ.
            </p>
          )}
        </div>
      </HrmPanel>

      <div
        ref={pendingSectionRef}
        id="reports-pending"
        className={focusPending ? 'rounded-2xl ring-2 ring-[var(--md-primary)]/30 scroll-mt-24' : 'scroll-mt-24'}
      >
      <HrmPanel title="Phiếu chờ duyệt" subtitle="Tổng hợp theo loại chứng từ">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {pending ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-[var(--md-surface-container-high)] px-3 py-1">Nhập: <strong>{pending.importCount}</strong></span>
                <span className="rounded-full bg-[var(--md-surface-container-high)] px-3 py-1">Xuất: <strong>{pending.exportCount}</strong></span>
                <span className="rounded-full bg-[var(--md-surface-container-high)] px-3 py-1">Chuyển: <strong>{pending.transferCount}</strong></span>
                <span className="rounded-full bg-[var(--md-surface-container-high)] px-3 py-1">Kiểm kê: <strong>{pending.stocktakeCount}</strong></span>
              </div>
            ) : (
              <span />
            )}
            <PermissionGate permission="wms.reports.export">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={exporting === 'pending'}
                onClick={() => handleExport('pending')}
              >
                <Download size={14} />
                {exporting === 'pending' ? 'Đang xuất…' : 'Xuất Excel'}
              </button>
            </PermissionGate>
          </div>

          <div className="overflow-x-auto table-scroll">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Loại</th>
                  <th className="table-header-cell">Mã phiếu</th>
                  <th className="table-header-cell">Ngày</th>
                  <th className="table-header-cell">Người tạo</th>
                  <th className="table-header-cell">Dự án / Kho</th>
                </tr>
              </thead>
              <tbody>
                {pendingQuery.isLoading ? (
                  <TableSkeletonRows colSpan={5} />
                ) : pendingQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-[var(--md-error)]">
                      {WMS_ERROR.loadDefault}
                    </td>
                  </tr>
                ) : !pending?.items.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="Không có phiếu chờ duyệt. Tất cả phiếu đã được xử lý." />
                    </td>
                  </tr>
                ) : (
                  pending.items.map(item => (
                    <tr key={`${item.kind}-${item.voucherCode}`} className="table-row">
                      <td className="table-cell">{KIND_LABELS[item.kind] ?? item.kind}</td>
                      <td className="table-cell font-mono text-xs text-[var(--md-primary)]">{item.voucherCode}</td>
                      <td className="table-cell">{item.date}</td>
                      <td className="table-cell">{item.createdBy}</td>
                      <td className="table-cell">{item.project || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </HrmPanel>
      </div>
    </div>
  );
}
