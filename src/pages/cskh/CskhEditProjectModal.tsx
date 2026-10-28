import { useCskhAction } from '../../hooks/cskh/useCskhAction';
import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import {
  CSKH_BOILER_TYPES,
  CSKH_INDUSTRIES,
  CSKH_PRIORITIES,
  CSKH_PHASES,
  type CskhProjectPatch,
  type CskhProjectRecord,
  type CskhPhaseMode,
} from '../../lib/cskh/commandCenter';
import { optionsFromCatalog } from '../../lib/cskh/masterData';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import { useCskhUserOptions } from '../../hooks/cskh/useCskhUserOptions';
import {
  CskhProjectBasicSection,
  CskhProjectPeopleSection,
  CskhProjectBoilerSection,
  CskhProjectProgressSection,
  CskhProjectContractSection,
  CskhProjectNotesSection,
} from './components/CskhProjectFormSections';

interface CskhEditProjectModalProps {
  open: boolean;
  project: CskhProjectRecord;
  clientOptions?: string[];
  onClose: () => void;
  onSave: (patch: CskhProjectPatch) => Promise<void>;
  onDelete?: (code: string) => Promise<void>;
}

type FieldKey =
  | 'name'
  | 'client'
  | 'sales'
  | 'pm'
  | 'warrantyMonths'
  | 'planPct'
  | 'actualPct'
  | 'bottleneckCount';

interface FormState {
  name: string;
  client: string;
  sales: string;
  pm: string;
  startDate: string;
  targetCodDate: string;
  contractSignedDate: string;
  advanceDate: string;
  boilerType: string;
  industry: string;
  capacity: string;
  priority: string;
  phaseId: string;
  phaseMode: CskhPhaseMode;
  planPct: number;
  actualPct: number;
  bottleneckCount: number;
  acceptanceDate: string;
  warrantyMonths: string;
  notes: string;
}

const PHASE_MODE_OPTIONS = [
  { value: 'auto', label: 'Tự động (Theo ngày hợp đồng & hoàn thành)' },
  { value: 'manual', label: 'Thủ công (Chỉ định theo điều phối viên)' },
];

function getInitialForm(project: CskhProjectRecord): FormState {
  return {
    name: project.name || '',
    client: project.clientName || '',
    sales: project.salesName || '',
    pm: project.pmName || '',
    startDate: project.startDate || '',
    targetCodDate: project.targetCodDate || '',
    contractSignedDate: project.contractSignedDate || '',
    advanceDate: project.advanceDate || '',
    boilerType: project.boilerType || '',
    industry: project.industry || '',
    capacity: project.capacity || '',
    priority: project.priority || 'normal',
    phaseId: project.phaseId || 'survey',
    phaseMode: project.phaseMode || 'auto',
    planPct: project.planPct ?? 0,
    actualPct: project.actualPct ?? 0,
    bottleneckCount: project.bottleneckCount ?? 0,
    acceptanceDate: project.acceptanceDate || '',
    warrantyMonths: project.warrantyMonths !== undefined ? String(project.warrantyMonths) : '12',
    notes: project.notes || '',
  };
}

