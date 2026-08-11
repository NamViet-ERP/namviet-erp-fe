import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, PackagePlus, Truck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmptyState from '../../components/ui/EmptyState';
import SearchBar from '../../components/ui/SearchBar';
import { useArrivalPlans } from '../../hooks/useArrivalPlans';
import { formatDateCell } from '../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { ArrivalPlanLineStatus, ArrivalPlanProjectApiDto } from '../../services/arrivalPlansService';

const DAY_PRESETS = [
  { days: 3, label: '3 ngày tới' },
  { days: 7, label: '7 ngày tới' },
  { days: 14, label: '14 ngày tới' },
  { days: 30, label: '30 ngày tới' },
] as const;

const STATUS_FILTERS: Array<{ value: ArrivalPlanLineStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'upcoming', label: 'Sắp về' },
  { value: 'due_today', label: 'Đến hạn' },
  { value: 'overdue', label: 'Quá hạn' },
];

const LINE_STATUS_META: Record<ArrivalPlanLineStatus, { label: string; className: string }> = {
  upcoming: { label: 'Sắp về', className: 'arrival-plans-pill--upcoming' },
  due_today: { label: 'Đến hạn', className: 'arrival-plans-pill--due-today' },
  overdue: { label: 'Quá hạn', className: 'arrival-plans-pill--overdue' },
};

