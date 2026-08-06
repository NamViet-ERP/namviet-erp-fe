import { useMemo, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../../lib/apiClient';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { purchaseOrdersService } from '../../../services/purchaseOrdersService';
import type {
  PurchaseOrderInstallmentApiDto,
  PurchaseOrderInstallmentDocumentApiDto,
} from '../../../types/api/purchasingApi';

const DOCUMENT_TYPES = [
  { value: 'CO', label: 'C/O' },
  { value: 'CQ', label: 'C/Q' },
  { value: 'DNTT', label: 'Đề nghị thanh toán' },
  { value: 'CONTRACT', label: 'Hợp đồng' },
  { value: 'INVOICE', label: 'Hóa đơn' },
  { value: 'BBNT', label: 'Biên bản nghiệm thu' },
  { value: 'BBGH', label: 'Biên bản giao hàng' },
  { value: 'OTHER', label: 'Khác' },
] as const;

const ACCEPTED_DOCUMENTS = '.pdf,.doc,.docx,.xls,.xlsx,application/pdf';

function statusLabel(status: string): string {
  if (status === 'open') return 'Đang mở';
  if (status === 'completed') return 'Đã hoàn thành';
  if (status === 'locked') return 'Chưa mở';
  return status;
}

function documentTypeLabel(docType: string): string {
  return DOCUMENT_TYPES.find(option => option.value === docType.toUpperCase())?.label ?? docType;
}

type StageProps = {
  poCode: string;
  installment: PurchaseOrderInstallmentApiDto;
  canManage: boolean;
  onRefresh: () => Promise<unknown>;
};

function PoInstallmentStage({
  poCode,
  installment,
  canManage,
  onRefresh,
}: StageProps) {
  const [busy, setBusy] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderInstallmentDocumentApiDto | null>(null);
  const isOpen = installment.status === 'open';
  const canEdit = canManage && isOpen;
  const requiredTypes = useMemo(
    () => installment.requiredDocTypes.map(type => type.toUpperCase()),
    [installment.requiredDocTypes],
  );

  const upload = async (docType: string, file: File) => {
    setBusy(`upload-${docType}`);
    try {
      await purchaseOrdersService.uploadInstallmentDocument(
        poCode,
        installment.stageNumber,
        file,
        docType,
      );
      await onRefresh();
      showToast('success', `Đã tải chứng từ ${documentTypeLabel(docType)}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được chứng từ.'));
    } finally {
      setBusy('');
    }
  };

  const download = async (document: PurchaseOrderInstallmentDocumentApiDto) => {
    setBusy(`download-${document.id}`);
    try {
      const blob = await purchaseOrdersService.downloadInstallmentDocument(
        poCode,
        installment.stageNumber,
        document.id,
      );
      await saveBlob(blob, document.fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được chứng từ.'));
    } finally {
      setBusy('');
    }
  };

  const deleteDocument = async () => {
    if (!deleteTarget) return;
    setBusy(`delete-${deleteTarget.id}`);
    try {
      await purchaseOrdersService.deleteInstallmentDocument(
        poCode,
        installment.stageNumber,
        deleteTarget.id,
      );
      setDeleteTarget(null);
      await onRefresh();
      showToast('success', 'Đã xóa chứng từ.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được chứng từ.'));
    } finally {
      setBusy('');
    }
  };

  const complete = async () => {
    setBusy('complete');
    try {
      await purchaseOrdersService.completeInstallment(poCode, installment.stageNumber);
      await onRefresh();
      showToast('success', `Đã hoàn thành đợt ${installment.stageNumber}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể hoàn thành đợt thanh toán.'));
    } finally {
      setBusy('');
    }
  };

  return (
    <article className={`po-installment-stage po-installment-stage--${installment.status}`}>
      <header className="po-installment-stage__head">
        <div className="po-installment-stage__identity">
          <strong>Đợt {installment.stageNumber}</strong>
          <span className="po-installment-stage__percent">{installment.percent}%</span>
          <span className={`po-installment-stage__status is-${installment.status}`}>
            {statusLabel(installment.status)}
          </span>
        </div>
        {canEdit ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={Boolean(busy)}
            onClick={() => { void complete(); }}
          >
            {busy === 'complete' ? 'Đang hoàn thành…' : 'Hoàn thành đợt'}
          </button>
        ) : null}
      </header>

      {requiredTypes.length === 0 ? (
        <p className="pur-detail__muted">Đợt này không yêu cầu chứng từ.</p>
      ) : (
        <div className="po-installment-stage__rows">
          {requiredTypes.map(docType => {
            const documents = installment.documents.filter(
              document => document.docType.toUpperCase() === docType,
            );
            const rowBusy = busy === `upload-${docType}`;
            return (
              <div key={docType} className="po-installment-doc-row">
                <div className="po-installment-doc-row__head">
                  <span className="po-installment-doc-row__type">{documentTypeLabel(docType)}</span>
                  <span className="po-installment-doc-row__required">Bắt buộc</span>
                </div>

                {canEdit ? (
                  <label className={`pending-evidence__zone${rowBusy ? ' is-disabled' : ''}`}>
                    <Upload size={20} aria-hidden />
                    <span className="pending-evidence__zone-hint">
                      {rowBusy ? 'Đang tải…' : 'Chọn file PDF / Word / Excel'}
                    </span>
                    <input
                      type="file"
                      accept={ACCEPTED_DOCUMENTS}
                      className="pending-evidence__input"
                      disabled={Boolean(busy)}
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) void upload(docType, file);
                      }}
                    />
                  </label>
                ) : null}

                {documents.length === 0 ? (
                  <p className="pending-evidence__empty">Chưa có file.</p>
                ) : (
                  <ul className="pending-evidence__docs" aria-label={`Chứng từ ${documentTypeLabel(docType)}`}>
                    {documents.map(document => (
                      <li key={document.id} className="pending-evidence__doc">
                        <span className="pending-evidence__doc-icon" aria-hidden>
                          <FileText size={16} />
                        </span>
                        <div className="pending-evidence__doc-body">
                          <button
                            type="button"
                            className="pending-evidence__name pending-evidence__name--link"
                            disabled={Boolean(busy)}
                            onClick={() => { void download(document); }}
                          >
                            {document.fileName}
                          </button>
                          <span className="pending-evidence__size">
                            {formatDateTimeVi(document.uploadedAt) ?? ''}
                            {document.uploadedByName ? ` · ${document.uploadedByName}` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={Boolean(busy)}
                          title={`Tải ${document.fileName}`}
                          aria-label={`Tải ${document.fileName}`}
                          onClick={() => { void download(document); }}
                        >
                          <Download size={14} aria-hidden />
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            className="pending-evidence__remove"
                            disabled={Boolean(busy)}
                            title={`Xóa ${document.fileName}`}
                            aria-label={`Xóa ${document.fileName}`}
                            onClick={() => setDeleteTarget(document)}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isOpen ? (
        <p className="po-installment-stage__notice">
          {installment.status === 'completed'
            ? 'Đợt đã hoàn thành. Chứng từ chỉ được xem và tải xuống.'
            : 'Đợt sẽ được mở sau khi hoàn thành đợt trước.'}
        </p>
      ) : (
        <p className="po-installment-stage__notice">
          Loại chứng từ đã cố định lúc tạo PO — chỉ được tải/xóa file theo loại đã chọn.
        </p>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { void deleteDocument(); }}
        title="Xóa chứng từ"
        message={deleteTarget ? `Bạn có chắc muốn xóa “${deleteTarget.fileName}”?` : ''}
        confirmLabel="Xóa"
        variant="danger"
      />
    </article>
  );
}

type Props = {
  poCode: string;
  installments: PurchaseOrderInstallmentApiDto[];
  canManage: boolean;
  onRefresh: () => Promise<unknown>;
};

export function PoInstallmentsSection({
  poCode,
  installments,
  canManage,
  onRefresh,
}: Props) {
  return (
    <section className="pur-detail__card" aria-label="Các đợt thanh toán">
      <div className="po-installment-section__head">
        <div>
          <h2 className="purchasing-section-title mb-0">Các đợt thanh toán</h2>
          <p className="pur-detail__muted mt-1">
            Chứng từ bổ sung theo từng đợt. DNTT chỉ tạo được khi đủ file bắt buộc của đợt.
          </p>
        </div>
      </div>

      {installments.length === 0 ? (
        <p className="pur-detail__muted">Đơn hàng chưa có tiến độ thanh toán.</p>
      ) : (
        <div className="po-installment-section__grid">
          {installments.map(installment => (
            <PoInstallmentStage
              key={`${installment.id}-${installment.status}-${installment.documents.length}`}
              poCode={poCode}
              installment={installment}
              canManage={canManage}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}
