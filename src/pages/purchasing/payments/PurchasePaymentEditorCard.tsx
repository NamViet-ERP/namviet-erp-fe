import {
  Banknote,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  ShoppingCart,
} from 'lucide-react';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import PoAutocomplete from '../../../components/purchasing/PoAutocomplete';
import FormField from '../../../components/ui/FormField';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type {
  PurchaseOrderApiDto,
  PurchaseOrderDetailApiDto,
  PurchasePaymentApiDto,
  PurchasePaymentNextStageApiDto,
} from '../../../types/api/purchasingApi';
import { amountToVietnameseWords } from '../../../utils/amountToVietnameseWords';
import { formatCurrency, formatCurrencyFull } from '../../../utils/formatCurrency';
import PurchasePaymentStageBanners from './PurchasePaymentStageBanners';
import type { CannotCreateReason } from './usePurchasePaymentDetail';

interface PurchasePaymentEditorCardProps {
  isCreate: boolean;
  poCode: string;
  onPoChange: (next: string) => void;
  orders: PurchaseOrderApiDto[];
  hasPoContext: boolean;
  order?: PurchaseOrderDetailApiDto;
  payment?: PurchasePaymentApiDto;
  nextStage?: PurchasePaymentNextStageApiDto | null;
  nextStageLoading: boolean;
  docsGateBlocked: boolean;
  missingDocTypes: string[];
  poHasNoApprovedImport: boolean;
  cannotCreateReason: CannotCreateReason | null;
  onViewPayment: (code: string) => void;
  invoiceNo: string;
  onInvoiceNoChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  amount: string;
  amountNum: number;
  note: string;
  onNoteChange: (v: string) => void;
  orderError: unknown;
  isOrderError: boolean;
  isOrderFetching: boolean;
}

