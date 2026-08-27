import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { useCskhDocsPipeline } from '../../hooks/cskh/useCskhDocsPipeline';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import {
  CSKH_DEPARTMENTS,
  departmentLabel,
  feedbackKpis,
  feedbackStatus,
  filterFeedback,
  newDocsId,
  removeFeedback,
  upsertFeedback,
  type CskhFeedbackFilter,
  type CskhFeedbackItem,
} from '../../lib/cskh/docsPipeline';
import CskhMasterTable from './CskhMasterTable';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsFeedbackPageProps {
  project: CskhProjectRecord;
}

const FILTERS: CskhFilterOption<CskhFeedbackFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'done', label: 'Đã hoàn tất', tone: 'ok' },
  { id: 'dueSoon', label: 'Sắp đến hạn', tone: 'warn' },
  { id: 'overdue', label: 'Quá hạn', tone: 'danger' },
  { id: 'resubmit', label: 'Đệ trình ≥ 2 lần', tone: 'info' },
];

const EMPTY_FORM = {
  name: '',
  notes: '',
  originalCode: '',
  departmentId: 'tech',
  sentDate: '',
  dueDate: '',
};

function statusCopy(row: CskhFeedbackItem) {
  const status = feedbackStatus(row);
  if (status === 'done') return { label: 'Đã hoàn tất', tone: 'ok' as const };
  if (status === 'overdue') return { label: 'Quá hạn', tone: 'danger' as const };
  if (status === 'dueSoon') return { label: 'Sắp đến hạn', tone: 'warn' as const };
  return { label: 'Đang chờ', tone: 'ok' as const };
}

export default function CskhDocsFeedbackPage({ project }: CskhDocsFeedbackPageProps) {
  const meta = cskhProjectTabMeta('docs-feedback');
  const { docs, update } = useCskhDocsPipeline(project.code);
  const kpis = feedbackKpis(docs.feedback);
  const [filter, setFilter] = useState<CskhFeedbackFilter>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhFeedbackItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhFeedbackItem | null>(null);
  const rows = filterFeedback(docs.feedback, filter);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sentDate: toIsoDate(new Date()) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhFeedbackItem) => {
    setEditing(row);
    setForm({
      name: row.name,
      notes: row.notes ?? '',
      originalCode: row.originalCode ?? '',
      departmentId: row.departmentId,
      sentDate: row.sentDate,
      dueDate: row.dueDate,
    });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập tên hồ sơ / nội dung câu hỏi.';
    if (!form.departmentId) next.departmentId = 'Chọn phòng ban chờ phản hồi.';
    if (!form.sentDate) next.sentDate = 'Chọn ngày gửi.';
    if (!form.dueDate) next.dueDate = 'Chọn hạn phản hồi.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    update(current => upsertFeedback(current, {
      id: editing?.id ?? newDocsId(),
      name,
      notes: form.notes.trim() || undefined,
      originalCode: form.originalCode.trim() || undefined,
      departmentId: form.departmentId,
      sentDate: form.sentDate,
      dueDate: form.dueDate,
      submitCount: editing?.submitCount ?? 1,
      done: editing?.done ?? false,
    }));
    setOpen(false);
    showToast('success', editing ? 'Đã cập nhật hồ sơ theo dõi.' : 'Đã thêm hồ sơ theo dõi.');
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader title={meta.title} subtitle={`${project.code} - ${meta.subtitle}`} />
      <CskhPipelineSteps code={project.code} current="docs-feedback" />

      <div className="dashboard-kpi-grid cskh-project__kpi cskh-project__kpi--5" role="list" aria-label="Chỉ số phản hồi">
        <Card className="cskh-desk__kpi-card" title="Tổng hồ sơ đang chờ" value={kpis.waiting} subtitle="Đang theo dõi" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Sắp đến hạn mở lại" value={kpis.dueSoon} subtitle="Trong 5 ngày tới" accent="amber" />
        <Card className="cskh-desk__kpi-card" title="Quá hạn phản hồi" value={kpis.overdue} subtitle="Cần escalate" accent="danger" />
        <Card className="cskh-desk__kpi-card" title="Đệ trình > 2 lần" value={kpis.resubmit} subtitle="Cần theo sát" accent="teal" />
        <Card className="cskh-desk__kpi-card" title="Đã hoàn tất" value={kpis.done} subtitle="Đã xử lý xong" accent="success" />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Hồ sơ đang chờ xử lý</h2>
            <p className="section-heading__sub mb-0">Bấm sửa để xem các lần đệ trình. Thêm hồ sơ mới khi CĐT hỏi thêm.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={filter} options={FILTERS} onChange={setFilter} label="Lọc hồ sơ" />
            <Button type="button" className="cskh-desk__toolbar-add" leftIcon={Plus} onClick={openCreate}>Thêm hồ sơ theo dõi</Button>
          </div>
        </div>
        <CskhMasterTable
          columns={[
            { key: 'name', label: 'Hồ sơ', render: row => row.name },
            { key: 'dept', label: 'Chờ phản hồi', render: row => departmentLabel(row.departmentId) },
            { key: 'sent', label: 'Ngày gửi', render: row => isoToDisplay(row.sentDate) || '-' },
            { key: 'due', label: 'Hạn phản hồi', render: row => isoToDisplay(row.dueDate) || '-' },
            { key: 'count', label: 'Số lần', className: 'cskh-col-pct', render: row => <span className="tabular-nums">{row.submitCount}</span> },
            {
              key: 'status',
              label: 'Trạng thái',
              render: row => {
                const copy = statusCopy(row);
                return (
                  <span className={`cskh-status cskh-status--${copy.tone}`}>
                    <span className="cskh-status__dot" aria-hidden />
                    {copy.label}
                  </span>
                );
              },
            },
          ]}
          rows={rows}
          emptyMessage="Không có hồ sơ khớp bộ lọc."
          emptyIcon={Bell}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </HrmPanel>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa hồ sơ theo dõi phản hồi' : 'Thêm hồ sơ theo dõi phản hồi'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Tên hồ sơ / nội dung câu hỏi cần theo dõi" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            placeholder="VD: Câu hỏi của CĐT về quy cách vật tư"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Ghi chú / bối cảnh">
          <textarea
            className="form-input"
            rows={3}
            value={form.notes}
            onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
            placeholder="VD: CĐT hỏi qua email ngày..."
          />
        </FormField>
        <FormField label="Liên kết văn bản gốc">
          <input
            className="form-input"
            value={form.originalCode}
            onChange={event => setForm(current => ({ ...current, originalCode: event.target.value }))}
            placeholder="VD: VB-501"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Gửi tới / phòng ban chờ phản hồi" required error={errors.departmentId}>
          <HrmSelect
            value={form.departmentId}
            options={CSKH_DEPARTMENTS.map(item => ({ value: item.id, label: item.label }))}
            allowEmpty={false}
            onChange={value => setForm(current => ({ ...current, departmentId: value }))}
          />
        </FormField>
        <FormField label="Ngày gửi" required error={errors.sentDate}>
          <HrmDatePicker
            value={form.sentDate}
            onChange={value => setForm(current => ({ ...current, sentDate: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <FormField label="Hạn phản hồi" required error={errors.dueDate}>
          <HrmDatePicker
            value={form.dueDate}
            onChange={value => setForm(current => ({ ...current, dueDate: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          update(current => removeFeedback(current, deleteTarget.id));
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa hồ sơ theo dõi"
        message={`Xóa hồ sơ "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
