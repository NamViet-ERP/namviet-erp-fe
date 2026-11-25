import type { Dispatch, SetStateAction } from 'react';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import type { CskhGanttItem } from '../../../lib/cskh/opsWorkspace';

export interface GanttItemFormState {
  name: string;
  department: string;
  days: string;
  startDate: string;
  endDate: string;
  actualPct: string;
  notes: string;
}

interface CskhGanttModalsProps {
  open: boolean;
  editing: CskhGanttItem | null;
  form: GanttItemFormState;
  setForm: Dispatch<SetStateAction<GanttItemFormState>>;
  errors: Record<string, string>;
  wbsWriteDisabled: boolean;
  isPending: boolean;
  deleteTarget: CskhGanttItem | null;
  deleteCount: number;
  onCloseForm: () => void;
  onSaveForm: () => void;
  onRequestDeleteFromEdit: (item: CskhGanttItem) => void;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
}

export default function CskhGanttModals({
  open,
  editing,
  form,
  setForm,
  errors,
  wbsWriteDisabled,
  isPending,
  deleteTarget,
  deleteCount,
  onCloseForm,
  onSaveForm,
  onRequestDeleteFromEdit,
  onCloseDelete,
  onConfirmDelete,
}: CskhGanttModalsProps) {
  return (
    <>
      <Modal
        isOpen={open}
        onClose={onCloseForm}
        title={editing ? 'Sửa hạng mục tiến độ' : 'Thêm hạng mục tiến độ'}
        size="md"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {editing ? (
              <Button
                type="button"
                variant="text"
                disabled={wbsWriteDisabled}
                style={{ color: '#dc2626' }}
                onClick={() => onRequestDeleteFromEdit(editing)}
              >
                Xóa hạng mục
              </Button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="outlined" onClick={onCloseForm}>Hủy</Button>
              <Button type="button" disabled={wbsWriteDisabled} onClick={onSaveForm}>Lưu</Button>
            </div>
          </div>
        )}
      >
        <FormField label="Hạng mục thi công" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            placeholder="VD: Lắp đặt khung thép & Thân lò"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Bộ phận phụ trách">
          <input
            className="form-input"
            value={form.department}
            onChange={event => setForm(current => ({ ...current, department: event.target.value }))}
            placeholder="VD: Đội Lắp 1 (CT)"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Thời hạn (số ngày)" required error={errors.days}>
          <input
            className="form-input"
            inputMode="numeric"
            value={form.days}
            onChange={event => setForm(current => ({ ...current, days: event.target.value }))}
            autoComplete="off"
          />
        </FormField>
        <FormField label="Bắt đầu dự kiến" required error={errors.startDate}>
          <HrmDatePicker
            value={form.startDate}
            onChange={value => setForm(current => ({ ...current, startDate: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <FormField label="Kết thúc dự kiến" required error={errors.endDate}>
          <HrmDatePicker
            value={form.endDate}
            onChange={value => setForm(current => ({ ...current, endDate: value }))}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <FormField label="% thực tế đạt được" required error={errors.actualPct}>
          <input
            className="form-input"
            inputMode="numeric"
            value={form.actualPct}
            onChange={event => setForm(current => ({ ...current, actualPct: event.target.value }))}
            autoComplete="off"
          />
        </FormField>
        <FormField label="Ghi chú">
          <input
            className="form-input"
            value={form.notes}
            onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
            placeholder="VD: Đang xử lý vướng mắc"
            autoComplete="off"
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isLoading={isPending}
        confirmDisabled={wbsWriteDisabled}
        isOpen={Boolean(deleteTarget)}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        title={deleteCount > 1 ? 'Xóa nhóm hạng mục' : 'Xóa hạng mục'}
        message={deleteCount > 1
          ? `Xóa nhóm "${deleteTarget?.name ?? ''}" cùng toàn bộ ${deleteCount - 1} hạng mục con (tổng ${deleteCount} hạng mục)?`
          : `Xóa hạng mục "${deleteTarget?.name ?? ''}"?`}
        confirmLabel={deleteCount > 1 ? `Xóa ${deleteCount} hạng mục` : 'Xóa'}
      />
    </>
  );
}
