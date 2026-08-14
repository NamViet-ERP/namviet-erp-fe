import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormField from '../../../components/ui/FormField';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { useCreateWarrantyClaim } from '../../../hooks/usePurchaseWarranties';
import type { PurchaseWarrantyApiDto } from '../../../services/purchaseWarrantiesService';
import WarrantyLotSelect from './WarrantyLotSelect';
import { DEFECT_TYPE_OPTIONS, SEVERITY_OPTIONS } from './warrantyLabels';

interface SpecLine {
  parameter: string;
  required: string;
  actual: string;
}

const emptySpec = (): SpecLine => ({ parameter: '', required: '', actual: '' });

interface CreateComplaintTicketPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lots: PurchaseWarrantyApiDto[];
  preselectedId: string;
  canCreate: boolean;
  onCreated: () => void;
}

function buildReason(reason: string, defectType: string, specs: SpecLine[]): string {
  const body = reason.trim();
  if (defectType !== 'spec') return body;
  const lines = specs.filter(s => s.parameter.trim() || s.required.trim() || s.actual.trim());
  if (lines.length === 0) return body;
  const block = lines
    .map(s => `- ${s.parameter.trim()}: yêu cầu ${s.required.trim()}; thực đo ${s.actual.trim()}`)
    .join('\n');
  return `${body}\n\nChỉ tiêu không đạt:\n${block}`;
}

export default function CreateComplaintTicketPanel({
  isOpen,
  onClose,
  lots,
  preselectedId,
  canCreate,
  onCreated,
}: CreateComplaintTicketPanelProps) {
  const [warrantyId, setWarrantyId] = useState(preselectedId);
  const [defectType, setDefectType] = useState('physical');
  const [severity, setSeverity] = useState('medium');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [specs, setSpecs] = useState<SpecLine[]>([emptySpec()]);
  const [lotError, setLotError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const createMutation = useCreateWarrantyClaim();

  useEffect(() => {
    if (!isOpen) return;
    setWarrantyId(preselectedId);
    setDefectType('physical');
    setSeverity('medium');
    setReason('');
    setNote('');
    setSpecs([emptySpec()]);
    setLotError('');
    setReasonError('');
  }, [isOpen, preselectedId]);

  const selected = lots.find(l => l.id === warrantyId);
  const canSubmit = canCreate && lots.length > 0 && !createMutation.isPending;

  const onSubmit = async () => {
    setLotError('');
    setReasonError('');
    if (!warrantyId) {
      setLotError('Chọn lô hàng liên quan.');
      return;
    }
    if (reason.trim().length < 3) {
      setReasonError('Nhập mô tả lỗi (tối thiểu 3 ký tự).');
      return;
    }
    try {
      await createMutation.mutateAsync({
        id: warrantyId,
        body: {
          reason: buildReason(reason, defectType, specs),
          note: note.trim() || undefined,
          submit: true,
          kind: 'complaint',
          defectType,
          severity,
        },
      });
      showToast('success', 'Đã tạo khiếu nại bảo hành.');
      onCreated();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được khiếu nại bảo hành'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo khiếu nại bảo hành"
      subtitle="Lỗi vật lý, sai thông số kỹ thuật, hoặc hỏng chức năng sau khi nhận / sử dụng."
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          {canCreate && lots.length > 0 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={() => {
                void onSubmit();
              }}
            >
              {createMutation.isPending ? 'Đang lưu…' : 'Lưu khiếu nại'}
            </button>
          ) : null}
        </>
      }
    >
      {!canCreate ? (
        <EmptyState message="Bạn không có quyền tạo khiếu nại bảo hành." />
      ) : lots.length === 0 ? (
        <EmptyState message="Chưa có hồ sơ bảo hành để gắn khiếu nại. Đồng bộ từ PO đã nhận trước." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <WarrantyLotSelect
              lots={lots}
              value={warrantyId}
              onChange={id => {
                setWarrantyId(id);
                setLotError('');
              }}
              error={lotError}
            />
          </div>
          <FormField label="Nhà cung cấp">
            <input className="form-input" readOnly value={selected?.supplierName || ''} />
          </FormField>
          <FormField label="Hàng hoá">
            <input
              className="form-input"
              readOnly
              value={selected ? `${selected.materialCode || selected.code} ${selected.materialName}` : ''}
            />
          </FormField>
          <FormField label="Dự án">
            <input className="form-input" readOnly value={selected?.projectCode || ''} />
          </FormField>
          <FormField label="PO liên quan">
            <input className="form-input" readOnly value={selected?.poCode || ''} />
          </FormField>
          <FormField label="Ngày nhận hàng">
            <input
              className="form-input"
              readOnly
              value={selected ? formatDateCell(selected.deliveryDate ?? undefined) : ''}
            />
          </FormField>
          <FormField label="Thời hạn bảo hành (tháng)">
            <input
              className="form-input"
              readOnly
              value={selected ? String(selected.warrantyMonths) : ''}
            />
          </FormField>
          <FormField label="Loại lỗi" required>
            <select
              className="form-input"
              value={defectType}
              onChange={e => setDefectType(e.target.value)}
            >
              {DEFECT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Mức độ nghiêm trọng" required>
            <select
              className="form-input"
              value={severity}
              onChange={e => setSeverity(e.target.value)}
            >
              {SEVERITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Mô tả chi tiết lỗi" required error={reasonError}>
              <textarea
                className="form-input"
                value={reason}
                onChange={e => {
                  setReason(e.target.value);
                  setReasonError('');
                }}
              />
            </FormField>
          </div>
          {defectType === 'spec' ? (
            <div className="md:col-span-2">
              <p className="form-label">Bảng chỉ tiêu không đạt</p>
              <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
                <table className="wms-inventory-table wms-voucher-detail-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Chỉ tiêu</th>
                      <th className="table-header-cell">Yêu cầu</th>
                      <th className="table-header-cell">Thực đo</th>
                      <th className="table-header-cell warranty-col-actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((line, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="table-cell">
                          <input
                            className="form-input"
                            value={line.parameter}
                            onChange={e => {
                              const next = [...specs];
                              next[idx] = { ...line, parameter: e.target.value };
                              setSpecs(next);
                            }}
                            aria-label={`Chỉ tiêu ${idx + 1}`}
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            className="form-input"
                            value={line.required}
                            onChange={e => {
                              const next = [...specs];
                              next[idx] = { ...line, required: e.target.value };
                              setSpecs(next);
                            }}
                            aria-label={`Yêu cầu ${idx + 1}`}
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            className="form-input"
                            value={line.actual}
                            onChange={e => {
                              const next = [...specs];
                              next[idx] = { ...line, actual: e.target.value };
                              setSpecs(next);
                            }}
                            aria-label={`Thực đo ${idx + 1}`}
                          />
                        </td>
                        <td className="table-cell warranty-col-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label={`Xoá chỉ tiêu ${idx + 1}`}
                            onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                            disabled={specs.length === 1}
                          >
                            <X size={14} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-2"
                onClick={() => setSpecs([...specs, emptySpec()])}
              >
                <Plus size={14} aria-hidden />
                Thêm chỉ tiêu
              </button>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <FormField label="Ghi chú thêm">
              <textarea
                className="form-input"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      )}
    </Modal>
  );
}
