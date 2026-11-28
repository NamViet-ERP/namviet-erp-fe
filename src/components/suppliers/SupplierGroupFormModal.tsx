import type React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import {
  isSameGroupNameExact,
  isSameGroupNameFolded,
} from '../../lib/suppliers/supplierGroupTree';
import type {
  SupplierGroupApiDto,
  UpsertSupplierGroupRequest,
} from '../../types/api/supplierDirectoryApi';

interface SupplierGroupFormModalProps {
  isOpen: boolean;
  editing: SupplierGroupApiDto | null;
  parentOptions: SupplierGroupApiDto[];
  allGroups?: SupplierGroupApiDto[];
  defaultParentId?: number | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: UpsertSupplierGroupRequest) => void;
}

interface SubGroupDraftRow {
  localKey: string;
  id: number | null;
  name: string;
  description: string | null;
}

const FORM_ID = 'supplier-group-form';

function resolveModalTitle(
  editing: SupplierGroupApiDto | null,
  defaultParentId?: number | null,
): string {
  if (editing) {
    return editing.parentGroupId != null ? 'Sửa mô tả con' : 'Sửa nhóm nhà cung cấp';
  }
  return defaultParentId != null ? 'Thêm mô tả cho nhóm' : 'Tạo nhóm nhà cung cấp';
}

export default function SupplierGroupFormModal({
  isOpen,
  editing,
  parentOptions,
  allGroups,
  defaultParentId = null,
  isSaving,
  onClose,
  onSubmit,
}: SupplierGroupFormModalProps) {
  const resolvedGroups = allGroups ?? parentOptions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolveModalTitle(editing, defaultParentId)}
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
      <GroupForm
        key={`${editing?.id ?? 'new'}-${defaultParentId ?? 'root'}`}
        editing={editing}
        resolvedGroups={resolvedGroups}
        defaultParentId={defaultParentId}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

