import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../../../components/ui/Button';
import TableShell from '../../../components/ui/TableShell';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type {
  PurchasePlanLineApiDto,
  PurchasePlanLinePoApiDto,
} from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';

function money(v: number | null | undefined): string {
  if (v == null) return '—';
  return formatCurrency(v);
}

function qty(v: number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
}

function LineQuotes({ line }: { line: PurchasePlanLineApiDto }) {
  const [open, setOpen] = useState(false);
  const quotes = line.quotes ?? [];
  if (quotes.length === 0) return <span className="text-sm">—</span>;
  return (
    <div>
      <Button
        type="button"
        variant="text"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        {quotes.length} báo giá
      </Button>
      {open ? (
        <ul className="pur-detail__quote-list">
          {quotes.map(q => (
            <li key={q.id}>
              {q.supplierName || '—'}: {formatCurrency(q.unitPrice ?? 0)}
              {q.note ? ` - ${q.note}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LinePoCell({ pos }: { pos?: PurchasePlanLinePoApiDto[] | null }) {
  const [open, setOpen] = useState(false);
  if (!pos || pos.length === 0) return <span className="hrm-empty-cell">—</span>;

  if (pos.length === 1) {
    const p = pos[0];
    return (
      <Link
        to={`/purchasing/orders/${encodeURIComponent(p.poCode)}`}
        className="pur-pay-plan__po-link font-semibold"
        title={`Đơn ${p.poCode}: Đã đặt ${p.orderedQty}, Đã nhận ${p.receivedQty}`}
      >
        {p.poCode}
      </Link>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="text"
        size="sm"
        className="text-xs py-0 px-1 font-semibold"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
        {pos.length} PO
      </Button>
      {open ? (
        <ul className="pur-detail__quote-list">
          {pos.map(p => (
            <li key={p.poCode}>
              <Link
                to={`/purchasing/orders/${encodeURIComponent(p.poCode)}`}
                className="pur-pay-plan__po-link font-semibold"
              >
                {p.poCode}
              </Link>
              : {p.orderedQty} đặt {p.receivedQty > 0 ? `(${p.receivedQty} nhận)` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface PurchasePlanDetailLinesTableProps {
  lines: PurchasePlanLineApiDto[];
}

export default function PurchasePlanDetailLinesTable({ lines }: PurchasePlanDetailLinesTableProps) {
  return (
    <section className="pur-detail__card" aria-label="Danh sách mặt hàng">
      <h2 className="pur-detail__section-title">Danh sách mặt hàng</h2>
      <TableShell
        className="pur-detail__table-wrap"
        tableClassName="pur-erp__table pur-erp__table--plan pur-detail__lines-table"
        colSpan={31}
        isEmpty={lines.length === 0}
        emptyMessage="KHMH chưa có dòng hàng."
        header={(
          <tr>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">STT</th>
            <th className="pur-detail__th pur-detail__th--base">Hệ</th>
            <th className="pur-detail__th pur-detail__th--base">Danh mục</th>
            <th className="pur-detail__th pur-detail__th--base">Mã VT</th>
            <th className="pur-detail__th pur-detail__th--base">Tên sản phẩm</th>
            <th className="pur-detail__th pur-detail__th--base">Quy cách</th>
            <th className="pur-detail__th pur-detail__th--base">Diễn giải</th>
            <th className="pur-detail__th pur-detail__th--base">ĐVT</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">SL</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">KG/ĐVT</th>
            <th className="pur-detail__th pur-detail__th--base">Ghi chú</th>
            <th className="pur-detail__th pur-detail__th--base">Tình trạng</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--budget">ĐG dự toán</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--budget">TT dự toán</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--proposal">ĐG đề xuất</th>
            <th className="pur-detail__th pur-detail__th--proposal">NCC đề xuất</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--proposal">TT đề xuất</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--purchase">ĐG mua</th>
            <th className="pur-detail__th pur-detail__th--purchase">NCC mua</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--purchase">TT mua</th>
            <th className="pur-detail__th pur-detail__th--select">NCC chọn</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--select">Giá chọn</th>
            <th className="pur-detail__th pur-detail__th--select">Lý do chọn</th>
            <th className="pur-detail__th pur-detail__th--track">Báo giá</th>
            <th className="pur-detail__th pur-detail__th--track">PO</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã đặt</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã giao</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Lỗi</th>
            <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Còn lại</th>
            <th className="pur-detail__th pur-detail__th--track">Ngày DK</th>
            <th className="pur-detail__th pur-detail__th--track">Ngày TT</th>
          </tr>
        )}
      >
        {lines.map((line, idx) => (
          <tr key={line.id}>
            <td className="pur-erp__td-num">{line.lineNo || idx + 1}</td>
            <td>{line.systemName || '—'}</td>
            <td>{line.category || '—'}</td>
            <td>{line.materialCode || '—'}</td>
            <td>{line.productName}</td>
            <td>{line.spec || '—'}</td>
            <td className="max-w-[200px] truncate" title={line.description || undefined}>
              {line.description || '—'}
            </td>
            <td>{line.unit || '—'}</td>
            <td className="pur-erp__td-num">{qty(line.quantity)}</td>
            <td className="pur-erp__td-num">{qty(line.kgPerUnit)}</td>
            <td>{line.lineNote || '—'}</td>
            <td>{line.purchaseStatus || '—'}</td>
            <td className="pur-erp__td-num">{money(line.budgetUnitPrice)}</td>
            <td className="pur-erp__td-num">{money(line.budgetAmount)}</td>
            <td className="pur-erp__td-num">{money(line.proposalUnitPrice)}</td>
            <td>{line.proposalSupplierName || '—'}</td>
            <td className="pur-erp__td-num">{money(line.proposalAmount)}</td>
            <td className="pur-erp__td-num">{money(line.purchaseUnitPrice)}</td>
            <td>{line.purchaseSupplierName || '—'}</td>
            <td className="pur-erp__td-num">{money(line.purchaseAmount)}</td>
            <td>{line.selectedSupplierName || '—'}</td>
            <td className="pur-erp__td-num">{money(line.selectedUnitPrice)}</td>
            <td>{line.selectionReason || '—'}</td>
            <td><LineQuotes line={line} /></td>
            <td className="text-center"><LinePoCell pos={line.pos} /></td>
            <td className="pur-erp__td-num">{qty(line.orderedQty)}</td>
            <td className="pur-erp__td-num">{qty(line.receivedQty)}</td>
            <td className="pur-erp__td-num">{qty(line.defectQty)}</td>
            <td className="pur-erp__td-num">{qty(line.remainingOrderableQty)}</td>
            <td>{formatDateCell(line.expectedDeliveryDate ?? undefined)}</td>
            <td>{formatDateCell(line.actualReceiptDate ?? undefined)}</td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}
