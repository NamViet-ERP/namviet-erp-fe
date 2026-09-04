import { useMemo, useState } from 'react';
import { BarChart3, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay, parseIsoDate, toIsoDate } from '../../lib/dates';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import { cskhProjectPath, cskhProjectTabMeta } from '../../constants/cskhProject';
import { useNavigate } from 'react-router-dom';
import {
  findCapacityBand,
  findScheduleCombo,
  parseCapacityTons,
  scheduleRowTimeline,
} from '../../lib/cskh/masterData';
import {
  formatSignedPct,
  progressGridCopy,
  progressStatus,
} from '../../lib/cskh/commandCenter';
import {
  captureSnapshot,
  ganttItemPlanPct,
  ganttItemStatus,
  ganttKpis,
  newOpsId,
  nextOpsCode,
  openBottleneckCount,
  removeGanttItem,
  reportWindow,
  snapshotCompare,
  upsertBottleneck,
  upsertGanttItem,
  type CskhGanttItem,
  type CskhReportPeriod,
} from '../../lib/cskh/opsWorkspace';
import CskhFilterTabs from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhGanttPageProps {
  project: CskhProjectRecord;
}

const EMPTY_FORM = {
  name: '',
  days: '1',
  startDate: '',
  endDate: '',
  actualPct: '0',
  notes: '',
};

function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function statusCopy(item: CskhGanttItem) {
  const status = ganttItemStatus(item);
  if (status === 'done') return { label: 'Hoàn thành', tone: 'ok' as const };
  return {
    label: progressGridCopy(status).badge,
    tone: status === 'blocked' ? 'danger' as const : status === 'slight_delay' ? 'warn' as const : 'ok' as const,
  };
}

