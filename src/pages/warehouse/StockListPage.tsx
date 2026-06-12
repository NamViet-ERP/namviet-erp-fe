import { useState, Fragment } from 'react';
import { Download, Layers, ClipboardList, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { products } from '../../data/products';
import { projects, initialProjectStocks, initialConsumablesQuotas, ProjectStockCell, ConsumableQuota } from '../../data/projects';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { showToast } from '../../components/ui/Toast';

const getProjectShortName = (name: string) => {
  let cleaned = name.replace(/Dự án |Nhà máy |Sữa |Bia /g, '');
  const words = cleaned.split(' ');
  const firstWord = words[0].toUpperCase();
  if (['HEINEKEN', 'VINAMILK', 'SABECO', 'VINHOMES'].includes(firstWord)) {
    return firstWord;
  }
  if (firstWord === 'THÉP') {
    return (words[1] + (words[2] ? ' ' + words[2] : '')).toUpperCase();
  }
  if (firstWord === 'LỌC' && words[1]?.toUpperCase() === 'DẦU') {
    return (words[2] + (words[3] ? ' ' + words[3] : '')).toUpperCase();
  }
  return cleaned.toUpperCase();
};

export default function StockListPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'consumables'>('matrix');
  const [projectStocks, setProjectStocks] = useState<ProjectStockCell[]>(initialProjectStocks);
  const [consumablesQuotas, setConsumablesQuotas] = useState<ConsumableQuota[]>(initialConsumablesQuotas);
  const [search, setSearch] = useState<string>('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');

  const displayedProjects = selectedProjectFilter === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProjectFilter);
  
  // Matrix Pagination
  const [matrixPage, setMatrixPage] = useState<number>(1);
  const [matrixPageSize, setMatrixPageSize] = useState<number>(10);
  
  // Consumables Pagination
  const [consPage, setConsPage] = useState<number>(1);
  const [consPageSize, setConsPageSize] = useState<number>(10);

  // Expandable row state in matrix table
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Consumable issuance Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    projectId: '',
    productId: '',
    qty: ''
  });

  const toggleRow = (prodId: string) => {
    if (expandedRow === prodId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(prodId);
    }
  };

  // 1. Process Stock Matrix Data
  const matrixData = products.map(p => {
    const stocks: Record<string, number> = {};
    // Get stock for general and projects
    const generalCell = projectStocks.find(s => s.productId === p.id && s.projectId === 'general');
    stocks['general'] = generalCell ? generalCell.closingQty : 0;
    
    projects.forEach(proj => {
      const cell = projectStocks.find(s => s.productId === p.id && s.projectId === proj.id);
      stocks[proj.id] = cell ? cell.closingQty : 0;
    });

    const actualQty = Object.values(stocks).reduce((sum, val) => sum + val, 0);
    // Mock incoming, reserved, available qty
    const incomingQty = Math.floor(actualQty * 0.15);
    const reservedQty = Math.floor(actualQty * 0.1);
    const availableQty = actualQty + incomingQty - reservedQty;

    return {
      ...p,
      stocks,
      actualQty,
      incomingQty,
      reservedQty,
      availableQty
    };
  });

  // Filter matrix data
  const filteredMatrix = matrixData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    if (selectedProjectFilter === 'all') return matchesSearch;
    if (selectedProjectFilter === 'general') return matchesSearch && item.stocks['general'] > 0;
    return matchesSearch && (item.stocks[selectedProjectFilter] || 0) > 0;
  });

  const matrixTotalPages = Math.ceil(filteredMatrix.length / matrixPageSize);
  const paginatedMatrix = filteredMatrix.slice((matrixPage - 1) * matrixPageSize, matrixPage * matrixPageSize);

  // 2. Process Consumables Quota Data
  const consumablesData = consumablesQuotas.map(cq => {
    const proj = projects.find(pr => pr.id === cq.projectId);
    const prod = products.find(p => p.id === cq.productId);
    const remaining = cq.quotaQty - cq.issuedQty;
    const isExceeded = remaining < 0;

    return {
      ...cq,
      projectName: proj?.name || 'Không rõ',
      productName: prod?.name || 'Không rõ',
      productSku: prod?.sku || '',
      unit: prod?.unit || 'Hộp',
      remaining,
      isExceeded
    };
  });

  // Filter consumables data
  const filteredConsumables = consumablesData.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || item.productSku.toLowerCase().includes(search.toLowerCase());
    const matchesProject = selectedProjectFilter === 'all' || item.projectId === selectedProjectFilter;
    return matchesSearch && matchesProject;
  });

  const consTotalPages = Math.ceil(filteredConsumables.length / consPageSize);
  const paginatedConsumables = filteredConsumables.slice((consPage - 1) * consPageSize, consPage * consPageSize);

  const handleOpenIssueModal = () => {
    setIssueForm({
      projectId: projects[0]?.id || '',
      productId: 'p-013', // default to welding rod
      qty: ''
    });
    setShowIssueModal(true);
  };

  const handleIssueSubmit = () => {
    if (!issueForm.projectId || !issueForm.productId || !issueForm.qty || Number(issueForm.qty) <= 0) {
      showToast('error', 'Vui lòng chọn đầy đủ thông tin và nhập số lượng hợp lệ.');
      return;
    }

    const qtyVal = Number(issueForm.qty);
    // Find and update consumable quota
    const exists = consumablesQuotas.find(cq => cq.projectId === issueForm.projectId && cq.productId === issueForm.productId);
    
    if (exists) {
      setConsumablesQuotas(prev => prev.map(cq => 
        (cq.projectId === issueForm.projectId && cq.productId === issueForm.productId)
          ? { ...cq, issuedQty: cq.issuedQty + qtyVal }
          : cq
      ));
    } else {
      // Create a new allocation entry
      setConsumablesQuotas(prev => [...prev, {
        projectId: issueForm.projectId,
        productId: issueForm.productId,
        quotaQty: 100, // default quota
        issuedQty: qtyVal
      }]);
    }

    // Deduct from general warehouse stock, and add to project stock cells
    setProjectStocks(prev => prev.map(cell => {
      if (cell.productId === issueForm.productId) {
        if (cell.projectId === 'general') {
          return { ...cell, exportQty: cell.exportQty + qtyVal, closingQty: Math.max(0, cell.closingQty - qtyVal) };
        }
        if (cell.projectId === issueForm.projectId) {
          return { ...cell, importQty: cell.importQty + qtyVal, closingQty: cell.closingQty + qtyVal };
        }
      }
      return cell;
    }));

    const projName = projects.find(pr => pr.id === issueForm.projectId)?.name;
    const prodName = products.find(p => p.id === issueForm.productId)?.name;
    
    showToast('success', `Đã cấp phát thành công ${qtyVal} ${products.find(p => p.id === issueForm.productId)?.unit} ${prodName} cho ${projName}!`, 'Cấp phát thành công');
    setShowIssueModal(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="KHO VT CHÍNH MAYZER"
        title="MA TRẬN TỒN KHO DỰ ÁN & ĐỊNH MỨC"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-outline text-xs">
              <Download size={14} /> XUẤT EXCEL MATRIX
            </button>
            {activeTab === 'consumables' && (
              <button className="btn btn-filled text-xs" onClick={handleOpenIssueModal}>
                <Plus size={14} /> CẤP PHÁT ĐỊNH MỨC
              </button>
            )}
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--md-outline-variant)] pb-px">
        <button
          onClick={() => { setActiveTab('matrix'); setSearch(''); setSelectedProjectFilter('all'); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'matrix'
              ? 'border-[var(--md-primary)] text-[var(--md-primary)] bg-[var(--tint-primary-weak)] rounded-t-xl'
              : 'border-transparent text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
        >
          <Layers size={16} /> MA TRẬN TỒN KHO CÔNG TRÌNH
        </button>
        <button
          onClick={() => { setActiveTab('consumables'); setSearch(''); setSelectedProjectFilter('all'); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'consumables'
              ? 'border-[var(--md-primary)] text-[var(--md-primary)] bg-[var(--tint-primary-weak)] rounded-t-xl'
              : 'border-transparent text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
          }`}
        >
          <ClipboardList size={16} /> ĐỊNH MỨC VẬT TƯ TIÊU HAO
        </button>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl shadow-card p-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select
              className="form-select w-full md:w-64 text-sm"
              value={selectedProjectFilter}
              onChange={e => { setSelectedProjectFilter(e.target.value); setMatrixPage(1); setConsPage(1); }}
            >
              <option value="all">Tất cả dự án & Kho tổng</option>
              <option value="general">Kho tổng (General Warehouse)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
              ))}
            </select>
          </div>
          <SearchBar
            value={search}
            onChange={e => { setSearch(e); setMatrixPage(1); setConsPage(1); }}
            placeholder={activeTab === 'matrix' ? 'Tìm mã SKU, tên vật tư máy nén khí...' : 'Tìm kiếm găng tay, que hàn, đá cắt...'}
          />
        </div>
      </div>

      {activeTab === 'matrix' ? (
        /* TAB 1: PROJECT STOCK MATRIX */
        <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          {filteredMatrix.length === 0 ? (
            <EmptyState message="Không tìm thấy dữ liệu tồn kho phù hợp!" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '1300px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--md-outline-variant)' }}>
                    <th className="table-header-cell text-left py-3 w-10"></th>
                    <th className="table-header-cell text-left font-bold">MÃ SKU</th>
                    <th className="table-header-cell text-left font-bold">TÊN VẬT TƯ / MÁY</th>
                    <th className="table-header-cell text-center font-bold">ĐVT</th>
                    <th className="table-header-cell text-right font-bold">KHO TỔNG</th>
                    {displayedProjects.map(proj => {
                      const shortName = getProjectShortName(proj.name);
                      return (
                        <th key={proj.id} className="table-header-cell text-right font-semibold whitespace-nowrap">{shortName}</th>
                      );
                    })}
                    <th className="table-header-cell text-right font-bold">TỔNG TỒN</th>
                    <th className="table-header-cell text-right font-semibold">ĐANG VỀ</th>
                    <th className="table-header-cell text-right font-semibold">GIỮ KHO</th>
                    <th className="table-header-cell text-right font-bold">KHẢ DỤNG</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMatrix.map((p) => {
                    const isExpanded = expandedRow === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr
                          key={p.id}
                          onClick={() => toggleRow(p.id)}
                          className={`hover:bg-[var(--tint-primary-weak)] cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[var(--tint-primary-weak)]' : 'border-b border-[var(--md-outline-variant)]'
                          }`}
                        >
                          <td className="table-cell text-center font-bold text-lg text-[var(--md-outline)]">
                            {isExpanded ? '−' : '+'}
                          </td>
                          <td className="table-cell font-bold text-[var(--md-primary)] font-mono">{p.sku}</td>
                          <td className="table-cell font-semibold text-[var(--md-on-surface)]">{p.name}</td>
                          <td className="table-cell text-center">{p.unit}</td>
                          {/* Closing stocks */}
                          <td className="table-cell text-right font-bold text-[var(--md-primary)]" style={{ background: 'var(--tint-primary-weak)' }}>{p.stocks['general']}</td>
                          {displayedProjects.map(proj => (
                            <td key={proj.id} className="table-cell text-right">{p.stocks[proj.id] || '—'}</td>
                          ))}
                          <td className="table-cell text-right font-extrabold text-[var(--md-on-surface)]" style={{ borderLeft: '1px solid var(--md-outline-variant)' }}>{p.actualQty}</td>
                          <td className="table-cell text-right text-amber-600 font-medium">+{p.incomingQty}</td>
                          <td className="table-cell text-right text-rose-500 font-medium">-{p.reservedQty}</td>
                          <td className="table-cell text-right font-black text-[var(--md-success)]" style={{ background: 'var(--tint-success-soft)', borderLeft: '1px solid var(--md-outline-variant)' }}>{p.availableQty}</td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[var(--tint-primary-weak)] border-b border-[var(--md-outline-variant)]">
                            <td colSpan={14} className="p-4">
                              <div className="rounded-xl p-4 border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] space-y-3">
                                <h4 className="font-bold text-[var(--md-primary)] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <ClipboardList size={14} />
                                  SỔ THẺ KHO DỰ ÁN CHI TIẾT (SCM Ledger): {p.name}
                                </h4>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                                  {/* General */}
                                  {(() => {
                                    const cell = projectStocks.find(s => s.productId === p.id && s.projectId === 'general');
                                    return (
                                      <div className="p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] text-center">
                                        <div className="text-[10px] font-bold text-[var(--md-primary)] uppercase">KHO TỔNG</div>
                                        <div className="grid grid-cols-2 gap-x-1 mt-2 text-[10px] text-left">
                                          <div>Đầu kì:</div><div className="font-bold text-right">{cell?.openingQty || 0}</div>
                                          <div>Nhập:</div><div className="font-bold text-right text-green-600">+{cell?.importQty || 0}</div>
                                          <div>Xuất:</div><div className="font-bold text-right text-rose-500">-{cell?.exportQty || 0}</div>
                                        </div>
                                        <div className="mt-2 border-t pt-1.5 text-xs font-bold text-center">Tồn: {cell?.closingQty || 0}</div>
                                      </div>
                                    );
                                  })()}

                                  {/* Projects cards */}
                                  {displayedProjects.map(proj => {
                                    const cell = projectStocks.find(s => s.productId === p.id && s.projectId === proj.id);
                                    return (
                                      <div key={proj.id} className="p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] text-center">
                                        <div className="text-[10px] font-bold text-[var(--md-on-surface)] truncate uppercase" title={proj.name}>
                                          {proj.name.replace('Dự án ', '').replace('Nhà máy ', '')}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-1 mt-2 text-[10px] text-left">
                                          <div>Đầu kì:</div><div className="font-bold text-right">{cell?.openingQty || 0}</div>
                                          <div>Nhập:</div><div className="font-bold text-right text-green-600">+{cell?.importQty || 0}</div>
                                          <div>Xuất:</div><div className="font-bold text-right text-rose-500">-{cell?.exportQty || 0}</div>
                                        </div>
                                        <div className="mt-2 border-t pt-1.5 text-xs font-bold text-center">Tồn: {cell?.closingQty || 0}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <Pagination
              currentPage={matrixPage}
              totalPages={matrixTotalPages}
              onPageChange={setMatrixPage}
              pageSize={matrixPageSize}
              onPageSizeChange={(s) => { setMatrixPageSize(s); setMatrixPage(1); }}
              totalItems={filteredMatrix.length}
            />
          </div>
        </div>
      ) : (
        /* TAB 2: CONSUMABLES QUOTAS */
        <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          {filteredConsumables.length === 0 ? (
            <EmptyState message="Không tìm thấy định mức vật tư tiêu hao nào!" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--md-outline-variant)' }}>
                    <th className="table-header-cell text-left font-bold py-3 pl-4">DỰ ÁN / CÔNG TRÌNH</th>
                    <th className="table-header-cell text-left font-bold">MÃ SKU</th>
                    <th className="table-header-cell text-left font-bold">VẬT TƯ TIÊU HAO</th>
                    <th className="table-header-cell text-center font-bold">ĐVT</th>
                    <th className="table-header-cell text-right font-bold">ĐỊNH MỨC DỰ TOÁN</th>
                    <th className="table-header-cell text-right font-bold">CẤP PHÁT THỰC TẾ</th>
                    <th className="table-header-cell text-right font-bold">CÒN LẠI</th>
                    <th className="table-header-cell text-center font-bold">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConsumables.map((c, idx) => (
                    <tr key={idx} className="table-row border-b border-[var(--md-outline-variant)] hover:bg-[var(--tint-primary-weak)]">
                      <td className="table-cell font-bold text-[var(--md-on-surface)] pl-4">{c.projectName}</td>
                      <td className="table-cell font-mono font-bold text-gray-500">{c.productSku}</td>
                      <td className="table-cell font-semibold text-[var(--md-on-surface)]">{c.productName}</td>
                      <td className="table-cell text-center">{c.unit}</td>
                      <td className="table-cell text-right font-bold text-[var(--md-primary)]">{c.quotaQty}</td>
                      <td className="table-cell text-right font-bold text-amber-600">{c.issuedQty}</td>
                      <td className={`table-cell text-right font-extrabold ${c.remaining < 0 ? 'text-[var(--md-error)]' : 'text-[var(--md-success)]'}`}>
                        {c.remaining}
                      </td>
                      <td className="table-cell text-center">
                        {c.isExceeded ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--md-error-container)] text-[var(--md-on-error-container)] border border-[var(--md-error)]">
                            <AlertTriangle size={10} /> VƯỢT ĐỊNH MỨC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--md-success-container)] text-[var(--md-on-success-container)]">
                            <CheckCircle size={10} /> HỢP LỆ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <Pagination
              currentPage={consPage}
              totalPages={consTotalPages}
              onPageChange={setConsPage}
              pageSize={consPageSize}
              onPageSizeChange={(s) => { setConsPageSize(s); setConsPage(1); }}
              totalItems={filteredConsumables.length}
            />
          </div>
        </div>
      )}

      {/* QUICK ISSUE CONSUMABLE MODAL */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="CẤP PHÁT VẬT TƯ TIÊU HAO THEO ĐỊNH MỨC"
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowIssueModal(false)}>HỦY BỎ</button>
            <button className="btn btn-primary" onClick={handleIssueSubmit}>XÁC NHẬN CẤP PHÁT</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Dự án nhận vật tư" required>
            <select
              className="form-select"
              value={issueForm.projectId}
              onChange={e => setIssueForm({ ...issueForm, projectId: e.target.value })}
            >
              {projects.filter(p => p.stage !== 'Đóng/Hoàn thành').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Vật tư tiêu hao" required>
            <select
              className="form-select"
              value={issueForm.productId}
              onChange={e => setIssueForm({ ...issueForm, productId: e.target.value })}
            >
              {products.filter(p => p.category === 'Vật tư tiêu hao').map(p => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name} ({p.unit})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Số lượng xuất cấp phát" required>
            <input
              type="number"
              min="1"
              className="form-input"
              value={issueForm.qty}
              onChange={e => setIssueForm({ ...issueForm, qty: e.target.value })}
              placeholder="Nhập số lượng hộp/đôi/viên..."
            />
          </FormField>

          <div className="bg-[var(--tint-primary-soft)] p-3 rounded-lg border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface-variant)] flex items-start gap-2">
            <AlertTriangle size={14} className="text-[var(--md-primary)] flex-shrink-0 mt-0.5" />
            <p>
              Hệ thống sẽ tự động trừ số lượng trong **Kho tổng (General Warehouse)** và ghi nhận khối lượng nhập vào kho của **Dự án thụ hưởng**, đồng thời kiểm đếm trực tiếp vào hạn mức định mức dự toán của dự án.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
