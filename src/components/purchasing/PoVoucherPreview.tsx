import { formatDateCell } from '../../lib/hrm/formatters';

/** Bên mua — khớp mẫu PO Mayzer. */
const BUYER_NAME = 'CÔNG TY TNHH MAYZER';
const BUYER_TAX_CODE = '0315986604';

const COMPANY_LEGAL_NAME = 'MAYZER COMPANY LIMITED';
const COMPANY_ADDRESS =
  'Thửa đất số 139, tờ bản đồ số 4, Đường Nguyễn Văn Siêu, xã Bến Lức, tỉnh Tây Ninh.';
const COMPANY_WEBSITE = 'mayzer.com.vn';
const MAYZER_LOGO_URL = `${import.meta.env.BASE_URL}Mayzer.png`;

export interface PoVoucherLine {
  name: string;
  /** Quy cách / Model (cột Model trên mẫu Excel). */
  model?: string;
  code?: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  expectedDeliveryDate?: string | null;
}

export interface PoVoucherModel {
  code: string;
  supplierName: string;
  /** MST / SĐT / liên hệ NCC nếu có. */
  supplierTaxOrContact?: string;
  projectLabel?: string;
  planCode?: string;
  orderDateLabel: string;
  /** Nhân viên mua hàng (Procurement Staff). */
  procurementStaff?: string;
  salesPerson?: string;
  technician?: string;
  paymentTermsDays?: number;
  paymentDueDateLabel?: string;
  paymentTermsText?: string;
  deliveryText?: string;
  warrantyText?: string;
  note?: string;
  /** Tổng trước VAT (= Subtotal trên mẫu). */
  totalAmount: number;
  /** Tỷ lệ VAT, mặc định 10% như mẫu. */
  vatRate?: number;
  lines: PoVoucherLine[];
}

function val(v?: string | null, empty = '—') {
  const t = v?.trim();
  return t ? t : empty;
}