export default function CskhGanttPage({ project }: CskhGanttPageProps) {
  const meta = cskhProjectTabMeta('gantt');
  const navigate = useNavigate();
  const { ops, update } = useCskhOpsWorkspace(project.code);
  const { patchProject } = useCskhCommandCenter();
  const { store: master } = useCskhMasterData();
  const kpis = ganttKpis(ops.ganttItems);
  const compare = snapshotCompare(ops.snapshots);
  const [period, setPeriod] = useState<CskhReportPeriod>('week');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhGanttItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhGanttItem | null>(null);

  const combo = project.boilerType && project.priority
    ? findScheduleCombo(master, project.boilerType, project.priority)
    : undefined;
  const band = combo ? findCapacityBand(combo, parseCapacityTons(project.capacity)) : undefined;
  const periodWindow = reportWindow(period);
  const day0 = project.advanceDate || project.startDate || toIsoDate(new Date());

  const syncRollup = (items: CskhGanttItem[]) => {
    if (items.length === 0) return;
    const next = ganttKpis(items);
    patchProject(project.code, { planPct: next.planPct, actualPct: next.actualPct });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, startDate: day0, endDate: addDaysIso(day0, 7) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhGanttItem) => {
    setEditing(row);
    setForm({
      name: row.name,
      days: String(row.days),
      startDate: row.startDate,
      endDate: row.endDate,
      actualPct: String(row.actualPct),
      notes: row.notes ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const saveItem = () => {
    const name = form.name.trim();
    const days = Number.parseInt(form.days, 10);
    const actualPct = Number.parseInt(form.actualPct, 10);
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập hạng mục.';
    if (!Number.isFinite(days) || days < 0) next.days = 'Nhập số ngày từ 0.';
    if (!form.startDate) next.startDate = 'Chọn ngày bắt đầu.';
    if (!form.endDate) next.endDate = 'Chọn ngày kết thúc.';
    if (!Number.isFinite(actualPct) || actualPct < 0 || actualPct > 100) next.actualPct = 'Nhập % thực tế 0-100.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const row: CskhGanttItem = {
      id: editing?.id ?? newOpsId(),
      name,
      days,
      startDate: form.startDate,
      endDate: form.endDate,
      actualPct,
      notes: form.notes.trim() || undefined,
    };
    update(current => {
      const nextOps = upsertGanttItem(current, row);
      syncRollup(nextOps.ganttItems);
      return nextOps;
    });
    setOpen(false);
    showToast('success', editing ? 'Đã cập nhật hạng mục.' : 'Đã thêm hạng mục.');
  };

  const applyTemplate = () => {
    if (!band || band.rows.length === 0) {
      showToast('warning', 'Chưa có bảng tiến độ chuẩn cho loại lò / ưu tiên / công suất này.');
      return;
    }
    const named = band.rows.filter(row => row.name.trim());
    if (named.length === 0) {
      showToast('warning', 'Bảng tiến độ chuẩn chưa có tên hạng mục.');
      return;
    }
    const spans = scheduleRowTimeline(named);
    const items: CskhGanttItem[] = named.map(row => {
      const span = spans.find(item => item.id === row.id);
      const startDay = span?.startDay ?? 0;
      const endDay = span?.endDay ?? row.days;
      return {
        id: newOpsId(),
        name: row.name.trim(),
        days: row.days,
        startDate: addDaysIso(day0, startDay),
        endDate: addDaysIso(day0, Math.max(startDay, endDay)),
        actualPct: 0,
      };
    });
    update(current => {
      const nextOps = { ...current, ganttItems: items };
      syncRollup(nextOps.ganttItems);
      return nextOps;
    });
    showToast('success', `Đã áp dụng ${items.length} hạng mục chuẩn. Ngày 0 là ngày nhận tạm ứng.`);
  };

  const saveSnapshot = () => {
    if (ops.ganttItems.length === 0) {
      showToast('warning', 'Thêm hạng mục trước khi lưu snapshot.');
      return;
    }
    update(current => captureSnapshot(current));
    showToast('success', 'Đã lưu snapshot tiến độ.');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
      />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số Gantt">
        <Card className="cskh-desk__kpi-card" title="Tổng hạng mục" value={kpis.total} subtitle={`${kpis.completed} hoàn thành`} accent="info" />
        <Card className="cskh-desk__kpi-card" title="Tiến độ thực tế" value={`${kpis.actualPct}%`} subtitle={`Kế hoạch ${kpis.planPct}% (${formatSignedPct(kpis.delta)})`} accent={kpis.delta < 0 ? 'warning' : 'success'} />
        <Card className="cskh-desk__kpi-card" title="Hạng mục đang nghẽn" value={kpis.delayed} subtitle="Chậm nhẹ hoặc nghẽn nặng" accent="danger" />
        <Card className="cskh-desk__kpi-card" title="Dự kiến hoàn tất" value={isoToDisplay(kpis.expectedEnd) || '-'} subtitle="Theo ngày kết thúc hạng mục" accent="teal" />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Bảng tiến độ đang áp dụng</h2>
            <p className="section-heading__sub mb-0">
              Gantt tính từ ngày nhận tạm ứng ({isoToDisplay(day0) || 'chưa có'}). Có thể áp dụng bảng chuẩn theo loại lò, ưu tiên và công suất.
            </p>
          </div>
          <div className="cskh-desk__board-tools">
            {ops.ganttItems.length === 0 ? (
              <Button type="button" variant="outlined" onClick={applyTemplate}>Áp dụng bảng chuẩn</Button>
            ) : null}
            <Button type="button" leftIcon={Plus} onClick={openCreate}>Thêm hạng mục</Button>
          </div>
        </div>
        {ops.ganttItems.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            message={meta.empty}
          />
        ) : (
          <div className="wms-inventory-table-wrap cskh-desk__table">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Hạng mục</th>
                  <th className="table-header-cell cskh-col-pct">Số ngày</th>
                  <th className="table-header-cell">Bắt đầu dự kiến</th>
                  <th className="table-header-cell">Kết thúc dự kiến</th>
                  <th className="table-header-cell cskh-col-pct">KH / TT</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {ops.ganttItems.map(row => {
                  const copy = statusCopy(row);
                  const plan = ganttItemPlanPct(row);
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell">{row.name}</td>
                      <td className="table-cell cskh-col-pct"><span className="tabular-nums">{row.days}</span></td>
                      <td className="table-cell">{isoToDisplay(row.startDate) || '-'}</td>
                      <td className="table-cell">{isoToDisplay(row.endDate) || '-'}</td>
                      <td className="table-cell cskh-col-pct"><span className="tabular-nums">{plan}% / {row.actualPct}%</span></td>
                      <td className="table-cell">
                        <span className={`cskh-status cskh-status--${copy.tone}`}>
                          <span className="cskh-status__dot" aria-hidden />
                          {copy.label}
                        </span>
                      </td>
                      <td className="table-cell hrm-table-col-actions">
                        <div className="hrm-table-row-actions">
                          <Button type="button" variant="text" onClick={() => openEdit(row)}>Sửa</Button>
                          {(copy.tone === 'warn' || copy.tone === 'danger') ? (
                            <Button
                              type="button"
                              variant="text"
                              onClick={() => {
                                const at = new Date().toISOString();
                                const planNow = ganttItemPlanPct(row);
                                update(current => {
                                  const nextOps = upsertBottleneck(current, {
                                    id: newOpsId(),
                                    code: nextOpsCode('NG', current.bottlenecks.map(item => item.code)),
                                    name: `Gantt chậm tiến độ: ${row.name}`,
                                    severity: copy.tone === 'danger' ? 'urgent' : 'medium',
                                    status: 'open',
                                    startedAt: toIsoDate(new Date()),
                                    expectedAt: row.endDate,
                                    reason: `% thực tế ${row.actualPct}% thấp hơn % kế hoạch ${planNow}%.`,
                                    source: 'gantt',
                                    history: [{ id: newOpsId(), at, text: 'Tạo từ Gantt khi TT lệch KH.' }],
                                  });
                                  patchProject(project.code, { bottleneckCount: openBottleneckCount(nextOps.bottlenecks) });
                                  return nextOps;
                                });
                                showToast('success', 'Đã tạo điểm nghẽn từ hạng mục chậm.');
                                navigate(cskhProjectPath(project.code, 'bottlenecks'));
                              }}
                            >
                              Tạo nghẽn
                            </Button>
                          ) : null}
                          <Button type="button" variant="text" onClick={() => setDeleteTarget(row)}>Xóa</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HrmPanel>

      {ops.ganttItems.length > 0 ? (
        <HrmPanel className="cskh-desk__panel">
          <div className="cskh-desk__section-head">
            <div>
              <h2 className="section-heading__title m-0">Bảng chi tiết {project.code}</h2>
              <p className="section-heading__sub mb-0">Xanh đúng tiến độ, cam chậm nhẹ, đỏ nghẽn, thanh đậm là % thực tế.</p>
            </div>
          </div>
          <CskhGanttChart items={ops.ganttItems} />
        </HrmPanel>
      ) : null}

      <HrmPanel className="cskh-desk__panel cskh-report">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Báo cáo tiến độ cho CĐT</h2>
            <p className="section-heading__sub mb-0">{periodWindow.label}. {isoToDisplay(toIsoDate(periodWindow.start))} - {isoToDisplay(toIsoDate(periodWindow.end))}.</p>
          </div>
          <div className="cskh-desk__board-tools">
            <CskhFilterTabs
              value={period}
              options={[{ id: 'week', label: 'Theo tuần' }, { id: 'month', label: 'Theo tháng' }]}
              onChange={setPeriod}
              label="Kỳ báo cáo"
            />
            <Button type="button" onClick={printReport}>Xuất PDF</Button>
          </div>
        </div>
        <p className="cskh-detail__body">
          {project.code} - {project.name}. {kpis.completed}/{kpis.total} hạng mục hoàn thành.
          {kpis.delayed > 0 ? ` ${kpis.delayed} hạng mục đang chậm, cần theo sát.` : ' Không có hạng mục nghẽn nặng.'}
        </p>
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Snapshot và so sánh tiến độ</h2>
            <p className="section-heading__sub mb-0">Lưu mốc % thực tế. Tối đa 50 snapshot gần nhất.</p>
          </div>
          <Button type="button" onClick={saveSnapshot}>Lưu snapshot</Button>
        </div>
        <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="So sánh snapshot">
          <Card className="cskh-desk__kpi-card" title="Tuần trước - TT" value={compare.previous ? `${compare.previous.actualPct}%` : '-'} subtitle={compare.previous ? new Date(compare.previous.at).toLocaleString('vi-VN') : 'Chưa có snapshot trước'} accent="info" />
          <Card className="cskh-desk__kpi-card" title="Tuần này - TT" value={compare.current ? `${compare.current.actualPct}%` : '-'} subtitle={compare.current ? `KH ${compare.current.planPct}%` : 'Chưa lưu snapshot'} accent="teal" />
          <Card className="cskh-desk__kpi-card" title="Biến động" value={compare.current && compare.previous ? formatSignedPct(compare.delta) : '-'} subtitle="So snapshot liền trước" accent={compare.delta < 0 ? 'danger' : 'success'} />
          <Card className="cskh-desk__kpi-card" title="Số snapshot" value={compare.count} subtitle="Tối đa 50 bản gần nhất" accent="neutral" />
        </div>
        {ops.snapshots.length === 0 ? (
          <EmptyState icon={BarChart3} message="Chưa có snapshot. Lưu một mốc sau khi cập nhật % thực tế." />
        ) : (
          <>
            {compare.current ? (
              <div className="wms-inventory-table-wrap cskh-desk__table">
                <table className="wms-inventory-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Hạng mục</th>
                      <th className="table-header-cell cskh-col-pct">KH lúc chụp</th>
                      <th className="table-header-cell cskh-col-pct">TT</th>
                      <th className="table-header-cell cskh-col-pct">Δ KH/TT</th>
                      <th className="table-header-cell">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compare.current.items.map(row => {
                      const delta = row.actualPct - row.planPct;
                      const status = row.actualPct >= 100
                        ? progressGridCopy('on_track')
                        : progressGridCopy(progressStatus({ planPct: row.planPct, actualPct: row.actualPct, bottleneckCount: 0 }));
                      return (
                        <tr key={row.id} className="table-row">
                          <td className="table-cell">{row.name}</td>
                          <td className="table-cell cskh-col-pct"><span className="tabular-nums">{row.planPct}%</span></td>
                          <td className="table-cell cskh-col-pct"><span className="tabular-nums">{row.actualPct}%</span></td>
                          <td className="table-cell cskh-col-pct"><span className="tabular-nums">{formatSignedPct(delta)}</span></td>
                          <td className="table-cell">{row.actualPct >= 100 ? 'Hoàn thành' : status.badge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
            <ol className="cskh-history">
              {ops.snapshots.map(row => (
                <li key={row.id}>
                  <span className="cskh-history__at">{new Date(row.at).toLocaleString('vi-VN')}</span>
                  <span>Portfolio {row.actualPct}% - {row.itemCount} hạng mục</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </HrmPanel>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa hạng mục' : 'Thêm hạng mục'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={saveItem}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Hạng mục" required error={errors.name}>
          <input className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="VD: Chế tạo cơ khí" autoComplete="off" />
        </FormField>
        <FormField label="Số ngày tiêu chuẩn" required error={errors.days}>
          <input className="form-input" inputMode="numeric" value={form.days} onChange={event => setForm(current => ({ ...current, days: event.target.value }))} autoComplete="off" />
        </FormField>
        <FormField label="Bắt đầu dự kiến" required error={errors.startDate}>
          <HrmDatePicker value={form.startDate} onChange={value => setForm(current => ({ ...current, startDate: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Kết thúc dự kiến" required error={errors.endDate}>
          <HrmDatePicker value={form.endDate} onChange={value => setForm(current => ({ ...current, endDate: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="% thực tế" required error={errors.actualPct}>
          <input className="form-input" inputMode="numeric" value={form.actualPct} onChange={event => setForm(current => ({ ...current, actualPct: event.target.value }))} autoComplete="off" />
        </FormField>
        <FormField label="Ghi chú">
          <input className="form-input" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} placeholder="VD: Đã gỡ nghẽn" autoComplete="off" />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          update(current => {
            const nextOps = removeGanttItem(current, deleteTarget.id);
            syncRollup(nextOps.ganttItems);
            return nextOps;
          });
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa hạng mục"
        message={`Xóa hạng mục "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}

function CskhGanttChart({ items }: { items: CskhGanttItem[] }) {
  // Mốc "hôm nay" chốt tại lần mount — tránh gọi Date.now() trong render (react-hooks/purity).
  const [now] = useState(() => Date.now());
  const range = useMemo(() => {
    const starts = items.map(row => parseIsoDate(row.startDate)?.getTime() ?? NaN).filter(Number.isFinite);
    const ends = items.map(row => parseIsoDate(row.endDate)?.getTime() ?? NaN).filter(Number.isFinite);
    const min = Math.min(...starts, now);
    const max = Math.max(...ends, now);
    return { min, max, span: Math.max(1, max - min) };
  }, [items, now]);

  const months = useMemo(() => {
    const marks: Date[] = [];
    const start = new Date(range.min);
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date(range.max);
    while (cursor <= end) {
      marks.push(new Date(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return marks;
  }, [range]);

  const today = ((now - range.min) / range.span) * 100;

  return (
    <div className="cskh-gantt" role="img" aria-label="Biểu đồ Gantt">
      <div className="cskh-gantt__months">
        {months.map(month => (
          <span
            key={month.toISOString()}
            className="cskh-gantt__month"
            style={{ left: `${((month.getTime() - range.min) / range.span) * 100}%` }}
          >
            {`T${month.getMonth() + 1}`}
          </span>
        ))}
      </div>
      {items.map(row => {
        const start = parseIsoDate(row.startDate)?.getTime() ?? range.min;
        const end = parseIsoDate(row.endDate)?.getTime() ?? start;
        const left = ((start - range.min) / range.span) * 100;
        const width = Math.max(2, ((Math.max(end, start) - start) / range.span) * 100);
        const status = ganttItemStatus(row);
        const tone = status === 'done' ? 'done' : status === 'blocked' ? 'blocked' : status === 'slight_delay' ? 'late' : 'ok';
        return (
          <div key={row.id} className="cskh-gantt__row">
            <span className="cskh-gantt__label">{row.name}</span>
            <div className="cskh-gantt__track">
              <span className="cskh-gantt__today" style={{ left: `${Math.min(100, Math.max(0, today))}%` }} aria-hidden />
              <span className={`cskh-gantt__bar cskh-gantt__bar--${tone}`} style={{ left: `${left}%`, width: `${width}%` }}>
                <span className="cskh-gantt__fill" style={{ width: `${row.actualPct}%` }} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
