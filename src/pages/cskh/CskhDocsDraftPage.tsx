import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCheck, Plus } from 'lucide-react';
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
import { employeesService } from '../../services/employeesService';
import { queryKeys } from '../../services/queryKeys';
import { useCskhDocsPipeline } from '../../hooks/cskh/useCskhDocsPipeline';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import {
  CSKH_CHANNELS,
  CSKH_DEPARTMENTS,
  CSKH_DRAFT_STAGES,
  channelLabel,
  departmentLabel,
  draftKpis,
  moveDraft,
  newDocsId,
  nextProcessOrder,
  removeProcess,
  upsertDraft,
  upsertProcess,
  type CskhDocProcess,
  type CskhDraftDoc,
  type CskhDraftStage,
} from '../../lib/cskh/docsPipeline';
import CskhMasterTable from './CskhMasterTable';
import CskhPipelineSteps from './CskhPipelineSteps';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsDraftPageProps {
  project: CskhProjectRecord;
}

const PROCESS_STATUS = [
  { value: 'active', label: 'Đang sử dụng' },
  { value: 'inactive', label: 'Tạm ẩn' },
];

const EMPTY_PROCESS = {
  name: '',
  departmentId: 'tech',
  notes: '',
  active: 'active',
  order: '1',
};

const EMPTY_DRAFT = {
  processId: '',
  name: '',
  author: '',
  channel: 'email',
  confirmDeadline: '',
};