/** Số kiểu mẫu Excel (dấu phẩy hàng nghìn). */
function money(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function buildDeliveryText(lines: PoVoucherLine[]): string | undefined {
  const dates = lines
    .map(l => l.expectedDeliveryDate)
    .filter((d): d is string => Boolean(d?.trim()))
    .map(d => d.slice(0, 10))
    .sort();
  if (dates.length === 0) return undefined;
  const from = formatDateCell(dates[0]);
  const to = formatDateCell(dates[dates.length - 1]);
  if (!from) return undefined;
  if (from === to) return `Dự kiến ngày ${from}`;
  return `Dự kiến từ ngày ${from} đến ngày ${to}`;
}

/** Phiếu PO in ấn — layout theo mẫu Excel Mayzer (Purchase Order). */
export default function PoVoucherPreview({ model }: { model: PoVoucherModel }) {
  const vatRate = model.vatRate ?? 0.1;
  const subtotal = model.totalAmount;
  const vat = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + vat;
  const hasLines = model.lines.length > 0;

  const paymentTerms = model.paymentTermsText
    ?? (model.paymentTermsDays != null
      ? `${model.paymentTermsDays} ngày${model.paymentDueDateLabel ? ` · Hạn ${formatDateCell(model.paymentDueDateLabel) ?? model.paymentDueDateLabel}` : ''}`
      : undefined);

  const delivery = model.deliveryText ?? buildDeliveryText(model.lines);
  const warranty = model.warrantyText ?? 'Bảo hành 12 tháng sau ngày giao hàng';
  const note = model.note?.trim()
    || 'Tất cả hàng hoá phải đúng xuất xứ, đầy đủ chứng từ';

  return (
    <article className="po-sheet" aria-label="Purchase Order">
      <header className="po-sheet__brand">
        <img
          className="po-sheet__logo"
          src={MAYZER_LOGO_URL}
          alt="Mayzer"
        />
        <div className="po-sheet__brand-text">
          <p className="po-sheet__company">{COMPANY_LEGAL_NAME}</p>
          <p className="po-sheet__addr">
            <strong>Add:</strong> {COMPANY_ADDRESS}
          </p>
          <p className="po-sheet__web">
            <strong>Website:</strong> {COMPANY_WEBSITE}
          </p>
        </div>
      </header>

      <h1 className="po-sheet__title">PURCHASE ORDER</h1>

      <div className="po-sheet__parties">
        <div className="po-sheet__party">
          <div className="po-sheet__row">
            <span className="po-sheet__label">Buyer</span>
            <span className="po-sheet__colon">:</span>
            <strong className="po-sheet__value">{BUYER_NAME}</strong>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Tax Code</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{BUYER_TAX_CODE}</span>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">PO No.</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.code)}</span>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Date</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.orderDateLabel)}</span>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Procurement Staff</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.procurementStaff)}</span>
          </div>
        </div>

        <div className="po-sheet__party">
          <div className="po-sheet__row">
            <span className="po-sheet__label">Supplier</span>
            <span className="po-sheet__colon">:</span>
            <strong className="po-sheet__value">{val(model.supplierName)}</strong>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Tax Code</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.supplierTaxOrContact)}</span>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Sales Person</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.salesPerson)}</span>
          </div>
          <div className="po-sheet__row">
            <span className="po-sheet__label">Technician</span>
            <span className="po-sheet__colon">:</span>
            <span className="po-sheet__value">{val(model.technician)}</span>
          </div>
        </div>
      </div>

      <table className="po-sheet__table">
        <thead>
          <tr>
            <th className="po-sheet__col-no">No.</th>
            <th className="po-sheet__col-desc">Description</th>
            <th className="po-sheet__col-model">Model</th>
            <th className="po-sheet__col-unit">Unit</th>
            <th className="po-sheet__col-qty">Quantity</th>
            <th className="po-sheet__col-price">Unit Price (VND)</th>
            <th className="po-sheet__col-amt">Amount (VND)</th>
          </tr>
        </thead>
        <tbody>
          {hasLines ? (
            model.lines.map((line, i) => (
              <tr key={`${line.name}-${i}`}>
                <td className="po-sheet__center">{i + 1}</td>
                <td className="po-sheet__desc">{line.name}</td>
                <td className="po-sheet__center">{val(line.model, '')}</td>
                <td className="po-sheet__center">{val(line.unit)}</td>
                <td className="po-sheet__center">{money(line.qty)}</td>
                <td className="po-sheet__num">{money(line.unitPrice)}</td>
                <td className="po-sheet__num">{money(line.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="po-sheet__center">1</td>
              <td colSpan={5}>—</td>
              <td className="po-sheet__num">—</td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="po-sheet__sum">
        <tbody>
          <tr>
            <th scope="row">Subtotal:</th>
            <td>{money(subtotal)}</td>
          </tr>
          <tr>
            <th scope="row">VAT {(vatRate * 100).toFixed(0)}%:</th>
            <td>{money(vat)}</td>
          </tr>
          <tr className="po-sheet__sum-grand">
            <th scope="row">Grand Total:</th>
            <td>{money(grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div className="po-sheet__terms">
        <div className="po-sheet__row">
          <span className="po-sheet__label po-sheet__label--term">Thời gian giao hàng</span>
          <span className="po-sheet__colon">:</span>
          <span className="po-sheet__value">{val(delivery, '')}</span>
        </div>
        <div className="po-sheet__row">
          <span className="po-sheet__label po-sheet__label--term">Điều khoản thanh toán</span>
          <span className="po-sheet__colon">:</span>
          <span className="po-sheet__value">{val(paymentTerms, '')}</span>
        </div>
        <div className="po-sheet__row">
          <span className="po-sheet__label po-sheet__label--term">Bảo hành</span>
          <span className="po-sheet__colon">:</span>
          <span className="po-sheet__value">{warranty}</span>
        </div>
        <div className="po-sheet__row">
          <span className="po-sheet__label po-sheet__label--term">Lưu ý</span>
          <span className="po-sheet__colon">:</span>
          <span className="po-sheet__value">{note}</span>
        </div>
      </div>

      <div className="po-sheet__signs">
        <div className="po-sheet__sign">
          <strong>BÊN MUA</strong>
          <span className="po-sheet__sign-space" aria-hidden />
        </div>
        <div className="po-sheet__sign">
          <strong>BÊN BÁN</strong>
          <span className="po-sheet__sign-space" aria-hidden />
        </div>
      </div>
    </article>
  );
}
