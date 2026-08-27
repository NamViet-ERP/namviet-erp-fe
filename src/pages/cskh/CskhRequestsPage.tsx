import { useEffect, useMemo, useState } from 'react';
import { Download, Lightbulb, Plus } from 'lucide-react';
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
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import { CSKH_DEPARTMENTS, departmentLabel } from '../../lib/cskh/docsPipeline';
import {
  filterRequests,
  newOpsId,
  removeRequest,
  requestKpis,
  requestRuntimeStatus,
  requestsToCsv,
  upsertRequest,
  type CskhInternalRequest,
  type CskhRequestFilter,
  type CskhRequestStatus,
} from '../../lib/cskh/opsWorkspace';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import CskhPickList from './CskhPickList';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhRequestsPageProps {
  project: CskhProjectRecord;
}

const FILTERS: CskhFilterOption<CskhRequestFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'open', label: 'Đang mở', tone: 'warn' },
  { id: 'processing', label: 'Đang xử lý', tone: 'ok' },
  { id: 'overdue', label: 'Quá hạn', tone: 'danger' },
  { id: 'closed', label: 'Đã đóng', tone: 'muted' },
];

const STATUS_COPY: Record<CskhRequestFilter, { label: string; tone: 'ok' | 'warn' | 'danger' }> = {
  all: { label: 'Tất cả', tone: 'ok' },
  open: { label: 'Đang mở', tone: 'warn' },
  processing: { label: 'Đang xử lý', tone: 'ok' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
  closed: { label: 'Đã đóng', tone: 'ok' },
};

const EMPTY_FORM = {
  name: '',
  body: '',
  fromDept: 'tech',
  toDept: 'acc',
  dueDate: '',
};

export default function CskhRequestsPage({ project }: CskhRequestsPageProps) {
  const meta = cskhProjectTabMeta('requests');
  const { ops, update } = useCskhOpsWorkspace(project.code);
  const kpis = requestKpis(ops.requests);
  const [filter, setFilter] = useState<CskhRequestFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhInternalRequest | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhInternalRequest | null>(null);

  const rows = useMemo(() => filterRequests(ops.requests, filter), [ops.requests, filter]);
  const selected = rows.find(row => row.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && rows.some(row => row.id === selectedId)) return;
    setSelectedId(rows[0]?.id ?? null);
  }, [rows, selectedId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, dueDate: toIsoDate(new Date()) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhInternalRequest) => {
    setEditing(row);
    setForm({
      name: row.name,
      body: row.body ?? '',
      fromDept: row.fromDept,
      toDept: row.toDept,
      dueDate: row.dueDate,
    });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập nội dung yêu cầu.';
    if (!form.fromDept) next.fromDept = 'Chọn phòng gửi.';
    if (!form.toDept) next.toDept = 'Chọn phòng nhận.';
    if (!form.dueDate) next.dueDate = 'Chọn hạn xử lý.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const row: CskhInternalRequest = {
      id: editing?.id ?? newOpsId(),
      name,
      body: form.body.trim() || undefined,
      fromDept: form.fromDept,
      toDept: form.toDept,
      dueDate: form.dueDate,
      status: editing?.status ?? 'open',
      createdAt: editing?.createdAt ?? toIsoDate(new Date()),
    };
    update(current => upsertRequest(current, row));
    setOpen(false);
    setSelectedId(row.id);
    showToast('success', editing ? 'Đã cập nhật yêu cầu.' : 'Đã tạo yêu cầu.');
  };

  const setStatus = (status: CskhRequestStatus) => {
    if (!selected) return;
    update(current => upsertRequest(current, { ...selected, status }));
    showToast('success', status === 'closed' ? 'Đã đóng yêu cầu.' : 'Đã chuyển đang xử lý.');
  };

  const exportCsv = () => {
    const blob = new Blob([requestsToCsv(ops.requests)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cskh-yeu-cau-${project.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={(
          <>
            <Button type="button" variant="outlined" leftIcon={Download} onClick={exportCsv}>Xuất Excel</Button>
            <Button type="button" leftIcon={Plus} onClick={openCreate}>Tạo yêu cầu</Button>
          </>
        )}
      />

      <div className="dashboard-kpi-grid cskh-project__kpi cskh-project__kpi--3" role="list" aria-label="Chỉ số yêu cầu">
        <Card className="cskh-desk__kpi-card" title="Tổng yêu cầu" value={kpis.total} subtitle={`${kpis.open} đang mở`} accent="info" />
        <Card className="cskh-desk__kpi-card" title="Cần xử lý" value={kpis.needAction} subtitle="Mở hoặc quá hạn" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="Đã đóng" value={Math.max(0, kpis.total - kpis.open)} subtitle="Đã xác nhận xong" accent="success" />
      </div>

      <HrmPanel className="cskh-desk__panel" noPadding>
        {ops.requests.length === 0 ? (
          <EmptyState icon={Lightbulb} message={meta.empty} />
        ) : (
          <>
            <div className="cskh-split-toolbar">
              <CskhFilterTabs value={filter} options={FILTERS} onChange={setFilter} label="Lọc yêu cầu" />
            </div>
            {rows.length === 0 ? (
              <p className="cskh-pick__empty">Không có yêu cầu khớp bộ lọc.</p>
            ) : (
              <div className="cskh-split cskh-split--detail">
                <div className="cskh-pick">
                  <p className="cskh-pick__head">{rows.length} yêu cầu</p>
                  <CskhPickList
                    title="Danh sách yêu cầu"
                    rows={rows}
                    selectedId={selectedId}
                    onSelect={row => setSelectedId(row.id)}
                    renderRow={row => {
                      const status = requestRuntimeStatus(row);
                      return (
                        <>
                          <span className="cskh-pick__name">{row.name}</span>
                          <span className="cskh-pick__meta">{departmentLabel(row.fromDept)} - {departmentLabel(row.toDept)}</span>
                          <span className={`cskh-status cskh-status--${STATUS_COPY[status].tone}`}>
                            <span className="cskh-status__dot" aria-hidden />
                            {STATUS_COPY[status].label}
                          </span>
                        </>
                      );
                    }}
                  />
                </div>

            <section className="cskh-detail" aria-label="Chi tiết yêu cầu">
              {selected ? (
                <>
                  <div className="cskh-detail__head">
                    <div>
                      <p className="cskh-detail__kicker">{STATUS_COPY[requestRuntimeStatus(selected)].label}</p>
                      <h3 className="cskh-detail__title">{selected.name}</h3>
                    </div>
                    <div className="cskh-inline-form__actions">
                      <Button type="button" variant="outlined" onClick={() => openEdit(selected)}>Sửa</Button>
                      <Button type="button" variant="outlined" onClick={() => setDeleteTarget(selected)}>Xóa</Button>
                    </div>
                  </div>
                  <dl className="cskh-fact-list">
                    <div className="cskh-fact-list__row">
                      <dt>Gửi từ</dt>
                      <dd>{departmentLabel(selected.fromDept)}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Gửi tới</dt>
                      <dd>{departmentLabel(selected.toDept)}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Hạn xử lý</dt>
                      <dd>{isoToDisplay(selected.dueDate) || '-'}</dd>
                    </div>
                  </dl>
                  {selected.body ? <p className="cskh-detail__body">{selected.body}</p> : null}
                  <div className="cskh-inline-form__actions">
                    <Button type="button" variant="outlined" disabled={selected.status === 'closed'} onClick={() => setStatus('processing')}>Đang xử lý</Button>
                    <Button type="button" disabled={selected.status === 'closed'} onClick={() => setStatus('closed')}>Đóng yêu cầu</Button>
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
        title={editing ? 'Sửa yêu cầu' : 'Tạo yêu cầu'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Nội dung yêu cầu" required error={errors.name}>
          <input className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="VD: Cần xác nhận số liệu nghiệm thu" autoComplete="off" />
        </FormField>
        <FormField label="Gửi từ" required error={errors.fromDept}>
          <HrmSelect value={form.fromDept} options={CSKH_DEPARTMENTS.map(item => ({ value: item.id, label: item.label }))} allowEmpty={false} onChange={value => setForm(current => ({ ...current, fromDept: value }))} />
        </FormField>
        <FormField label="Gửi tới" required error={errors.toDept}>
          <HrmSelect value={form.toDept} options={CSKH_DEPARTMENTS.map(item => ({ value: item.id, label: item.label }))} allowEmpty={false} onChange={value => setForm(current => ({ ...current, toDept: value }))} />
        </FormField>
        <FormField label="Hạn xử lý" required error={errors.dueDate}>
          <HrmDatePicker value={form.dueDate} onChange={value => setForm(current => ({ ...current, dueDate: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Mô tả">
          <textarea className="form-input" rows={3} value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} placeholder="Bối cảnh, file đính kèm, người liên quan" />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          update(current => removeRequest(current, deleteTarget.id));
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa yêu cầu"
        message={`Xóa yêu cầu "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