function CskhEditProjectModalInner({
  open,
  project,
  clientOptions = [],
  onClose,
  onSave,
  onDelete,
}: CskhEditProjectModalProps) {
  const { store: master } = useCskhMasterData();
  const { run, isPending, error: actionError } = useCskhAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<FormState>(() => getInitialForm(project));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const { options: userOptions, isLoading: isLoadingUsers } = useCskhUserOptions([
    project?.pmName,
    project?.salesName,
  ]);

  const clientSelectOptions = useMemo(
    () => clientOptions.map(name => ({ value: name, label: name })),
    [clientOptions],
  );

  const boilerOptions = useMemo(
    () => optionsFromCatalog(master.boilerTypes, CSKH_BOILER_TYPES),
    [master.boilerTypes],
  );

  const industryOptions = useMemo(
    () => optionsFromCatalog(master.industries, CSKH_INDUSTRIES),
    [master.industries],
  );

  const priorityOptions = useMemo(
    () => optionsFromCatalog(master.priorities, CSKH_PRIORITIES),
    [master.priorities],
  );

  const phaseOptions = useMemo(
    () =>
      CSKH_PHASES.map(item => ({
        value: item.id,
        label: item.label,
      })),
    [],
  );

  const patch = (partial: Partial<FormState>) => {
    setForm(current => ({ ...current, ...partial }));
    setErrors({});
  };

  const submit = async () => {
    const next: Partial<Record<FieldKey, string>> = {};
    const name = form.name.trim();
    const client = form.client.trim();
    const months = Number(form.warrantyMonths);

    if (!name) next.name = 'Vui lòng nhập tên dự án.';
    if (!client) next.client = 'Vui lòng nhập tên chủ đầu tư.';

    if (form.warrantyMonths.trim() !== '') {
      if (!Number.isFinite(months) || months < 0 || months > 240) {
        next.warrantyMonths = 'Số tháng bảo hành không hợp lệ (0 - 240 tháng).';
      }
    }

    if (form.planPct < 0 || form.planPct > 100) {
      next.planPct = 'Tiến độ kế hoạch phải từ 0% đến 100%.';
    }
    if (form.actualPct < 0 || form.actualPct > 100) {
      next.actualPct = 'Tiến độ thực tế phải từ 0% đến 100%.';
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    if (!await run(() => onSave({
      name,
      clientName: client,
      pmName: form.pm.trim() || undefined,
      salesName: form.sales.trim() || undefined,
      startDate: form.startDate || null,
      targetCodDate: form.targetCodDate || null,
      contractSignedDate: form.contractSignedDate || null,
      advanceDate: form.advanceDate || null,
      boilerType: form.boilerType || null,
      industry: form.industry || null,
      capacity: form.capacity.trim() || null,
      priority: form.priority || null,
      phaseId: form.phaseId,
      phaseMode: form.phaseMode,
      planPct: form.planPct,
      actualPct: form.actualPct,
      bottleneckCount: form.bottleneckCount,
      acceptanceDate: form.acceptanceDate || null,
      warrantyMonths: Number.isFinite(months) ? months : null,
      notes: form.notes.trim() || null,
    }))) return;

    showToast('success', `Đã cập nhật dự án ${project.code} thành công`);
    onClose();
  };

  const handleDelete = async () => {
    if (onDelete) {
      if (!await run(() => onDelete(project.code))) return;
      showToast('info', `Đã xóa dự án ${project.code}`);
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title={`Chỉnh sửa dự án: ${project.code}`}
        size="xl"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="outlined"
                  leftIcon={Trash2}
                  className="text-rose-600 border-rose-300 hover:bg-rose-50 rounded-lg"
                  onClick={() => setConfirmDelete(true)}
                >
                  Xóa dự án
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outlined" className="rounded-lg" onClick={onClose}>
                Hủy
              </Button>
              <Button type="button" variant="filled" className="rounded-lg" disabled={isPending} onClick={submit}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          {actionError && <p role="alert">{actionError}</p>}
          <CskhProjectBasicSection
            name={form.name}
            code={project.code}
            startDate={form.startDate}
            targetCodDate={form.targetCodDate}
            isReadOnlyCode={true}
            nameError={errors.name}
            onChange={patch}
          />

          <CskhProjectPeopleSection
            client={form.client}
            clientOptions={clientSelectOptions}
            datalistId="cskh-edit-clients"
            pm={form.pm}
            sales={form.sales}
            userOptions={userOptions}
            isLoadingUsers={isLoadingUsers}
            clientError={errors.client}
            pmError={errors.pm}
            salesError={errors.sales}
            onChange={patch}
          />

          <CskhProjectBoilerSection
            boilerType={form.boilerType}
            boilerOptions={boilerOptions}
            capacity={form.capacity}
            industry={form.industry}
            industryOptions={industryOptions}
            priority={form.priority}
            priorityOptions={priorityOptions}
            onChange={patch}
          />

          <CskhProjectProgressSection
            phaseId={form.phaseId}
            phaseOptions={phaseOptions}
            phaseMode={form.phaseMode}
            phaseModeOptions={PHASE_MODE_OPTIONS}
            planPct={form.planPct}
            actualPct={form.actualPct}
            bottleneckCount={form.bottleneckCount}
            planError={errors.planPct}
            actualError={errors.actualPct}
            onChange={patch}
          />

          <CskhProjectContractSection
            contractSignedDate={form.contractSignedDate}
            advanceDate={form.advanceDate}
            acceptanceDate={form.acceptanceDate}
            warrantyMonths={form.warrantyMonths}
            warrantyError={errors.warrantyMonths}
            onChange={patch}
          />

          <CskhProjectNotesSection
            notes={form.notes}
            onChange={val => patch({ notes: val })}
          />
        </div>
      </Modal>

      <ConfirmDialog isLoading={isPending}
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa dự án"
        variant="danger"
        confirmLabel="Xóa dự án"
        cancelLabel="Hủy"
        message={(
          <div className="space-y-2 text-left">
            <p>
              Bạn có chắc chắn muốn xóa dự án <strong>{project.name}</strong> ({project.code})?
            </p>
            <p className="text-xs text-slate-500">
              Hành động này sẽ xóa dự án khỏi bảng theo dõi và không thể hoàn tác.
            </p>
          </div>
        )}
      />
    </>
  );
}

export default function CskhEditProjectModal(props: CskhEditProjectModalProps) {
  if (!props.open || !props.project) return null;
  return <CskhEditProjectModalInner key={props.project.code} {...props} />;
}
