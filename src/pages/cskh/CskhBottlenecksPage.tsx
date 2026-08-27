import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import { CSKH_DEPARTMENTS, departmentLabel } from '../../lib/cskh/docsPipeline';
import {
  CSKH_SEVERITIES,
  appendBottleneckNote,
  bottleneckKpis,
  closeBottleneck,
  daysBetween,
  filterBottlenecks,
  nextOpsCode,
  newOpsId,
  openBottleneckCount,
  removeBottleneck,
  severityLabel,
  upsertBottleneck,
  type CskhBottleneck,
  type CskhBottleneckFilter,
  type CskhSeverity,
} from '../../lib/cskh/opsWorkspace';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import CskhPickList from './CskhPickList';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhBottlenecksPageProps {
  project: CskhProjectRecord;
}

const FILTERS: CskhFilterOption<CskhBottleneckFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'urgent', label: 'Khẩn cấp', tone: 'danger' },
  { id: 'medium', label: 'Trung bình', tone: 'warn' },
  { id: 'low', label: 'Thấp', tone: 'ok' },
  { id: 'closed', label: 'Đã đóng', tone: 'muted' },
];

const EMPTY_FORM = {
  name: '',
  severity: 'medium' as CskhSeverity,
  startedAt: '',
  expectedAt: '',
  reason: '',
  departmentId: 'tech',
};

function severityTone(id: CskhSeverity): 'danger' | 'warn' | 'ok' {
  if (id === 'urgent') return 'danger';
  if (id === 'medium') return 'warn';
  return 'ok';
}

