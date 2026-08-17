import {
  Building2,
  CalendarDays,
  FileText,
  FolderKanban,
  PenLine,
  Receipt,
  Stamp,
  UserRound,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { amountToVietnameseWords } from '../../utils/amountToVietnameseWords';
import { formatDateCell } from '../../lib/hrm/formatters';

const COMPANY_NAME = 'CÔNG TY TNHH MAYZER';
const DEPT_NAME = 'Phòng Cung ứng';

export interface DnttPreviewLine {
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  code?: string;
}

export interface DnttPreviewModel {
  code?: string;
  dateLabel: string;
  poCode: string;
  planCode?: string;
  supplierName: string;
  invoiceNo?: string;
  dueDate?: string;
  amount: number;
  note?: string;
  projectLabel?: string;
  requesterName?: string;
  attachmentCount?: number;
  lines: DnttPreviewLine[];
}

function val(v?: string, empty = '—') {
  const t = v?.trim();
  return t ? t : empty;
}

/**
 * Giấy đề nghị thanh toán — Mẫu 05-TT (in) + footer web rõ ràng hơn khi xem trước.
 */
export default function DnttVoucherPreview({ model }: { model: DnttPreviewModel }) {
  const hasLines = model.lines.length > 0;
  const contentText = [
    model.supplierName ? `Thanh toán NCC ${model.supplierName}` : 'Thanh toán nhà cung cấp',
    model.poCode ? `theo PO ${model.poCode}` : null,
    model.invoiceNo ? `HĐ ${model.invoiceNo}` : null,
    model.projectLabel ? `DA ${model.projectLabel}` : null,
  ].filter(Boolean).join(' — ');

  const attachments = model.attachmentCount
    ?? [model.poCode && 'PO', model.invoiceNo && 'Hóa đơn'].filter(Boolean).length;

  const planProject = [model.planCode, model.projectLabel].filter(Boolean).join(' · ');
  const amountLabel = model.amount > 0 ? `${formatCurrency(model.amount)} đ` : '—';
  const wordsLabel = model.amount > 0
    ? `${amountToVietnameseWords(model.amount)}./.`
    : '—';

  const signs = [
    {
      role: 'Người đề nghị',
      hint: 'Ký, họ tên',
      name: model.requesterName || '',
      Icon: UserRound,
      tone: 'done' as const,
    },
    {
      role: 'Phụ trách bộ phận',
      hint: 'Ký, họ tên',
      name: '',
      Icon: PenLine,
      tone: 'wait' as const,
    },
    {
      role: 'Kế toán trưởng',
      hint: 'Ký, họ tên',
      name: '',
      Icon: Receipt,
      tone: 'wait' as const,
    },
    {
      role: 'Giám đốc',
      hint: 'Duyệt chi',
      name: '',
      Icon: Stamp,
      tone: 'wait' as const,
    },
  ];

  return (
    <article className="dntt05" aria-label="Giấy đề nghị thanh toán Mẫu 05-TT">
      <div className="dntt05__top">
        <div className="dntt05__unit">
          <p className="dntt05__unit-name">{COMPANY_NAME}</p>
          <p className="dntt05__unit-dept">Bộ phận: {DEPT_NAME}</p>
        </div>
        <div className="dntt05__form-meta">
          <p className="dntt05__form-no">Mẫu số 05-TT</p>
          <p>(Ban hành theo Thông tư số 99/2025/TT-BTC)</p>
          <p className="dntt05__date">Ngày {val(model.dateLabel)}</p>
        </div>
      </div>

      <h1 className="dntt05__title">GIẤY ĐỀ NGHỊ THANH TOÁN</h1>
      <p className="dntt05__doc-no">
        Số: <strong>{model.code || '—'}</strong>
        {model.poCode ? <> · Tham chiếu PO: <strong>{model.poCode}</strong></> : null}
      </p>

      <p className="dntt05__to">
        <strong>Kính gửi:</strong> Giám đốc {COMPANY_NAME}
      </p>

      <div className="dntt05__who">
        <div>
          <span>Họ và tên người đề nghị</span>
          <strong>{val(model.requesterName)}</strong>
        </div>
        <div>
          <span>Bộ phận</span>
          <strong>{DEPT_NAME}</strong>
        </div>
      </div>

      <p className="dntt05__lead">
        Đề nghị thanh toán số tiền dưới đây (đã phát sinh / đến hạn theo đơn mua hàng):
      </p>

      <table className="dntt05__table">
        <thead>
          <tr>
            <th className="dntt05__col-stt">STT</th>
            <th>Nội dung thanh toán</th>
            <th className="dntt05__col-amt">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {hasLines ? (
            model.lines.map((line, i) => (
              <tr key={`${line.name}-${i}`}>
                <td className="dntt05__center">{i + 1}</td>
                <td>
                  <div className="dntt05__line-name">{line.name}</div>
                  <div className="dntt05__line-meta">
                    {[line.code, line.unit && `ĐVT: ${line.unit}`, `SL: ${formatCurrency(line.qty)}`, `ĐG: ${formatCurrency(line.unitPrice)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </td>
                <td className="dntt05__num">{formatCurrency(line.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="dntt05__center">1</td>
              <td>{contentText || '—'}</td>
              <td className="dntt05__num">{model.amount > 0 ? formatCurrency(model.amount) : '—'}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="dntt05__total-label">Tổng số tiền đề nghị thanh toán</td>
            <td className="dntt05__num dntt05__total-amt">{amountLabel}</td>
          </tr>
        </tfoot>
      </table>

      <div className="dntt05__words">
        <span>Viết bằng chữ</span>
        <strong className={model.amount > 0 ? '' : 'is-empty'}>{wordsLabel}</strong>
      </div>

      <div className="dntt05__refs" aria-label="Thông tin tham chiếu">
        <div className="dntt05__ref">
          <Building2 size={14} strokeWidth={1.75} className="dntt05__ref-icon no-print" aria-hidden />
          <div>
            <span>Nhà cung cấp</span>
            <strong className={!model.supplierName ? 'is-empty' : undefined}>{val(model.supplierName)}</strong>
          </div>
        </div>
        <div className="dntt05__ref">
          <FileText size={14} strokeWidth={1.75} className="dntt05__ref-icon no-print" aria-hidden />
          <div>
            <span>Hóa đơn</span>
            <strong className={!model.invoiceNo ? 'is-empty' : undefined}>{val(model.invoiceNo)}</strong>
          </div>
        </div>
        <div className="dntt05__ref">
          <CalendarDays size={14} strokeWidth={1.75} className="dntt05__ref-icon no-print" aria-hidden />
          <div>
            <span>Hạn thanh toán</span>
            <strong className={!model.dueDate ? 'is-empty' : undefined}>
              {model.dueDate ? formatDateCell(model.dueDate) : '—'}
            </strong>
          </div>
        </div>
        <div className="dntt05__ref">
          <FolderKanban size={14} strokeWidth={1.75} className="dntt05__ref-icon no-print" aria-hidden />
          <div>
            <span>KHMH / Dự án</span>
            <strong className={!planProject ? 'is-empty' : undefined}>{val(planProject)}</strong>
          </div>
        </div>
      </div>

      {model.note ? (
        <p className="dntt05__note"><span>Ghi chú:</span> {model.note}</p>
      ) : null}

      <div className="dntt05__attach">
        <span>Kèm theo</span>
        <strong>
          {attachments > 0 ? `${attachments} chứng từ gốc` : 'Chứng từ gốc'}
          {' '}
          (PO, hóa đơn, biên bản giao hàng…)
        </strong>
      </div>

      <p className="dntt05__closing">
        Kính đề nghị Giám đốc xem xét, duyệt chi và chuyển Kế toán thực hiện thanh toán.
      </p>

      <div className="dntt05__signs" aria-label="Chữ ký trình duyệt">
        {signs.map(s => (
          <div key={s.role} className={`dntt05__sign dntt05__sign--${s.tone}`}>
            <div className="dntt05__sign-head">
              <s.Icon size={14} strokeWidth={1.75} className="dntt05__sign-icon no-print" aria-hidden />
              <p className="dntt05__sign-role">{s.role}</p>
            </div>
            <p className="dntt05__sign-hint">({s.hint})</p>
            <div className="dntt05__sign-space" aria-hidden />
            <p className={`dntt05__sign-name${s.name ? '' : ' is-empty'}`}>
              {s.name || 'Chờ ký'}
            </p>
            <span className={`dntt05__sign-badge no-print ${s.tone === 'done' ? 'is-done' : 'is-wait'}`}>
              {s.tone === 'done' ? 'Đã ghi' : 'Chờ duyệt'}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
