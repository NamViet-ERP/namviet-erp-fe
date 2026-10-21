import type { CskhProjectRecord } from './commandCenter';
import type { CskhGanttItem, CskhProjectOps } from './opsWorkspace';
import { CONTRACT_MILESTONES } from '../../lib/cskh/ganttUtils';
import { isoToDisplay } from '../dates';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function printCskhGanttReport(
  project: CskhProjectRecord,
  ops: CskhProjectOps,
  items: CskhGanttItem[],
  todayStr = '2026-09-22',
): boolean {
  const printDate = isoToDisplay(todayStr) || '22/09/2026';
  const planPct = 100;
  const actualPct = 58;
  const deltaPct = actualPct - planPct;

  const itemsRows = items.map((row, idx) => {
    const rowPlan = row.startDate > todayStr ? 0 : row.endDate < todayStr ? 100 : 70;
    const rowDelta = row.actualPct - rowPlan;
    const isBottleneck = !row.isGroup && row.actualPct < 100 && (row.statusLabel?.includes('Nghẽn') || rowDelta <= -20);
    const isGroup = Boolean(row.isGroup);
    const depthIndent = (row.level ?? 0) * 14;
    const statusBg = row.actualPct >= 100 ? '#dcfce7' : isBottleneck ? '#fee2e2' : '#fef3c7';
    const statusColor = row.actualPct >= 100 ? '#15803d' : isBottleneck ? '#b91c1c' : '#b45309';
    const rowBg = isGroup
      ? '#f8fafc'
      : isBottleneck
        ? '#fff5f5'
        : idx % 2 === 1
          ? '#fafafa'
          : '#ffffff';

    return `
      <tr style="background-color: ${rowBg}; ${isGroup ? 'border-top: 1.5px solid #cbd5e1; font-weight: 700;' : ''}">
        <td style="text-align: center; font-weight: 700; font-family: monospace; font-size: 10px; color: ${isGroup ? '#0369a1' : '#64748b'};">
          ${escapeHtml(row.wbs || String(idx + 1))}
        </td>
        <td style="color: ${isGroup ? '#0f172a' : '#334155'}; font-weight: ${isGroup ? '700' : '500'}; padding-left: ${depthIndent + 8}px;">
          ${isGroup ? '📁 ' : '• '}${escapeHtml(row.name)}
        </td>
        <td style="color: #475569; font-size: 10.5px;">${escapeHtml(row.department || 'Đội thi công')}</td>
        <td style="text-align: center; font-weight: ${isGroup ? '700' : '400'};">${row.days} ngày</td>
        <td style="text-align: center; font-size: 10.5px; color: #64748b; font-family: monospace;">${isoToDisplay(row.startDate)} ➔ ${isoToDisplay(row.endDate)}</td>
        <td style="text-align: center; font-weight: 600;">${rowPlan}%</td>
        <td style="text-align: center; font-weight: 700; color: ${row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : '#0284c7'};">${row.actualPct}%</td>
        <td style="text-align: center; font-weight: 700; color: ${rowDelta < 0 ? '#dc2626' : '#16a34a'};">${rowDelta > 0 ? `+${rowDelta}` : rowDelta}%</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
            ${escapeHtml(row.statusLabel || (row.actualPct >= 100 ? 'Hoàn thành' : 'Đang thực hiện'))}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const milestoneRows = CONTRACT_MILESTONES.slice(0, 5).map(cm => {
    const isDone = cm.status === 'done' || cm.status === 'on_track';
    const isDelay = cm.status === 'delayed';
    const statusBg = isDone ? '#dcfce7' : isDelay ? '#fee2e2' : '#e0f2fe';
    const statusColor = isDone ? '#15803d' : isDelay ? '#b91c1c' : '#0369a1';

    return `
      <tr>
        <td style="font-weight: 600; color: #0f172a;">${escapeHtml(cm.name)}</td>
        <td style="text-align: center; font-family: monospace;">${isoToDisplay(cm.date)}</td>
        <td style="text-align: center; font-weight: 700; color: #0284c7;">${cm.paymentPct}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
            ${escapeHtml(cm.statusLabel)}
          </span>
        </td>
        <td style="font-size: 11px; color: #64748b;">${escapeHtml(cm.notes)}</td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Báo Cáo Tiến Độ Dự Án - ${escapeHtml(project.code)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-table { width: 100%; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; }
    .company-title { font-size: 14px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; }
    .company-sub { font-size: 10.5px; color: #64748b; }
    .report-title { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; text-align: center; margin: 8px 0 4px; letter-spacing: 0.2px; }
    .report-sub { font-size: 11px; color: #475569; text-align: center; margin-bottom: 14px; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-box { padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; }
    .kpi-box.danger { border-color: #fca5a5; background: #fef2f2; }
    .kpi-box.success { border-color: #86efac; background: #f0fdf4; }
    .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .kpi-val { font-size: 18px; font-weight: 800; }
    .kpi-sub { font-size: 10px; color: #64748b; margin-top: 2px; }

    .section-title { font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin: 12px 0 6px; display: flex; align-items: center; gap: 6px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
    table.data-table th { background: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 10px; }

    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 24px; text-align: center; page-break-inside: avoid; }
    .sig-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #334155; }
    .sig-sub { font-size: 10px; color: #64748b; font-style: italic; margin-top: 2px; }
    .sig-space { height: 50px; }
    .sig-name { font-weight: 700; font-size: 11px; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <div class="company-title">CÔNG TY CỔ PHẦN CÔNG NGHỆ NĂNG LƯỢNG NAM VIỆT</div>
        <div class="company-sub">HỆ THỐNG QUẢN LÝ DỰ ÁN EPC LÒ HƠI CÔNG NGHIỆP & BỒN ÁP LỰC</div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <div style="font-weight: 700; font-size: 11px; color: #0f172a;">MÃ DỰ ÁN: ${escapeHtml(project.code)}</div>
        <div style="font-size: 10.5px; color: #64748b;">Thời điểm xuất: ${printDate} · Tuần 37</div>
      </td>
    </tr>
  </table>

  <div class="report-title">BÁO CÁO TIẾN ĐỘ THI CÔNG & TIẾN ĐỘ DUAL GANTT (EPC BOILER CORE)</div>
  <div class="report-sub">
    Dự án: <strong>${escapeHtml(project.name)}</strong> · Khách hàng: <strong>${escapeHtml(project.clientName || 'Công ty CP Nhựa An Phát Xanh')}</strong> · Loại lò: <strong>${escapeHtml(project.boilerType || 'Biomass')} (${escapeHtml(project.capacity || '30 Tấn/h')})</strong>
  </div>

  <!-- KPI SUMMARY -->
  <div class="kpi-grid">
    <div class="kpi-box success">
      <div class="kpi-label">Tiến độ kế hoạch hôm nay</div>
      <div class="kpi-val" style="color: #0284c7;">${planPct}%</div>
      <div class="kpi-sub">Kỳ vọng hoàn tất thân lò</div>
    </div>
    <div class="kpi-box danger">
      <div class="kpi-label">Tiến độ thực tế đạt được</div>
      <div class="kpi-val" style="color: #dc2626;">${actualPct}%</div>
      <div class="kpi-sub">Bị chững lại do 2 điểm nghẽn</div>
    </div>
    <div class="kpi-box danger">
      <div class="kpi-label">Độ lệch tiến độ (Δ)</div>
      <div class="kpi-val" style="color: #dc2626;">${deltaPct}%</div>
      <div class="kpi-sub">Chậm 12 ngày đường găng</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Mốc nghiệm thu sắp tới</div>
      <div class="kpi-val" style="color: #d97706; font-size: 15px;">30/09 (Còn 8 ngày)</div>
      <div class="kpi-sub">Mốc 4: Thử áp lực 1.5x (15%)</div>
    </div>
  </div>

  <!-- SECTION 1: EXECUTION ITEMS -->
  <div class="section-title">1. TIẾN ĐỘ THI CÔNG BÓC TÁCH NỘI BỘ (KICK-OFF 170 NGÀY - 6 HẠNG MỤC)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 4%;">STT</th>
        <th style="width: 30%;">Hạng mục thi công</th>
        <th style="width: 16%;">Bộ phận phụ trách</th>
        <th style="width: 8%;">Thời hạn</th>
        <th style="width: 16%;">Timeline kế hoạch</th>
        <th style="width: 6%;">% KH</th>
        <th style="width: 6%;">% TT</th>
        <th style="width: 6%;">Δ Lệch</th>
        <th style="width: 14%;">Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <!-- SECTION 2: CONTRACT MILESTONES -->
  <div class="section-title">2. MỐC HỢP ĐỒNG & GIẢI NGÂN CHỦ ĐẦU TƯ (CAM KẾT PHÁP LÝ EPC)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 36%;">Mốc hợp đồng</th>
        <th style="width: 14%;">Hạn cam kết</th>
        <th style="width: 12%;">Giải ngân</th>
        <th style="width: 18%;">Tình trạng nghiệm thu</th>
        <th style="width: 20%;">Ghi chú đối soát</th>
      </tr>
    </thead>
    <tbody>
      ${milestoneRows}
    </tbody>
  </table>

  <!-- SECTION 3: BOTTLENECKS (MA TRẬN ĐIỂM NGHẼN) -->
  ${ops.bottlenecks.length > 0 ? `
  <div class="section-title">3. MA TRẬN ĐIỂM NGHẼN ĐƯỜNG GĂNG CẦN THÁO GỠ (${ops.bottlenecks.length} ĐIỂM)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 12%;">Mã nghẽn</th>
        <th style="width: 32%;">Nội dung điểm nghẽn</th>
        <th style="width: 18%;">PIC phụ trách</th>
        <th style="width: 14%;">Mức độ</th>
        <th style="width: 24%;">Giải pháp & Tiến độ xử lý</th>
      </tr>
    </thead>
    <tbody>
      ${ops.bottlenecks.map(bn => `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #dc2626;">${escapeHtml(bn.code || bn.id)}</td>
          <td style="font-weight: 600; color: #0f172a;">${escapeHtml(bn.name)}</td>
          <td style="color: #475569;">${escapeHtml(bn.pic || 'Ban QLDA')}</td>
          <td style="text-align: center; font-weight: 700; color: ${bn.severity === 'urgent' ? '#dc2626' : '#d97706'};">
            ${bn.severity === 'urgent' ? 'Rất nghiêm trọng' : bn.severity === 'medium' ? 'Nghiêm trọng' : 'Thường'}
          </td>
          <td style="font-size: 11px; color: #64748b;">${escapeHtml(bn.resolution || bn.reason || 'Đang giải tỏa')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="signatures">
    <div>
      <div class="sig-title">BAN CHỈ HUY CÔNG TRƯỜNG</div>
      <div class="sig-sub">(Ký & ghi rõ họ tên)</div>
      <div class="sig-space"></div>
      <div class="sig-name">Chỉ huy trưởng công trình</div>
    </div>
    <div>
      <div class="sig-title">TƯ VẤN GIÁM SÁT CHỦ ĐẦU TƯ</div>
      <div class="sig-sub">(Ký & xác nhận khối lượng)</div>
      <div class="sig-space"></div>
      <div class="sig-name">Đại diện BQL CĐT An Phát Xanh</div>
    </div>
    <div>
      <div class="sig-title">GIÁM ĐỐC DỰ ÁN EPC</div>
      <div class="sig-sub">(Phê duyệt báo cáo tuần 37)</div>
      <div class="sig-space"></div>
      <div class="sig-name">Ban Giám Đốc Nam Việt</div>
    </div>
  </div>
</body>
</html>`;

  // Sử dụng iframe cô lập để in ra đúng chuẩn A4 Landscape không bị ảnh hưởng bởi CSS bên ngoài
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', `In báo cáo tiến độ ${project.code}`);
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const handlePrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };

  if (iframe.contentWindow?.document.readyState === 'complete') {
    setTimeout(handlePrint, 250);
  } else {
    iframe.onload = () => setTimeout(handlePrint, 250);
  }

  return true;
}