export default function CskhBottlenecksPage({ project }: CskhBottlenecksPageProps) {
  const meta = cskhProjectTabMeta('bottlenecks');
  const { ops, update } = useCskhOpsWorkspace(project.code);
  const { patchProject } = useCskhCommandCenter();
  const kpis = bottleneckKpis(ops.bottlenecks);
  const [filter, setFilter] = useState<CskhBottleneckFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhBottleneck | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhBottleneck | null>(null);

  const rows = useMemo(() => filterBottlenecks(ops.bottlenecks, filter), [ops.bottlenecks, filter]);
  const selected = rows.find(row => row.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && rows.some(row => row.id === selectedId)) return;
    setSelectedId(rows[0]?.id ?? null);
  }, [rows, selectedId]);

  const syncCount = (bottlenecks: CskhBottleneck[]) => {
    const openCount = openBottleneckCount(bottlenecks);
    if (openCount !== project.bottleneckCount) {
      patchProject(project.code, { bottleneckCount: openCount });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, startedAt: toIsoDate(new Date()) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhBottleneck) => {
    setEditing(row);
    setForm({
      name: row.name,
      severity: row.severity,
      startedAt: row.startedAt,
      expectedAt: row.expectedAt,
      reason: row.reason,
      departmentId: row.departmentId ?? 'tech',
    });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const reason = form.reason.trim();
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập nội dung điểm nghẽn.';
    if (!form.startedAt) next.startedAt = 'Chọn ngày phát sinh.';
    if (!form.expectedAt) next.expectedAt = 'Chọn hạn xử lý.';
    if (!reason) next.reason = 'Nhập lý do nghẽn.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const at = new Date().toISOString();
    const row: CskhBottleneck = {
      id: editing?.id ?? newOpsId(),
      code: editing?.code ?? nextOpsCode('NG', ops.bottlenecks.map(item => item.code)),
      name,
      severity: form.severity,
      status: editing?.status ?? 'open',
      startedAt: form.startedAt,
      expectedAt: form.expectedAt,
      reason,
      departmentId: form.departmentId,
      source: editing?.source ?? 'manual',
      history: editing?.history ?? [{ id: newOpsId(), at, text: 'Tạo điểm nghẽn.' }],
    };
    update(current => {
      const nextOps = upsertBottleneck(current, row);
      syncCount(nextOps.bottlenecks);
      return nextOps;
    });
    setOpen(false);
    setSelectedId(row.id);
    showToast('success', editing ? 'Đã cập nhật điểm nghẽn.' : 'Đã tạo điểm nghẽn.');
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={(
          <Button type="button" leftIcon={Plus} onClick={openCreate}>Tạo điểm nghẽn</Button>
        )}
      />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số điểm nghẽn">
        <Card className="cskh-desk__kpi-card" title="Điểm nghẽn đang mở" value={kpis.open} subtitle={`${ops.bottlenecks.length} tổng cộng`} accent="danger" />
        <Card className="cskh-desk__kpi-card" title="Mức độ khẩn cấp" value={kpis.urgent} subtitle="Cần xử lý ngay" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="Quá hạn xử lý" value={kpis.overdue} subtitle="So với hạn dự kiến" accent="amber" />
        <Card className="cskh-desk__kpi-card" title="Đã đóng" value={kpis.closed} subtitle="Đã xác nhận xong" accent="success" />
      </div>

      <HrmPanel className="cskh-desk__panel" noPadding>
        {ops.bottlenecks.length === 0 ? (
          <EmptyState icon={AlertTriangle} message={meta.empty} />
        ) : (
          <>
            <div className="cskh-split-toolbar">
              <CskhFilterTabs value={filter} options={FILTERS} onChange={setFilter} label="Lọc điểm nghẽn" />
            </div>
            {rows.length === 0 ? (
              <p className="cskh-pick__empty">Không có điểm nghẽn khớp bộ lọc.</p>
            ) : (
              <div className="cskh-split cskh-split--detail">
                <div className="cskh-pick">
                  <p className="cskh-pick__head">{rows.length} điểm nghẽn</p>
                  <CskhPickList
                    title="Danh sách điểm nghẽn"
                    rows={rows}
                    selectedId={selectedId}
                    onSelect={row => setSelectedId(row.id)}
                    renderRow={row => (
                      <>
                        <span className="cskh-pick__code">{row.code}</span>
                        <span className="cskh-pick__name">{row.name}</span>
                        <span className={`cskh-status cskh-status--${row.status === 'closed' ? 'ok' : severityTone(row.severity)}`}>
                          <span className="cskh-status__dot" aria-hidden />
                          {row.status === 'closed' ? 'Đã đóng' : severityLabel(row.severity)}
                        </span>
                        <span className="cskh-pick__meta">{row.status === 'closed' ? 'Đã đóng' : `${daysBetween(row.startedAt)} ngày`}</span>
                      </>
                    )}
                  />
                </div>

            <section className="cskh-detail" aria-label="Chi tiết điểm nghẽn">
              {selected ? (
                <>
                  <div className="cskh-detail__head">
                    <div>
                      <p className="cskh-detail__kicker">{selected.code}</p>
                      <h3 className="cskh-detail__title">{selected.name}</h3>
                    </div>
                    <div className="cskh-inline-form__actions">
                      <Button type="button" variant="outlined" onClick={() => openEdit(selected)}>Sửa</Button>
                      <Button type="button" variant="outlined" onClick={() => setDeleteTarget(selected)}>Xóa</Button>
                    </div>
                  </div>
                  <dl className="cskh-fact-list">
                    <div className="cskh-fact-list__row">
                      <dt>Mức độ</dt>
                      <dd>{severityLabel(selected.severity)}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Phát sinh</dt>
                      <dd>{isoToDisplay(selected.startedAt) || '-'}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Hạn xử lý</dt>
                      <dd>{isoToDisplay(selected.expectedAt) || '-'}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Phòng ban</dt>
                      <dd>{selected.departmentId ? departmentLabel(selected.departmentId) : '-'}</dd>
                    </div>
                  </dl>
                  <p className="section-heading__sub mb-0">Lý do nghẽn</p>
                  <p className="cskh-detail__body">{selected.reason}</p>
                  <p className="section-heading__sub mb-0">Lịch sử</p>
                  <ol className="cskh-history">
                    {selected.history.map(note => (
                      <li key={note.id}>
                        <span className="cskh-history__at">{new Date(note.at).toLocaleString('vi-VN')}</span>
                        <span>{note.text}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="cskh-inline-form__actions">
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={selected.status === 'closed'}
                      onClick={() => {
                        const dept = selected.departmentId ? departmentLabel(selected.departmentId) : 'phòng ban phụ trách';
                        update(current => appendBottleneckNote(current, selected.id, `Đã nhắc ${dept}.`));
                        showToast('success', `Đã ghi nhận nhắc ${dept}.`);
                      }}
                    >
                      Nhắc lại phòng ban
                    </Button>
                    <Button
                      type="button"
                      disabled={selected.status === 'closed'}
                      onClick={() => {
                        update(current => {
                          const nextOps = closeBottleneck(current, selected.id);
                          syncCount(nextOps.bottlenecks);
                          return nextOps;
                        });
                        showToast('success', 'Đã đóng điểm nghẽn.');
                      }}
                    >
                      Đã xử lý xong
                    </Button>
                  </div>
                </>
              ) : null}
            </section>
              </div>
            )}
          </>
        )}
      </HrmPanel>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa điểm nghẽn' : 'Tạo điểm nghẽn'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Nội dung điểm nghẽn" required error={errors.name}>
          <input className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="VD: Gantt chậm tiến độ giai đoạn sản xuất" autoComplete="off" />
        </FormField>
        <FormField label="Mức độ" required>
          <HrmSelect value={form.severity} options={CSKH_SEVERITIES.map(item => ({ value: item.id, label: item.label }))} allowEmpty={false} onChange={value => setForm(current => ({ ...current, severity: value as CskhSeverity }))} />
        </FormField>
        <FormField label="Phòng ban phụ trách">
          <HrmSelect value={form.departmentId} options={CSKH_DEPARTMENTS.map(item => ({ value: item.id, label: item.label }))} allowEmpty={false} onChange={value => setForm(current => ({ ...current, departmentId: value }))} />
        </FormField>
        <FormField label="Ngày phát sinh" required error={errors.startedAt}>
          <HrmDatePicker value={form.startedAt} onChange={value => setForm(current => ({ ...current, startedAt: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Hạn xử lý" required error={errors.expectedAt}>
          <HrmDatePicker value={form.expectedAt} onChange={value => setForm(current => ({ ...current, expectedAt: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Lý do nghẽn" required error={errors.reason}>
          <textarea className="form-input" rows={3} value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} placeholder="VD: % thực tế thấp hơn % kế hoạch tại thời điểm hiện tại" />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          update(current => {
            const nextOps = removeBottleneck(current, deleteTarget.id);
            syncCount(nextOps.bottlenecks);
            return nextOps;
          });
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa điểm nghẽn"
        message={`Xóa điểm nghẽn "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
