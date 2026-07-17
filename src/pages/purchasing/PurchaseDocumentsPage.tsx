import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import SearchBar from '../../components/ui/SearchBar';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import CreateDocumentModal from '../../components/purchasing/CreateDocumentModal';
import type { DocumentRow } from '../../data/purchasingMock';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import { downloadPurchasingDocument } from '../../lib/purchasing/downloadPurchasingDocument';
import { resolvePoDocumentChecklist } from '../../lib/purchasing/documentChecklist';
import { showToast } from '../../components/ui/Toast';

export default function PurchaseDocumentsPage() {
  const { documents: rows, orders, documentChecklist } = usePurchasingStore();
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('');
  const [focusPoId, setFocusPoId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ poId: string; docType?: string } | null>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  const types = useMemo(() => [...new Set(rows.map(d => d.docType))], [rows]);

  const poCards = useMemo(() => (
    orders.map(order => ({
      order,
      checklist: resolvePoDocumentChecklist(order, rows, documentChecklist),
    }))
  ), [orders, rows, documentChecklist]);

  const firstIncomplete = useMemo(
    () => poCards.find(c => c.checklist.missing.length > 0) ?? null,
    [poCards],
  );

  const focusOrder = useMemo(
    () => (focusPoId ? orders.find(o => o.id === focusPoId) ?? null : null),
    [focusPoId, orders],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (focusPoId && r.poId !== focusPoId) return false;
      if (docType && r.docType !== docType) return false;
      if (!q) return true;
      return [r.name, r.project, r.poCode, r.supplier].some(v => v.toLowerCase().includes(q));
    });
  }, [rows, search, docType, focusPoId]);

  const openUpload = (poId: string, missingType?: string) => {
    setUploadTarget({ poId, docType: missingType });
  };

  const viewFiles = (poId: string) => {
    setFocusPoId(poId);
    requestAnimationFrame(() => {
      fileListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const onDownload = (row: DocumentRow) => {
    try {
      downloadPurchasingDocument(row);
      showToast('success', `Đang tải ${row.name}`);
    } catch {
      showToast('error', 'Không tải được tài liệu.');
    }
  };

  const emptyFileMessage = (() => {
    if (focusOrder) {
      return `Đơn ${focusOrder.code} chưa có file. Bấm “Tải …” trên card phía trên để bổ sung.`;
    }
    if (rows.length === 0) {
      return 'Chưa có file nào được tải lên. Bổ sung từ card đơn hàng phía trên.';
    }
    return 'Không có file khớp bộ lọc.';
  })();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Mua hàng"
        title="6. Hồ sơ chứng từ"
        subtitle="Theo dõi giấy tờ từng đơn. Bảng dưới chỉ hiện file đã tải lên."
        actions={firstIncomplete ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openUpload(
              firstIncomplete.order.id,
              firstIncomplete.checklist.missing[0],
            )}
          >
            <Upload size={16} aria-hidden />
            Tải file thiếu
          </button>
        ) : undefined}
      />

      <h2 className="purchasing-section-title">Theo đơn hàng</h2>
      <div className="purchasing-po-check-grid">
        {poCards.length === 0 ? (
          <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có đơn hàng.</p>
        ) : poCards.map(({ order, checklist }) => {
          const incomplete = checklist.missing.length > 0;
          return (
            <article key={order.id} className="purchasing-po-check">
              <div className="purchasing-po-check__head">
                <span className="purchasing-po-check__code">{order.code}</span>
                <PurchasingStatusBadge label={checklist.label} tone={checklist.tone} />
              </div>
              <p className="purchasing-po-check__meta">
                {order.project} · {order.supplier}
              </p>
              <p className="purchasing-po-check__need">
                <strong>Cần có:</strong> {checklist.required.join(', ') || '—'}
              </p>
              <p className="purchasing-po-check__need">
                <strong>Đã có:</strong> {checklist.present.length ? checklist.present.join(', ') : 'Chưa có file'}
              </p>

              {incomplete ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {checklist.missing.map(missing => (
                    <button
                      key={missing}
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openUpload(order.id, missing)}
                    >
                      Tải {missing}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">Bộ hồ sơ đã đủ.</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outlined btn-sm"
                  onClick={() => viewFiles(order.id)}
                >
                  Xem file của đơn này
                </button>
                {incomplete && (
                  <button
                    type="button"
                    className="btn btn-tonal btn-sm"
                    onClick={() => openUpload(order.id)}
                  >
                    Tải file khác
                  </button>
                )}
                <Link
                  to="/purchasing/orders"
                  className="btn btn-text btn-sm"
                >
                  Mở đơn hàng
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div ref={fileListRef}>
        <h2 className="purchasing-section-title">File đã lưu</h2>
        <p className="purchasing-section-hint">
          Chỉ các file đã tải lên. Đơn chưa có file (ví dụ còn “Chưa có file” ở card trên) sẽ không có dòng ở đây.
        </p>
        <HrmPanel noPadding>
          <div className="hrm-list-toolbar">
            <div className="hrm-list-toolbar__filters">
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên file, dự án, đơn…" />
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                <div className="hrm-filter-select-wrap">
                  <select className="hrm-filter-select" value={docType} onChange={e => setDocType(e.target.value)} aria-label="Loại">
                    <option value="">Tất cả loại</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {focusOrder && (
                  <button type="button" className="hrm-filter-reset" onClick={() => setFocusPoId(null)}>
                    Đang lọc {focusOrder.code} · Bỏ lọc
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto table-scroll hrm-table-wrap">
            <table className="w-full border-collapse hrm-table table-min-w--950">
              <thead>
                <tr>
                  <th className="table-header-cell">Tên file</th>
                  <th className="table-header-cell">Loại</th>
                  <th className="table-header-cell">Đơn hàng</th>
                  <th className="table-header-cell">Dự án</th>
                  <th className="table-header-cell">Ngày</th>
                  <th className="table-header-cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="table-cell text-[var(--md-on-surface-variant)]" colSpan={6}>
                      {emptyFileMessage}
                    </td>
                  </tr>
                ) : filtered.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell font-semibold">{row.name}</td>
                    <td className="table-cell whitespace-nowrap">{row.docType}</td>
                    <td className="table-cell whitespace-nowrap">{row.poCode}</td>
                    <td className="table-cell">{row.project}</td>
                    <td className="table-cell whitespace-nowrap">{row.uploadedAt}</td>
                    <td className="table-cell whitespace-nowrap">
                      <button type="button" className="btn btn-tonal btn-sm" onClick={() => onDownload(row)}>
                        <Download size={14} aria-hidden />
                        Tải về
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HrmPanel>
      </div>

      <CreateDocumentModal
        open={Boolean(uploadTarget)}
        onClose={() => setUploadTarget(null)}
        prefillPoId={uploadTarget?.poId}
        prefillDocType={uploadTarget?.docType}
      />
    </div>
  );
}
