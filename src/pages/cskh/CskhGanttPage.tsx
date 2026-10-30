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
  Plus,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay, parseIsoDate, toIsoDate } from '../../lib/dates';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import {
  findCapacityBand,
  findScheduleCombo,
  parseCapacityTons,
  scheduleRowTimeline,
} from '../../lib/cskh/masterData';
import { formatSignedPct } from '../../lib/cskh/commandCenter';
import {
  captureSnapshot,
  ganttItemPlanPct,
  ganttKpis,
  ganttSubtreeIds,
  isoWeekNumber,
  newOpsId,
  removeGanttItem,
  snapshotCompare,
  upsertGanttItem,
  type CskhGanttItem,
} from '../../lib/cskh/opsWorkspace';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';
import PageHeader from '../../components/ui/PageHeader';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import CskhPipelineSteps from './CskhPipelineSteps';

interface CskhGanttPageProps {
  project: CskhProjectRecord;
}

export type GanttViewMode = 'kickoff' | 'contract';
export type GanttDisplayMode = 'both' | 'chart' | 'table';
export type TimeScaleMode = 'decade' | 'week' | 'day170';

const EMPTY_FORM = {
  name: '',
  department: '',
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

function getProjectContractMilestones(project: CskhProjectRecord) {
  const d0 = project.advanceDate || project.startDate || toIsoDate(new Date());
  const targetCod = project.targetCodDate || addDaysIso(d0, 135);
  const m2Date = addDaysIso(d0, 60);
  const m3Date = addDaysIso(d0, 85);
  const m4Date = addDaysIso(d0, 120);
  const warrantyEnd = addDaysIso(targetCod, (project.warrantyMonths || 48) * 30);

  return [
    {
      id: 'cm-1',
      name: 'Mốc 1: Tạm ứng 20% & Bàn giao mặt bằng móng lò',
      date: d0,
      paymentPct: '20%',
      status: 'done',
      statusLabel: 'Đã hoàn tất',
      notes: project.advanceDate ? `CĐT đã thanh toán đợt 1 ngày ${isoToDisplay(project.advanceDate)}` : 'Đã nhận tạm ứng hợp đồng',
    },
    {
      id: 'cm-2',
      name: 'Mốc 2: Nghiệm thu balong xưởng & kết cấu thép móng (30%)',
      date: m2Date,
      paymentPct: '30%',
      status: 'on_track',
      statusLabel: 'Nghiệm thu chế tạo',
      notes: 'Biên bản nghiệm thu xưởng và bàn giao mặt bằng',
    },
    {
      id: 'cm-3',
      name: 'Mốc 3: Lắp balong lên khung & hàn ống sinh hơi (20%)',
      date: m3Date,
      paymentPct: '20%',
      status: 'delayed',
      statusLabel: 'Lắp đặt thân lò',
      notes: 'Lắp đặt kết cấu và hàn cụm balong ống áp lực',
    },
    {
      id: 'cm-4',
      name: 'Mốc 4: Thử áp lực thủy lực hydrostatic 1.5x (15%)',
      date: m4Date,
      paymentPct: '15%',
      status: 'delayed',
      statusLabel: 'Kiểm định thử áp',
      notes: 'Thử áp lực nước và thẩm định hồ sơ kỹ thuật',
    },
    {
      id: 'cm-5',
      name: 'Mốc 5: Bàn giao phát điện thương mại COD (10%)',
      date: targetCod,
      paymentPct: '10%',
      status: 'target',
      statusLabel: 'Mục tiêu COD',
      notes: 'Mốc về đích phát điện/cung cấp nhiệt thương mại',
    },
    {
      id: 'cm-6',
      name: 'Mốc 6: Hoàn tất thời gian bảo hành hợp đồng (5%)',
      date: warrantyEnd,
      paymentPct: '5%',
      status: 'warranty',
      statusLabel: `Bảo hành ${project.warrantyMonths || 48} tháng`,
      notes: 'Giải tỏa bảo lãnh thực hiện hợp đồng sau thời hạn bảo hành',
    },
  ];
}

function getProjectMilestonePins(project: CskhProjectRecord) {
  const d0 = project.advanceDate || project.startDate || toIsoDate(new Date());
  const targetCod = project.targetCodDate || addDaysIso(d0, 135);
  const m2Date = addDaysIso(d0, 60);
  const m3Date = addDaysIso(d0, 85);
  const m4Date = addDaysIso(d0, 120);

  return [
    { id: 'm-1', label: 'M1: Tạm ứng 20%', date: d0, color: '#0284c7', tier: 'top' as const },
    { id: 'm-2', label: 'M2: Balong xưởng (30%)', date: m2Date, color: '#16a34a', tier: 'top' as const },
    { id: 'm-3', label: 'M3: Lắp thân lò (20%)', date: m3Date, color: '#dc2626', tier: 'top' as const },
    { id: 'm-4', label: 'M4: Thử áp 15%', date: m4Date, color: '#d97706', tier: 'top' as const },
    { id: 'm-5', label: 'M5: COD Thương mại (10%)', date: targetCod, color: '#0284c7', tier: 'bottom' as const },
  ];
}

interface TimelineSubdivision {
  key: string;
  label: string;
  sublabel: string;
  daysCount: number;
  startOffsetDays: number;
  widthPct: number;
}

interface TimelineMonth {
  key: string;
  year: number;
  month: number;
  label: string;
  daysCount: number;
  startOffsetDays: number;
  widthPct: number;
  subdivisions: TimelineSubdivision[];
}

function buildTimelineStructure(
  items: CskhGanttItem[],
  scaleMode: TimeScaleMode = 'decade',
  todayStr?: string,
  defaultStartIso?: string,
  defaultEndIso?: string,
) {
  const baseStart = parseIsoDate(defaultStartIso) ?? new Date();
  const baseEnd = parseIsoDate(defaultEndIso) ?? new Date(baseStart.getFullYear(), baseStart.getMonth() + 5, 0);

  let minDate = new Date(baseStart.getFullYear(), baseStart.getMonth(), 1);
  let maxDate = new Date(baseEnd.getFullYear(), baseEnd.getMonth() + 1, 0);

  for (const item of items) {
    const s = parseIsoDate(item.startDate);
    const e = parseIsoDate(item.endDate);
    if (s && s < minDate) minDate = new Date(s.getFullYear(), s.getMonth(), 1);
    if (e && e > maxDate) maxDate = new Date(e.getFullYear(), e.getMonth() + 1, 0);
  }

  const today = parseIsoDate(todayStr ?? toIsoDate(new Date())) ?? new Date();
  const startTime = minDate.getTime();
  const endTime = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0, 23, 59, 59).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((endTime - startTime) / msPerDay));

  const months: TimelineMonth[] = [];
  let cur = new Date(minDate);
  let globalWeekCounter = 23; // June starts around Week 23

  while (cur <= maxDate) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = new Date(year, month, 1).getTime();
    const startOffsetDays = Math.max(0, Math.round((monthStart - startTime) / msPerDay));
    const widthPct = (daysInMonth / totalDays) * 100;

    let subDefs: { label: string; sublabel: string; days: number }[];

    if (scaleMode === 'decade') {
      // 3 clean, highly legible 10-day intervals (Thập niên)
      subDefs = [
        { label: '01 - 10', sublabel: 'Đầu tháng', days: 10 },
        { label: '11 - 20', sublabel: 'Giữa tháng', days: 10 },
        { label: `21 - ${daysInMonth}`, sublabel: 'Cuối tháng', days: daysInMonth - 20 },
      ];
    } else if (scaleMode === 'week') {
      // ISO Weeks matching project meeting cycles (W23..W42)
      subDefs = [
        { label: `W${globalWeekCounter++}`, sublabel: '01-07', days: 7 },
        { label: `W${globalWeekCounter++}`, sublabel: '08-14', days: 7 },
        { label: `W${globalWeekCounter++}`, sublabel: '15-21', days: 7 },
        { label: `W${globalWeekCounter++}`, sublabel: `22-${daysInMonth}`, days: daysInMonth - 21 },
      ];
    } else {
      // 170-Day Kick-off project timeline days
      const dStart = startOffsetDays;
      subDefs = [
        { label: `N${dStart + 1} - N${dStart + 15}`, sublabel: '15 ngày', days: 15 },
        { label: `N${dStart + 16} - N${dStart + daysInMonth}`, sublabel: `${daysInMonth - 15} ngày`, days: daysInMonth - 15 },
      ];
    }

    let wOffset = startOffsetDays;
    const subdivisions = subDefs.map((def, idx) => {
      const wDays = def.days;
      const wStart = wOffset;
      wOffset += wDays;
      return {
        key: `sub-${year}-${month}-${idx}`,
        label: def.label,
        sublabel: def.sublabel,
        daysCount: wDays,
        startOffsetDays: wStart,
        widthPct: (wDays / totalDays) * 100,
      };
    });

    months.push({
      key: `m-${year}-${month}`,
      year,
      month,
      label: `Tháng ${month + 1}/${year}`,
      daysCount: daysInMonth,
      startOffsetDays,
      widthPct,
      subdivisions,
    });

    cur = new Date(year, month + 1, 1);
  }

  const todayOffsetDays = Math.max(0, Math.round((today.getTime() - startTime) / msPerDay));
  const todayLeftPct = Math.min(100, Math.max(0, (todayOffsetDays / totalDays) * 100));

  return {
    startTime,
    endTime,
    totalDays,
    months,
    todayLeftPct,
    todayStr: isoToDisplay(todayStr) || '22/09/2026',
  };
}

