import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RefreshCw, X } from 'lucide-react';
import CreateOrderModal from '../../components/purchasing/CreateOrderModal';
import EditOrderModal from '../../components/purchasing/EditOrderModal';
import PurchaseOrderDetailModal from '../../components/purchasing/PurchaseOrderDetailModal';
import PurchaseOrdersTable from '../../components/purchasing/PurchaseOrdersTable';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import type { PurchaseOrderRow } from '../../data/purchasingMock';
import { orderMatchesTab, parseViDate } from '../../data/purchasingMock';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../../components/ui/Toast';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { isoToDisplay } from '../../lib/dates';
import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS, type ListPageSize } from '../../constants/pagination';

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'Đang theo dõi', label: 'Đang theo dõi' },
  { id: 'Hóa đơn thuế', label: 'Hóa đơn thuế' },
  { id: 'Hóa đơn lẻ', label: 'Hóa đơn lẻ' },
  { id: 'Đã chi', label: 'Đã chi' },
  { id: 'Chi 1 phần', label: 'Chi 1 phần' },
  { id: 'Chưa chi', label: 'Chưa chi' },
  { id: 'Sắp đến hạn về', label: 'Sắp đến hạn về' },
  { id: 'Trễ hạn về', label: 'Trễ hạn về' },
  { id: 'Chưa nhập hàng', label: 'Chưa nhập hàng' },
  { id: 'Nhập 1 phần', label: 'Nhập 1 phần' },
  { id: 'Nhập đủ', label: 'Nhập đủ' },
] as const;

const EMPTY_SELECT = 'Không có mục nào được chọn';

function sameDay(a: string, bIsoOrDisplay: string): boolean {
  if (!bIsoOrDisplay) return true;
  const display = bIsoOrDisplay.includes('-') ? isoToDisplay(bIsoOrDisplay) : bIsoOrDisplay;
  return a === display;
}

function dateInRange(value: string, filterIso: string): boolean {
  if (!filterIso) return true;
  const v = parseViDate(value);
  const f = parseViDate(isoToDisplay(filterIso));
  if (!v || !f) return sameDay(value, filterIso);
  return v.getTime() === f.getTime();
}

