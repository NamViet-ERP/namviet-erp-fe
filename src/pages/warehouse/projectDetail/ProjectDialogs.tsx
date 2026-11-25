import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import WarehouseKeeperMultiSelect from '../../../components/warehouse/WarehouseKeeperMultiSelect';
import { MAX_MATERIAL_BUDGET, MAX_MATERIAL_BUDGET_LABEL } from '../../../constants/wmsLimits';
import {
  useCloseProject,
  useDeleteProject,
  useUpdateProject,
} from '../../../hooks/useProjects';
import { getApiErrorMessage, getApiFieldErrors } from '../../../lib/apiClient';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../../lib/wms/stockTerminology';
import { parseCurrencyInput } from '../../../utils/currencyInput';
import type {
  ProjectWarehouseKeeperDto,
  UpdateWarehouseProjectRequest,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
  WarehouseProjectLedgerEntryApiDto,
} from '../../../types/wms';

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function validateEditForm(form: {
  projectName: string;
  materialBudget: string;
  warehouseKeepers: ProjectWarehouseKeeperDto[];
}): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.projectName.trim()) errs.projectName = 'Vui lòng nhập tên công trình';
  if (form.warehouseKeepers.length < 1) {
    errs.warehouseKeepers = 'Chọn ít nhất 1 thủ kho phụ trách';
  }
  if (parseCurrencyInput(form.materialBudget) <= 0) {
    errs.materialBudget = 'Vui lòng nhập ngân sách vật tư';
  } else if (parseCurrencyInput(form.materialBudget) > MAX_MATERIAL_BUDGET) {
    errs.materialBudget = `Ngân sách tối đa ${MAX_MATERIAL_BUDGET_LABEL} đ`;
  }
  return errs;
}

function openEditForm(project: WarehouseProjectApiDto) {
  return {
    projectName: project.projectName,
    pmName: project.pmName && project.pmName !== '—' ? project.pmName : '',
    endDate: toDateInputValue(project.endDate ?? undefined),
    materialBudget: project.materialBudget > 0 ? String(project.materialBudget) : '',
    warehouseKeepers: [...(project.warehouseKeepers ?? [])],
  };
}