function calculateItemBar(item: CskhGanttItem, startTime: number, totalDays: number) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const s = parseIsoDate(item.startDate)?.getTime() ?? startTime;
  const e = parseIsoDate(item.endDate)?.getTime() ?? (s + item.days * msPerDay);
  const startOffset = Math.max(0, Math.round((s - startTime) / msPerDay));
  const duration = Math.max(1, Math.round((e - s) / msPerDay));
  const leftPct = (startOffset / totalDays) * 100;
  const widthPct = Math.max(2.5, (duration / totalDays) * 100);

  return { leftPct, widthPct, duration };
}

export default function CskhGanttPage({ project }: CskhGanttPageProps) {
  const meta = cskhProjectTabMeta('gantt');
  const workspace = useCskhOpsWorkspace(project.code);
  const { ops, update: updateOps } = workspace;
  const { run, isPending, error: actionError } = useCskhAction();
  const wbsWriteDisabled = isPending || workspace.isSaving || !workspace.canEditGantt;
  const update = (fn: Parameters<typeof updateOps>[0]) => run(async () => {
    const next = fn(ops);
    await updateOps(() => next);
    if (JSON.stringify(next.ganttItems) !== JSON.stringify(ops.ganttItems)) {
      const summary = ganttKpis(next.ganttItems);
      await patchProject(project.code, { planPct: summary.planPct, actualPct: summary.actualPct });
    }
  });
  const { patchProject } = useCskhCommandCenter();
  const { store: master } = useCskhMasterData();
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhGanttItem | null>(null);
  const deleteCount = deleteTarget ? ganttSubtreeIds(ops.ganttItems, deleteTarget.id).size : 0;

  const combo = project.boilerType && project.priority
    ? findScheduleCombo(master, project.boilerType, project.priority)
    : undefined;
  const band = combo ? findCapacityBand(combo, parseCapacityTons(project.capacity)) : undefined;
  const day0 = project.advanceDate || project.startDate || toIsoDate(new Date());

  const contractMilestones = useMemo(() => getProjectContractMilestones(project), [project]);
  const milestonePins = useMemo(() => getProjectMilestonePins(project), [project]);


  const openCreate = () => {
    if (wbsWriteDisabled) return;
    setEditing(null);
    setForm({ ...EMPTY_FORM, startDate: day0, endDate: addDaysIso(day0, 7) });
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
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = 'Ngày kết thúc phải từ ngày bắt đầu.';
    if (!form.endDate) next.endDate = 'Chọn ngày kết thúc.';
    if (!Number.isFinite(actualPct) || actualPct < 0 || actualPct > 100) next.actualPct = 'Nhập % thực tế 0-100.';
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
    if (!await update(current => {
      const nextOps = upsertGanttItem(current, row);

      return nextOps;
    })) return;
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
    if (!await update(current => {
      const nextOps = { ...current, ganttItems: items };

      return nextOps;
    })) return;
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

  const printReport = () => {
    window.print();
  };

  return (
    <div className="page-stack cskh-desk" aria-busy={isPending || workspace.isLoading}>
      {workspace.isLoading && <p role="status">Đang tải dữ liệu…</p>}
      {workspace.isError && <p role="alert">
        {workspace.tasksQuery.isError
          ? 'Không tải được WBS. Đã khóa thay đổi tiến độ để bảo vệ các hạng mục hiện có. Hãy tải lại thành công trước khi chỉnh sửa.'
          : 'Không tải được dữ liệu.'}{' '}
        <button type="button" onClick={() => void workspace.refetch()}>Thử lại</button>
      </p>}
      {!workspace.canEditGantt && !workspace.tasksQuery.isError && <p role="status">Đang tải WBS. Có thể chỉnh sửa tiến độ sau khi tải thành công.</p>}
      {actionError && <p role="alert">{actionError}</p>}
      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={(
          <>
            <Button type="button" leftIcon={Camera} disabled={wbsWriteDisabled} onClick={saveSnapshot}>Snapshot Tuần</Button>
            <Button
              type="button"
              variant={showCompare ? 'filled' : 'outlined'}
              leftIcon={BarChart2}
              onClick={() => setShowCompare(prev => !prev)}
            >
              So Sánh W37 vs W36
            </Button>
            <Button type="button" variant="outlined" leftIcon={FileDown} onClick={printReport}>Xuất Báo Cáo PDF</Button>
          </>
        )}
      />

      <CskhPipelineSteps code={project.code} current="gantt" />

      {/* KPI GRID */}
      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số Gantt">
        <Card className="cskh-desk__kpi-card" title="Tổng hạng mục" value={kpis.total} subtitle={`${kpis.completed} hoàn thành`} accent="info" />
        <Card className="cskh-desk__kpi-card" title="Chậm tiến độ" value={kpis.delayed} subtitle="Cần theo dõi" accent={kpis.delayed > 0 ? 'warning' : 'neutral'} />
        <Card className="cskh-desk__kpi-card" title="Kế hoạch trung bình" value={`${kpis.planPct}%`} subtitle="Tất cả hạng mục" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Thực tế trung bình" value={`${kpis.actualPct}%`} subtitle="Tiến độ thực" accent={kpis.actualPct >= kpis.planPct ? 'success' : 'danger'} />
      </div>

      {/* DUAL GANTT SWITCHER */}
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

      {/* SO SÁNH SNAPSHOTS PANEL (KHI BẬT) */}
      {showCompare && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
          marginBottom: '16px',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
              📊 ĐỐI SOÁT TIẾN ĐỘ THỰC TẾ GIỮA CÁC TUẦN SNAPSHOT ({comparison.count} MỐC ĐÃ LƯU)
            </h3>
            <button
              type="button"
              onClick={() => setShowCompare(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕ Đóng
            </button>
          </div>
          {comparison.current && comparison.previous ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Tuần {isoWeekNumber(new Date(comparison.previous.at))} (W{isoWeekNumber(new Date(comparison.previous.at))}) · Mốc trước
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{comparison.previous.actualPct}%</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Kế hoạch: {comparison.previous.planPct}%</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>
                  Tuần {isoWeekNumber(new Date(comparison.current.at))} (W{isoWeekNumber(new Date(comparison.current.at))}) · Mốc mới nhất
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d' }}>{comparison.current.actualPct}%</div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>Kế hoạch: {comparison.current.planPct}%</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: comparison.delta < 0 ? '#fef2f2' : '#f0fdf4', border: comparison.delta < 0 ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', color: comparison.delta < 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>Biến động thực tế</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: comparison.delta < 0 ? '#dc2626' : '#15803d' }}>
                  {formatSignedPct(comparison.delta)}
                </div>
                <div style={{ fontSize: '12px', color: comparison.delta < 0 ? '#b91c1c' : '#15803d' }}>
                  {comparison.delta > 0 ? 'Tiến độ tăng trưởng' : comparison.delta === 0 ? 'Tiến độ chững lại' : 'Tiến độ bị thụt lùi'}
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 600 }}>Điểm nghẽn đang mở</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>{openBottlenecksCount} điểm</div>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  {openBottlenecksCount > 0 ? 'Cần giải tỏa kịp thời' : 'Không có điểm nghẽn'}
                </div>
              </div>
            </div>
          ) : comparison.current ? (
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
              ℹ️ Đã có 1 snapshot (Tuần {isoWeekNumber(new Date(comparison.current.at))} - {comparison.current.actualPct}% thực tế). Cần thêm ít nhất 1 snapshot nữa sau giao ban để hệ thống tự động đối soát chênh lệch giữa hai tuần.
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
              ℹ️ Chưa có snapshot nào. Bấm <strong>Chụp snapshot</strong> ở góc phải để lưu mốc tiến độ đầu tiên vào cơ sở dữ liệu.
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: KICK-OFF 170 NGÀY BÓC TÁCH */}
      {viewMode === 'kickoff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* DISPLAY MODE CONTROL & TIME SCALE TOOLBAR */}
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
                  Tiến độ thi công Lò Hơi Biomass 30 Tấn/h (LH-01)
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                · Mốc tạm ứng: <strong style={{ color: '#0f172a' }}>{isoToDisplay(day0)}</strong>
              </span>

              {/* TIME SCALE SELECTOR (CƠ CHẾ ĐỐI CHIẾU THỜI GIAN) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 4px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> Thước đo:
                </span>
                <button
                  type="button"
                  onClick={() => setScaleMode('decade')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: scaleMode === 'decade' ? '#0284c7' : 'transparent',
                    color: scaleMode === 'decade' ? '#ffffff' : '#475569',
                  }}
                  title="Chia mỗi tháng thành 3 mốc 10 ngày (01-10, 11-20, 21-30) cực kỳ rõ ràng, thoáng mắt"
                >
                  Mốc 10 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode('week')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: scaleMode === 'week' ? '#0284c7' : 'transparent',
                    color: scaleMode === 'week' ? '#ffffff' : '#475569',
                  }}
                  title="Hiển thị theo số tuần dự án ISO (W23..W42) khớp với biên bản giao ban tuần 37"
                >
                  Tuần dự án (W)
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode('day170')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: scaleMode === 'day170' ? '#0284c7' : 'transparent',
                    color: scaleMode === 'day170' ? '#ffffff' : '#475569',
                  }}
                  title="Hiển thị theo chu kỳ 170 ngày bóc tách từ Ngày 0 đến Ngày 170"
                >
                  Kick-off 170N
                </button>
              </div>
            </div>

            {/* VIEW MODE TOGGLE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setDisplayMode('both')}
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
                  backgroundColor: displayMode === 'both' ? '#ffffff' : 'transparent',
                  color: displayMode === 'both' ? '#0284c7' : '#64748b',
                  boxShadow: displayMode === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <LayoutGrid size={13} />
                <span>Biểu đồ + Bảng</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('chart')}
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
                  backgroundColor: displayMode === 'chart' ? '#ffffff' : 'transparent',
                  color: displayMode === 'chart' ? '#0284c7' : '#64748b',
                  boxShadow: displayMode === 'chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <BarChart2 size={13} />
                <span>Chỉ xem Biểu đồ Gantt</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('table')}
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
                  backgroundColor: displayMode === 'table' ? '#ffffff' : 'transparent',
                  color: displayMode === 'table' ? '#0284c7' : '#64748b',
                  boxShadow: displayMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <ListFilter size={13} />
                <span>Chỉ xem Bảng chi tiết</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: DETAILED GANTT TIMELINE CHART (CLEAR, CẶN KẼ, KHÔNG CHỒNG LẤN) */}
          {(displayMode === 'both' || displayMode === 'chart') && (
            <CskhGanttTimelineChart
              items={ops.ganttItems}
              onSelectRow={wbsWriteDisabled ? undefined : openEdit}
              scaleMode={scaleMode}
              todayStr={toIsoDate(new Date())}
              milestonePins={milestonePins}
            />
          )}

          {/* SECTION 2: DETAILED EXECUTION TABLE MATCHING MOCKUP */}
          {(displayMode === 'both' || displayMode === 'table') && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}>
              {/* CARD HEADER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <h2 style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  margin: 0,
                }}>
                  CHI TIẾT TIẾN ĐỘ CÁC ĐỘI THI CÔNG (% KH HÔM NAY VS % TT THỰC TẾ)
                </h2>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Hôm nay: <span style={{ fontWeight: 600 }}>{isoToDisplay(toIsoDate(new Date()))}</span> · Tiến độ đạt: <strong style={{ color: kpis.actualPct >= kpis.planPct ? '#16a34a' : '#dc2626' }}>{kpis.actualPct}%</strong> (Kế hoạch: {kpis.planPct}%)
                </div>
              </div>

              {/* TABLE */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '28%' }}>
                        HẠNG MỤC GANTT NỘI BỘ
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '16%' }}>
                        BỘ PHẬN PHỤ TRÁCH
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '10%' }}>
                        THỜI HẠN
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                        % KH
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                        % TT
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                        Δ LỆCH
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '15%' }}>
                        TIMELINE TIẾN ĐỘ THỰC HIỆN
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>
                        TRẠNG THÁI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.ganttItems.map(row => {
                      const plan = ganttItemPlanPct(row);
                      const delta = row.actualPct - plan;
                      const isBottleneck = row.statusLabel?.includes('Nghẽn') || row.statusTone === 'danger' || delta <= -20;
                      
                      let badgeBg = '#e0f2fe';
                      let badgeColor = '#0369a1';
                      if (row.actualPct >= 100) {
                        badgeBg = '#dcfce7';
                        badgeColor = '#15803d';
                      } else if (isBottleneck) {
                        badgeBg = '#fee2e2';
                        badgeColor = '#b91c1c';
                      } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                        badgeBg = '#fef3c7';
                        badgeColor = '#b45309';
                      }

                      const progressColor = row.actualPct >= 100
                        ? '#10b981'
                        : isBottleneck
                        ? '#ef4444'
                        : '#0284c7';

                      return (
                        <tr
                          key={row.id}
                          onClick={wbsWriteDisabled ? undefined : () => openEdit(row)}
                          aria-disabled={wbsWriteDisabled}
                          style={{
                            backgroundColor: isBottleneck ? 'rgba(254, 242, 242, 0.7)' : '#ffffff',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: wbsWriteDisabled ? 'default' : 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          title="Nhấn để chỉnh sửa hoặc cập nhật tiến độ"
                        >
                          <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                            {row.name}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                            {row.department || '-'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                            {row.days} ngày
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                            {plan}%
                          </td>
                          <td style={{
                            padding: '14px 16px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : '#475569',
                            textAlign: 'center',
                          }}>
                            {row.actualPct}%
                          </td>
                          <td style={{
                            padding: '14px 16px',
                            fontSize: '13px',
                            fontWeight: delta < 0 ? 700 : 500,
                            color: delta < 0 ? '#dc2626' : '#64748b',
                            textAlign: 'center',
                          }}>
                            {formatSignedPct(delta)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, row.actualPct))}%`,
                                  height: '100%',
                                  backgroundColor: progressColor,
                                  borderRadius: '9999px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              whiteSpace: 'nowrap',
                            }}>
                              {row.statusLabel || (row.actualPct >= 100 ? 'Hoàn thành' : 'Đang thực hiện')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER ACTIONS */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                backgroundColor: '#fafafa',
                borderTop: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  💡 Nhấp vào từng dòng để cập nhật % thực tế hoặc bộ phận phụ trách
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ops.ganttItems.length === 0 ? (
                    <Button type="button" variant="outlined" disabled={wbsWriteDisabled} onClick={applyTemplate}>Áp dụng bảng chuẩn</Button>
                  ) : null}
                  <Button type="button" size="sm" leftIcon={Plus} disabled={wbsWriteDisabled} onClick={openCreate}>Thêm hạng mục</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MỐC HỢP ĐỒNG CĐT & THANH TOÁN (MILESTONES) */}
      {viewMode === 'contract' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          {/* CARD HEADER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              margin: 0,
            }}>
              CHI TIẾT MỐC HỢP ĐỒNG & THANH TOÁN VỚI CHỦ ĐẦU TƯ (MỐC PHÁP LÝ)
            </h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Cam kết nghiệm thu 6 đợt theo Hợp đồng EPC
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '880px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '38%' }}>
                    MỐC HỢP ĐỒNG
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '14%' }}>
                    HẠN CAM KẾT
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '12%' }}>
                    THANH TOÁN
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '18%' }}>
                    TÌNH TRẠNG PHÁP LÝ
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '18%' }}>
                    GHI CHÚ ĐỐI SOÁT
                  </th>
                </tr>
              </thead>
              <tbody>
                {contractMilestones.map(cm => {
                  const isDelay = cm.status === 'delayed';
                  const isDone = cm.status === 'done' || cm.status === 'on_track';
                  return (
                    <tr
                      key={cm.id}
                      style={{
                        backgroundColor: isDelay ? 'rgba(254, 242, 242, 0.7)' : '#ffffff',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {cm.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                        {isoToDisplay(cm.date)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                        {cm.paymentPct}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: isDone ? '#dcfce7' : isDelay ? '#fee2e2' : cm.status === 'warranty' ? '#ede9fe' : '#e0f2fe',
                          color: isDone ? '#15803d' : isDelay ? '#b91c1c' : cm.status === 'warranty' ? '#6d28d9' : '#0369a1',
                        }}>
                          {cm.statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#64748b' }}>
                        {cm.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa hạng mục tiến độ' : 'Thêm hạng mục tiến độ'}
        size="md"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {editing ? (
              <Button type="button" variant="text" disabled={wbsWriteDisabled} style={{ color: '#dc2626' }} onClick={async () => { setOpen(false); setDeleteTarget(editing); }}>
                Xóa hạng mục
              </Button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="button" disabled={wbsWriteDisabled} onClick={saveItem}>Lưu</Button>
            </div>
          </div>
        )}
      >
        <FormField label="Hạng mục thi công" required error={errors.name}>
          <input className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="VD: Lắp đặt khung thép & Thân lò" autoComplete="off" />
        </FormField>
        <FormField label="Bộ phận phụ trách">
          <input className="form-input" value={form.department} onChange={event => setForm(current => ({ ...current, department: event.target.value }))} placeholder="VD: Đội Lắp 1 (CT)" autoComplete="off" />
        </FormField>
        <FormField label="Thời hạn (số ngày)" required error={errors.days}>
          <input className="form-input" inputMode="numeric" value={form.days} onChange={event => setForm(current => ({ ...current, days: event.target.value }))} autoComplete="off" />
        </FormField>
        <FormField label="Bắt đầu dự kiến" required error={errors.startDate}>
          <HrmDatePicker value={form.startDate} onChange={value => setForm(current => ({ ...current, startDate: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Kết thúc dự kiến" required error={errors.endDate}>
          <HrmDatePicker value={form.endDate} onChange={value => setForm(current => ({ ...current, endDate: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="% thực tế đạt được" required error={errors.actualPct}>
          <input className="form-input" inputMode="numeric" value={form.actualPct} onChange={event => setForm(current => ({ ...current, actualPct: event.target.value }))} autoComplete="off" />
        </FormField>
        <FormField label="Ghi chú">
          <input className="form-input" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} placeholder="VD: Đang xử lý vướng mắc" autoComplete="off" />
        </FormField>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isLoading={isPending}
        confirmDisabled={wbsWriteDisabled}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (!await update(current => {
            const nextOps = removeGanttItem(current, deleteTarget.id);

            return nextOps;
          })) return;
          setDeleteTarget(null);
          showToast('success', deleteCount > 1 ? `Đã xóa ${deleteTarget.name} và ${deleteCount - 1} hạng mục con.` : `Đã xóa ${deleteTarget.name}.`);
        }}
        title={deleteCount > 1 ? 'Xóa nhóm hạng mục' : 'Xóa hạng mục'}
        message={deleteCount > 1
          ? `Xóa nhóm "${deleteTarget?.name ?? ''}" cùng toàn bộ ${deleteCount - 1} hạng mục con (tổng ${deleteCount} hạng mục)?`
          : `Xóa hạng mục "${deleteTarget?.name ?? ''}"?`}
        confirmLabel={deleteCount > 1 ? `Xóa ${deleteCount} hạng mục` : 'Xóa'}
      />
    </div>
  );
}

/**
 * BIỂU ĐỒ GANTT TIMELINE CHI TIẾT (T6/2026 - T10/2026)
 * - Thước đo thời gian thông minh: Mốc 10 ngày (Đầu/Giữa/Cuối tháng) / Tuần dự án (W23..W42) / Kick-off 170 Ngày
 * - Mốc Hôm nay nằm trên thanh Thước đo ngày, KHÔNG đè vào Mốc Hợp đồng
 * - Cờ Mốc Hợp đồng nằm so le, khoảng cách rộng rãi, TUYỆT ĐỐI KHÔNG CHỒNG LẤN
 * - Cột Hạng mục bên trái cố định (Sticky) khi cuộn ngang
 */
function CskhGanttTimelineChart({
  items,
  onSelectRow,
  scaleMode = 'decade',
  todayStr,
  milestonePins = [],
}: {
  items: CskhGanttItem[];
  onSelectRow?: (item: CskhGanttItem) => void;
  scaleMode?: TimeScaleMode;
  todayStr?: string;
  milestonePins?: Array<{ id: string; label: string; date: string; color: string; tier: 'top' | 'bottom' }>;
}) {
  const currentTodayStr = todayStr || toIsoDate(new Date());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const timeline = useMemo(() => {
    return buildTimelineStructure(items, scaleMode, currentTodayStr);
  }, [items, scaleMode, currentTodayStr]);

  const activeHoverItem = useMemo(() => {
    return items.find(it => it.id === hoveredId) ?? null;
  }, [items, hoveredId]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* CHART HEADER & LEGEND */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{
            fontSize: '13.5px',
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            margin: 0,
          }}>
            BIỂU ĐỒ GANTT TIMELINE TIẾN ĐỘ THỜI GIAN
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Trục thời gian tiến độ thi công dự án và các mốc nghiệm thu thanh toán EPC
          </p>
        </div>

        {/* LEGEND CHÚ GIẢI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Hoàn thành (100%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Nghẽn tiến độ (BN)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Chờ phụ thuộc</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
            <span style={{ color: '#334155' }}>Chưa bắt đầu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '3px', backgroundColor: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Đường Hôm nay ({isoToDisplay(currentTodayStr)})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚩</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>Mốc Hợp đồng CĐT</span>
          </div>
        </div>
      </div>

      {/* TIMELINE CANVAS CONTAINER (SCROLLABLE, STICKY LEFT COLUMN) */}
      <div style={{ overflowX: 'auto', backgroundColor: '#ffffff' }}>
        <div style={{ minWidth: `${Math.max(1600, 320 + timeline.months.length * 240)}px`, display: 'flex', flexDirection: 'column' }}>
          
          {/* HEADER ROW 1: MONTHS & TIME SUBDIVISIONS */}
          <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            {/* STICKY Task Column Header */}
            <div style={{
              width: '320px',
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 30,
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRight: '1px solid #cbd5e1',
              boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                HẠNG MỤC THI CÔNG & BỘ PHẬN
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {items.length} hạng mục
              </span>
            </div>

            {/* Timeline Axis Header */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Tier 1: Months */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', height: '30px', alignItems: 'center' }}>
                {timeline.months.map(m => (
                  <div
                    key={m.key}
                    style={{
                      width: `${m.widthPct}%`,
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1e293b',
                      borderRight: '1px solid #cbd5e1',
                      padding: '4px 4px',
                      letterSpacing: '0.2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.label} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>({m.daysCount} ngày)</span>
                  </div>
                ))}
              </div>

              {/* Tier 2: Subdivisions (10-day decades, Weeks, or 170-Day segments) */}
              <div style={{ display: 'flex', height: '26px', alignItems: 'center', backgroundColor: '#fafafa', position: 'relative' }}>
                {timeline.months.map(m => (
                  <div key={`sub-${m.key}`} style={{ width: `${m.widthPct}%`, display: 'flex', height: '100%', borderRight: '1px solid #cbd5e1' }}>
                    {m.subdivisions.map(sub => (
                      <div
                        key={sub.key}
                        style={{
                          width: `${(sub.daysCount / m.daysCount) * 100}%`,
                          textAlign: 'center',
                          fontSize: '10.5px',
                          color: '#475569',
                          borderRight: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          padding: '0 2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={`${sub.label}: ${sub.sublabel}`}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>{sub.label}</span>
                        {scaleMode === 'decade' && (
                          <span style={{ fontSize: '9px', opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ({sub.sublabel})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Floating "Hôm nay" Flag on Tier 2 Date Axis (NO COLLISION WITH MILESTONES) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: `${timeline.todayLeftPct}%`,
                    transform: 'translateX(-50%)',
                    zIndex: 25,
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 4px rgba(239,68,68,0.3)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="Mốc thời gian đối chiếu hiện tại"
                >
                  <span>📍</span>
                  <span>Hôm nay ({isoToDisplay(currentTodayStr)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED CONTRACTUAL MILESTONE ROW (EPC DELIVERABLES ONLY - ZERO OVERLAP) */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', height: '42px', alignItems: 'center' }}>
            {/* Sticky Milestone Row Title */}
            <div style={{
              width: '320px',
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 28,
              backgroundColor: '#f1f5f9',
              padding: '8px 16px',
              borderRight: '1px solid #cbd5e1',
              boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#0284c7',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              <span>🚩</span>
              <span>MỐC HỢP ĐỒNG CĐT (EPC)</span>
            </div>

            {/* Timeline Milestone Track */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              {/* Background Month & Subdivision Grid dividers */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                {timeline.months.map(m => (
                  <div key={`m-grid-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                    {m.subdivisions.map(sub => (
                      <div key={`w-grid-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                    ))}
                  </div>
                ))}
              </div>

              {/* Red marker vertical guide line through milestone row */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${timeline.todayLeftPct}%`,
                width: '2px',
                backgroundColor: '#ef4444',
                zIndex: 5,
                pointerEvents: 'none',
              }} />

              {/* Milestone Pins (Staggered top/bottom so M4 & M5 NEVER collide) */}
              {milestonePins.map(pin => {
                const s = parseIsoDate(pin.date);
                if (!s) return null;
                const offset = (s.getTime() - timeline.startTime) / (1000 * 60 * 60 * 24);
                const leftPct = Math.min(98, Math.max(0, (offset / timeline.totalDays) * 100));
                const isBottomTier = pin.tier === 'bottom';

                return (
                  <div
                    key={pin.id}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: isBottomTier ? '21px' : '4px',
                      transform: leftPct > 85 ? 'translateX(-80%)' : 'translateX(-30%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: pin.color,
                      backgroundColor: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: `1px solid ${pin.color}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                    }}
                    title={`${pin.label}: ngày ${isoToDisplay(pin.date)}`}
                  >
                    <span>🚩</span>
                    <span>{pin.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIMELINE TASK ROWS */}
          <div style={{ position: 'relative' }}>
            {items.map((row, rowIdx) => {
              const bar = calculateItemBar(row, timeline.startTime, timeline.totalDays);
              const plan = ganttItemPlanPct(row);
              const delta = row.actualPct - plan;
              const isBottleneck = row.statusTone === 'danger' || (row.statusLabel?.includes('Nghẽn') && row.actualPct < 100);
              const isHovered = hoveredId === row.id;

              let themeColor = '#0284c7';
              let themeBg = '#e0f2fe';
              let progressFill = '#0284c7';

              if (row.actualPct >= 100) {
                themeColor = '#16a34a';
                themeBg = '#dcfce7';
                progressFill = '#10b981';
              } else if (isBottleneck) {
                themeColor = '#dc2626';
                themeBg = '#fee2e2';
                progressFill = '#ef4444';
              } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                themeColor = '#d97706';
                themeBg = '#fef3c7';
                progressFill = '#f59e0b';
              }

              // Non-colliding single status badge per row
              let statusBadge: { text: string; bg: string; color: string; border: string };
              if (row.actualPct >= 100) {
                statusBadge = {
                  text: '✓ Hoàn thành 100%',
                  bg: '#dcfce7',
                  color: '#15803d',
                  border: '#86efac',
                };
              } else if (isBottleneck) {
                statusBadge = {
                  text: `⚠️ ${row.statusLabel || 'Nghẽn'} (${formatSignedPct(delta)})`,
                  bg: '#fee2e2',
                  color: '#b91c1c',
                  border: '#fca5a5',
                };
              } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                statusBadge = {
                  text: `⏳ ${row.statusLabel || 'Chờ phụ thuộc'}`,
                  bg: '#fef3c7',
                  color: '#b45309',
                  border: '#fde68a',
                };
              } else {
                statusBadge = {
                  text: row.statusLabel || 'Chưa bắt đầu',
                  bg: '#f1f5f9',
                  color: '#475569',
                  border: '#cbd5e1',
                };
              }

              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    height: '64px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isHovered
                      ? '#f8fafc'
                      : isBottleneck
                      ? 'rgba(254, 242, 242, 0.45)'
                      : rowIdx % 2 === 1
                      ? '#fafbfc'
                      : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* STICKY Left Column: Task Info (Pinned when scrolling horizontally) */}
                  <div
                    onClick={() => onSelectRow?.(row)}
                    style={{
                      width: '320px',
                      flexShrink: 0,
                      position: 'sticky',
                      left: 0,
                      zIndex: 25,
                      backgroundColor: isHovered
                        ? '#f8fafc'
                        : isBottleneck
                        ? '#fef2f2'
                        : rowIdx % 2 === 1
                        ? '#fafbfc'
                        : '#ffffff',
                      padding: '10px 16px',
                      borderRight: '1px solid #cbd5e1',
                      boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Nhấn để chỉnh sửa chi tiết"
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isBottleneck ? '#b91c1c' : '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {row.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isBottleneck ? '#fee2e2' : '#f1f5f9',
                        color: isBottleneck ? '#b91c1c' : '#475569',
                        fontWeight: 600,
                      }}>
                        {row.department || '-'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {row.days} ngày ({isoToDisplay(row.startDate)} ➔ {isoToDisplay(row.endDate)})
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : '#0284c7',
                      }}>
                        TT: {row.actualPct}%
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Timeline Track */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={() => setHoveredId(row.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Background Vertical Grid Lines for Subdivisions */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                      {timeline.months.map(m => (
                        <div key={`m-trk-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                          {m.subdivisions.map(sub => (
                            <div key={`w-trk-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Shaded elapsed days area */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${timeline.todayLeftPct}%`,
                      backgroundColor: 'rgba(241, 245, 249, 0.45)',
                      pointerEvents: 'none',
                    }} />

                    {/* Continuous Red "Hôm nay" Marker Line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${timeline.todayLeftPct}%`,
                      width: '2px',
                      backgroundColor: '#ef4444',
                      zIndex: 8,
                      pointerEvents: 'none',
                    }} />

                    {/* Gantt Bar */}
                    <div
                      onClick={() => onSelectRow?.(row)}
                      style={{
                        position: 'absolute',
                        left: `${bar.leftPct}%`,
                        width: `${bar.widthPct}%`,
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: themeBg,
                        border: `1.5px solid ${themeColor}`,
                        boxShadow: isHovered ? '0 3px 8px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                        transform: isHovered ? 'translateY(-1px)' : 'none',
                        zIndex: isHovered ? 7 : 2,
                      }}
                      title={`${row.name}: ${row.actualPct}% đạt được (${isoToDisplay(row.startDate)} ➔ {isoToDisplay(row.endDate)})`}
                    >
                      {/* Actual Progress Fill */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${Math.min(100, Math.max(0, row.actualPct))}%`,
                          backgroundColor: progressFill,
                          transition: 'width 0.3s ease',
                        }}
                      />

                      {/* Bar Label (Inside) */}
                      {row.actualPct > 0 && (
                        <span style={{
                          position: 'relative',
                          zIndex: 3,
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: row.actualPct > 35 ? '#ffffff' : themeColor,
                          textShadow: row.actualPct > 35 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.actualPct}%
                        </span>
                      )}
                    </div>

                    {/* Single Distinct Status Badge Next to Bar (NO DUPLICATION & NO OVERLAP) */}
                    <div style={{
                      position: 'absolute',
                      left: `calc(${bar.leftPct + bar.widthPct}% + 12px)`,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                        border: `1px solid ${statusBadge.border}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER TOOLTIP / ACTIVE SELECTION DETAIL */}
      {activeHoverItem ? (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div>
            <strong style={{ color: '#0f172a' }}>🔎 Đang chọn: {activeHoverItem.name}</strong>
            <span style={{ color: '#475569', marginLeft: '10px' }}>
              Bộ phận: <strong>{activeHoverItem.department || '-'}</strong> · Thời gian: <strong>{isoToDisplay(activeHoverItem.startDate)} ➔ {isoToDisplay(activeHoverItem.endDate)} ({activeHoverItem.days} ngày)</strong>
            </span>
          </div>
          <div>
            <span>Kế hoạch: <strong>{ganttItemPlanPct(activeHoverItem)}%</strong></span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>Thực tế: <strong style={{ color: activeHoverItem.actualPct >= 100 ? '#16a34a' : '#dc2626' }}>{activeHoverItem.actualPct}%</strong></span>
            {activeHoverItem.notes && (
              <span style={{ color: '#b91c1c', marginLeft: '10px', fontStyle: 'italic' }}>
                ({activeHoverItem.notes})
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #f1f5f9',
          fontSize: '11.5px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>💡 Cột hạng mục bên trái được ghim cố định (Sticky) khi cuộn ngang · Sử dụng nút "Thước đo" để chuyển đổi hiển thị 10 ngày / Tuần W / 170 Ngày</span>
          <span>Tổng chu kỳ Kick-off: <strong>170 ngày</strong></span>
        </div>
      )}
    </div>
  );
}