function fmtQty(n: number) {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

export default function ArrivalPlansPage() {
  const canViewPrices = useCanViewWmsPrices();
  const [daysAhead, setDaysAhead] = useState(7);
  const [lineStatus, setLineStatus] = useState<ArrivalPlanLineStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useArrivalPlans(daysAhead, {
    lineStatus: lineStatus === 'all' ? undefined : lineStatus,
  });
  const projects = data?.projects ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      p =>
        p.projectCode.toLowerCase().includes(q)
        || p.projectName.toLowerCase().includes(q)
        || p.lines.some(l => l.productName.toLowerCase().includes(q) || l.planCode.toLowerCase().includes(q)),
    );
  }, [projects, search]);

  const totalLines = filtered.reduce((s, p) => s + p.lineCount, 0);
  const totalQty = filtered.reduce((s, p) => s + p.totalRemainingQty, 0);

  return (
    <div className="hrm-page arrival-plans-page">
      <PageHeader
        title="Kế hoạch hàng về"
        subtitle="Theo ngày dự kiến (Ngày DK) trên KHMH — hàng đã nhận thực tế sẽ biến mất khỏi danh sách này."
      />

      <div className="hrm-stat-grid">
        <HrmStatCard
          label="Dự án có hàng về"
          value={isLoading ? '—' : filtered.length}
          icon={Truck}
          tone="primary"
        />
        <HrmStatCard
          label="Dòng chờ nhận"
          value={isLoading ? '—' : totalLines}
          icon={CalendarClock}
          tone="warning"
        />
        <HrmStatCard
          label="SL còn lại"
          value={isLoading ? '—' : fmtQty(totalQty)}
          icon={PackagePlus}
          tone="success"
        />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar arrival-plans-toolbar">
          <div className="hrm-list-toolbar__filters arrival-plans-filters">
            <div className="arrival-plans-day-chips" role="group" aria-label="Lọc thời gian">
              {DAY_PRESETS.map(p => (
                <button
                  key={p.days}
                  type="button"
                  className={
                    daysAhead === p.days
                      ? 'arrival-plans-day-chip is-active'
                      : 'arrival-plans-day-chip'
                  }
                  onClick={() => {
                    setDaysAhead(p.days);
                    setExpanded(null);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="arrival-plans-day-chips" role="group" aria-label="Lọc trạng thái">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  className={
                    lineStatus === f.value
                      ? 'arrival-plans-day-chip is-active'
                      : 'arrival-plans-day-chip'
                  }
                  onClick={() => setLineStatus(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm dự án, mã KHMH, mặt hàng…"
            />
          </div>
          {data && (
            <div className="arrival-plans-window text-sm text-[var(--md-on-surface-variant)] tabular-nums">
              <span>
                Hôm nay {formatDateCell(data.asOfDate ?? data.windowTo)}
                {' → '}
                {daysAhead} ngày tới ({formatDateCell(data.windowTo)})
              </span>
              {(data.overdueLookbackDays ?? 0) > 0 ? (
                <span className="ml-2 opacity-80">
                  · Kèm quá hạn tối đa {data.overdueLookbackDays} ngày
                  (từ {formatDateCell(data.windowFrom)})
                </span>
              ) : null}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="arrival-plans-skeleton" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="arrival-plans-skeleton__row" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState message={getApiErrorMessage(error, 'Không tải được kế hoạch hàng về')} icon={Truck} />
        ) : filtered.length === 0 ? (
          <EmptyState
            message={
              lineStatus === 'all'
                ? `Không có hàng về trong ${daysAhead} ngày tới (tính cả quá hạn trong ${data?.overdueLookbackDays ?? 30} ngày gần đây).`
                : `Không có dòng "${STATUS_FILTERS.find(f => f.value === lineStatus)?.label}" trong ${daysAhead} ngày tới.`
            }
            icon={CalendarClock}
          />
        ) : (
          <ul className="arrival-plans-project-list">
            {filtered.map(project => (
              <ArrivalProjectCard
                key={project.projectCode}
                project={project}
                expanded={expanded === project.projectCode}
                canViewPrices={canViewPrices}
                onToggle={() =>
                  setExpanded(prev =>
                    prev === project.projectCode ? null : project.projectCode,
                  )
                }
              />
            ))}
          </ul>
        )}
      </HrmPanel>
    </div>
  );
}

function ArrivalProjectCard({
  project,
  expanded,
  canViewPrices,
  onToggle,
}: {
  project: ArrivalPlanProjectApiDto;
  expanded: boolean;
  canViewPrices: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="arrival-plans-project is-highlight">
      <button type="button" className="arrival-plans-project__head" onClick={onToggle}>
        <div className="arrival-plans-project__title">
          <span className="arrival-plans-project__code font-mono">{project.projectCode}</span>
          <span className="arrival-plans-project__name">{project.projectName}</span>
        </div>
        <div className="arrival-plans-project__meta">
          <span className="arrival-plans-pill">
            {project.lineCount} dòng
          </span>
          <span className="arrival-plans-pill arrival-plans-pill--qty">
            SL {fmtQty(project.totalRemainingQty)}
          </span>
          {project.earliestExpectedDate && (
            <span className="arrival-plans-pill arrival-plans-pill--date tabular-nums">
              Sớm nhất {formatDateCell(project.earliestExpectedDate)}
            </span>
          )}
          {project.overdueCount > 0 && (
            <span className="arrival-plans-pill arrival-plans-pill--overdue">
              Quá hạn {project.overdueCount}
            </span>
          )}
          {project.dueTodayCount > 0 && (
            <span className="arrival-plans-pill arrival-plans-pill--due-today">
              Đến hạn {project.dueTodayCount}
            </span>
          )}
          <span className="arrival-plans-project__chevron" aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="arrival-plans-project__body">
          <div className="overflow-x-auto">
            <table className="wms-inventory-table arrival-plans-table">
              <thead>
                <tr>
                  <th className="table-header-cell">KHMH</th>
                  <th className="table-header-cell">Mặt hàng</th>
                  <th className="table-header-cell text-right">Còn lại</th>
                  <th className="table-header-cell">ĐVT</th>
                  <th className="table-header-cell whitespace-nowrap">Ngày DK</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">NCC</th>
                  {canViewPrices && <th className="table-header-cell text-right">Đơn giá</th>}
                  <th className="table-header-cell text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {project.lines.map(line => (
                  <tr key={line.lineId} className="table-row">
                    <td className="table-cell font-mono text-sm">
                      <Link
                        to={`/purchasing/plans/${encodeURIComponent(line.planCode)}`}
                        className="text-[var(--md-primary)]"
                        onClick={e => e.stopPropagation()}
                      >
                        {line.planCode}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold line-clamp-2" title={line.productName}>
                        {line.productName}
                      </div>
                      {line.materialCode && (
                        <div className="text-xs text-[var(--md-on-surface-variant)] font-mono">
                          {line.materialCode}
                        </div>
                      )}
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold">
                      {fmtQty(line.remainingQty)}
                    </td>
                    <td className="table-cell">{line.unit}</td>
                    <td className="table-cell tabular-nums whitespace-nowrap">
                      {formatDateCell(line.expectedDeliveryDate)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      <span className={`arrival-plans-pill ${LINE_STATUS_META[line.lineStatus as ArrivalPlanLineStatus].className}`}>
                        {LINE_STATUS_META[line.lineStatus as ArrivalPlanLineStatus].label}
                      </span>
                    </td>
                    <td className="table-cell max-w-[160px]">
                      <span className="line-clamp-2">{line.purchaseSupplierName || '—'}</span>
                    </td>
                    {canViewPrices && (
                      <td className="table-cell text-right tabular-nums">
                        {line.unitPrice != null ? formatCurrencyFull(line.unitPrice) : '—'}
                      </td>
                    )}
                    <td className="table-cell text-center">
                      <Link
                        to={`/warehouse/import?project=${encodeURIComponent(project.projectCode)}&plan=${encodeURIComponent(line.planCode)}`}
                        className="btn btn-outline btn-sm inline-flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <PackagePlus size={14} />
                        Nhập kho
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="arrival-plans-hint">
            Khi duyệt phiếu nhập thực tế, hệ thống ghi Ngày TT trên KHMH và dòng sẽ không còn trong kế hoạch hàng về.
          </p>
        </div>
      )}
    </li>
  );
}