function ProjectEditModal({
  code,
  project,
  onClose,
}: {
  code: string;
  project: WarehouseProjectApiDto;
  onClose: () => void;
}) {
  const [editForm, setEditForm] = useState(() => openEditForm(project));
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const updateMutation = useUpdateProject();

  const handleSaveEdit = async () => {
    const clientErrors = validateEditForm(editForm);
    if (Object.keys(clientErrors).length > 0) {
      setEditErrors(clientErrors);
      return;
    }

    setEditErrors({});
    try {
      await updateMutation.mutateAsync({
        code,
        body: {
          projectName: editForm.projectName.trim(),
          pmId: EMPTY_PM_ID,
          pmName:
            editForm.warehouseKeepers.map(k => k.displayName).join(', ')
            || editForm.pmName.trim()
            || '—',
          endDate: editForm.endDate || null,
          materialBudget: parseCurrencyInput(editForm.materialBudget),
          status: project.status as UpdateWarehouseProjectRequest['status'],
          warehouseKeepers: editForm.warehouseKeepers,
        },
      });
      onClose();
      showToast('success', 'Đã cập nhật thông tin kho dự án.');
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setEditErrors(fieldErrors);
      } else {
        showToast('error', getApiErrorMessage(err, 'Không thể cập nhật kho dự án'));
      }
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Chỉnh sửa kho dự án"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="btn btn-filled"
            disabled={updateMutation.isPending}
            onClick={() => void handleSaveEdit()}
          >
            Lưu thay đổi
          </button>
        </>
      }
    >
      <div className="space-y-4 modal-form-bordered">
        <FormField label="Mã kho dự án">
          <input className="form-input font-mono" value={project.projectCode} readOnly disabled />
        </FormField>
        <FormField label="Tên công trình" required error={editErrors.projectName}>
          <input
            className="form-input"
            value={editForm.projectName}
            onChange={e => {
              setEditForm({ ...editForm, projectName: e.target.value });
              if (editErrors.projectName) {
                setEditErrors(prev => {
                  const next = { ...prev };
                  delete next.projectName;
                  return next;
                });
              }
            }}
          />
        </FormField>
        <FormField label="Người phụ trách dự án (Thủ kho)" required error={editErrors.warehouseKeepers}>
          <WarehouseKeeperMultiSelect
            value={editForm.warehouseKeepers}
            onChange={warehouseKeepers => {
              setEditForm({ ...editForm, warehouseKeepers });
              if (editErrors.warehouseKeepers) {
                setEditErrors(prev => {
                  const next = { ...prev };
                  delete next.warehouseKeepers;
                  return next;
                });
              }
            }}
            placeholder="Chọn ≥1 thủ kho…"
          />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Ngày kết thúc dự kiến">
            <input
              type="date"
              className="form-input"
              value={editForm.endDate}
              onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
            />
          </FormField>
          <FormField label="Ngân sách Vật tư" required error={editErrors.materialBudget}>
            <CurrencyInput
              suffix="(VNĐ)"
              className="tabular-nums"
              value={editForm.materialBudget}
              onChange={(_raw, numeric) => {
                setEditForm({ ...editForm, materialBudget: numeric > 0 ? String(numeric) : '' });
                if (editErrors.materialBudget) {
                  setEditErrors(prev => {
                    const next = { ...prev };
                    delete next.materialBudget;
                    return next;
                  });
                }
              }}
              placeholder="0"
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

interface ProjectDialogsProps {
  code: string;
  project: WarehouseProjectApiDto;
  showCloseConfirm: boolean;
  onCloseConfirmCancel: () => void;
  showDeleteConfirm: boolean;
  onDeleteConfirmCancel: () => void;
  onDeleted: () => void;
  showEdit: boolean;
  onEditClose: () => void;
  pendingLedgerEntries: WarehouseProjectLedgerEntryApiDto[];
  pendingStockLines: WarehouseProjectInventoryApiDto[];
  actualStockLines: WarehouseProjectInventoryApiDto[];
  totalActualQty: number;
}

export default function ProjectDialogs({
  code,
  project,
  showCloseConfirm,
  onCloseConfirmCancel,
  showDeleteConfirm,
  onDeleteConfirmCancel,
  onDeleted,
  showEdit,
  onEditClose,
  pendingLedgerEntries,
  pendingStockLines,
  actualStockLines,
  totalActualQty,
}: ProjectDialogsProps) {
  const closeMutation = useCloseProject();
  const deleteMutation = useDeleteProject();
  const hasPendingItems = pendingLedgerEntries.length > 0 || pendingStockLines.length > 0;

  const handleConfirmClose = async () => {
    try {
      await closeMutation.mutateAsync(code);
      onCloseConfirmCancel();
      showToast('success', `Đã đóng kho dự án. Tồn còn lại đã chuyển về ${GENERAL_WAREHOUSE_LABEL_LOWER}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đóng kho dự án'));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(code);
      showToast('success', `Đã xóa kho dự án ${project.projectCode}.`);
      onDeleted();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa kho dự án'));
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={onCloseConfirmCancel}
        onConfirm={() => void handleConfirmClose()}
        title="Đóng kho dự án?"
        confirmLabel={hasPendingItems ? 'Không thể đóng kho' : 'Đóng kho'}
        confirmDisabled={hasPendingItems}
        cancelLabel={hasPendingItems ? 'Đóng thông báo' : 'Hủy'}
        variant={hasPendingItems ? 'default' : 'danger'}
        isLoading={closeMutation.isPending}
        message={
          <div className="space-y-3 text-left text-sm">
            <p>
              Bạn đang yêu cầu đóng kho dự án <strong>{project.projectName}</strong> ({project.projectCode}).
            </p>

            {hasPendingItems ? (
              <div className="p-3 rounded-lg border border-[var(--md-error)] bg-[color-mix(in_srgb,var(--md-error)_8%,transparent)] text-[var(--md-on-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[var(--md-error)]">
                  <AlertTriangle size={18} />
                  <span>Chưa thể đóng kho: Còn chứng từ hoặc vật tư chưa xử lý!</span>
                </div>
                {pendingLedgerEntries.length > 0 && (
                  <div>
                    <p className="font-medium text-xs text-[var(--md-on-surface-variant)] mb-1">
                      Chứng từ chưa duyệt ({pendingLedgerEntries.length} phiếu):
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs font-mono">
                      {pendingLedgerEntries.map(e => (
                        <li key={e.id}>
                          <strong>{e.voucherCode}</strong> ({e.kind === 'import' ? 'Nhập kho' : e.kind === 'export' ? 'Xuất kho' : 'Chuyển kho'} - {e.status === 'draft' ? 'Bản nháp' : 'Chờ duyệt'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pendingStockLines.length > 0 && (
                  <div>
                    <p className="font-medium text-xs text-[var(--md-on-surface-variant)] mb-1">
                      Vật tư đang chờ xuất / chờ bảo hành:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {pendingStockLines.map(r => (
                        <li key={r.materialCode}>
                          <strong>{r.materialName}</strong> ({r.materialCode}):{' '}
                          {r.plannedExportQty > 0 ? `Chờ xuất ${r.plannedExportQty} ${r.unit}` : ''}
                          {r.pendingDefectQty > 0 ? `Chờ bảo hành ${r.pendingDefectQty} ${r.unit}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs pt-1 border-t border-[color-mix(in_srgb,var(--md-error)_20%,transparent)] leading-relaxed">
                  💡 <strong>Hướng dẫn xử lý:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Nếu vật tư <strong>đã xuất đi sử dụng tại công trình</strong>: Thủ kho cần vào duyệt phiếu xuất trước (vật tư đã xuất dùng sẽ ghi nhận vào công trình, <strong>không</strong> hoàn về kho tổng).</li>
                    <li>Nếu không dùng nữa hoặc tạo nhầm: Vui lòng <strong>Hủy phiếu</strong> treo.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {actualStockLines.length > 0 ? (
                  <p>
                    <strong>{actualStockLines.length}</strong> mặt hàng (tổng{' '}
                    <strong>{totalActualQty}</strong> đơn vị tồn thực tế còn lại) sẽ được tự động hoàn về <strong>{GENERAL_WAREHOUSE_LABEL_LOWER}</strong>.
                  </p>
                ) : (
                  <p>Kho không còn tồn thực tế — chỉ khóa thao tác nhập/xuất.</p>
                )}
                <p className="text-[var(--md-on-surface-variant)] text-xs">
                  Sau khi đóng, không thể nhập hoặc xuất thêm cho kho dự án này.
                </p>
              </>
            )}
          </div>
        }
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={onDeleteConfirmCancel}
        onConfirm={() => void handleConfirmDelete()}
        title="Xóa kho dự án"
        confirmLabel="Xóa kho"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
        message={
          <div className="space-y-2 text-left">
            <p>
              Bạn có chắc chắn muốn xóa kho dự án <strong>{project.projectName}</strong> ({project.projectCode})?
            </p>
            <p className="text-[var(--md-on-surface-variant)] text-sm">
              Thao tác này chỉ dành cho trường hợp tạo nhầm khi kho chưa có mặt hàng hay phát sinh giao dịch. Dữ liệu kho dự án sẽ bị xóa.
            </p>
          </div>
        }
      />

      {showEdit && (
        <ProjectEditModal
          code={code}
          project={project}
          onClose={onEditClose}
        />
      )}
    </>
  );
}