/** Đơn hàng trong nước — chrome khớp KHMH; bảng cột theo ERP. */
export default function PurchaseOrdersPage() {
  const { orders: allOrders } = usePurchasingStore();
  const rows = useMemo(() => allOrders.filter(r => r.channel === 'domestic'), [allOrders]);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrderRow | null>(null);
  const [editOrder, setEditOrder] = useState<PurchaseOrderRow | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paySupplier, setPaySupplier] = useState('');
  const payPopoverRef = useRef<HTMLDivElement>(null);

  const [docCode, setDocCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [pod, setPod] = useState('');
  const [ecd, setEcd] = useState('');
  const [etd, setEtd] = useState('');
  const [etaPort, setEtaPort] = useState('');
  const [etw, setEtw] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [invoice, setInvoice] = useState('');
  const [buyCompany, setBuyCompany] = useState('');
  const [statusTab, setStatusTab] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const tabsRef = useRef<HTMLDivElement>(null);

  const docOptions = useMemo(() => [...new Set(rows.map(r => r.code))].sort(), [rows]);
  const supplierOptions = useMemo(() => [...new Set(rows.map(r => r.supplier).filter(Boolean))].sort(), [rows]);
  const companyOptions = useMemo(() => [...new Set(rows.map(r => r.buyCompany).filter(Boolean))].sort(), [rows]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { '': rows.length };
    for (const t of STATUS_TABS) {
      if (!t.id) continue;
      map[t.id] = rows.filter(r => orderMatchesTab(r, t.id)).length;
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return rows.filter(r => {
      if (!orderMatchesTab(r, statusTab)) return false;
      if (docCode && r.code !== docCode) return false;
      if (supplier && r.supplier !== supplier) return false;
      if (buyCompany && r.buyCompany !== buyCompany) return false;
      if (poNumber && !r.poNumber.toLowerCase().includes(poNumber.toLowerCase())) return false;
      if (invoice && !r.invoiceNo.toLowerCase().includes(invoice.toLowerCase())) return false;
      if (pod && !dateInRange(r.orderedAt, pod)) return false;
      if (ecd && !dateInRange(r.eta, ecd)) return false;
      if (etd && !dateInRange(r.etd, etd)) return false;
      if (etaPort && !dateInRange(r.etaPort, etaPort)) return false;
      if (etw && !dateInRange(r.etw || r.eta, etw)) return false;
      if (q && ![r.code, r.project, r.supplier, r.poNumber, r.invoiceNo, r.buyCompany, r.note]
        .some(v => v.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [rows, statusTab, docCode, supplier, buyCompany, poNumber, invoice, pod, ecd, etd, etaPort, etw, tableSearch]);

  useEffect(() => {
    if (!payOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (payPopoverRef.current && !payPopoverRef.current.contains(e.target as Node)) {
        setPayOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [payOpen]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetFilters = () => {
    setDocCode('');
    setSupplier('');
    setPod('');
    setEcd('');
    setEtd('');
    setEtaPort('');
    setEtw('');
    setPoNumber('');
    setInvoice('');
    setBuyCompany('');
    setStatusTab('');
    setTableSearch('');
    setPage(1);
  };

  const scrollTabs = (dir: -1 | 1) => {
    tabsRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  return (
    <div className="page-shell pur-erp pur-erp--plan pur-erp--po">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Đơn đặt hàng (PO)</h1>
          <p className="pur-erp__subtitle">Đơn trong nước — theo dõi POD / ECD · thanh toán · nhập hàng</p>
        </div>
        <div className="pur-erp__head-actions">
          <button type="button" className="pur-erp__action pur-erp__action--primary" onClick={() => setCreateOpen(true)}>
            Tạo mới
          </button>
          <div className="pur-erp__chi-tong" ref={payPopoverRef}>
            <button
              type="button"
              className="pur-erp__action pur-erp__action--history"
              aria-expanded={payOpen}
              aria-haspopup="dialog"
              onClick={() => {
                setPayOpen(v => !v);
                if (!payOpen) setPaySupplier('');
              }}
            >
              Chi tổng
            </button>
            {payOpen && (
              <div className="pur-erp__chi-tong-pop" role="dialog" aria-label="Chi tổng">
                <div className="pur-erp__chi-tong-pop-head">
                  <span>Chi tổng</span>
                  <button
                    type="button"
                    className="pur-erp__chi-tong-close"
                    aria-label="Đóng"
                    onClick={() => setPayOpen(false)}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
                <label className="pur-erp__chi-tong-field">
                  <span>Chọn nhà cung cấp</span>
                  <select
                    value={paySupplier}
                    onChange={e => setPaySupplier(e.target.value)}
                  >
                    <option value="">{EMPTY_SELECT}</option>
                    {supplierOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="pur-erp__chi-tong-submit"
                  onClick={() => {
                    if (!paySupplier) {
                      showToast('warning', 'Chọn nhà cung cấp.');
                      return;
                    }
                    showToast('success', `Lập phiếu chi tổng — ${paySupplier} (UI demo).`);
                    setPayOpen(false);
                  }}
                >
                  LẬP PHIẾU
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="pur-erp__workspace">
        <div className="pur-erp__filter-card pur-erp__filter-card--po">
          <div className="pur-erp__toolbar pur-erp__toolbar--po">
            <div className="pur-erp__toolbar-fields pur-erp__filter-grid pur-erp__filter-grid--po">
              <label className="pur-erp__field">
                <span>Mã chứng từ</span>
                <select className="pur-erp__select" value={docCode} onChange={e => { setDocCode(e.target.value); setPage(1); }}>
                  <option value="">{EMPTY_SELECT}</option>
                  {docOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="pur-erp__field">
                <span>Tên nhà cung cấp</span>
                <select className="pur-erp__select" value={supplier} onChange={e => { setSupplier(e.target.value); setPage(1); }}>
                  <option value="">{EMPTY_SELECT}</option>
                  {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="pur-erp__field">
                <span>Ngày đặt hàng (POD)</span>
                <HrmDatePicker value={pod} onChange={v => { setPod(v); setPage(1); }} placeholder="dd/mm/yyyy" />
              </label>
              <label className="pur-erp__field">
                <span>Ngày dự kiến có hàng (ECD)</span>
                <HrmDatePicker value={ecd} onChange={v => { setEcd(v); setPage(1); }} placeholder="dd/mm/yyyy" />
              </label>
              <label className="pur-erp__field">
                <span>Ngày tàu khởi hành (ETD)</span>
                <HrmDatePicker value={etd} onChange={v => { setEtd(v); setPage(1); }} placeholder="dd/mm/yyyy" />
              </label>
              <label className="pur-erp__field">
                <span>Ngày tàu cập cảng (ETA)</span>
                <HrmDatePicker value={etaPort} onChange={v => { setEtaPort(v); setPage(1); }} placeholder="dd/mm/yyyy" />
              </label>
              <label className="pur-erp__field">
                <span>Ngày hàng về kho (ETW)</span>
                <HrmDatePicker value={etw} onChange={v => { setEtw(v); setPage(1); }} placeholder="dd/mm/yyyy" />
              </label>
              <label className="pur-erp__field">
                <span>Số PO</span>
                <input
                  className="pur-erp__select"
                  value={poNumber}
                  onChange={e => { setPoNumber(e.target.value); setPage(1); }}
                  placeholder="Số PO"
                />
              </label>
              <label className="pur-erp__field">
                <span>Invoice</span>
                <input
                  className="pur-erp__select"
                  value={invoice}
                  onChange={e => { setInvoice(e.target.value); setPage(1); }}
                  placeholder="Invoice"
                />
              </label>
              <label className="pur-erp__field">
                <span>Tên cty mua hàng</span>
                <select className="pur-erp__select" value={buyCompany} onChange={e => { setBuyCompany(e.target.value); setPage(1); }}>
                  <option value="">{EMPTY_SELECT}</option>
                  {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="pur-erp__toolbar-actions">
              <button type="button" className="pur-erp__export" onClick={() => showToast('info', `Xuất ${filtered.length} đơn (UI demo).`)}>
                <Download size={13} aria-hidden />
                Xuất ra
              </button>
              <button type="button" className="pur-erp__icon-btn" aria-label="Làm mới bộ lọc" onClick={resetFilters}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="pur-erp__panel">
          <div className="pur-erp__tabs-row">
            <div className="pur-erp__tabs-wrap">
              <button type="button" className="pur-erp__tabs-nav" aria-label="Cuộn tab trái" onClick={() => scrollTabs(-1)}>
                <ChevronLeft size={16} />
              </button>
              <div ref={tabsRef} className="pur-erp__tabs pur-erp__tabs--scroll" role="tablist" aria-label="Trạng thái đơn">
                {STATUS_TABS.map(t => (
                  <button
                    key={t.id || 'all'}
                    type="button"
                    role="tab"
                    aria-selected={statusTab === t.id}
                    className={`pur-erp__tab${statusTab === t.id ? ' is-active' : ''}`}
                    onClick={() => { setStatusTab(t.id); setPage(1); }}
                  >
                    {t.label}
                    <span className="pur-erp__tab-count">{tabCounts[t.id] ?? 0}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="pur-erp__tabs-nav" aria-label="Cuộn tab phải" onClick={() => scrollTabs(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="pur-erp__table-tools">
              <select
                className="pur-erp__pagesize"
                value={pageSize}
                aria-label="Số dòng mỗi trang"
                onChange={e => { setPageSize(Number(e.target.value) as ListPageSize); setPage(1); }}
              >
                {LIST_PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="pur-erp__table-search">
                <input
                  type="search"
                  value={tableSearch}
                  onChange={e => { setTableSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm kiếm..."
                  aria-label="Tìm kiếm trong bảng"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message={rows.length === 0 ? 'Chưa có đơn đặt hàng trong nước.' : 'Không có đơn khớp bộ lọc.'} />
          ) : (
            <>
              <PurchaseOrdersTable
                rows={pageRows}
                onView={setViewOrder}
                onEdit={setEditOrder}
              />
              <Pagination
                embedded
                itemLabel="đơn"
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={s => { setPageSize(s as ListPageSize); setPage(1); }}
                totalItems={filtered.length}
              />
            </>
          )}
        </div>
      </div>

      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultKind="standard"
      />

      <PurchaseOrderDetailModal
        order={viewOrder}
        onClose={() => setViewOrder(null)}
      />
      <EditOrderModal
        order={editOrder ? (allOrders.find(o => o.id === editOrder.id) ?? editOrder) : null}
        onClose={() => setEditOrder(null)}
      />
    </div>
  );
}
