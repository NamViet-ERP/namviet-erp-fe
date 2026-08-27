import { useState } from 'react';
import { Plus, Send } from 'lucide-react';
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
  CSKH_CHANNELS,
  channelLabel,
  filterHandovers,
  handoverKpis,
  newDocsId,
  removeHandover,
  upsertHandover,
  type CskhHandover,
  type CskhHandoverDirection,
  type CskhHandoverFilter,
} from '../../lib/cskh/docsPipeline';
import CskhMasterTable from './CskhMasterTable';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsHandoverPageProps {
  project: CskhProjectRecord;
}

const DIRECTIONS: CskhFilterOption<CskhHandoverDirection>[] = [
  { id: 'out', label: 'Hồ sơ đi', tone: 'navy' },
  { id: 'in', label: 'Hồ sơ về', tone: 'info' },
];

const FILTERS: CskhFilterOption<CskhHandoverFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'signed', label: 'Đã ký', tone: 'ok' },
  { id: 'unsigned', label: 'Chưa ký', tone: 'warn' },
  { id: 'unconfirmed', label: 'Chưa xác nhận', tone: 'danger' },
];

const EMPTY_FORM = {
  name: '',
  from: '',
  to: '',
  channel: 'email',
  at: '',
  signed: false,
  confirmed: false,
  fileUploaded: true,
  noFileReason: '',
  originalCode: '',
};