/** Modal chỉ render khi mở nên state khởi tạo lại mỗi lần mở — không cần đồng bộ qua effect. */
function GroupForm({
  editing,
  resolvedGroups,
  defaultParentId,
  onSubmit,
}: Pick<SupplierGroupFormModalProps, 'editing' | 'defaultParentId' | 'onSubmit'> & {
  resolvedGroups: SupplierGroupApiDto[];
}) {
  const nameInputId = useId();
  const descInputId = useId();
  const subTitleId = useId();

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const parentGroupId = editing ? (editing.parentGroupId ?? null) : (defaultParentId ?? null);
  const [subRows, setSubRows] = useState<SubGroupDraftRow[]>(() => {
    if (editing != null && editing.parentGroupId == null) {
      return resolvedGroups
        .filter(g => g.parentGroupId === editing.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
        .map(g => ({
          localKey: `existing-${g.id}`,
          id: g.id,
          name: g.name,
          description: g.description ?? null,
        }));
    }
    return [];
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nextSeqRef = useRef(0);
  const pendingFocusKeyRef = useRef<string | null>(null);
  const subNameInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    const targetKey = pendingFocusKeyRef.current;
    if (!targetKey) return;
    const inputEl = subNameInputRefs.current.get(targetKey);
    if (inputEl) {
      inputEl.focus();
      pendingFocusKeyRef.current = null;
    }
  }, [subRows]);

  const isChildContext = parentGroupId !== null;
  const trimmedName = name.trim();

  const selectedParent = useMemo(
    () =>
      parentGroupId !== null
        ? (resolvedGroups.find(g => g.id === parentGroupId) ?? null)
        : null,
    [resolvedGroups, parentGroupId],
  );

  const parentDisplayName = selectedParent?.name ?? editing?.parentGroupName ?? '';

  const duplicateNameError = useMemo(() => {
    if (!trimmedName) return '';
    if (parentGroupId !== null) {
      const siblingDup = resolvedGroups.find(
        g =>
          g.parentGroupId === parentGroupId &&
          g.id !== editing?.id &&
          isSameGroupNameExact(g.name, name),
      );
      if (siblingDup) {
        return `Mô tả "${trimmedName}" đã tồn tại trong nhóm "${parentDisplayName}".`;
      }
      return '';
    }

    const rootDup = resolvedGroups.find(
      g =>
        g.parentGroupId == null &&
        g.id !== editing?.id &&
        isSameGroupNameExact(g.name, name),
    );
    if (rootDup) {
      return `Nhóm "${trimmedName}" đã tồn tại.`;
    }
    return '';
  }, [trimmedName, parentGroupId, resolvedGroups, editing?.id, name, parentDisplayName]);

  const nameError =
    duplicateNameError ||
    (submitAttempted && !trimmedName
      ? isChildContext
        ? 'Mô tả là bắt buộc.'
        : 'Tên nhóm là bắt buộc.'
      : '');

  const childAntiRepeatWarning = useMemo(() => {
    if (!isChildContext || !parentDisplayName) return '';
    if (!isSameGroupNameFolded(name, parentDisplayName)) return '';
    return `Không cần lặp lại tên nhóm "${parentDisplayName}" — hãy nhập mô tả cụ thể (VD: Lắp đặt, Cung cấp vật tư) để tránh hiển thị lặp "${parentDisplayName} › ${parentDisplayName}".`;
  }, [isChildContext, parentDisplayName, name]);

  const subRowStates = useMemo(() => {
    return subRows.map(row => {
      const trimmedSubName = row.name.trim();
      const missingName = row.id != null && !trimmedSubName;
      const duplicateInList =
        trimmedSubName !== '' &&
        subRows.some(
          other =>
            other.localKey !== row.localKey &&
            isSameGroupNameExact(other.name, row.name),
        );

      let rowError = '';
      if (missingName) {
        rowError = 'Vui lòng nhập mô tả con hoặc xóa dòng trống.';
      } else if (duplicateInList) {
        rowError = 'Mô tả con bị trùng trong danh sách.';
      }

      const antiRepeatWarn =
        trimmedName !== '' && isSameGroupNameFolded(row.name, name)
          ? `Không cần lặp lại tên nhóm "${trimmedName}" — hãy nhập mô tả con cụ thể để tránh hiển thị lặp "${trimmedName} › ${trimmedName}".`
          : '';

      return { rowError, antiRepeatWarn };
    });
  }, [subRows, trimmedName, name]);

  const handleAddSubRow = () => {
    nextSeqRef.current += 1;
    const localKey = `draft-${nextSeqRef.current}`;
    pendingFocusKeyRef.current = localKey;
    setSubRows(prev => [...prev, { localKey, id: null, name: '', description: null }]);
  };

  const handleRemoveSubRow = (localKey: string) => {
    subNameInputRefs.current.delete(localKey);
    setSubRows(prev => prev.filter(row => row.localKey !== localKey));
  };

  const handleSubRowChange = (localKey: string, value: string) => {
    setSubRows(prev =>
      prev.map(row => (row.localKey === localKey ? { ...row, name: value } : row)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!trimmedName || duplicateNameError) {
      return;
    }

    if (parentGroupId === null) {
      if (subRowStates.some(state => state.rowError !== '')) {
        return;
      }
      const validSubRows = subRows.filter(r => !(r.id == null && !r.name.trim()));
      onSubmit({
        name: trimmedName,
        description: description.trim() || null,
        parentGroupId: null,
        ...(validSubRows.length > 0
          ? {
              subGroups: validSubRows.map(r => ({
                id: r.id,
                name: r.name.trim(),
                description: r.id != null ? (r.description ?? null) : null,
              })),
            }
          : {}),
      });
      return;
    }

    onSubmit({
      name: trimmedName,
      description: editing?.description ?? null,
      parentGroupId,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
      {isChildContext ? (
        <div className="supplier-group-form__parent-context">
          Thuộc nhóm:{' '}
          <strong>{selectedParent?.name ?? editing?.parentGroupName ?? `#${parentGroupId}`}</strong>
        </div>
      ) : null}
      <FormField
        label={isChildContext ? 'Mô tả' : 'Tên nhóm'}
        htmlFor={nameInputId}
        required
        error={nameError}
      >
        <input
          id={nameInputId}
          className="form-input"
          value={name}
          aria-invalid={nameError ? 'true' : undefined}
          onChange={e => setName(e.target.value)}
          placeholder={
            isChildContext
              ? 'VD: Lắp đặt, Cung cấp vật tư, Gia công…'
              : 'VD: Bảo Ôn, Thiết bị điện'
          }
        />
        {isChildContext ? (
          <p className="supplier-group-form__hint">
            Nhập mô tả / hạng mục con cụ thể trong nhóm (không cần lặp lại tên nhóm).
          </p>
        ) : null}
        {childAntiRepeatWarning ? (
          <div className="supplier-group-form__warn" role="status">
            <AlertTriangle size={14} className="supplier-group-form__warn-icon" aria-hidden />
            <span>{childAntiRepeatWarning}</span>
          </div>
        ) : null}
      </FormField>

      {!isChildContext ? (
        <>
          <FormField label="Mô tả chung" htmlFor={descInputId}>
            <textarea
              id={descInputId}
              className="form-input"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả tổng quan cho nhóm (tùy chọn)"
            />
          </FormField>

          <section className="supplier-group-form__subgroups" aria-labelledby={subTitleId}>
            <div className="supplier-group-form__subgroups-head">
              <div className="supplier-group-form__subgroups-title-wrap">
                <h4 id={subTitleId} className="supplier-group-form__subgroups-title">
                  Danh sách mô tả bên trong (tùy chọn)
                </h4>
                {subRows.length > 0 ? (
                  <span className="supplier-group-form__subgroups-count">{subRows.length}</span>
                ) : null}
              </div>
              <Button type="button" variant="outlined" size="sm" onClick={handleAddSubRow}>
                + Thêm mô tả
              </Button>
            </div>
            <p className="supplier-group-form__hint">
              Mỗi dòng là một mô tả / phạm vi cụ thể thuộc nhóm này (VD: Cung cấp vật tư, Lắp
              đặt, Gia công). Có thể thêm nhiều dòng trong 1 lần lưu.
            </p>

            {subRows.length === 0 ? (
              <div className="supplier-group-form__subgroups-empty">
                Chưa có mô tả con nào — có thể lưu ngay hoặc bấm &ldquo;+ Thêm mô tả&rdquo; để thêm
                nhiều dòng cùng lúc.
              </div>
            ) : (
              <div className="supplier-group-form__subgroups-list">
                {subRows.map((row, idx) => {
                  const state = subRowStates[idx]!;
                  const hasError = state.rowError !== '';
                  return (
                    <div
                      key={row.localKey}
                      className={`supplier-group-form__sub-row${
                        hasError ? ' supplier-group-form__sub-row--error' : ''
                      }`}
                    >
                      <div className="supplier-group-form__sub-row-bar">
                        <span className="supplier-group-form__sub-index">{idx + 1}</span>
                        <div className="supplier-group-form__sub-inputs supplier-group-form__sub-inputs--single">
                          <input
                            ref={el => {
                              if (el) subNameInputRefs.current.set(row.localKey, el);
                              else subNameInputRefs.current.delete(row.localKey);
                            }}
                            className={`form-input${hasError ? ' form-input--error' : ''}`}
                            value={row.name}
                            placeholder="VD: Cung cấp vật tư, Lắp đặt, Gia công…"
                            aria-label={`Mô tả con #${idx + 1}`}
                            aria-invalid={hasError ? 'true' : undefined}
                            onChange={e => handleSubRowChange(row.localKey, e.target.value)}
                          />
                        </div>
                        {row.id != null ? (
                          <span className="supplier-group-form__saved-tag">Đã lưu</span>
                        ) : (
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger supplier-group-form__sub-remove"
                            aria-label={`Xóa dòng mô tả #${idx + 1}`}
                            title="Xóa dòng"
                            onClick={() => handleRemoveSubRow(row.localKey)}
                          >
                            <X size={14} aria-hidden />
                          </button>
                        )}
                      </div>
                      {hasError ? (
                        <p className="supplier-group-form__row-error" role="alert">
                          {state.rowError}
                        </p>
                      ) : null}
                      {state.antiRepeatWarn ? (
                        <div className="supplier-group-form__warn" role="status">
                          <AlertTriangle
                            size={14}
                            className="supplier-group-form__warn-icon"
                            aria-hidden
                          />
                          <span>{state.antiRepeatWarn}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </form>
  );
}
