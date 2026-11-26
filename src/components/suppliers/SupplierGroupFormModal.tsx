import type React from 'react';
import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';

interface SupplierGroupFormModalProps {
  isOpen: boolean;
  editing: SupplierGroupApiDto | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string | null }) => void;
}

const FORM_ID = 'supplier-group-form';

export default function SupplierGroupFormModal({
  isOpen,
  editing,
  isSaving,
  onClose,
  onSubmit,
}: SupplierGroupFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa nhóm nhà cung cấp' : 'Tạo nhóm nhà cung cấp'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outlined" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="filled"
            size="sm"
            disabled={isSaving}
            loading={isSaving}
          >
            Lưu
          </Button>
        </>
      }
    >
      <GroupForm editing={editing} onSubmit={onSubmit} />
    </Modal>
  );
}

/** Modal chỉ render khi mở nên state khởi tạo lại mỗi lần mở — không cần đồng bộ qua effect. */
function GroupForm({
  editing,
  onSubmit,
}: Pick<SupplierGroupFormModalProps, 'editing' | 'onSubmit'>) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tên nhóm là bắt buộc.');
      return;
    }
    setError('');
    onSubmit({ name: trimmed, description: description.trim() || null });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
      <FormField label="Tên nhóm" required error={error}>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="VD: Thiết bị điện"
        />
      </FormField>
      <FormField label="Mô tả">
        <textarea
          className="form-input"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Phạm vi ngành hàng của nhóm"
        />
      </FormField>
    </form>
  );
}
