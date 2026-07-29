/**
 * In phiếu PO qua iframe ẩn — tránh header/footer trình duyệt
 * (title "Nam Việt Group" + URL trang chi tiết).
 * Ngày giờ vẫn có thể hiện nếu user bật "Headers and footers" trong hộp thoại In.
 */
export function printPoSheet(root: HTMLElement, documentTitle = 'Purchase Order'): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', documentTitle);
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
  const frameDoc = iframe.contentDocument;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return false;
  }

  const cleanup = () => {
    iframe.remove();
  };
  frameWindow.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  const headParts: string[] = [
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(documentTitle)}</title>`,
  ];

  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = (link as HTMLLinkElement).href;
    if (href) headParts.push(`<link rel="stylesheet" href="${escapeAttr(href)}" />`);
  });
  document.querySelectorAll('style').forEach(style => {
    headParts.push(`<style>${style.textContent ?? ''}</style>`);
  });

  headParts.push(`<style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }
    .po-voucher-print-sheet {
      display: block !important;
      position: static !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: #fff !important;
    }
    @page { size: A4; margin: 12mm; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; }
    }
  </style>`);

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html><html lang="vi"><head>${headParts.join('')}</head><body>${root.outerHTML}</body></html>`);
  frameDoc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    frameWindow.focus();
    frameWindow.print();
  };

  const images = Array.from(frameDoc.images);
  if (images.length === 0) {
    triggerPrint();
    return true;
  }

  let pending = images.length;
  const done = () => {
    pending -= 1;
    if (pending <= 0) triggerPrint();
  };
  for (const img of images) {
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  }
  window.setTimeout(triggerPrint, 3_000);

  return true;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
