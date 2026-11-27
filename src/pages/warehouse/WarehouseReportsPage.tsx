import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import SectionCard from '../../components/ui/SectionCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import KpiCard, { type KpiCardTone } from '../../components/ui/KpiCard';
import TableShell from '../../components/ui/TableShell';
import StatusBadge, { type StatusTone } from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import PermissionGate from '../../components/auth/PermissionGate';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { reportsService } from '../../services/reportsService';
import { queryKeys } from '../../services/queryKeys';
import { useProjects } from '../../hooks/useProjects';

const KIND_LABELS: Record<string, string> = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  transfer: 'Chuyển kho',
  stocktake: 'Kiểm kê',
};

const KIND_LIST_PATH: Record<string, string> = {
  import: '/warehouse/import',
  export: '/warehouse/export',
  transfer: '/warehouse/transfer',
  stocktake: '/stocktake/list',
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
    queryKey: queryKeys.wmsReports.movement(dateFrom, dateTo),
    queryFn: () => reportsService.movementSummary({ dateFrom, dateTo }),
  });

  const stockQuery = useQuery({
    queryKey: queryKeys.wmsReports.stock(projectCode),
    queryFn: () => reportsService.stock(projectCode || undefined),
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.wmsReports.pending,
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

  const movementCards: Array<{
    label: string;
    value?: string | number;
    tone: KpiCardTone;
  }> = [
    { label: 'Phiếu nhập', value: movement?.importCount, tone: 'primary' },
    {
      label: 'Giá trị nhập',
      value: movement ? formatCurrencyFull(movement.importValue) : undefined,
      tone: 'success',
    },
    { label: 'Phiếu xuất', value: movement?.exportCount, tone: 'warning' },
    {
      label: 'Giá trị xuất',
      value: movement ? formatCurrencyFull(movement.exportValue) : undefined,
      tone: 'info',
    },
    { label: 'Phiếu chuyển', value: movement?.transferCount, tone: 'neutral' },
  ];

  const pendingCountBadges: Array<{
    key: string;
    label: string;
    tone: StatusTone;
  }> = pending
    ? [
        {
          key: 'import',
          label: `Nhập: ${pending.importCount}`,
          tone: pending.importCount > 0 ? 'info' : 'neutral',
        },
        {
          key: 'export',
          label: `Xuất: ${pending.exportCount}`,
          tone: pending.exportCount > 0 ? 'warning' : 'neutral',
        },
        {
          key: 'transfer',
          label: `Chuyển: ${pending.transferCount}`,
          tone: pending.transferCount > 0 ? 'primary' : 'neutral',
        },
        {
          key: 'stocktake',
          label: `Kiểm kê: ${pending.stocktakeCount}`,
          tone: pending.stocktakeCount > 0 ? 'warning' : 'neutral',
        },
      ]
    : [];

  const renderExportButton = (kind: 'movement' | 'stock' | 'pending') => (
    <PermissionGate permission="wms.reports.export">
      <Button
        type="button"
        variant="outlined"
        size="sm"
        leftIcon={Download}
        loading={exporting === kind}
        onClick={() => handleExport(kind)}
      >
        {exporting === kind ? 'Đang xuất…' : 'Xuất Excel'}
      </Button>
    </PermissionGate>
  );

  useEffect(() => {
    if (!focusPending || pendingQuery.isLoading) return;
    pendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusPending, pendingQuery.isLoading]);

  return (
    <PageShell variant="dashboard">
      <PageHeader
        eyebrow="Kho hàng"
        title={focusPending ? 'Phiếu chờ duyệt' : 'Báo cáo kho'}
        subtitle={
          focusPending
            ? 'Danh sách phiếu nhập, xuất, chuyển và kiểm kê đang chờ duyệt.'
            : 'Tổng hợp nhập–xuất, tồn kho theo dự án và phiếu chờ duyệt.'
        }
      />

      <SectionCard title="Nhập – xuất theo kỳ" subtitle="Lọc theo ngày chứng từ">
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
            {renderExportButton('movement')}
          </div>

          {movementQuery.isError ? (
            <p role="alert" className="text-sm text-[var(--md-error)]">{WMS_ERROR.loadDefault}</p>
          ) : movementQuery.isLoading || movement ? (
            <MetricsStrip columns={5} ariaLabel="Tổng hợp nhập xuất theo kỳ">
              {movementCards.map(tile => (
                <KpiCard
                  key={tile.label}
                  label={tile.label}
                  value={tile.value}
                  tone={tile.tone}
                  loading={movementQuery.isLoading}
                />
              ))}
            </MetricsStrip>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Tồn kho theo dự án" subtitle="Chỉ hiển thị vật tư còn tồn">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              aria-label="Dự án báo cáo tồn kho"
              className="form-select w-64"
              value={projectCode}
              onChange={e => setProjectCode(e.target.value)}
            >
              <option value="">Tất cả dự án</option>
              {projects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} - {p.projectName}
                </option>
              ))}
            </select>
            {renderExportButton('stock')}
          </div>

          <TableShell
            header={
              <tr>
                <th className="table-header-cell">Dự án</th>
                <th className="table-header-cell">Mã vật tư</th>
                <th className="table-header-cell">Tên vật tư</th>
                <th className="table-header-cell text-center">ĐVT</th>
                <th className="table-header-cell text-right">SL tồn</th>
              </tr>
            }
            colSpan={5}
            loading={stockQuery.isLoading}
            error={stockQuery.isError ? WMS_ERROR.loadDefault : null}
            isEmpty={stockRows.length === 0}
            emptyMessage="Không có vật tư nào còn tồn theo bộ lọc hiện tại."
            caption={
              !stockQuery.isLoading && !stockQuery.isError && stockRows.length > 100
                ? `Hiển thị 100/${stockRows.length} dòng - xuất Excel để xem đầy đủ.`
                : undefined
            }
          >
            {stockRows.slice(0, 100).map(row => (
              <tr key={`${row.projectCode}-${row.materialCode}`} className="table-row">
                <td className="table-cell">
                  <span className="font-medium">{row.projectName}</span>
                  <div>
                    <EntityCodeLink
                      code={row.projectCode}
                      to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                    />
                  </div>
                </td>
                <td className="table-cell">
                  <EntityCodeLink
                    code={row.materialCode}
                    to="/operations/materials"
                    state={{ highlightCode: row.materialCode }}
                  />
                </td>
                <td className="table-cell">{row.materialName}</td>
                <td className="table-cell text-center">{row.unit}</td>
                <td className="table-cell text-right tabular-nums font-semibold">{row.qty}</td>
              </tr>
            ))}
          </TableShell>
        </div>
      </SectionCard>

      <SectionCard
        ref={pendingSectionRef}
        id="reports-pending"
        highlighted={focusPending}
        title="Phiếu chờ duyệt"
        subtitle="Tổng hợp theo loại chứng từ"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {pending ? (
              <div className="flex flex-wrap gap-2">
                {pendingCountBadges.map(badge => (
                  <StatusBadge
                    key={badge.key}
                    tone={badge.tone}
                    label={badge.label}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}
            {renderExportButton('pending')}
          </div>

          <TableShell
            header={
              <tr>
                <th className="table-header-cell">Loại</th>
                <th className="table-header-cell">Mã phiếu</th>
                <th className="table-header-cell">Ngày</th>
                <th className="table-header-cell">Người tạo</th>
                <th className="table-header-cell">Dự án / Kho</th>
              </tr>
            }
            colSpan={5}
            loading={pendingQuery.isLoading}
            error={pendingQuery.isError ? WMS_ERROR.loadDefault : null}
            isEmpty={!pending?.items.length}
            emptyMessage="Không có phiếu chờ duyệt. Tất cả phiếu đã được xử lý."
          >
            {(pending?.items ?? []).map(item => (
              <tr key={`${item.kind}-${item.voucherCode}`} className="table-row">
                <td className="table-cell">{KIND_LABELS[item.kind] ?? item.kind}</td>
                <td className="table-cell">
                  {KIND_LIST_PATH[item.kind] ? (
                    <EntityCodeLink code={item.voucherCode} to={KIND_LIST_PATH[item.kind]} />
                  ) : (
                    <span className="entity-code">{item.voucherCode}</span>
                  )}
                </td>
                <td className="table-cell">{item.date}</td>
                <td className="table-cell">{item.createdBy}</td>
                <td className="table-cell">{item.project || '—'}</td>
              </tr>
            ))}
          </TableShell>
        </div>
      </SectionCard>
    </PageShell>
  );
}
