import { Edit, Save, X } from 'lucide-react';

interface HrmEditActionsProps {
  isEditing: boolean;
  isSaving?: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function HrmEditActions({
  isEditing,
  isSaving = false,
  disabled = false,
  onEdit,
  onCancel,
  onSave,
}: HrmEditActionsProps) {
  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        title={disabled ? 'Bạn không có quyền chỉnh sửa' : undefined}
        className="btn btn-primary rounded-full px-5 flex items-center gap-2"
      >
        <Edit size={16} /> Chỉnh sửa
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={onCancel} className="btn btn-outline rounded-full px-5 flex items-center gap-2">
        <X size={16} /> Hủy
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || disabled}
        className="btn btn-primary rounded-full px-5 flex items-center gap-2"
      >
        <Save size={16} /> Lưu
      </button>
    </>
  );
}
