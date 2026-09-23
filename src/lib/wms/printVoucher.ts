import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/ui/Toast';

export interface VoucherPrintField {
  label: string;
  value: string;
}

export interface VoucherPrintLine {
  name: string;
  code?: string;
  qty: number | string;
  unit?: string;
  unitPrice?: number;
  lineTotal?: number;
  extra?: string;
  reason?: string;
}

export interface VoucherPrintPayload {
  title: string;
  voucherCode: string;
  statusLabel?: string;
  fields: VoucherPrintField[];
  columns: string[];
  lines: VoucherPrintLine[];
  footerNote?: string;
  grandTotalLabel?: string;
  grandTotal?: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildLineCells(line: VoucherPrintLine, columns: string[]): string {
  const cells: string[] = [];
  for (const col of columns) {
    if (col === 'Vật tư') {
      cells.push(
        `<td><div class="name">${escapeHtml(line.name)}</div>${
          line.code ? `<div class="code">${escapeHtml(line.code)}</div>` : ''
        }</td>`,
      );
    } else if (col === 'SL') {
      cells.push(`<td class="num">${escapeHtml(String(line.qty))}</td>`);
    } else if (col === 'ĐVT') {
      cells.push(`<td class="center">${escapeHtml(line.unit || '—')}</td>`);
    } else if (col === 'Đơn giá') {
      cells.push(
        `<td class="num">${line.unitPrice != null ? escapeHtml(formatCurrency(line.unitPrice)) : '—'}</td>`,
      );
    } else if (col === 'Thành tiền') {
      cells.push(
        `<td class="num strong">${line.lineTotal != null ? escapeHtml(formatCurrency(line.lineTotal)) : '—'}</td>`,
      );
    } else if (col === 'Hệ thống') {
      cells.push(`<td class="num">${escapeHtml(String(line.qty))}</td>`);
    } else if (col === 'Thực tế') {
      cells.push(`<td class="num">${escapeHtml(String(line.extra ?? '—'))}</td>`);
    } else if (col === 'Chênh lệch') {
      cells.push(`<td class="num">${escapeHtml(String(line.lineTotal ?? '—'))}</td>`);
    } else if (col === 'Lý do') {
      cells.push(`<td>${escapeHtml(line.reason || '—')}</td>`);
    } else {
      cells.push(`<td>${escapeHtml(line.extra ?? '')}</td>`);
    }
  }
  return cells.join('');
}

export function buildVoucherPrintHtml(payload: VoucherPrintPayload): string {
  const headerCells = payload.columns.map(col => `<th>${escapeHtml(col)}</th>`).join('');
  const bodyRows = payload.lines
    .map(line => `<tr>${buildLineCells(line, payload.columns)}</tr>`)
    .join('');
  const infoRows = payload.fields
    .map(f => `<div class="info-row"><span>${escapeHtml(f.label)}</span><strong>${escapeHtml(f.value)}</strong></div>`)
    .join('');
  const totalRow =
    payload.grandTotal != null
      ? `<div class="grand-total"><span>${escapeHtml(payload.grandTotalLabel || 'Tổng cộng')}</span><strong>${escapeHtml(formatCurrency(payload.grandTotal))} đ</strong></div>`
      : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(payload.voucherCode)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; font-size: 12px; }
    h1 { font-size: 18px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .code { font-family: Consolas, monospace; font-size: 14px; margin-bottom: 12px; }
    .status { display: inline-block; border: 1px solid #999; padding: 2px 8px; border-radius: 999px; font-size: 11px; margin-bottom: 16px; }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 18px; }
    .info-row { display: flex; flex-direction: column; gap: 2px; }
    .info-row span { color: #666; font-size: 10px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; vertical-align: top; }
    th { background: #f3f3f3; text-align: left; font-size: 11px; }
    td.num, th.num { text-align: right; }
    td.center { text-align: center; }
    .name { font-weight: 600; }
    .code { font-family: Consolas, monospace; font-size: 10px; color: #666; margin-top: 2px; }
    .grand-total { margin-top: 12px; display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; }
    .footer { margin-top: 24px; color: #666; font-size: 11px; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(payload.title)}</h1>
  <div class="code">${escapeHtml(payload.voucherCode)}</div>
  ${payload.statusLabel ? `<div class="status">${escapeHtml(payload.statusLabel)}</div>` : ''}
  <div class="info">${infoRows}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${totalRow}
  ${payload.footerNote ? `<div class="footer">${escapeHtml(payload.footerNote)}</div>` : ''}
</body>
</html>`;
}

export function printVoucher(payload: VoucherPrintPayload): boolean {
  const html = buildVoucherPrintHtml(payload);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', `In ${payload.voucherCode}`);
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    iframe.remove();
    return false;
  }

  const cleanup = () => {
    iframe.remove();
  };
  frameWindow.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  const doc = frameWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    frameWindow.focus();
    frameWindow.print();
  };

  if (doc.readyState === 'complete') {
    triggerPrint();
  } else {
    frameWindow.addEventListener('load', () => triggerPrint(), { once: true });
  }

  return true;
}

export function printVoucherWithFeedback(payload: VoucherPrintPayload): void {
  if (!printVoucher(payload)) {
    showToast('error', 'Không mở được hộp thoại in. Vui lòng thử lại.');
  }
}