export default function PurchasePaymentEditorCard({
  isCreate,
  poCode,
  onPoChange,
  orders,
  hasPoContext,
  order,
  payment,
  nextStage,
  nextStageLoading,
  docsGateBlocked,
  missingDocTypes,
  poHasNoApprovedImport,
  cannotCreateReason,
  onViewPayment,
  invoiceNo,
  onInvoiceNoChange,
  dueDate,
  onDueDateChange,
  amount,
  amountNum,
  note,
  onNoteChange,
  orderError,
  isOrderError,
  isOrderFetching,
}: PurchasePaymentEditorCardProps) {
  return (
    <aside className="pur-dntt__editor no-print">
      <section className="pur-dntt__card" aria-label="Thông tin đề nghị">
        <header className="pur-dntt__card-head">
          <div className="pur-dntt__card-head-main">
            <span className="pur-dntt__card-icon" aria-hidden>
              <ClipboardList size={16} strokeWidth={1.75} />
            </span>
            <div>
              <h2>Thông tin đề nghị</h2>
              <p>Chi nhà cung cấp theo đơn hàng PO</p>
            </div>
          </div>
          <span className="pur-dntt__chip">Mẫu 05-TT</span>
        </header>

        <div className="pur-dntt__card-body">
          <FormField label="Đơn hàng PO" required className="pur-dntt__ff">
            <PoAutocomplete
              value={poCode}
              onChange={onPoChange}
              orders={orders}
              disabled={!isCreate}
              placeholder="Tìm mã PO, NCC hoặc KHMH…"
            />
          </FormField>

          {hasPoContext ? (
            <div className="pur-dntt__po-card" aria-label="Tóm tắt PO">
              <div className="pur-dntt__po-tile">
                <Building2 size={14} strokeWidth={1.75} aria-hidden />
                <div>
                  <span>Nhà cung cấp</span>
                  <strong>{order?.supplierName || payment?.supplierName || '—'}</strong>
                </div>
              </div>
              <div className="pur-dntt__po-tile">
                <FolderKanban size={14} strokeWidth={1.75} aria-hidden />
                <div>
                  <span>KHMH</span>
                  <strong>{order?.planCode || '—'}</strong>
                </div>
              </div>
              <div className="pur-dntt__po-tile">
                <ShoppingCart size={14} strokeWidth={1.75} aria-hidden />
                <div>
                  <span>Dự án</span>
                  <strong>
                    {[order?.projectCode, order?.projectName].filter(Boolean).join(' — ') || '—'}
                  </strong>
                </div>
              </div>
              <div className="pur-dntt__po-tile pur-dntt__po-tile--money">
                <Banknote size={14} strokeWidth={1.75} aria-hidden />
                <div>
                  <span>Tổng PO</span>
                  <strong>{formatCurrencyFull(order?.totalAmount ?? payment?.amount)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="pur-dntt__empty-po" role="status">
              <FileText size={18} strokeWidth={1.75} aria-hidden />
              <div>
                <strong>Chưa chọn đơn hàng</strong>
                <p>Chọn PO để tự điền NCC, số tiền và nội dung trên giấy.</p>
              </div>
            </div>
          )}

          <PurchasePaymentStageBanners
            isCreate={isCreate}
            poCode={poCode}
            order={order}
            payment={payment}
            nextStage={nextStage}
            nextStageLoading={nextStageLoading}
            docsGateBlocked={docsGateBlocked}
            missingDocTypes={missingDocTypes}
            poHasNoApprovedImport={poHasNoApprovedImport}
            cannotCreateReason={cannotCreateReason}
            onViewPayment={onViewPayment}
          />

          <div className="pur-dntt__grid2">
            <FormField label="Số hóa đơn NCC" className="pur-dntt__ff">
              <input
                className="form-input form-input-md"
                value={invoiceNo}
                readOnly={!isCreate}
                onChange={e => onInvoiceNoChange(e.target.value)}
                placeholder="VD: HD-2607-012"
                aria-label="Số hóa đơn NCC"
              />
            </FormField>
            <FormField label="Hạn thanh toán" required className="pur-dntt__ff">
              {isCreate ? (
                <HrmDatePicker value={dueDate} onChange={onDueDateChange} placeholder="dd/mm/yyyy" />
              ) : (
                <div className="pur-dntt__readonly">
                  <CalendarDays size={14} strokeWidth={1.75} aria-hidden />
                  <input className="form-input form-input-md" readOnly value={formatDateCell(dueDate)} />
                </div>
              )}
            </FormField>
          </div>

          <FormField label="Số tiền đề nghị" className="pur-dntt__ff">
            <div className="pur-dntt__amount-wrap">
              <Banknote size={15} strokeWidth={1.75} className="pur-dntt__amount-icon" aria-hidden />
              <input
                className="form-input form-input-md pur-dntt__amount"
                value={amount}
                readOnly
                placeholder={nextStage ? formatCurrency(nextStage.amount) : '0'}
                inputMode="numeric"
                aria-label="Số tiền đề nghị"
              />
              <span className="pur-dntt__amount-suffix">VNĐ</span>
            </div>
            {amountNum > 0 ? (
              <p className="pur-dntt__words-live">{amountToVietnameseWords(amountNum)}</p>
            ) : isCreate && poCode && !nextStage ? (
              <p className="pur-dntt__words-live text-[var(--md-on-surface-variant)]">
                Chưa có đợt thanh toán khả dụng cho đơn hàng này
              </p>
            ) : null}
          </FormField>

          <FormField label="Nội dung / ghi chú trên giấy" className="pur-dntt__ff pur-dntt__ff--last">
            <textarea
              className="form-input form-input-md pur-dntt__note"
              rows={4}
              value={note}
              readOnly={!isCreate}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="VD: Thanh toán đợt 1 theo hợp đồng…"
              aria-label="Nội dung ghi chú trên giấy"
            />
          </FormField>

          {poCode && isOrderError ? (
            <p className="pur-dntt__error">{getApiErrorMessage(orderError)}</p>
          ) : null}
          {poCode && isOrderFetching ? (
            <p className="pur-dntt__hint">Đang tải chi tiết PO…</p>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