export default function CskhDocsHandoverPage({ project }: CskhDocsHandoverPageProps) {
  const meta = cskhProjectTabMeta('docs-handover');
  const { docs, update } = useCskhDocsPipeline(project.code);
  const kpis = handoverKpis(docs.handovers);
  const [direction, setDirection] = useState<CskhHandoverDirection>('out');
  const [filter, setFilter] = useState<CskhHandoverFilter>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CskhHandover | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CskhHandover | null>(null);

  const rows = filterHandovers(docs.handovers, direction, filter);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, at: toIsoDate(new Date()) });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: CskhHandover) => {
    setEditing(row);
    setForm({
      name: row.name,
      from: row.from,
      to: row.to,
      channel: row.channel,
      at: row.at,
      signed: row.signed,
      confirmed: row.confirmed,
      fileUploaded: row.fileUploaded,
      noFileReason: row.noFileReason ?? '',
      originalCode: row.originalCode ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const from = form.from.trim();
    const to = form.to.trim();
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập tên hồ sơ.';
    if (!from) next.from = direction === 'in' ? 'Nhập nguồn gửi.' : 'Nhập người gửi.';
    if (!to) next.to = 'Nhập người tiếp nhận.';
    if (!form.channel) next.channel = 'Chọn kênh giao nhận.';
    if (!form.at) next.at = 'Chọn thời gian.';
    if (!form.fileUploaded && !form.noFileReason.trim()) {
      next.noFileReason = 'Nhập lý do chưa upload file.';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    update(current => upsertHandover(current, {
      id: editing?.id ?? newDocsId(),
      name,
      direction,
      from,
      to,
      channel: form.channel,
      at: form.at,
      signed: form.signed,
      confirmed: form.confirmed,
      fileUploaded: form.fileUploaded,
      noFileReason: form.fileUploaded ? undefined : form.noFileReason.trim(),
      originalCode: form.originalCode.trim() || undefined,
    }));
    setOpen(false);
    showToast('success', editing ? 'Đã cập nhật giao nhận.' : 'Đã thêm giao nhận.');
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader title={meta.title} subtitle={`${project.code} - ${meta.subtitle}`} />
      <CskhPipelineSteps code={project.code} current="docs-handover" />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số giao nhận">
        <Card className="cskh-desk__kpi-card" title="Hồ sơ đi" value={kpis.outgoing} subtitle={`${docs.handovers.filter(row => row.direction === 'out' && !row.signed).length} chưa có bản ký`} accent="info" />
        <Card className="cskh-desk__kpi-card" title="Hồ sơ về" value={kpis.incoming} subtitle={`${docs.handovers.filter(row => row.direction === 'in' && !row.confirmed).length} chưa xác nhận nhận`} accent="success" />
        <Card className="cskh-desk__kpi-card" title="Chưa có file đã ký" value={kpis.unsigned} subtitle="Cần theo dõi bổ sung" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="Chưa xác nhận nhận đủ" value={kpis.unconfirmed} subtitle="Rủi ro thất lạc hồ sơ" accent="danger" />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Giao nhận hồ sơ</h2>
            <p className="section-heading__sub mb-0">Hồ sơ đi và hồ sơ về, lọc theo trạng thái ký và xác nhận.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={direction} options={DIRECTIONS} onChange={setDirection} label="Chiều hồ sơ" />
            <CskhFilterTabs value={filter} options={FILTERS} onChange={setFilter} label="Lọc trạng thái" />
            <Button type="button" className="cskh-desk__toolbar-add" leftIcon={Plus} onClick={openCreate}>
              Thêm giao nhận
            </Button>
          </div>
        </div>
        <CskhMasterTable
          columns={[
            { key: 'name', label: 'Hồ sơ', render: row => row.name },
            { key: 'from', label: 'Người gửi', render: row => row.from },
            { key: 'to', label: 'Người nhận', render: row => row.to },
            {
              key: 'meta',
              label: 'Thời gian - kênh',
              render: row => `${isoToDisplay(row.at) || '-'} · ${channelLabel(row.channel)}`,
            },
            {
              key: 'signed',
              label: 'Bản đã ký',
              render: row => (
                <span className={`cskh-status ${row.signed ? 'cskh-status--ok' : 'cskh-status--warn'}`}>
                  <span className="cskh-status__dot" aria-hidden />
                  {row.signed ? 'Đã ký' : 'Chưa ký'}
                </span>
              ),
            },
            {
              key: 'confirmed',
              label: 'Xác nhận nhận',
              render: row => (
                <span className={`cskh-status ${row.confirmed ? 'cskh-status--ok' : 'cskh-status--warn'}`}>
                  <span className="cskh-status__dot" aria-hidden />
                  {row.confirmed ? 'Đã nhận' : 'Chưa xác nhận'}
                </span>
              ),
            },
          ]}
          rows={rows}
          emptyMessage="Không có hồ sơ khớp bộ lọc."
          emptyIcon={Send}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </HrmPanel>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa giao nhận' : 'Thêm giao nhận'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Tên hồ sơ" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            placeholder="VD: Biên bản nghiệm thu giai đoạn 1"
            autoComplete="off"
          />
        </FormField>
        <FormField label={direction === 'in' ? 'Nguồn gửi' : 'Người gửi'} required error={errors.from}>
          <input
            className="form-input"
            value={form.from}
            onChange={event => setForm(current => ({ ...current, from: event.target.value }))}
            placeholder={direction === 'in' ? 'VD: CĐT - Cty Giấy An Phát' : 'VD: Trần Văn A'}
            autoComplete="off"
          />
        </FormField>
        <FormField label="Người tiếp nhận" required error={errors.to}>
          <input
            className="form-input"
            value={form.to}
            onChange={event => setForm(current => ({ ...current, to: event.target.value }))}
            placeholder="VD: CĐT / Trần Thị Mai"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Kênh giao nhận" required error={errors.channel}>
          <HrmSelect
            value={form.channel}
            options={CSKH_CHANNELS.map(item => ({ value: item.id, label: item.label }))}
            allowEmpty={false}
            onChange={value => setForm(current => ({ ...current, channel: value }))}
          />
        </FormField>
        <FormField label="Thời gian" required error={errors.at}>
          <HrmDatePicker
            value={form.at}
            onChange={value => setForm(current => ({ ...current, at: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <label className="cskh-check">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={form.signed}
            onChange={event => setForm(current => ({ ...current, signed: event.target.checked }))}
          />
          Đã có bản ký
        </label>
        <label className="cskh-check">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={form.fileUploaded}
            onChange={event => setForm(current => ({ ...current, fileUploaded: event.target.checked }))}
          />
          Đã tải file đính kèm lên hệ thống
        </label>
        {!form.fileUploaded ? (
          <FormField label="Lý do chưa upload file" required error={errors.noFileReason}>
            <textarea
              className="form-input"
              rows={3}
              value={form.noFileReason}
              onChange={event => setForm(current => ({ ...current, noFileReason: event.target.value }))}
              placeholder="VD: Bản gốc đang chờ CĐT ký, sẽ bổ sung sau"
            />
          </FormField>
        ) : null}
        <FormField label="Liên kết văn bản gốc (mã, nếu có)">
          <input
            className="form-input"
            value={form.originalCode}
            onChange={event => setForm(current => ({ ...current, originalCode: event.target.value }))}
            placeholder="VD: VB-501"
            autoComplete="off"
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          update(current => removeHandover(current, deleteTarget.id));
          setDeleteTarget(null);
          showToast('success', `Đã xóa ${deleteTarget.name}.`);
        }}
        title="Xóa giao nhận"
        message={`Xóa hồ sơ "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
