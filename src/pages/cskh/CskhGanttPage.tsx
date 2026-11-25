import { useCskhAction } from '../../hooks/cskh/useCskhAction';
import { useMemo, useState } from 'react';
import {
  BarChart2,
  Calendar,
  Camera,
  Clock,
  FileDown,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import {
  findCapacityBand,
  findScheduleCombo,
  parseCapacityTons,
  scheduleRowTimeline,
} from '../../lib/cskh/masterData';
import {
  captureSnapshot,
  ganttKpis,
  ganttSubtreeIds,
  isoWeekNumber,
  newOpsId,
  removeGanttItem,
  snapshotCompare,
  upsertGanttItem,
  type CskhGanttItem,
} from '../../lib/cskh/opsWorkspace';
import {
  addDaysIso,
  EMPTY_FORM,
  type GanttDisplayMode,
  type GanttViewMode,
  type TimeScaleMode,
} from '../../lib/cskh/ganttUtils';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';
import PageHeader from '../../components/ui/PageHeader';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhGanttChartView from './components/CskhGanttChartView';
import CskhGanttComparePanel from './components/CskhGanttComparePanel';
import CskhGanttMilestonesPanel from './components/CskhGanttMilestonesPanel';
import CskhGanttTablePanel from './components/CskhGanttTablePanel';
import CskhGanttModals, { type GanttItemFormState } from './components/CskhGanttModals';

interface CskhGanttPageProps {
  project: CskhProjectRecord;
}

const INITIAL_MODAL_FORM: GanttItemFormState = {
  name: EMPTY_FORM.name,
  department: EMPTY_FORM.department,
  days: EMPTY_FORM.days,
  startDate: EMPTY_FORM.startDate,
  endDate: EMPTY_FORM.endDate,
  actualPct: EMPTY_FORM.actualPct,
  notes: EMPTY_FORM.notes,
};

export default function CskhGanttPage({ project }: CskhGanttPageProps) {
  const meta = cskhProjectTabMeta('gantt');
  const workspace = useCskhOpsWorkspace(project.code);
  const { ops, update: updateOps } = workspace;
  const { run, isPending, error: actionError } = useCskhAction();
  const wbsWriteDisabled = isPending || workspace.isSaving || !workspace.canEditGantt;
  const { patchProject } = useCskhCommandCenter();
  const { store: master } = useCskhMasterData();

  const update = (fn: Parameters<typeof updateOps>[0]) => run(async () => {
    const next = fn(ops);
    await updateOps(() => next);
    if (JSON.stringify(next.ganttItems) !== JSON.stringify(ops.ganttItems)) {
      const summary = ganttKpis(next.ganttItems);
      await patchProject(project.code, { planPct: summary.planPct, actualPct: summary.actualPct });
    }
  });

  const kpis = ganttKpis(ops.ganttItems);
  const comparison = useMemo(() => snapshotCompare(ops.snapshots), [ops.snapshots]);
  const openBottlenecksCount = useMemo(
    () => ops.bottlenecks.filter(b => b.status === 'open').length,
    [ops.bottlenecks],
  );

  const [viewMode, setViewMode] = useState<GanttViewMode>('kickoff');
  const [displayMode, setDisplayMode] = useState<GanttDisplayMode>('both');
  const [scaleMode, setScaleMode] = useState<TimeScaleMode>('decade');
  const [showCompare, setShowCompare] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhGanttItem | null>(null);
  const [form, setForm] = useState<GanttItemFormState>(INITIAL_MODAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhGanttItem | null>(null);
  const deleteCount = deleteTarget ? ganttSubtreeIds(ops.ganttItems, deleteTarget.id).size : 0;

  const combo = project.boilerType && project.priority
    ? findScheduleCombo(master, project.boilerType, project.priority)
    : undefined;
  const band = combo ? findCapacityBand(combo, parseCapacityTons(project.capacity)) : undefined;
  const day0 = project.advanceDate || project.startDate || toIsoDate(new Date());

  const openCreate = () => {
    if (wbsWriteDisabled) return;
    setEditing(null);
    setForm({ ...INITIAL_MODAL_FORM, startDate: day0, endDate: addDaysIso(day0, 7) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhGanttItem) => {
    if (wbsWriteDisabled) return;
    setEditing(row);
    setForm({
      name: row.name,
      department: row.department || '',
      days: String(row.days),
      startDate: row.startDate,
      endDate: row.endDate,
      actualPct: String(row.actualPct),
      notes: row.notes ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const saveItem = async () => {
    const name = form.name.trim();
    const days = Number.parseInt(form.days, 10);
    const actualPct = Number.parseInt(form.actualPct, 10);
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập hạng mục.';
    if (!Number.isFinite(days) || days < 0) next.days = 'Nhập số ngày từ 0.';
    if (!form.startDate) next.startDate = 'Chọn ngày bắt đầu.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = 'Ngày kết thúc phải từ ngày bắt đầu.';
    }
    if (!form.endDate) next.endDate = 'Chọn ngày kết thúc.';
    if (!Number.isFinite(actualPct) || actualPct < 0 || actualPct > 100) {
      next.actualPct = 'Nhập % thực tế 0-100.';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const row: CskhGanttItem = {
      ...editing,
      id: editing?.id ?? newOpsId(),
      name,
      department: form.department.trim() || undefined,
      days,
      startDate: form.startDate,
      endDate: form.endDate,
      actualPct,
      notes: form.notes.trim() || undefined,
    };
    if (!await update(current => upsertGanttItem(current, row))) return;
    setOpen(false);
    showToast('success', editing ? 'Đã cập nhật hạng mục.' : 'Đã thêm hạng mục.');
  };

  const applyTemplate = async () => {
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
    if (!await update(current => ({ ...current, ganttItems: items }))) return;
    showToast('success', `Đã áp dụng ${items.length} hạng mục chuẩn. Ngày 0 là ngày nhận tạm ứng.`);
  };

  const saveSnapshot = async () => {
    if (ops.ganttItems.length === 0) {
      showToast('warning', 'Thêm hạng mục trước khi lưu snapshot.');
      return;
    }
    if (!await update(current => captureSnapshot(current))) return;
    showToast('success', 'Đã chụp và lưu snapshot tiến độ tuần thành công.');
  };

  const compareLabel = comparison.current && comparison.previous
    ? `So sánh W${isoWeekNumber(new Date(comparison.current.at))} vs W${isoWeekNumber(new Date(comparison.previous.at))}`
    : 'So sánh kỳ trước';

  return (
    <div className="page-stack cskh-desk" aria-busy={isPending || workspace.isLoading}>
      {workspace.isLoading && <p role="status">Đang tải dữ liệu…</p>}
      {workspace.isError && (
        <p role="alert">
          {workspace.tasksQuery.isError
            ? 'Không tải được WBS. Đã khóa thay đổi tiến độ để bảo vệ các hạng mục hiện có. Hãy tải lại thành công trước khi chỉnh sửa.'
            : 'Không tải được dữ liệu.'}{' '}
          <button type="button" onClick={() => void workspace.refetch()}>Thử lại</button>
        </p>
      )}
      {!workspace.canEditGantt && !workspace.tasksQuery.isError && (
        <p role="status">Đang tải WBS. Có thể chỉnh sửa tiến độ sau khi tải thành công.</p>
      )}
      {actionError && <p role="alert">{actionError}</p>}

      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={(
          <>
            <Button type="button" leftIcon={Camera} disabled={wbsWriteDisabled} onClick={saveSnapshot}>
              Snapshot Tuần
            </Button>
            <Button
              type="button"
              variant={showCompare ? 'filled' : 'outlined'}
              leftIcon={BarChart2}
              onClick={() => setShowCompare(prev => !prev)}
            >
              {compareLabel}
            </Button>
            <Button type="button" variant="outlined" leftIcon={FileDown} onClick={() => window.print()}>
              Xuất Báo Cáo PDF
            </Button>
          </>
        )}
      />

      <CskhPipelineSteps code={project.code} current="gantt" />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số Gantt">
        <Card className="cskh-desk__kpi-card" title="Tổng hạng mục" value={kpis.total} subtitle={`${kpis.completed} hoàn thành`} accent="info" />
        <Card className="cskh-desk__kpi-card" title="Chậm tiến độ" value={kpis.delayed} subtitle="Cần theo dõi" accent={kpis.delayed > 0 ? 'warning' : 'neutral'} />
        <Card className="cskh-desk__kpi-card" title="Kế hoạch trung bình" value={`${kpis.planPct}%`} subtitle="Tất cả hạng mục" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Thực tế trung bình" value={`${kpis.actualPct}%`} subtitle="Tiến độ thực" accent={kpis.actualPct >= kpis.planPct ? 'success' : 'danger'} />
      </div>

      <div className="cskh-desk__view" role="tablist" aria-label="Chế độ biểu đồ Gantt">
        <button
          type="button"
          className={`btn btn-outlined cskh-desk__tab cskh-desk__tab--navy${viewMode === 'kickoff' ? ' is-active' : ''}`}
          onClick={() => setViewMode('kickoff')}
          aria-selected={viewMode === 'kickoff'}
        >
          🚀 Gantt 2: Kick-off Nội Bộ (170 ngày chi tiết)
        </button>
        <button
          type="button"
          className={`btn btn-outlined cskh-desk__tab cskh-desk__tab--navy${viewMode === 'contract' ? ' is-active' : ''}`}
          onClick={() => setViewMode('contract')}
          aria-selected={viewMode === 'contract'}
        >
          🏛 Gantt 1: CĐT & Hợp Đồng (Mốc nghiệm thu)
        </button>
      </div>

      {showCompare && (
        <CskhGanttComparePanel
          comparison={comparison}
          openBottlenecksCount={openBottlenecksCount}
          onClose={() => setShowCompare(false)}
        />
      )}

      {viewMode === 'kickoff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#0284c7" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Tiến độ thi công {project.name} ({project.code})
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                · Mốc tạm ứng: <strong style={{ color: '#0f172a' }}>{isoToDisplay(day0)}</strong>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 4px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> Thước đo:
                </span>
                {(
                  [
                    { key: 'decade', label: 'Mốc 10 ngày', title: 'Chia mỗi tháng thành 3 mốc 10 ngày (01-10, 11-20, 21-cuối tháng)' },
                    { key: 'week', label: 'Tuần dự án (W)', title: 'Hiển thị theo tuần ISO thực tế' },
                    { key: 'day170', label: 'Kick-off 170N', title: 'Hiển thị theo chu kỳ ngày từ mốc bắt đầu' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setScaleMode(item.key)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: scaleMode === item.key ? '#0284c7' : 'transparent',
                      color: scaleMode === item.key ? '#ffffff' : '#475569',
                    }}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {(
                [
                  { key: 'both', label: 'Biểu đồ + Bảng', icon: LayoutGrid },
                  { key: 'chart', label: 'Chỉ xem Biểu đồ Gantt', icon: BarChart2 },
                  { key: 'table', label: 'Chỉ xem Bảng chi tiết', icon: ListFilter },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDisplayMode(key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: displayMode === key ? '#ffffff' : 'transparent',
                    color: displayMode === key ? '#0284c7' : '#64748b',
                    boxShadow: displayMode === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {(displayMode === 'both' || displayMode === 'chart') && (
            <CskhGanttChartView
              items={ops.ganttItems}
              onSelectRow={wbsWriteDisabled ? undefined : openEdit}
              scaleMode={scaleMode}
              todayStr={toIsoDate(new Date())}
            />
          )}

          {(displayMode === 'both' || displayMode === 'table') && (
            <CskhGanttTablePanel
              items={ops.ganttItems}
              actualPct={kpis.actualPct}
              planPct={kpis.planPct}
              wbsWriteDisabled={wbsWriteDisabled}
              onEdit={openEdit}
              onApplyTemplate={applyTemplate}
              onCreate={openCreate}
            />
          )}
        </div>
      )}

      {viewMode === 'contract' && <CskhGanttMilestonesPanel milestones={[]} />}

      <CskhGanttModals
        open={open}
        editing={editing}
        form={form}
        setForm={setForm}
        errors={errors}
        wbsWriteDisabled={wbsWriteDisabled}
        isPending={isPending}
        deleteTarget={deleteTarget}
        deleteCount={deleteCount}
        onCloseForm={() => setOpen(false)}
        onSaveForm={saveItem}
        onRequestDeleteFromEdit={item => {
          setOpen(false);
          setDeleteTarget(item);
        }}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={async () => {
          if (!deleteTarget) return;
          if (!await update(current => removeGanttItem(current, deleteTarget.id))) return;
          setDeleteTarget(null);
          showToast(
            'success',
            deleteCount > 1
              ? `Đã xóa ${deleteTarget.name} và ${deleteCount - 1} hạng mục con.`
              : `Đã xóa ${deleteTarget.name}.`,
          );
        }}
      />
    </div>
  );
}
