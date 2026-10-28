import { useCskhAction } from '../../hooks/cskh/useCskhAction';
import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
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
import { isoToDisplay, toIsoDate } from '../../lib/dates';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import {
  isPastDate,
  meetingKpis,
  newOpsId,
  nextOpsCode,
  openBottleneckCount,
  removeMeeting,
  upsertBottleneck,
  upsertMeeting,
  type CskhMeeting,
  type CskhMeetingAction,
} from '../../lib/cskh/opsWorkspace';
import CskhPickList from './CskhPickList';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';
import CskhPipelineSteps from './CskhPipelineSteps';

interface CskhMeetingsPageProps {
  project: CskhProjectRecord;
}

const EMPTY_FORM = {
  name: '',
  date: '',
  attendees: '',
  agenda: '',
};

function overdueActionCount(row: CskhMeeting): number {
  return row.actions.filter(action => !action.done && isPastDate(action.dueDate)).length;
}

export default function CskhMeetingsPage({ project }: CskhMeetingsPageProps) {
  const meta = cskhProjectTabMeta('meetings');
  const workspace = useCskhOpsWorkspace(project.code);
  const { ops, update: updateOps } = workspace;
  const { run, isPending, error: actionError } = useCskhAction();
  const update = (fn: Parameters<typeof updateOps>[0]) => run(async () => {
    const next = fn(ops);
    await updateOps(() => next);
    if (openBottleneckCount(next.bottlenecks) !== openBottleneckCount(ops.bottlenecks)) {
      await patchProject(project.code, { bottleneckCount: openBottleneckCount(next.bottlenecks) });
    }
  });
  const { patchProject } = useCskhCommandCenter();
  const kpis = meetingKpis(ops.meetings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhMeeting | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhMeeting | null>(null);
  const [actionName, setActionName] = useState('');
  const [actionDue, setActionDue] = useState('');
  const [minutes, setMinutes] = useState('');
  const [minutesSourceId, setMinutesSourceId] = useState<string | null>(null);

  const rows = ops.meetings;
  const nextSelectedId =
    selectedId && rows.some(row => row.id === selectedId) ? selectedId : (rows[0]?.id ?? null);
  if (nextSelectedId !== selectedId) {
    setSelectedId(nextSelectedId);
  }
  const selected = rows.find(row => row.id === nextSelectedId) ?? null;

  if ((selected?.id ?? null) !== minutesSourceId) {
    setMinutesSourceId(selected?.id ?? null);
    setMinutes(selected?.minutes ?? '');
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: toIsoDate(new Date()) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhMeeting) => {
    setEditing(row);
    setForm({
      name: row.name,
      date: row.date,
      attendees: row.attendees ?? '',
      agenda: row.agenda ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập tên cuộc họp.';
    if (!form.date) next.date = 'Chọn ngày họp.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const row: CskhMeeting = {
      ...editing,
      id: editing?.id ?? newOpsId(),
      name,
      date: form.date,
      attendees: form.attendees.trim() || undefined,
      agenda: form.agenda.trim() || undefined,
      minutes: editing?.minutes,
      actions: editing?.actions ?? [],
    };
    if (!await update(current => upsertMeeting(current, row))) return;
    setOpen(false);
    setSelectedId(row.id);
    showToast('success', editing ? 'Đã cập nhật cuộc họp.' : 'Đã tạo cuộc họp.');
  };

  const patchSelected = async (patch: Partial<CskhMeeting>) => {
    if (!selected) return false;
    return update(current => upsertMeeting(current, { ...selected, ...patch }));
  };

  const addAction = async () => {
    const name = actionName.trim();
    if (!selected || !name || !actionDue) {
      showToast('warning', 'Nhập hành động và hạn xử lý.');
      return;
    }
    const action: CskhMeetingAction = { id: newOpsId(), name, dueDate: actionDue, done: false };
    if (!await patchSelected({ actions: [...selected.actions, action] })) return;
    setActionName('');
    setActionDue('');
  };

  return (
    <div className="page-stack cskh-desk" aria-busy={isPending || workspace.isLoading}>
      {workspace.isLoading && <p role="status">Đang tải dữ liệu…</p>}
      {workspace.isError && <p role="alert">Không tải được dữ liệu. <button type="button" onClick={() => void workspace.refetch()}>Thử lại</button></p>}
      {actionError && <p role="alert">{actionError}</p>}
      <PageHeader
        eyebrow={project.code}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={(
          <Button type="button" leftIcon={Plus} onClick={openCreate}>Tạo cuộc họp</Button>
        )}
      />
      <CskhPipelineSteps code={project.code} current="meetings" />

      <div className="dashboard-kpi-grid cskh-project__kpi cskh-project__kpi--3" role="list" aria-label="Chỉ số cuộc họp">
        <Card className="cskh-desk__kpi-card" title="Cuộc họp" value={kpis.total} subtitle="Đã ghi nhận" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Hành động đang mở" value={kpis.openActions} subtitle="Chưa đánh dấu xong" accent="amber" />
        <Card className="cskh-desk__kpi-card" title="Quá hạn" value={kpis.overdueActions} subtitle="Có thể tạo điểm nghẽn" accent="danger" />
      </div>

      <HrmPanel className="cskh-desk__panel" noPadding>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarDays} message={meta.empty} />
        ) : (
          <div className="cskh-split cskh-split--detail">
            <div className="cskh-pick">
              <p className="cskh-pick__head">{rows.length} cuộc họp</p>
              <CskhPickList
                title="Danh sách cuộc họp"
                rows={rows}
                selectedId={selectedId}
                onSelect={row => setSelectedId(row.id)}
                renderRow={row => {
                  const overdue = overdueActionCount(row);
                  return (
                    <>
                      <span className="cskh-pick__name">{row.name}</span>
                      <span className="cskh-pick__meta">{isoToDisplay(row.date) || '-'}</span>
                      {overdue > 0 ? (
                        <span className="cskh-status cskh-status--danger">
                          <span className="cskh-status__dot" aria-hidden />
                          {overdue} quá hạn
                        </span>
                      ) : null}
                    </>
                  );
                }}
              />
            </div>

            <section className="cskh-detail" aria-label="Chi tiết cuộc họp">
              {selected ? (
                <>
                  <div className="cskh-detail__head">
                    <div>
                      <p className="cskh-detail__kicker">{isoToDisplay(selected.date) || '-'}</p>
                      <h3 className="cskh-detail__title">{selected.name}</h3>
                    </div>
                    <div className="cskh-inline-form__actions">
                      <Button type="button" variant="outlined" onClick={() => openEdit(selected)}>Sửa</Button>
                      <Button type="button" variant="outlined" onClick={() => setDeleteTarget(selected)}>Xóa</Button>
                    </div>
                  </div>
                  <dl className="cskh-fact-list">
                    <div className="cskh-fact-list__row">
                      <dt>Thành phần</dt>
                      <dd>{selected.attendees || '-'}</dd>
                    </div>
                    <div className="cskh-fact-list__row">
                      <dt>Agenda</dt>
                      <dd>{selected.agenda || '-'}</dd>
                    </div>
                  </dl>
                  <div className="cskh-detail__section">
                    <FormField label="Biên bản">
                      <textarea className="form-input" rows={3} value={minutes} onChange={event => setMinutes(event.target.value)} placeholder="Ghi nhận thảo luận sau họp" />
                    </FormField>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={async () => {
                        if (!await patchSelected({ minutes: minutes.trim() || undefined })) return;
                        showToast('success', 'Đã lưu biên bản.');
                      }}
                    >
                      Lưu biên bản
                    </Button>
                  </div>

                  <div className="cskh-detail__section">
                    <p className="section-heading__sub mb-0">Hành động sau họp</p>
                    {selected.actions.length === 0 ? (
                      <p className="cskh-pick__meta">Chưa có hành động.</p>
                    ) : (
                      <div className="wms-voucher-detail-table-wrap">
                        <table className="wms-inventory-table wms-voucher-detail-table">
                          <thead>
                            <tr>
                              <th className="table-header-cell cskh-col-check" aria-label="Hoàn thành" />
                              <th className="table-header-cell">Hành động</th>
                              <th className="table-header-cell cskh-col-due">Hạn</th>
                              <th className="table-header-cell cskh-col-state">Trạng thái</th>
                              <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
                            </tr>
                          </thead>
                          <tbody>
                            {selected.actions.map(action => {
                              const overdue = !action.done && isPastDate(action.dueDate);
                              return (
                                <tr key={action.id} className="table-row">
                                  <td className="table-cell cskh-col-check">
                                    <input
                                      type="checkbox"
                                      className="form-checkbox"
                                      checked={action.done}
                                      disabled={isPending}
                                      aria-label={`Hoàn thành ${action.name}`}
                                      onChange={event => patchSelected({
                                        actions: selected.actions.map(item => (item.id === action.id ? { ...item, done: event.target.checked } : item)),
                                      })}
                                    />
                                  </td>
                                  <td className="table-cell">{action.name}</td>
                                  <td className="table-cell cskh-col-due">
                                    <span className="tabular-nums">{isoToDisplay(action.dueDate) || '-'}</span>
                                  </td>
                                  <td className="table-cell cskh-col-state">
                                    <span className={`cskh-status cskh-status--${action.done ? 'ok' : overdue ? 'danger' : 'warn'}`}>
                                      <span className="cskh-status__dot" aria-hidden />
                                      {action.done ? 'Xong' : overdue ? 'Quá hạn' : 'Đang mở'}
                                    </span>
                                  </td>
                                  <td className="table-cell hrm-table-col-actions">
                                    {overdue && !action.generatedBottleneck ? (
                                      <Button
                                        type="button"
                                        variant="text"
                                        onClick={async () => {
                                          const at = new Date().toISOString();
                                          if (!await update(current => {
                                            const nextOps = upsertBottleneck(current, {
                                              id: newOpsId(),
                                              code: nextOpsCode('NG', current.bottlenecks.map(item => item.code)),
                                              name: `Hành động họp quá hạn: ${action.name}`,
                                              severity: 'medium',
                                              status: 'open',
                                              startedAt: toIsoDate(new Date()),
                                              expectedAt: action.dueDate,
                                              reason: `Hành động sau họp "${selected.name}" đã quá hạn.`,
                                              source: 'meeting',
                                              history: [{ id: newOpsId(), at, text: `Tạo từ cuộc họp ${selected.name}.` }],
                                            });

                                            return upsertMeeting(nextOps, { ...selected,
                                              actions: selected.actions.map(item => item.id === action.id ? { ...item, generatedBottleneck: true } : item),
                                            });
                                          })) return;
                                          showToast('success', 'Đã tạo điểm nghẽn từ hành động quá hạn.');
                                        }}
                                      >
                                        Tạo điểm nghẽn
                                      </Button>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="cskh-inline-form">
                      <div className="cskh-inline-form__grid">
                        <FormField label="Hành động">
                          <input className="form-input" value={actionName} onChange={event => setActionName(event.target.value)} placeholder="VD: Gửi biên bản cho CĐT" autoComplete="off" />
                        </FormField>
                        <FormField label="Hạn">
                          <HrmDatePicker value={actionDue} onChange={setActionDue} placeholder="dd/mm/yyyy" />
                        </FormField>
                      </div>
                      <Button type="button" leftIcon={Plus} disabled={isPending} onClick={addAction}>Thêm hành động</Button>
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        )}
      </HrmPanel>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa cuộc họp' : 'Tạo cuộc họp'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" disabled={isPending} onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Tên cuộc họp" required error={errors.name}>
          <input className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="VD: Họp tiến độ tuần" autoComplete="off" />
        </FormField>
        <FormField label="Ngày họp" required error={errors.date}>
          <HrmDatePicker value={form.date} onChange={value => setForm(current => ({ ...current, date: value }))} placeholder="dd/mm/yyyy" />
        </FormField>
        <FormField label="Thành phần">
          <input className="form-input" value={form.attendees} onChange={event => setForm(current => ({ ...current, attendees: event.target.value }))} placeholder="VD: PA, kỹ thuật, CĐT" autoComplete="off" />
        </FormField>
        <FormField label="Agenda">
          <textarea className="form-input" rows={3} value={form.agenda} onChange={event => setForm(current => ({ ...current, agenda: event.target.value }))} placeholder="Các mục cần thảo luận" />
        </FormField>
      </Modal>

      <ConfirmDialog
        isLoading={isPending}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (!await update(current => removeMeeting(current, deleteTarget.id))) return;
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa cuộc họp"
        message={`Xóa cuộc họp "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
