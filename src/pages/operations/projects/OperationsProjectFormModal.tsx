import type { Dispatch, SetStateAction } from 'react';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import ProjectMemberMultiSelect from '../../../components/operations/ProjectMemberMultiSelect';
import ProjectPersonnelSelect from '../../../components/operations/ProjectPersonnelSelect';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { ProjectFormState } from './useOperationsProjectListController';

interface OperationsProjectFormModalProps {
  isOpen: boolean;
  editing: WarehouseProjectApiDto | null;
  form: ProjectFormState;
  errors: Record<string, string>;
  pending: boolean;
  onChange: Dispatch<SetStateAction<ProjectFormState>>;
  onClose: () => void;
  onSave: () => void;
}

export default function OperationsProjectFormModal({
  isOpen,
  editing,
  form,
  errors,
  pending,
  onChange,
  onClose,
  onSave,
}: OperationsProjectFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa dự án' : 'Tạo dự án mới'}
      size="lg"
      footer={(
        <>
          <Button type="button" variant="outlined" onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button type="button" variant="filled" loading={pending} onClick={onSave}>
            {pending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </>
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ops-projects-create">
        <FormField label="Mã dự án" htmlFor="modal-project-code" required error={errors.projectCode}>
          <input
            id="modal-project-code"
            name="projectCode"
            className="form-input"
            value={form.projectCode}
            disabled={Boolean(editing)}
            onChange={e => onChange(f => ({ ...f, projectCode: e.target.value.toUpperCase() }))}
            placeholder="VD: DA-2026-001"
          />
        </FormField>
        <FormField label="Khách hàng (viết tắt)" htmlFor="modal-client-name" error={errors.clientName}>
          <input
            id="modal-client-name"
            name="clientName"
            className="form-input"
            value={form.clientName}
            onChange={e => onChange(f => ({ ...f, clientName: e.target.value }))}
            placeholder="VD: PVN"
          />
        </FormField>
        <FormField label="Tên dự án" htmlFor="modal-project-name" required error={errors.projectName}>
          <input
            id="modal-project-name"
            name="projectName"
            className="form-input"
            value={form.projectName}
            onChange={e => onChange(f => ({ ...f, projectName: e.target.value }))}
          />
        </FormField>
        <FormField label="PIC / Quản lý" required error={errors.pmName}>
          <ProjectPersonnelSelect
            value={form.pmName}
            onChange={name =>
              onChange(f => ({
                ...f,
                pmName: name,
                scMembers: f.scMembers.filter(
                  m => m.trim().toLowerCase() !== name.trim().toLowerCase(),
                ),
              }))
            }
            excludeNames={form.scMembers}
          />
        </FormField>
        <FormField label="Thành viên SC" error={errors.scMembers}>
          <ProjectMemberMultiSelect
            value={form.scMembers}
            onChange={members => onChange(f => ({ ...f, scMembers: members }))}
            excludeNames={form.pmName ? [form.pmName] : []}
          />
        </FormField>
        <FormField label="Ngân sách VT (tối thiểu 1)" htmlFor="modal-material-budget" error={errors.materialBudget}>
          <CurrencyInput
            id="modal-material-budget"
            value={form.materialBudget}
            min={0}
            placeholder="VD: 1.000.000.000"
            onChange={materialBudget => onChange(f => ({ ...f, materialBudget }))}
          />
        </FormField>
        <FormField label="Ngày bắt đầu" htmlFor="modal-start-date" required error={errors.startDate}>
          <HrmDatePicker
            id="modal-start-date"
            value={form.startDate}
            disabled={Boolean(editing)}
            error={Boolean(errors.startDate)}
            placeholder="Chọn ngày bắt đầu"
            onChange={iso => onChange(f => ({ ...f, startDate: iso }))}
          />
        </FormField>
        <FormField label="Ngày kết thúc" htmlFor="modal-end-date" error={errors.endDate}>
          <HrmDatePicker
            id="modal-end-date"
            value={form.endDate}
            error={Boolean(errors.endDate)}
            placeholder="Chọn ngày kết thúc"
            onChange={iso => onChange(f => ({ ...f, endDate: iso }))}
          />
        </FormField>
      </div>
      {!editing ? (
        <p className="ops-projects-create__hint">
          Sau khi lưu, kho dự án cùng mã sẽ xuất hiện trong Kho hàng - Kho dự án.
        </p>
      ) : null}
    </Modal>
  );
}