export default function CskhDocsDraftPage({ project }: CskhDocsDraftPageProps) {
  const meta = cskhProjectTabMeta('docs-draft');
  const { docs, update } = useCskhDocsPipeline(project.code);
  const kpis = draftKpis(docs.drafts);
  const processes = useMemo(
    () => [...docs.processes].sort((a, b) => a.order - b.order),
    [docs.processes],
  );
  const activeProcesses = processes.filter(row => row.active);
  const processOptions = activeProcesses.map(row => ({ value: row.id, label: row.name }));

  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'active'],
    queryFn: async () => {
      try {
        return await employeesService.listActive();
      } catch {
        return [];
      }
    },
    retry: false,
  });
  const peopleOptions = useMemo(
    () => employees
      .map(row => ({ value: row.fullName, label: row.fullName }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [employees],
  );

  const [processOpen, setProcessOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<CskhDocProcess | null>(null);
  const [processForm, setProcessForm] = useState(EMPTY_PROCESS);
  const [processErrors, setProcessErrors] = useState<Record<string, string>>({});
  const [deleteProcess, setDeleteProcess] = useState<CskhDocProcess | null>(null);

  const [draftOpen, setDraftOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CskhDraftDoc | null>(null);
  const [draftForm, setDraftForm] = useState(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  const openCreateProcess = () => {
    setEditingProcess(null);
    setProcessForm({ ...EMPTY_PROCESS, order: String(nextProcessOrder(docs.processes)) });
    setProcessErrors({});
    setProcessOpen(true);
  };

  const openEditProcess = (row: CskhDocProcess) => {
    setEditingProcess(row);
    setProcessForm({
      name: row.name,
      departmentId: row.departmentId,
      notes: row.notes ?? '',
      active: row.active ? 'active' : 'inactive',
      order: String(row.order),
    });
    setProcessErrors({});
    setProcessOpen(true);
  };

  const saveProcess = () => {
    const name = processForm.name.trim();
    const order = Number.parseInt(processForm.order, 10);
    const next: Record<string, string> = {};
    if (!name) next.name = 'Nhập loại văn bản.';
    if (!processForm.departmentId) next.departmentId = 'Chọn phòng ban xác nhận.';
    if (!Number.isFinite(order) || order < 1) next.order = 'Nhập thứ tự từ 1.';
    if (Object.keys(next).length > 0) {
      setProcessErrors(next);
      return;
    }
    update(current => upsertProcess(current, {
      id: editingProcess?.id ?? newDocsId(),
      name,
      departmentId: processForm.departmentId,
      notes: processForm.notes.trim() || undefined,
      active: processForm.active !== 'inactive',
      order,
    }));
    setProcessOpen(false);
    showToast('success', editingProcess ? 'Đã cập nhật quy trình.' : 'Đã thêm quy trình.');
  };

  const openCreateDraft = () => {
    if (activeProcesses.length === 0) {
      showToast('warning', 'Thêm quy trình trước khi soạn hồ sơ.');
      return;
    }
    setEditingDraft(null);
    setDraftForm({ ...EMPTY_DRAFT, processId: activeProcesses[0]?.id ?? '' });
    setDraftErrors({});
    setDraftOpen(true);
  };

  const openEditDraft = (row: CskhDraftDoc) => {
    setEditingDraft(row);
    setDraftForm({
      processId: row.processId,
      name: row.name,
      author: row.author,
      channel: row.channel,
      confirmDeadline: row.confirmDeadline ?? '',
    });
    setDraftErrors({});
    setDraftOpen(true);
  };

  const saveDraft = () => {
    const name = draftForm.name.trim();
    const author = draftForm.author.trim();
    const next: Record<string, string> = {};
    if (!draftForm.processId) next.processId = 'Chọn loại văn bản.';
    if (!name) next.name = 'Nhập tên văn bản.';
    if (!author) next.author = 'Chọn người soạn.';
    if (!draftForm.channel) next.channel = 'Chọn kênh gửi.';
    if (!draftForm.confirmDeadline) next.confirmDeadline = 'Chọn hạn xác nhận.';
    if (Object.keys(next).length > 0) {
      setDraftErrors(next);
      return;
    }
    update(current => upsertDraft(current, {
      id: editingDraft?.id ?? newDocsId(),
      name,
      processId: draftForm.processId,
      author,
      channel: draftForm.channel,
      confirmDeadline: draftForm.confirmDeadline,
      stage: editingDraft?.stage ?? 'draft',
    }));
    setDraftOpen(false);
    showToast('success', editingDraft ? 'Đã cập nhật hồ sơ.' : 'Đã soạn hồ sơ mới.');
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader title={meta.title} subtitle={`${project.code} - ${meta.subtitle}`} />
      <CskhPipelineSteps code={project.code} current="docs-draft" />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số soạn duyệt">
        <Card className="cskh-desk__kpi-card" title="Đang xử lý" value={kpis.processing} subtitle="Ở tổng cộng" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Đang chờ xác nhận" value={kpis.waiting} subtitle="Cần phòng ban phản hồi" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="Quá hạn xác nhận" value={kpis.overdue} subtitle="Cần nhắc / escalate" accent="danger" />
        <Card className="cskh-desk__kpi-card" title="Sẵn sàng gửi đi" value={kpis.ready} subtitle="Đã ký, chưa gửi" accent="success" />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Quy trình theo loại văn bản</h2>
            <p className="section-heading__sub mb-0">Thêm, sửa hoặc xóa quy trình riêng cho dự án đang mở.</p>
          </div>
          <Button type="button" leftIcon={Plus} onClick={openCreateProcess}>Thêm quy trình</Button>
        </div>
        <CskhMasterTable
          columns={[
            { key: 'name', label: 'Loại văn bản', render: row => row.name },
            { key: 'dept', label: 'Phòng ban xác nhận', render: row => departmentLabel(row.departmentId) },
            { key: 'notes', label: 'Ghi chú', render: row => row.notes || '-' },
          ]}
          rows={processes}
          emptyMessage="Chưa có quy trình. Thêm loại văn bản để soạn hồ sơ."
          emptyIcon={FileCheck}
          emptyAction={<Button type="button" leftIcon={Plus} onClick={openCreateProcess}>Thêm quy trình</Button>}
          onEdit={openEditProcess}
          onDelete={setDeleteProcess}
        />
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Bảng theo dõi văn bản</h2>
            <p className="section-heading__sub mb-0">Kéo thả theo cột để thấy hồ sơ đang nghẽn ở khâu nào. Bấm thẻ để xem chi tiết.</p>
          </div>
          <Button type="button" leftIcon={Plus} onClick={openCreateDraft}>Soạn hồ sơ mới</Button>
        </div>
        <CskhDocKanban
          drafts={docs.drafts}
          processes={processes}
          onMove={(id, stage) => update(current => moveDraft(current, id, stage))}
          onOpen={openEditDraft}
        />
      </HrmPanel>

      <Modal
        isOpen={processOpen}
        onClose={() => setProcessOpen(false)}
        title={editingProcess ? 'Sửa quy trình theo loại văn bản' : 'Thêm quy trình theo loại văn bản'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setProcessOpen(false)}>Hủy</Button>
            <Button type="button" onClick={saveProcess}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Loại văn bản" required error={processErrors.name}>
          <input
            className="form-input"
            value={processForm.name}
            onChange={event => setProcessForm(current => ({ ...current, name: event.target.value }))}
            placeholder="VD: Biên bản nghiệm thu"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Phòng ban xác nhận" required error={processErrors.departmentId}>
          <HrmSelect
            value={processForm.departmentId}
            options={CSKH_DEPARTMENTS.map(item => ({ value: item.id, label: item.label }))}
            allowEmpty={false}
            onChange={value => setProcessForm(current => ({ ...current, departmentId: value }))}
          />
        </FormField>
        <FormField label="Ghi chú">
          <textarea
            className="form-input"
            rows={3}
            value={processForm.notes}
            onChange={event => setProcessForm(current => ({ ...current, notes: event.target.value }))}
            placeholder="VD: Kiểm tra thông số kỹ thuật trước khi gửi CĐT"
          />
        </FormField>
        <FormField label="Trạng thái" required>
          <HrmSelect
            value={processForm.active}
            options={PROCESS_STATUS}
            allowEmpty={false}
            onChange={value => setProcessForm(current => ({ ...current, active: value }))}
          />
        </FormField>
        <FormField label="Thứ tự" required error={processErrors.order}>
          <input
            className="form-input"
            inputMode="numeric"
            value={processForm.order}
            onChange={event => setProcessForm(current => ({ ...current, order: event.target.value }))}
            autoComplete="off"
          />
        </FormField>
      </Modal>

      <Modal
        isOpen={draftOpen}
        onClose={() => setDraftOpen(false)}
        title={editingDraft ? 'Sửa hồ sơ / văn bản' : 'Soạn hồ sơ / văn bản mới'}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={() => setDraftOpen(false)}>Hủy</Button>
            <Button type="button" onClick={saveDraft}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Loại văn bản" required error={draftErrors.processId}>
          <HrmSelect
            value={draftForm.processId}
            options={processOptions}
            allowEmpty={false}
            onChange={value => setDraftForm(current => ({ ...current, processId: value }))}
          />
        </FormField>
        <FormField label="Tên văn bản" required error={draftErrors.name}>
          <input
            className="form-input"
            value={draftForm.name}
            onChange={event => setDraftForm(current => ({ ...current, name: event.target.value }))}
            placeholder="VD: Biên bản nghiệm thu giai đoạn 1"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Người soạn" required error={draftErrors.author}>
          {peopleOptions.length > 0 ? (
            <HrmSelect
              value={draftForm.author}
              options={peopleOptions}
              allowEmpty={false}
              onChange={value => setDraftForm(current => ({ ...current, author: value }))}
            />
          ) : (
            <input
              className="form-input"
              value={draftForm.author}
              onChange={event => setDraftForm(current => ({ ...current, author: event.target.value }))}
              placeholder="VD: Trần Văn A"
              autoComplete="off"
            />
          )}
        </FormField>
        <FormField label="Kênh gửi" required error={draftErrors.channel}>
          <HrmSelect
            value={draftForm.channel}
            options={CSKH_CHANNELS.map(item => ({ value: item.id, label: item.label }))}
            allowEmpty={false}
            onChange={value => setDraftForm(current => ({ ...current, channel: value }))}
          />
        </FormField>
        <FormField label="Hạn xác nhận" required error={draftErrors.confirmDeadline}>
          <HrmDatePicker
            value={draftForm.confirmDeadline}
            onChange={value => setDraftForm(current => ({ ...current, confirmDeadline: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteProcess)}
        onClose={() => setDeleteProcess(null)}
        onConfirm={() => {
          if (!deleteProcess) return;
          update(current => removeProcess(current, deleteProcess.id));
          setDeleteProcess(null);
          showToast('success', `Đã xóa ${deleteProcess.name}.`);
        }}
        title="Xóa quy trình"
        message={`Xóa quy trình "${deleteProcess?.name ?? ''}" và hồ sơ đang gắn với loại này?`}
        confirmLabel="Xóa"
      />
    </div>
  );
}

interface CskhDocKanbanProps {
  drafts: CskhDraftDoc[];
  processes: CskhDocProcess[];
  onMove: (id: string, stage: CskhDraftStage) => void;
  onOpen: (row: CskhDraftDoc) => void;
}

function CskhDocKanban({ drafts, processes, onMove, onOpen }: CskhDocKanbanProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<CskhDraftStage | null>(null);

  return (
    <div className="cskh-kanban" role="list" aria-label="Theo dõi văn bản">
      {CSKH_DRAFT_STAGES.map(stage => {
        const cards = drafts.filter(row => row.stage === stage.id);
        return (
          <section
            key={stage.id}
            className={`cskh-kanban__col${overStage === stage.id ? ' is-over' : ''}`}
            onDragOver={event => {
              event.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() => {
              if (overStage === stage.id) setOverStage(null);
            }}
            onDrop={event => {
              event.preventDefault();
              const id = event.dataTransfer.getData('text/plain');
              setOverStage(null);
              setDragging(null);
              if (id) onMove(id, stage.id);
            }}
          >
            <header className="cskh-kanban__head">
              <h3 className="cskh-kanban__title">{stage.label}</h3>
              <span className="cskh-kanban__count">{cards.length}</span>
            </header>
            <div className="cskh-kanban__list">
              {cards.length === 0 ? (
                <p className="cskh-kanban__empty">Thả thẻ vào đây</p>
              ) : (
                cards.map(card => (
                  <article
                    key={card.id}
                    className={`cskh-kanban__card${dragging === card.id ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={event => {
                      event.dataTransfer.setData('text/plain', card.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDragging(card.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverStage(null);
                    }}
                  >
                    <button type="button" className="cskh-kanban__open" onClick={() => onOpen(card)}>
                      <span className="cskh-kanban__code">
                        {processes.find(row => row.id === card.processId)?.name ?? 'Hồ sơ'}
                      </span>
                      <span className="cskh-kanban__name">{card.name}</span>
                      <span className="cskh-kanban__meta">
                        {card.author} · {channelLabel(card.channel)}
                      </span>
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
