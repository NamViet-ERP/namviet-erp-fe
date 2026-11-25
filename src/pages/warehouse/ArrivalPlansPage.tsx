import { useMemo, useState } from 'react';
import { CalendarClock, PackagePlus, Truck } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import FilterToolbar from '../../components/ui/FilterToolbar';
import KpiCard from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import { useArrivalPlans } from '../../hooks/useArrivalPlans';
import { formatDateCell } from '../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import type { ArrivalPlanLineStatus } from '../../services/arrivalPlansService';
import ArrivalProjectCard from './arrivalPlans/ArrivalProjectCard';

function fmtArrivalQty(n: number) {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

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

export default function ArrivalPlansPage() {
  const canViewPrices = useCanViewWmsPrices();
  const [daysAhead, setDaysAhead] = useState(7);
  const [lineStatus, setLineStatus] = useState<ArrivalPlanLineStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useArrivalPlans(daysAhead, {
    lineStatus: lineStatus === 'all' ? undefined : lineStatus,
  });
  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);

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
    <PageShell className="arrival-plans-page">
      <PageHeader
        title="Kế hoạch hàng về"
        subtitle="Theo dõi ngày dự kiến trên KHMH: nhập kho hoặc xuất thẳng ra công trường. Không thao tác trên tab này."
      />

      <MetricsStrip columns={3}>
        <KpiCard
          label="Dự án có hàng về"
          value={isLoading ? '—' : filtered.length}
          icon={Truck}
          tone="primary"
        />
        <KpiCard
          label="Dòng chờ nhận"
          value={isLoading ? '—' : totalLines}
          icon={CalendarClock}
          tone="warning"
        />
        <KpiCard
          label="SL còn lại"
          value={isLoading ? '—' : fmtArrivalQty(totalQty)}
          icon={PackagePlus}
          tone="success"
        />
      </MetricsStrip>

      <SectionCard noPadding>
        <FilterToolbar
          className="arrival-plans-toolbar"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm dự án, mã KHMH, mặt hàng…"
          filters={
            <div className="arrival-plans-filters flex flex-wrap items-center gap-2.5">
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
            </div>
          }
        />

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
      </SectionCard>
    </PageShell>
  );
}
