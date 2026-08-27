import { useState } from 'react';
import { Flag, Gauge, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import {
  CSKH_COLOR_OPTIONS,
  nextCatalogCode,
  newMasterId,
  removeById,
  upsertById,
  type CskhColorItem,
  type CskhColorToken,
} from '../../lib/cskh/masterData';
import CskhMasterTable from './CskhMasterTable';

type Target = 'statuses' | 'priorities';

interface FormState {
  name: string;
  color: string;
}

const EMPTY_FORM: FormState = { name: '', color: '' };

export default function CskhStatusPriorityPage() {
  const { store, persist } = useCskhMasterData();
  const [target, setTarget] = useState<Target>('statuses');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<{ list: Target; id: string; name: string } | null>(null);

  const isStatus = target === 'statuses';
  const addLabel = isStatus ? 'Thêm trạng thái' : 'Thêm ưu tiên';
  const modalTitle = editingId
    ? (isStatus ? 'Sửa trạng thái' : 'Sửa mức ưu tiên')
    : addLabel;

  const openCreate = (list: Target) => {
    setTarget(list);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (list: Target, row: CskhColorItem) => {
    setTarget(list);
    setEditingId(row.id);
    setForm({ name: row.name, color: row.color });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const save = () => {
    const name = form.name.trim();
    const next: { name?: string; color?: string } = {};
    if (!name) next.name = 'Nhập tên hiển thị.';
    if (!form.color) next.color = 'Chọn màu sắc.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const list = store[target];
    const existing = list.find(row => row.id === editingId);
    const prefix = target === 'statuses' ? 'TT' : 'UT';
    const item: CskhColorItem = {
      id: existing?.id ?? newMasterId(),
      code: existing?.code ?? nextCatalogCode(prefix, list.map(row => row.code)),
      name,
      color: form.color as CskhColorToken,
    };
    persist(current => ({
      ...current,
      [target]: upsertById(current[target], item),
    }));
    showToast('success', editingId ? 'Đã cập nhật.' : 'Đã thêm.');
    closeForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    persist(current => ({
      ...current,
      [deleteTarget.list]: removeById(current[deleteTarget.list], deleteTarget.id),
    }));
    showToast('success', `Đã xóa ${deleteTarget.name}.`);
    setDeleteTarget(null);
  };

  const colorColumns = [
    {
      key: 'code',
      label: 'Mã',
      className: 'cskh-col-code',
      render: (row: CskhColorItem) => <span className="font-mono">{row.code}</span>,
    },
    { key: 'name', label: 'Tên hiển thị', render: (row: CskhColorItem) => row.name },
    {
      key: 'color',
      label: 'Màu',
      render: (row: CskhColorItem) => (
        <span className={`cskh-status cskh-status--${row.color}`}>
          <span className="cskh-status__dot" aria-hidden />
          {CSKH_COLOR_OPTIONS.find(option => option.value === row.color)?.label ?? row.color}
        </span>
      ),
    },
  ];

  const renderList = (list: Target, title: string, add: string, empty: string) => (
    <HrmPanel className="cskh-desk__panel">
      <div className="cskh-desk__section-head">
        <div className="cskh-settings-lead">
          <h2 className="section-heading__title m-0">{title}</h2>
          <p className="section-heading__sub mb-0 tabular-nums">{store[list].length} mục</p>
        </div>
        <Button type="button" leftIcon={Plus} onClick={() => openCreate(list)}>
          {add}
        </Button>
      </div>
      <CskhMasterTable
        columns={colorColumns}
        rows={store[list]}
        emptyMessage={empty}
        emptyIcon={list === 'statuses' ? Flag : Gauge}
        emptyAction={(
          <Button type="button" leftIcon={Plus} onClick={() => openCreate(list)}>
            {add}
          </Button>
        )}
        onEdit={row => openEdit(list, row)}
        onDelete={row => setDeleteTarget({ list, id: row.id, name: row.name })}
      />
    </HrmPanel>
  );

  return (
    <>
      <PageHeader
        title="Trạng thái & Ưu tiên"
        subtitle="Màu trạng thái tiến độ và mức ưu tiên khi tạo dự án."
      />

      <div className="cskh-split">
        {renderList('statuses', 'Trạng thái dự án', 'Thêm trạng thái', 'Chưa có trạng thái. Chọn Xanh, Cam hoặc Đỏ để nhận diện trên tổng quan.')}
        {renderList('priorities', 'Mức ưu tiên', 'Thêm ưu tiên', 'Chưa có mức ưu tiên. Dùng khi tạo dự án và lập bảng tiến độ chuẩn.')}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={modalTitle}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={closeForm}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label="Tên hiển thị" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={e => {
              setForm(current => ({ ...current, name: e.target.value }));
              setErrors(current => ({ ...current, name: undefined }));
            }}
            placeholder={isStatus ? 'VD: Chậm nặng' : 'VD: Khẩn cấp'}
          />
        </FormField>
        <FormField label="Màu sắc" required error={errors.color}>
          <div className="cskh-field-preview">
            <HrmSelect
              value={form.color}
              onChange={value => {
                setForm(current => ({ ...current, color: value }));
                setErrors(current => ({ ...current, color: undefined }));
              }}
              options={CSKH_COLOR_OPTIONS}
              placeholder="Chọn màu sắc"
              error={Boolean(errors.color)}
            />
            {form.color ? (
              <span className={`cskh-status cskh-status--${form.color}`}>
                <span className="cskh-status__dot" aria-hidden />
                {form.name.trim()
                  || CSKH_COLOR_OPTIONS.find(option => option.value === form.color)?.label
                  || form.color}
              </span>
            ) : null}
          </div>
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa khỏi danh mục"
        message={deleteTarget ? `Xóa ${deleteTarget.name}?` : ''}
        confirmLabel="Xóa"
      />
    </>
  );
}
