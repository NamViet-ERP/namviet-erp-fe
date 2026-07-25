import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import {
  usePurchasePlanImportConfirm,
  usePurchasePlanImportPreview,
} from '../../hooks/usePurchasePlans';
import type { PurchasePlanImportPreviewApiDto } from '../../types/api/purchasingApi';

interface ImportPlanExcelModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: (planCode: string) => void;
}

export default function ImportPlanExcelModal({ open, onClose, onImported }: ImportPlanExcelModalProps) {
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200, status: 'Active' });
  const previewMutation = usePurchasePlanImportPreview();
  const confirmMutation = usePurchasePlanImportConfirm();

  const [projectCode, setProjectCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PurchasePlanImportPreviewApiDto | null>(null);

  const projects = projectsPage?.items ?? [];
  const busy = previewMutation.isPending || confirmMutation.isPending;

  const reset = () => {
    setProjectCode('');
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const runPreview = async () => {
    if (!projectCode) {
      showToast('warning', 'Vui lòng chọn dự án.');
      return;
    }
    if (!file) {
      showToast('warning', 'Vui lòng chọn file Excel.');
      return;
    }
    try {
      const result = await previewMutation.mutateAsync({ projectCode, file });
      setPreview(result);
      showToast('success', 'Đã phân tích file. Kiểm tra đối chiếu cột trước khi xác nhận.');
    } catch (err) {
      setPreview(null);
      showToast('error', getApiErrorMessage(err, 'Không đọc được file Excel.'));
    }
  };

  const runConfirm = async () => {
    if (!preview) return;
    if (preview.errorRowCount > 0) {
      showToast('warning', 'Còn lỗi bắt buộc — sửa file hoặc đối chiếu lại trước khi import.');
      return;
    }
    const validLines = (preview.lines ?? []).filter(l => l.isValid);
    if (validLines.length === 0) {
      showToast('warning', 'Không có dòng hợp lệ để import.');
      return;
    }
    try {
      const plan = await confirmMutation.mutateAsync({
        projectCode: preview.projectCode,
        lines: validLines,
      });
      showToast('success', `Đã import KHMH ${plan.code}.`);
      reset();
      onClose();
      onImported?.(plan.code);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Import thất bại.'));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Import Excel kế hoạch mua hàng"
      size="lg"
      footer={(
        <>
          <button type="button" className="btn btn-text" onClick={handleClose} disabled={busy}>
            Hủy
          </button>
          {!preview ? (
            <button type="button" className="btn btn-primary" onClick={runPreview} disabled={busy}>
              {previewMutation.isPending ? 'Đang phân tích…' : 'Phân tích file'}
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-text" onClick={() => setPreview(null)} disabled={busy}>
                Chọn lại
              </button>
              <button type="button" className="btn btn-primary" onClick={runConfirm} disabled={busy}>
                {confirmMutation.isPending ? 'Đang import…' : 'Xác nhận import'}
              </button>
            </>
          )}
        </>
      )}
    >
      <div className="form-grid">
        <FormField label="Dự án" required>
          <select
            id="import-plan-project"
            className="form-input form-input-md"
            value={projectCode}
            disabled={busy || Boolean(preview)}
            onChange={e => setProjectCode(e.target.value)}
            aria-label="Dự án"
          >
            <option value="">Chọn dự án</option>
            {projects.map(p => (
              <option key={p.projectCode} value={p.projectCode}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="File Excel" required>
          <input
            id="import-plan-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={busy || Boolean(preview)}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            aria-label="File Excel"
          />
        </FormField>
      </div>

      {preview && (
        <div className="pur-erp__import-preview" style={{ marginTop: 16 }}>
          <p className="text-sm">
            Sheet: <strong>{preview.sheetName || '—'}</strong>
            {' · '}
            Dòng hợp lệ: <strong>{preview.validRowCount}</strong>/{preview.totalRows}
            {preview.errorRowCount > 0 ? (
              <> · Lỗi: <strong>{preview.errorRowCount}</strong></>
            ) : null}
          </p>
          <div className="overflow-x-auto table-scroll" style={{ marginTop: 8 }}>
            <table className="pur-erp__table">
              <thead>
                <tr>
                  <th>Trường</th>
                  <th>Header Excel</th>
                  <th>Cột</th>
                </tr>
              </thead>
              <tbody>
                {(preview.mappedColumns ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3}>Chưa có thông tin cột từ API.</td>
                  </tr>
                ) : (
                  preview.mappedColumns.map(col => (
                    <tr key={`${col.field}-${col.columnIndex}`}>
                      <td>{col.field}</td>
                      <td>{col.header}</td>
                      <td>{col.columnIndex}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {(preview.errors ?? []).length > 0 && (
            <ul className="text-sm" style={{ marginTop: 8, color: 'var(--md-sys-color-error, #b3261e)' }}>
              {preview.errors.slice(0, 12).map((err, i) => (
                <li key={`${err.rowNumber}-${err.field}-${i}`}>
                  Dòng {err.rowNumber}: {err.field} — {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
