import { useState } from 'react';
import { Plus, Eye, FileText, Check, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { transfers as initialTransfers } from '../../data/transfers';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { projects, initialLendingLogs, LendingLog } from '../../data/projects';
import { generateCode } from '../../utils/generateCode';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import type { Transfer } from '../../types';

type TransferTab = 'internal' | 'loans' | 'consolidation';

/** Transfer voucher row, extended with a UI-only creation timestamp. */
interface TransferRow extends Transfer {
  createdTime?: string;
}

interface FormItem {
  productId: string;
  qty: string;
}

interface TransferForm {
  fromWarehouseId: string;
  toWarehouseId: string;
  note: string;
  items: FormItem[];
}

const emptyForm: TransferForm = { fromWarehouseId: '', toWarehouseId: '', note: '', items: [{ productId: '', qty: '' }] };

const generateUniqueTransferId = () => `tf-${Date.now()}`;
const generateUniqueLoanId = () => `lend-${Date.now()}`;
const getLocaleDateString = () => new Date().toLocaleDateString('vi-VN');

export default function TransferListPage() {
  const activeRole = localStorage.getItem('nv-user-role') || 'admin';
  const [activeTab, setActiveTab] = useState<TransferTab>('internal');
  const [transfers, setTransfers] = useState<TransferRow[]>(initialTransfers);
  const [loans, setLoans] = useState<LendingLog[]>(initialLendingLogs);
  
  // Consolidation State
  const [selectedConsProjectId, setSelectedConsProjectId] = useState('proj-006'); // default to Heineken (closed)
  const [consCompleted, setConsCompleted] = useState(false);

  // Search and Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showCreateTransfer, setShowCreateTransfer] = useState(false);
  const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRow | null>(null);
  const [showLoanDetail, setShowLoanDetail] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LendingLog | null>(null);

  // Forms
  const [transferForm, setTransferForm] = useState<TransferForm>({ ...emptyForm });
  const [loanForm, setLoanForm] = useState({
    borrowingProjectId: '',
    lendingProjectId: '',
    productId: '',
    qty: '',
    note: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Suggestion Banner State
  const [showSuggestion, setShowSuggestion] = useState(true);

  // Tab config
  const tabs = [
    { id: 'internal', label: 'Chuyển kho nội bộ', count: transfers.length },
    { id: 'loans', label: 'Mượn - Trả liên dự án', count: loans.filter(l => l.status !== 'returned').length },
    { id: 'consolidation', label: 'Kết chuyển tồn dư thừa', count: 1 },
  ];

  // Filters
  let filteredTransfers = transfers;
  if (search) {
    filteredTransfers = filteredTransfers.filter(t =>
      t.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
      t.fromWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
      t.toWarehouseName.toLowerCase().includes(search.toLowerCase())
    );
  }
  const transTotalPages = Math.ceil(filteredTransfers.length / pageSize);
  const paginatedTransfers = filteredTransfers.slice((page - 1) * pageSize, page * pageSize);

  let filteredLoans = loans;
  if (search) {
    filteredLoans = filteredLoans.filter(l => {
      const pBorrow = projects.find(p => p.id === l.borrowingProjectId)?.name || '';
      const pLend = projects.find(p => p.id === l.lendingProjectId)?.name || '';
      const prodName = products.find(p => p.id === l.productId)?.name || '';
      return pBorrow.toLowerCase().includes(search.toLowerCase()) ||
             pLend.toLowerCase().includes(search.toLowerCase()) ||
             prodName.toLowerCase().includes(search.toLowerCase());
    });
  }

  // Double PM Signatures Handlers
  const handlePmSign = (loanId: string, type: 'borrow' | 'lend') => {
    let showSuccess = false;
    let showInfo = false;
    let loanCode = '';

    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const updated = {
          ...l,
          borrowPmSigned: type === 'borrow' ? true : l.borrowPmSigned,
          lendPmSigned: type === 'lend' ? true : l.lendPmSigned
        };
        loanCode = l.voucherCode;
        if (updated.borrowPmSigned && updated.lendPmSigned && updated.status === 'pending') {
          updated.status = 'borrowing';
          showSuccess = true;
        } else {
          showInfo = true;
        }
        return updated;
      }
      return l;
    }));

    if (showSuccess) {
      showToast('success', `Cả 2 Giám đốc dự án đã ký duyệt. Phiếu mượn ${loanCode} chuyển sang ĐANG MƯỢN.`, 'Duyệt thành công');
    } else if (showInfo) {
      showToast('info', `PM ${type === 'borrow' ? 'mượn' : 'cho mượn'} đã ký xác nhận.`, 'Đã ký duyệt');
    }
  };

  const handleReturnLoan = (loanId: string) => {
    let loanCode = '';
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        loanCode = l.voucherCode;
        return { ...l, status: 'returned' as const };
      }
      return l;
    }));
    if (loanCode) {
      showToast('success', `Đã hoàn trả thành công vật tư cho phiếu ${loanCode}. Ghi nhận thẻ kho SCM.`, 'Hoàn trả thành công');
    }
  };

  // Suggestion Return Action
  const handleAutoReturnSuggestion = () => {
    // Return loan-001 (Sabeco borrows 1 unit of p-002 from Vinamilk)
    handleReturnLoan('lend-001');
    setShowSuggestion(false);
  };

  // Consolidation Action
  const handleConsolidate = () => {
    setConsCompleted(true);
    showToast('success', `Đã kết chuyển thành công toàn bộ vật tư dư thừa của dự án về Kho tổng (General Warehouse)!`, 'Kết chuyển thành công');
  };

  // Internal Transfer Form Handler
  const validateTransfer = () => {
    const errs: Record<string, string> = {};
    if (!transferForm.fromWarehouseId) errs.fromWarehouseId = 'Vui lòng chọn kho nguồn';
    if (!transferForm.toWarehouseId) errs.toWarehouseId = 'Vui lòng chọn kho đích';
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId && transferForm.fromWarehouseId) {
      errs.toWarehouseId = 'Kho đích phải khác kho nguồn';
    }
    const validItems = transferForm.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    transferForm.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) {
        errs[`item_qty_${i}`] = 'Số lượng phải > 0';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateTransferSubmit = () => {
    if (!validateTransfer()) return;
    const fromWh = warehouses.find(w => w.id === transferForm.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === transferForm.toWarehouseId);
    
    const newTf: TransferRow = {
      id: generateUniqueTransferId(),
      voucherCode: generateCode('CK'),
      date: getLocaleDateString(),
      fromWarehouseId: transferForm.fromWarehouseId,
      fromWarehouseName: fromWh?.name || '',
      toWarehouseId: transferForm.toWarehouseId,
      toWarehouseName: toWh?.name || '',
      items: transferForm.items.filter(it => it.productId).map(it => {
        const prod = products.find(p => p.id === it.productId);
        return { productId: it.productId, sku: prod?.sku ?? '', name: prod?.name ?? '', qty: Number(it.qty), unit: prod?.unit ?? '' };
      }),
      status: 'approved',
      createdBy: activeRole.toUpperCase(),
      note: transferForm.note,
      createdTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setTransfers([newTf, ...transfers]);
    setShowCreateTransfer(false);
    setTransferForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Đã tạo và duyệt thành công phiếu chuyển kho ${newTf.voucherCode}!`, 'Chuyển kho thành công');
  };

  // Cross-project Loan Request Submit
  const handleCreateLoanSubmit = () => {
    if (!loanForm.borrowingProjectId || !loanForm.lendingProjectId || !loanForm.productId || !loanForm.qty || Number(loanForm.qty) <= 0) {
      showToast('error', 'Vui lòng nhập đầy đủ thông tin yêu cầu mượn vật tư.');
      return;
    }
    if (loanForm.borrowingProjectId === loanForm.lendingProjectId) {
      showToast('error', 'Dự án mượn và cho mượn không thể trùng nhau.');
      return;
    }

    const borrowProj = projects.find(p => p.id === loanForm.borrowingProjectId);
    const newLoan: LendingLog = {
      id: generateUniqueLoanId(),
      voucherCode: `ML-${Math.floor(10000 + Math.random() * 90000)}`,
      date: getLocaleDateString(),
      borrowingProjectId: loanForm.borrowingProjectId,
      lendingProjectId: loanForm.lendingProjectId,
      productId: loanForm.productId,
      qty: Number(loanForm.qty),
      status: 'pending',
      borrowPmSigned: true, // Auto-signed by borrowing PM (initiator)
      lendPmSigned: false,
      note: loanForm.note,
      createdBy: borrowProj?.pm || activeRole.toUpperCase(),
      createdTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setLoans([newLoan, ...loans]);
    setShowCreateLoan(false);
    setLoanForm({ borrowingProjectId: '', lendingProjectId: '', productId: '', qty: '', note: '' });
    showToast('success', `Đã tạo yêu cầu mượn liên dự án ${newLoan.voucherCode}. Đang chờ PM đối tác ký duyệt.`, 'Tạo yêu cầu thành công');
  };

  const getTransferActions = (item: TransferRow) => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedTransfer(item); setShowDetail(true); } },
    { label: 'In phiếu xuất kho', icon: FileText, onClick: () => showToast('info', 'Đang kết nối máy in...') }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="ĐIỀU PHỐI VẬT TƯ"
        title="ĐIỀU PHỐI & CHUYỂN KHO DỰ ÁN"
        actions={
          <div className="flex gap-2">
            {activeTab === 'internal' && (
              <button className="btn btn-filled text-xs" onClick={() => setShowCreateTransfer(true)}>
                <Plus size={14} /> TẠO PHIẾU CHUYỂN
              </button>
            )}
            {activeTab === 'loans' && (
              <button className="btn btn-filled text-xs" onClick={() => setShowCreateLoan(true)}>
                <Plus size={14} /> YÊU CẦU MƯỢN HÀNG
              </button>
            )}
          </div>
        }
      />

      <TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id as TransferTab); setSearch(''); setPage(1); }} />

      {/* SEARCH BAR FOR LISTS */}
      {activeTab !== 'consolidation' && (
        <div className="rounded-2xl shadow-card p-4 flex justify-between items-center page-filter-bar" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm chứng từ, tên dự án, sản phẩm..." />
        </div>
      )}

      {/* ── TAB 1: INTERNAL TRANSFERS ── */}
      {activeTab === 'internal' && (
        <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          {paginatedTransfers.length === 0 ? (
            <EmptyState message="Không tìm thấy phiếu chuyển kho nào!" />
          ) : (
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-xs" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th className="table-header-cell">Ngày chứng từ</th>
                    <th className="table-header-cell">Mã chứng từ</th>
                    <th className="table-header-cell">Kho nguồn</th>
                    <th className="table-header-cell">Kho tiếp nhận</th>
                    <th className="table-header-cell">Ghi chú/Lý do</th>
                    <th className="table-header-cell">Người lập</th>
                    <th className="table-header-cell">Trạng thái</th>
                    <th className="table-header-cell text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransfers.map((t) => (
                    <tr key={t.id} className="table-row cursor-pointer hover:bg-[var(--tint-primary-weak)]"
                      onClick={() => { setSelectedTransfer(t); setShowDetail(true); }}>
                      <td className="table-cell text-[var(--md-on-surface)]">{t.date}</td>
                      <td className="table-cell font-bold text-[var(--md-primary)]">{t.voucherCode}</td>
                      <td className="table-cell">{t.fromWarehouseName}</td>
                      <td className="table-cell">{t.toWarehouseName}</td>
                      <td className="table-cell max-w-[150px] truncate" title={t.note || ''}>{t.note || '—'}</td>
                      <td className="table-cell">
                        <div className="font-semibold text-[var(--md-on-surface)]">{t.createdBy || 'Hệ thống'}</div>
                        <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">{t.date} {t.createdTime || '08:30'}</div>
                      </td>
                      <td className="table-cell"><Badge status={t.status} /></td>
                      <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}>
                        <Dropdown items={getTransferActions(t)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 pb-4 mt-2">
            <Pagination currentPage={page} totalPages={transTotalPages} onPageChange={setPage}
              pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filteredTransfers.length} />
          </div>
        </div>
      )}

      {/* ── TAB 2: CROSS-PROJECT LOANS ── */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {/* Automatic suggestion banner */}
          {showSuggestion && (
            <div className="rounded-2xl p-4 flex items-start gap-4 border animate-slide-in"
              style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', borderColor: 'var(--md-primary)' }}>
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-[var(--md-primary)]" />
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">Gợi ý hoàn trả tự động (Smart suggestions)</h4>
                <p className="text-[11px] mt-1">
                  Mayzer SCM phát hiện: Lô hàng **Máy nén khí trục vít 15HP** của **Dự án Sabeco** nhập theo phiếu **NK-002144** vừa được duyệt nhập kho thành công.
                  Hệ thống đề xuất hoàn trả ngay vật tư mượn tạm từ **Dự án Sữa Vinamilk Củ Chi** (Phiếu mượn **ML-00241**).
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleAutoReturnSuggestion} className="btn btn-filled text-[10px] py-1.5 px-3">
                    XÁC NHẬN HOÀN TRẢ NGAY
                  </button>
                  <button onClick={() => setShowSuggestion(false)} className="btn btn-outline text-[10px] py-1.5 px-3">
                    BỎ QUA
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            {filteredLoans.length === 0 ? (
              <EmptyState message="Không tìm thấy yêu cầu mượn trả nào!" />
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full text-xs" style={{ minWidth: '1100px' }}>
                  <thead>
                    <tr style={{ background: 'var(--md-surface-container-high)' }}>
                      <th className="table-header-cell">Mã yêu cầu</th>
                      <th className="table-header-cell">Ngày yêu cầu</th>
                      <th className="table-header-cell">Dự án mượn</th>
                      <th className="table-header-cell">Dự án cho mượn</th>
                      <th className="table-header-cell">Vật tư yêu cầu</th>
                      <th className="table-header-cell text-right">Số lượng</th>
                      <th className="table-header-cell">Lý do mượn</th>
                      <th className="table-header-cell text-center">Bảo mật chữ ký PM</th>
                      <th className="table-header-cell">Người tạo</th>
                      <th className="table-header-cell text-center">Trạng thái</th>
                      <th className="table-header-cell text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((l) => {
                      const prod = products.find(p => p.id === l.productId);
                      const projBorrow = projects.find(p => p.id === l.borrowingProjectId);
                      const projLend = projects.find(p => p.id === l.lendingProjectId);
                      
                      return (
                        <tr key={l.id} className="table-row border-b border-[var(--md-outline-variant)] cursor-pointer hover:bg-[var(--tint-primary-weak)]"
                          onClick={() => { setSelectedLoan(l); setShowLoanDetail(true); }}>
                          <td className="table-cell font-bold text-[var(--md-primary)] font-mono">{l.voucherCode}</td>
                          <td className="table-cell text-[var(--md-on-surface)]">{l.date}</td>
                          <td className="table-cell font-semibold text-[var(--md-on-surface)]">{projBorrow?.name}</td>
                          <td className="table-cell font-semibold text-[var(--md-on-surface)]">{projLend?.name}</td>
                          <td className="table-cell">
                            <div className="font-bold">{prod?.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{prod?.sku}</div>
                          </td>
                          <td className="table-cell text-right font-bold">{l.qty} {prod?.unit}</td>
                          <td className="table-cell max-w-[200px] truncate" title={l.note}>{l.note || '—'}</td>
                          <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-center gap-1">
                              {/* Signature 1: Borrowing PM */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-semibold">PM Mượn:</span>
                                {l.borrowPmSigned ? (
                                  <span className="text-[9px] font-bold text-[var(--md-success)] bg-[var(--tint-success-soft)] px-1.5 py-0.5 rounded">Đã ký</span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handlePmSign(l.id, 'borrow'); }} className="text-[9px] font-bold text-[var(--md-primary)] hover:underline">Ký duyệt</button>
                                )}
                              </div>
                              {/* Signature 2: Lending PM */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-semibold">PM Cho:</span>
                                {l.lendPmSigned ? (
                                  <span className="text-[9px] font-bold text-[var(--md-success)] bg-[var(--tint-success-soft)] px-1.5 py-0.5 rounded">Đã ký</span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handlePmSign(l.id, 'lend'); }} className="text-[9px] font-bold text-[var(--md-primary)] hover:underline">Ký duyệt</button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="font-semibold text-[var(--md-on-surface)]">{l.createdBy || 'PM Mượn'}</div>
                            <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">{l.date} {l.createdTime || '09:00'}</div>
                          </td>
                          <td className="table-cell text-center">
                            <Badge status={l.status === 'pending' ? 'loan_pending' : l.status} />
                          </td>
                          <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}>
                            {l.status === 'borrowing' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReturnLoan(l.id); }}
                                className="btn btn-outlined text-[9px] py-1 px-2.5 font-bold hover:bg-[var(--md-primary)] hover:text-white"
                              >
                                HOÀN TRẢ
                              </button>
                            ) : (
                              <span className="text-gray-400 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: PROJECT SURPLUS CONSOLIDATION ── */}
      {activeTab === 'consolidation' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-5 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">Kết chuyển vật tư dư thừa về Kho tổng</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <FormField label="Dự án thi công hoàn thiện" className="md:col-span-2">
                <select
                  className="form-select"
                  value={selectedConsProjectId}
                  onChange={(e) => { setSelectedConsProjectId(e.target.value); setConsCompleted(false); }}
                >
                  <option value="proj-006">Dự án 6 — Nhà máy Bia Heineken Vũng Tàu (Đóng/Hoàn thành)</option>
                  <option value="proj-005">Dự án 5 — Dự án Vinhomes Grand Park (Lắp đặt xong)</option>
                </select>
              </FormField>
              
              <button
                disabled={consCompleted}
                onClick={handleConsolidate}
                className={`btn btn-filled text-xs py-3 w-full flex items-center justify-center gap-2 ${consCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Check size={16} /> THỰC HIỆN KẾT CHUYỂN VỀ KHO TỔNG
              </button>
            </div>
          </div>

          <div className="rounded-2xl shadow-card p-5" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">
              Danh sách vật tư dư thừa phát hiện tại công trường
            </h4>

            {consCompleted ? (
              <div className="p-8 text-center bg-[var(--md-success-container)] text-[var(--md-on-success-container)] rounded-xl border border-[var(--md-success)] flex flex-col items-center">
                <ShieldCheck size={48} className="text-[var(--md-success)] mb-2" />
                <h4 className="font-bold text-sm uppercase tracking-wide">KẾT CHUYỂN HOÀN TẤT</h4>
                <p className="text-xs mt-1 max-w-md">
                  Toàn bộ vật tư dư thừa đã được thu hồi và cộng tăng trực tiếp vào tồn kho khả dụng của **Kho VT Chính Mayzer (Kho tổng)**. Mã chứng từ kết chuyển phát sinh tự động **KC-20260609**.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full text-xs" style={{ minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'var(--md-surface-container-high)', borderBottom: '1px solid var(--md-outline-variant)' }}>
                    <th className="py-2 text-left pl-3">Sản phẩm vật tư</th>
                    <th className="py-2 text-center w-24">Mã SKU</th>
                    <th className="py-2 text-center w-24">ĐVT</th>
                    <th className="py-2 text-right w-32 pl-4">Khối lượng tồn công trình</th>
                    <th className="py-2 text-center w-40">Trạng thái vật lý</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedConsProjectId === 'proj-006' ? (
                    <>
                      <tr className="border-b">
                        <td className="py-3 font-semibold pl-3">Máy nén khí trục vít 7.5HP</td>
                        <td className="py-3 text-center font-mono">MNK-SC-7.5</td>
                        <td className="py-3 text-center">Cái</td>
                        <td className="py-3 text-right font-bold text-rose-500">1</td>
                        <td className="py-3 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--tint-success-soft)] text-[var(--md-success)] border border-[var(--tint-success-border)] whitespace-nowrap uppercase">Chưa qua sử dụng</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-semibold pl-3">Que hàn điện Kim Tín KT-421</td>
                        <td className="py-3 text-center font-mono">QH-KT-421</td>
                        <td className="py-3 text-center">Hộp</td>
                        <td className="py-3 text-right font-bold text-rose-500">15</td>
                        <td className="py-3 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--tint-success-soft)] text-[var(--md-success)] border border-[var(--tint-success-border)] whitespace-nowrap uppercase">Mới nguyên niêm phong</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-semibold pl-3">Dầu máy nén khí 20L</td>
                        <td className="py-3 text-center font-mono">DK-OIL-20L</td>
                        <td className="py-3 text-center">Thùng</td>
                        <td className="py-3 text-right font-bold text-rose-500">3</td>
                        <td className="py-3 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--tint-success-soft)] text-[var(--md-success)] border border-[var(--tint-success-border)] whitespace-nowrap uppercase">Mới nguyên vỏ hộp</span></td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b">
                        <td className="py-3 font-semibold pl-3">Bình chứa khí nén 500L</td>
                        <td className="py-3 text-center font-mono">BLK-500</td>
                        <td className="py-3 text-center">Cái</td>
                        <td className="py-3 text-right font-bold text-rose-500">1</td>
                        <td className="py-3 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--tint-success-soft)] text-[var(--md-success)] border border-[var(--tint-success-border)] whitespace-nowrap uppercase">Chưa qua sử dụng</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-semibold pl-3">Găng tay bảo hộ hàn da bò</td>
                        <td className="py-3 text-center font-mono">GT-BH-DA</td>
                        <td className="py-3 text-center">Đôi</td>
                        <td className="py-3 text-right font-bold text-rose-500">10</td>
                        <td className="py-3 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--tint-success-soft)] text-[var(--md-success)] border border-[var(--tint-success-border)] whitespace-nowrap uppercase">Mới nguyên hộp</span></td>
                      </tr>
                    </>
                  )}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TRANSFER TICKET MODAL */}
      <Modal isOpen={showCreateTransfer} onClose={() => { setShowCreateTransfer(false); setErrors({}); }}
        title="TẠO PHIẾU CHUYỂN KHO NỘI BỘ" size="full"
        footer={<>
          <button className="btn btn-outline text-xs" onClick={() => { setShowCreateTransfer(false); setErrors({}); }}>HỦY BỎ</button>
          <button className="btn btn-filled text-xs" onClick={handleCreateTransferSubmit}>TẠO PHIẾU CHUYỂN</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Kho bãi nguồn" required error={errors.fromWarehouseId}>
            <select className={`form-select ${errors.fromWarehouseId ? 'border-[var(--md-error)]' : ''}`}
              value={transferForm.fromWarehouseId} onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho nguồn --</option>
              {warehouses.filter(w => w.group !== 'Kho hư lỗi' && w.group !== 'Kho bảo hành').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Kho bãi đích" required error={errors.toWarehouseId}>
            <select className={`form-select ${errors.toWarehouseId ? 'border-[var(--md-error)]' : ''}`}
              value={transferForm.toWarehouseId} onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho đích --</option>
              {warehouses.filter(w => w.id !== transferForm.fromWarehouseId && w.group !== 'Kho hư lỗi' && w.group !== 'Kho bảo hành').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Lý do chuyển kho" className="md:col-span-2">
            <textarea className="form-input text-xs" rows={2} value={transferForm.note}
              onChange={e => setTransferForm({ ...transferForm, note: e.target.value })} placeholder="VD: Chuyển hàng cân bằng tồn kho..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-xs uppercase text-[var(--md-on-surface)]">Danh sách hàng hóa luân chuyển</h4>
          <button className="btn btn-outline text-[10px] py-1 px-2.5" onClick={() => setTransferForm({ ...transferForm, items: [...transferForm.items, { productId: '', qty: '' }] })}>
            <Plus size={12} /> Thêm dòng
          </button>
        </div>
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}
        <div className="overflow-x-auto table-scroll">
          <table className="form-table text-xs" style={{ minWidth: '750px' }}>
            <thead>
              <tr>
                <th className="table-header-cell w-10">STT</th>
                <th className="table-header-cell">Sản phẩm</th>
                <th className="table-header-cell w-32">Số lượng</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody>
              {transferForm.items.map((it, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-xs" value={it.productId}
                      onChange={e => {
                        const items = [...transferForm.items];
                        items[i].productId = e.target.value;
                        setTransferForm({ ...transferForm, items });
                      }}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="1" className={`form-input text-xs text-right ${errors[`item_qty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.qty} onChange={e => {
                        const items = [...transferForm.items];
                        items[i].qty = e.target.value;
                        setTransferForm({ ...transferForm, items });
                      }} placeholder="0" />
                    {errors[`item_qty_${i}`] && <p className="text-[var(--md-error)] text-[9px] mt-0.5">{errors[`item_qty_${i}`]}</p>}
                  </td>
                  <td className="table-cell text-center">
                    {transferForm.items.length > 1 && (
                      <button className="p-1 text-[var(--md-error)]" onClick={() => {
                        setTransferForm({ ...transferForm, items: transferForm.items.filter((_, idx) => idx !== i) });
                      }}><Trash2 size={12} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* CREATE LOAN REQUEST MODAL */}
      <Modal isOpen={showCreateLoan} onClose={() => setShowCreateLoan(false)}
        title="YÊU CẦU MƯỢN VẬT TƯ LIÊN DỰ ÁN KHẨN CẤP" size="md"
        footer={<>
          <button className="btn btn-outline text-xs" onClick={() => setShowCreateLoan(false)}>HỦY BỎ</button>
          <button className="btn btn-filled text-xs" onClick={handleCreateLoanSubmit}>GỬI YÊU CẦU MƯỢN</button>
        </>}
      >
        <div className="space-y-4">
          <FormField label="Dự án thiếu hụt (Dự án mượn)" required>
            <select className="form-select" value={loanForm.borrowingProjectId}
              onChange={e => setLoanForm({ ...loanForm, borrowingProjectId: e.target.value })}>
              <option value="">-- Chọn dự án thiếu hụt --</option>
              {projects.filter(p => p.stage !== 'Đóng/Hoàn thành').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Dự án đối tác có dư thừa (Dự án cho mượn)" required>
            <select className="form-select" value={loanForm.lendingProjectId}
              onChange={e => setLoanForm({ ...loanForm, lendingProjectId: e.target.value })}>
              <option value="">-- Chọn dự án cho mượn --</option>
              {projects.filter(p => p.id !== loanForm.borrowingProjectId).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Sản phẩm mượn tạm" required>
            <select className="form-select" value={loanForm.productId}
              onChange={e => setLoanForm({ ...loanForm, productId: e.target.value })}>
              <option value="">-- Chọn vật tư cần mượn --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Số lượng mượn" required>
            <input type="number" min="1" className="form-input text-xs"
              value={loanForm.qty} onChange={e => setLoanForm({ ...loanForm, qty: e.target.value })}
              placeholder="Nhập số lượng..." />
          </FormField>

          <FormField label="Lý do mượn khẩn cấp">
            <textarea className="form-input text-xs" rows={2} value={loanForm.note}
              onChange={e => setLoanForm({ ...loanForm, note: e.target.value })}
              placeholder="Nhập lý do mượn (VD: Thiếu hụt vật tư chờ PO-002410)..." />
          </FormField>

          <div className="bg-[var(--tint-primary-soft)] p-3 rounded-lg border text-[11px] text-[var(--md-on-surface-variant)] flex items-start gap-2">
            <AlertTriangle size={14} className="text-[var(--md-primary)] flex-shrink-0 mt-0.5" />
            <p>
              **BẢO MẬT & ĐỐI CHIẾU PM**: Yêu cầu mượn vật tư sau khi tạo sẽ ở trạng thái **Chờ duyệt PM**. Bắt buộc PM của cả 2 dự án phải thực hiện ký số xác nhận thì vật tư mới được luân chuyển thực tế.
            </p>
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL FOR INTERNAL TRANSFERS */}
      {selectedTransfer && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title={`CHI TIẾT PHIẾU CHUYỂN KHO — ${selectedTransfer.voucherCode}`}
          size="lg"
          footer={<button className="btn btn-outline text-xs" onClick={() => setShowDetail(false)}>ĐÓNG</button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Mã chứng từ:</span>
                <span className="font-bold text-[var(--md-primary)] text-sm">{selectedTransfer.voucherCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ngày luân chuyển:</span>
                <span className="font-bold">{selectedTransfer.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Kho bãi nguồn:</span>
                <span className="font-bold">{selectedTransfer.fromWarehouseName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Kho bãi tiếp nhận:</span>
                <span className="font-bold">{selectedTransfer.toWarehouseName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Người tạo:</span>
                <span className="font-bold block">{selectedTransfer.createdBy || 'Hệ thống'}</span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] font-semibold">Lúc {selectedTransfer.createdTime || '08:30'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ghi chú điều phối:</span>
                <p className="font-semibold">{selectedTransfer.note || '—'}</p>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase text-[var(--md-on-surface)] mt-4">Danh sách hàng hóa luân chuyển</h4>
            
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                  <th className="py-2 text-left font-semibold">Tên hàng / SKU</th>
                  <th className="py-2 text-center font-semibold w-24">ĐVT</th>
                  <th className="py-2 text-right font-semibold w-24">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransfer.items?.map((it, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                    <td className="py-2">
                      <div className="font-bold">{it.name}</div>
                      <div className="text-[10px] font-mono text-[var(--md-on-surface-variant)]">{it.sku}</div>
                    </td>
                    <td className="py-2 text-center">{it.unit}</td>
                    <td className="py-2 text-right font-bold">{it.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* DETAIL MODAL FOR LOANS */}
      {selectedLoan && (
        <Modal
          isOpen={showLoanDetail}
          onClose={() => setShowLoanDetail(false)}
          title={`CHI TIẾT PHIẾU MƯỢN VẬT TƯ — ${selectedLoan.voucherCode}`}
          size="md"
          footer={<button className="btn btn-outline text-xs" onClick={() => setShowLoanDetail(false)}>ĐÓNG</button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Mã yêu cầu:</span>
                <span className="font-bold text-[var(--md-primary)] text-sm">{selectedLoan.voucherCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ngày yêu cầu:</span>
                <span className="font-bold">{selectedLoan.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Dự án mượn:</span>
                <span className="font-bold text-[var(--md-on-surface)]">
                  {projects.find(p => p.id === selectedLoan.borrowingProjectId)?.name || 'Dự án mượn'}
                </span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] block font-semibold">
                  PM: {projects.find(p => p.id === selectedLoan.borrowingProjectId)?.pm} ({selectedLoan.borrowPmSigned ? 'Đã ký' : 'Chưa ký'})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Dự án cho mượn:</span>
                <span className="font-bold text-[var(--md-on-surface)]">
                  {projects.find(p => p.id === selectedLoan.lendingProjectId)?.name || 'Dự án cho mượn'}
                </span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] block font-semibold">
                  PM: {projects.find(p => p.id === selectedLoan.lendingProjectId)?.pm} ({selectedLoan.lendPmSigned ? 'Đã ký' : 'Chưa ký'})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Người tạo:</span>
                <span className="font-bold block">{selectedLoan.createdBy || 'PM Mượn'}</span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] font-semibold">Lúc {selectedLoan.createdTime || '09:00'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Trạng thái:</span>
                <div className="mt-1">
                  <Badge status={selectedLoan.status === 'pending' ? 'loan_pending' : selectedLoan.status} />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Lý do mượn vật tư:</span>
                <p className="font-semibold">{selectedLoan.note || '—'}</p>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase text-[var(--md-on-surface)] mt-4">Vật tư yêu cầu luân chuyển</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                  <th className="py-2 text-left font-semibold">Tên hàng / SKU</th>
                  <th className="py-2 text-center font-semibold w-24">ĐVT</th>
                  <th className="py-2 text-right font-semibold w-24">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const prod = products.find(p => p.id === selectedLoan.productId);
                  return (
                    <tr className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                      <td className="py-2">
                        <div className="font-bold">{prod?.name || 'Vật tư'}</div>
                        <div className="text-[10px] font-mono text-[var(--md-on-surface-variant)]">{prod?.sku || ''}</div>
                      </td>
                      <td className="py-2 text-center">{prod?.unit || 'Cái'}</td>
                      <td className="py-2 text-right font-bold">{selectedLoan.qty}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
