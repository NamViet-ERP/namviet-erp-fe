import { useState } from 'react';
import FormField from '../../../components/ui/FormField';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../../lib/hrm/formatters';
import {
  useCloseWarrantyClaim,
  usePurchaseWarranty,
  useUpdatePurchaseWarranty,
} from '../../../hooks/usePurchaseWarranties';
import type { PurchaseWarrantyClaimApiDto } from '../../../types/api/purchasingApi';
import {
  claimKindLabel,
  claimStatusLabel,
  defectTypeLabel,
  severityLabel,
  statusLabel,
} from './warrantyLabels';

interface WarrantyDetailModalProps {
  selectedId: string | null;
  canUpdate: boolean;
  onClose: () => void;
}

export default function WarrantyDetailModal({
  selectedId,
  canUpdate,
  onClose,
}: WarrantyDetailModalProps) {
  const detailQuery = usePurchaseWarranty(selectedId ?? undefined);
  const updateMutation = useUpdatePurchaseWarranty();
  const closeClaimMutation = useCloseWarrantyClaim();
  const data = detailQuery.data;

  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [anchorType, setAnchorType] = useState('delivery');
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [closeClaimId, setCloseClaimId] = useState<string | null>(null);
  const [serviceRating, setServiceRating] = useState('5');
  const [serviceNote, setServiceNote] = useState('');
  const [hydratedDataId, setHydratedDataId] = useState<string | null>(null);

  if (data && data.id !== hydratedDataId) {
    setHydratedDataId(data.id);
    setWarrantyMonths(String(data.warrantyMonths || 12));
    setAnchorType(data.anchorType || 'delivery');
    setAcceptanceDate(data.acceptanceDate?.slice(0, 10) ?? '');
  }

  const onSaveMeta = async () => {
    if (!selectedId) return;
    const months = Number(warrantyMonths);
    if (!Number.isFinite(months) || months < 0 || months > 120) {
      showToast('error', 'Số tháng BH phải từ 0 đến 120.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        body: {
          warrantyMonths: months,
          anchorType,
          acceptanceDate: acceptanceDate || null,
        },
      });
      showToast('success', 'Đã cập nhật hồ sơ bảo hành.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được hồ sơ BH'));
    }
  };

  const onConfirmCloseClaim = async () => {
    if (!closeClaimId) return;
    const rating = Number(serviceRating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      showToast('error', 'Đánh giá dịch vụ BH phải từ 1 đến 5.');
      return;
    }
    try {
      await closeClaimMutation.mutateAsync({
        claimId: closeClaimId,
        body: { serviceRating: rating, serviceNote: serviceNote.trim() || null },
      });
      setCloseClaimId(null);
      setServiceRating('5');
      setServiceNote('');
      showToast('success', 'Đã đóng phiếu và lưu đánh giá dịch vụ.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đóng được phiếu'));
    }
  };

  return (
    <>
      <Modal
        isOpen={Boolean(selectedId)}
        onClose={onClose}
        title={data ? `Bảo hành ${data.code}` : 'Chi tiết bảo hành'}
        size="lg"
      >
        {detailQuery.isLoading || !data ? (
          <EmptyState message={detailQuery.isLoading ? 'Đang tải…' : 'Không tìm thấy hồ sơ.'} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--md-on-surface-variant)]">PO / VT</div>
                <div className="font-semibold">
                  {data.poCode} · {data.materialName}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">NCC / Dự án</div>
                <div className="font-semibold">
                  {data.supplierName || '-'} · {data.projectCode || '-'}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">Ngày giao / Hạn BH</div>
                <div className="font-semibold tabular-nums">
                  {formatDateCell(data.deliveryDate ?? undefined)} → {formatDateCell(data.warrantyEndDate ?? undefined)}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">Trạng thái</div>
                <div className="font-semibold">{statusLabel(data.status)}</div>
              </div>
            </div>

            {canUpdate ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-[var(--md-outline-variant)] pt-3">
                <FormField label="Số tháng BH">
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={120}
                    value={warrantyMonths}
                    onChange={e => setWarrantyMonths(e.target.value)}
                  />
                </FormField>
                <FormField label="Mốc tính hạn">
                  <select
                    className="form-input"
                    value={anchorType}
                    onChange={e => setAnchorType(e.target.value)}
                  >
                    <option value="delivery">Giao hàng</option>
                    <option value="acceptance">Nghiệm thu</option>
                  </select>
                </FormField>
                <FormField label="Ngày nghiệm thu">
                  <input
                    className="form-input"
                    type="date"
                    value={acceptanceDate}
                    onChange={e => setAcceptanceDate(e.target.value)}
                  />
                </FormField>
                <div className="md:col-span-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      void onSaveMeta();
                    }}
                  >
                    Lưu mốc / tháng BH
                  </button>
                </div>
              </div>
            ) : null}

            <div className="border-t border-[var(--md-outline-variant)] pt-3">
              <h3 className="purchasing-section-title">Lịch sử khiếu nại bảo hành</h3>
              {data.claims.length === 0 ? (
                <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có phiếu.</p>
              ) : (
                <ul className="space-y-2">
                  {data.claims.map(c => {
                    const claim = c as PurchaseWarrantyClaimApiDto;
                    return (
                    <li
                      key={claim.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[var(--md-outline-variant)] px-3 py-2"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold">{claim.ticketCode}</div>
                        <div className="text-sm">{claim.reason}</div>
                        <div className="text-xs text-[var(--md-on-surface-variant)]">
                          {claimKindLabel(claim.kind ?? 'warranty')} · {claimStatusLabel(claim.status)} · {claim.createdByName} · {formatDateTimeVi(claim.createdAt)}
                          {claim.defectType ? ` · ${defectTypeLabel(claim.defectType)}` : ''}
                          {claim.severity ? ` · ${severityLabel(claim.severity)}` : ''}
                          {claim.serviceRating != null ? ` · Đánh giá DV: ${claim.serviceRating}/5` : ''}
                        </div>
                      </div>
                      {canUpdate && claim.status === 'submitted' ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={closeClaimMutation.isPending}
                          onClick={() => {
                            setCloseClaimId(claim.id);
                            setServiceRating('5');
                            setServiceNote('');
                          }}
                        >
                          Đóng phiếu
                        </button>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(closeClaimId)}
        onClose={() => {
          if (!closeClaimMutation.isPending) setCloseClaimId(null);
        }}
        title="Đóng phiếu và đánh giá dịch vụ"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Đánh giá dịch vụ nhà cung cấp trước khi đóng phiếu.
          </p>
          <FormField label="Điểm dịch vụ (1-5)" required>
            <select
              className="form-input"
              value={serviceRating}
              onChange={e => setServiceRating(e.target.value)}
            >
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={String(n)}>{n}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ghi chú đánh giá">
            <textarea
              className="form-input min-h-[3.5rem]"
              value={serviceNote}
              onChange={e => setServiceNote(e.target.value)}
              placeholder="Thời gian phản hồi, chất lượng sửa chữa"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={closeClaimMutation.isPending}
              onClick={() => setCloseClaimId(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={closeClaimMutation.isPending}
              onClick={() => {
                void onConfirmCloseClaim();
              }}
            >
              {closeClaimMutation.isPending ? 'Đang lưu…' : 'Đóng phiếu'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
