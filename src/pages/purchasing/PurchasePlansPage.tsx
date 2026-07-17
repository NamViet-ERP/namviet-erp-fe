import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import PlanDetailModal from '../../components/purchasing/PlanDetailModal';
import PlanYcmhHistoryModal from '../../components/purchasing/PlanYcmhHistoryModal';
import CreateYcmhFromPlansModal from '../../components/purchasing/CreateYcmhFromPlansModal';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import type { PlanScope, PurchasePlanRow } from '../../data/purchasingMock';
import { usePurchasingStore, updatePlanPlanning } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS, type ListPageSize } from '../../constants/pagination';
import type { PlanDetailMode } from '../../components/purchasing/PlanDetailModal';

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'Chưa YCMH', label: 'Chưa YCMH' },
  { id: 'YCMH 1 phần', label: 'YCMH 1 phần' },
  { id: 'Đã YCMH đủ', label: 'Đã YCMH đủ' },
] as const;

/** UI pixel bám ERP /admin/purchase_plan — mock data, BE gắn sau. */
export default function PurchasePlansPage() {
  const { plans: rows, requests } = usePurchasingStore();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<{ plan: PurchasePlanRow; mode: PlanDetailMode } | null>(null);
  const [scope, setScope] = useState<PlanScope>('machine');
  const [itemQuery, setItemQuery] = useState('');
  const [itemType, setItemType] = useState('');
  const [category, setCategory] = useState('');
  const [showAllMachines, setShowAllMachines] = useState(false);
  const [statusTab, setStatusTab] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const scoped = useMemo(
    () => rows.filter(r => r.scope === scope),
    [rows, scope],
  );

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { '': scoped.length };
    for (const t of STATUS_TABS) {
      if (!t.id) continue;
      map[t.id] = scoped.filter(r => r.status === t.id).length;
    }
    return map;
  }, [scoped]);

  const filtered = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    const tq = tableSearch.trim().toLowerCase();
    return scoped.filter(r => {
      if (statusTab && r.status !== statusTab) return false;
      if (scope === 'machine' && itemType && r.itemType !== itemType) return false;
      if (category && r.category !== category) return false;
      if (scope === 'machine' && !showAllMachines) {
        const remain = Number(String(r.remainingQty).replace(/[^\d.-]/g, '')) || 0;
        if (remain <= 0) return false;
      }
      if (q && ![r.itemCode, r.item].some(v => v.toLowerCase().includes(q))) return false;
      if (tq && ![r.code, r.itemCode, r.item, r.project, r.itemType].some(v => v.toLowerCase().includes(tq))) {
        return false;
      }
      return true;
    });
  }, [scoped, scope, statusTab, itemType, category, itemQuery, tableSearch, showAllMachines]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const allPageSelected = pageRows.length > 0 && pageRows.every(r => selected.includes(r.id));
  const ycmhEligible = selected.filter(id => {
    const p = rows.find(r => r.id === id);
    return p && Number(p.remainingQty) > 0 && p.status !== 'Đã YCMH đủ';
  });
  const hasCreatablePlans = scoped.some(p => Number(p.remainingQty) > 0 && p.status !== 'Đã YCMH đủ');
  const historyCount = requests.length;

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(prev => prev.filter(id => !pageRows.some(r => r.id === id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...pageRows.map(r => r.id)])]);
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const resetFilters = () => {
    setItemQuery('');
    setItemType('');
    setCategory('');
    setStatusTab('');
    setTableSearch('');
    setShowAllMachines(false);
    setSelected([]);
    setPage(1);
  };

  const openCreateYcmh = () => {
    if (selected.length === 0) {
      showToast('warning', 'Xin vui lòng chọn mặt hàng cần tạo YCMH');
      return;
    }
    if (ycmhEligible.length === 0) {
      showToast('warning', 'Các dòng đã chọn đều đã YCMH đủ hoặc hết số lượng còn lại.');
      return;
    }
    setCreateOpen(true);
  };

  return (
    <div className={`page-shell pur-erp pur-erp--plan pur-erp--plan-${scope}`}>
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Kế hoạch mua hàng</h1>
          <p className="pur-erp__subtitle">
            {scope === 'machine' ? 'Máy & thiết bị — dự kiến có hàng / xuất hàng' : 'Phụ tùng & vật tư — nhu cầu mua theo danh mục'}
          </p>
        </div>
        <div className="pur-erp__head-actions">
          <button type="button" className="pur-erp__action pur-erp__action--history" onClick={() => setHistoryOpen(true)}>
            Lịch sử YCMH
            {historyCount > 0 ? <span className="pur-erp__badge">{historyCount}</span> : null}
          </button>
          <button
            type="button"
            className="pur-erp__action pur-erp__action--primary"
            disabled={!hasCreatablePlans}
            title={
              !hasCreatablePlans
                ? 'Không còn dòng nào có thể tạo YCMH'
                : selected.length === 0
                  ? 'Chọn dòng bằng checkbox rồi tạo YCMH'
                  : `Tạo YCMH cho ${ycmhEligible.length} dòng đã chọn`
            }
            onClick={openCreateYcmh}
          >
            Tạo YCMH
          </button>
        </div>
      </header>

      <div className="pur-erp__workspace">
        <div className="pur-erp__filter-card pur-erp__filter-card--plan">
          <div className={`pur-erp__toolbar pur-erp__toolbar--${scope}`}>
            <div className="pur-erp__scope-row" role="tablist" aria-label="Loại kế hoạch">
              <button
                type="button"
                role="tab"
                aria-selected={scope === 'machine'}
                className={`pur-erp__scope-btn pur-erp__scope-btn--machine${scope === 'machine' ? ' is-active' : ''}`}
                onClick={() => {
                  setScope('machine');
                  setSelected([]);
                  setItemType('');
                  setCategory('');
                  setShowAllMachines(false);
                  setPage(1);
                }}
              >
                KHMH máy
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scope === 'parts'}
                className={`pur-erp__scope-btn pur-erp__scope-btn--parts${scope === 'parts' ? ' is-active' : ''}`}
                onClick={() => {
                  setScope('parts');
                  setSelected([]);
                  setItemType('');
                  setCategory('');
                  setShowAllMachines(false);
                  setPage(1);
                }}
              >
                KHMH phụ tùng
              </button>
            </div>

            <div className="pur-erp__toolbar-fields">
              <label className="pur-erp__field pur-erp__field--query">
                <span>Mã / Tên hàng</span>
                <input
                  className="form-input form-input-md"
                  value={itemQuery}
                  onChange={e => { setItemQuery(e.target.value); setPage(1); }}
                  placeholder="Nhập Mã/ Tên Hàng"
                />
              </label>
              {scope === 'machine' ? (
                <>
                  <label className="pur-erp__field">
                    <span>Loại hàng</span>
                    <select className="form-input form-input-md" value={itemType} onChange={e => { setItemType(e.target.value); setPage(1); }}>
                      <option value="">Loại hàng</option>
                      <option value="Máy">Máy</option>
                    </select>
                  </label>
                  <label className="pur-erp__field">
                    <span>Danh mục</span>
                    <select className="form-input form-input-md" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                      <option value="">Nhóm thành phẩm</option>
                      <option value="Nhóm thành phẩm">Nhóm thành phẩm</option>
                    </select>
                  </label>
                  <label className="pur-erp__check">
                    <input type="checkbox" checked={showAllMachines} onChange={e => { setShowAllMachines(e.target.checked); setPage(1); }} />
                    Hiện tất cả máy
                  </label>
                </>
              ) : (
                <label className="pur-erp__field">
                  <span>Danh mục</span>
                  <select className="form-input form-input-md" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                    <option value="">Danh mục phụ tùng</option>
                    <option value="Nguyên liệu">Nguyên liệu</option>
                    <option value="Phụ tùng">Phụ tùng</option>
                  </select>
                </label>
              )}
            </div>

            <div className="pur-erp__toolbar-actions">
              <button type="button" className="pur-erp__export" onClick={() => showToast('info', `Xuất ${filtered.length} dòng (UI demo).`)}>
                <Download size={13} aria-hidden />
                Xuất ra
              </button>
              <button type="button" className="pur-erp__icon-btn" aria-label="Làm mới bộ lọc" onClick={resetFilters}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="pur-erp__selection" role="status">
            <span>
              Đã chọn <strong>{selected.length}</strong> dòng
              {ycmhEligible.length > 0 ? <> · tạo được <strong>{ycmhEligible.length}</strong></> : null}
            </span>
            <div className="pur-erp__head-actions">
              <button type="button" className="btn btn-text btn-sm" onClick={() => setSelected([])}>Bỏ chọn</button>
              <button
                type="button"
                className="pur-erp__action pur-erp__action--primary"
                disabled={ycmhEligible.length === 0}
                onClick={openCreateYcmh}
              >
                Tạo YCMH
              </button>
            </div>
          </div>
        )}

        <div className="pur-erp__panel">
          <div className="pur-erp__tabs-row">
            <div className="pur-erp__tabs" role="tablist" aria-label="Tiến độ YCMH">
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
            <EmptyState message={rows.length === 0 ? 'Chưa có dòng kế hoạch mua hàng.' : 'Không có dòng khớp bộ lọc.'} />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                {scope === 'machine' ? (
                  <table className="pur-erp__table pur-erp__table--plan">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="pur-erp__th-check">
                          <input type="checkbox" checked={allPageSelected} onChange={toggleAll} aria-label="Chọn tất cả trang" />
                        </th>
                        <th rowSpan={2} className="pur-erp__th-num">STT</th>
                        <th rowSpan={2}>Mã HH/Model</th>
                        <th rowSpan={2} className="pur-erp__th-num">Công suất (HP)</th>
                        <th rowSpan={2} className="pur-erp__th-num">SL tối thiểu</th>
                        <th rowSpan={2} className="pur-erp__th-num">Tồn kho thực tế</th>
                        <th colSpan={2} className="pur-erp__th-group">Dự kiến</th>
                        <th rowSpan={2} className="pur-erp__th-num">Planing</th>
                        <th rowSpan={2} className="pur-erp__th-num">Báo giá &gt; 70%</th>
                        <th rowSpan={2} className="pur-erp__th-num">Đã YCMH</th>
                        <th rowSpan={2} className="pur-erp__th-num">Còn lại</th>
                      </tr>
                      <tr className="pur-erp__subhead">
                        <th className="pur-erp__th-num">Có hàng</th>
                        <th className="pur-erp__th-num">Xuất hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, idx) => {
                        const selectedRow = selected.includes(row.id);
                        const remain = Number(String(row.remainingQty).replace(/[^\d.-]/g, ''));
                        const live = rows.find(r => r.id === row.id) ?? row;
                        const openDetail = (mode: PlanDetailMode) => (e: ReactMouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDetail({ plan: live, mode });
                        };
                        return (
                          <tr key={row.id} className={selectedRow ? 'is-selected' : undefined}>
                            <td className="pur-erp__td-check">
                              <input
                                type="checkbox"
                                checked={selectedRow}
                                onChange={() => toggleOne(row.id)}
                                aria-label={`Chọn ${row.itemCode}`}
                              />
                            </td>
                            <td className="pur-erp__td-num">{(safePage - 1) * pageSize + idx + 1}</td>
                            <td className="pur-erp__td-code">
                              <div className="pur-erp__link-cell">{row.itemCode}</div>
                            </td>
                            <td className="pur-erp__td-num">{row.horsepower}</td>
                            <td className="pur-erp__td-num">{row.minQty}</td>
                            <td
                              className="pur-erp__td-num pur-erp__td-click"
                              onClick={() => setDetail({ plan: live, mode: 'forecast' })}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setDetail({ plan: live, mode: 'forecast' });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title="Chi tiết tồn kho"
                            >
                              <span className="pur-erp__cell-link">{row.stockQty}</span>
                            </td>
                            <td
                              className="pur-erp__td-num pur-erp__td-click"
                              onClick={openDetail('forecast')}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setDetail({ plan: live, mode: 'forecast' });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title="Chi tiết dự kiến có hàng"
                            >
                              <span className="pur-erp__cell-link">{row.forecastAvailable || '0'}</span>
                            </td>
                            <td
                              className="pur-erp__td-num pur-erp__td-click"
                              onClick={openDetail('outbound')}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setDetail({ plan: live, mode: 'outbound' });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title="Chi tiết xuất hàng"
                            >
                              <span className="pur-erp__cell-link">{row.forecastOutbound || '0'}</span>
                            </td>
                            <td className="pur-erp__td-planing" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                className="pur-erp__planing-input"
                                inputMode="decimal"
                                value={live.planning}
                                aria-label={`Planing ${row.itemCode}`}
                                onChange={e => updatePlanPlanning(row.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td
                              className="pur-erp__td-num pur-erp__td-click"
                              onClick={openDetail('quote')}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setDetail({ plan: live, mode: 'quote' });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title="Chi tiết báo giá > 70%"
                            >
                              <span className="pur-erp__cell-link pur-erp__cell-link--bold">{row.quoteOver70 || '0'}</span>
                            </td>
                            <td className="pur-erp__td-num">{row.requestedQty}</td>
                            <td className={`pur-erp__td-num pur-erp__remain${remain > 0 ? ' is-warn' : ''}`}>
                              {row.remainingQty}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="pur-erp__table pur-erp__table--plan pur-erp__table--plan-parts">
                    <thead>
                      <tr>
                        <th className="pur-erp__th-check">
                          <input type="checkbox" checked={allPageSelected} onChange={toggleAll} aria-label="Chọn tất cả trang" />
                        </th>
                        <th>Mã /Tên hàng</th>
                        <th>Loại</th>
                        <th className="pur-erp__th-num">Tổng số lượng cần</th>
                        <th className="pur-erp__th-num">SL tồn kho</th>
                        <th className="pur-erp__th-num">SL tối thiểu</th>
                        <th className="pur-erp__th-num">Planing cần mua</th>
                        <th className="pur-erp__th-num">Đã YCMH</th>
                        <th className="pur-erp__th-num">Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map(row => {
                        const selectedRow = selected.includes(row.id);
                        const remain = Number(String(row.remainingQty).replace(/[^\d.-]/g, ''));
                        const live = rows.find(r => r.id === row.id) ?? row;
                        return (
                          <tr key={row.id} className={selectedRow ? 'is-selected' : undefined}>
                            <td className="pur-erp__td-check">
                              <input
                                type="checkbox"
                                checked={selectedRow}
                                onChange={() => toggleOne(row.id)}
                                aria-label={`Chọn ${row.itemCode}`}
                              />
                            </td>
                            <td className="pur-erp__td-item">
                              <div className="pur-erp__item-name">
                                <strong>{row.itemCode}</strong>
                                <span>{row.item}</span>
                              </div>
                            </td>
                            <td>{row.itemType}</td>
                            <td className="pur-erp__td-num">{row.qty}</td>
                            <td className="pur-erp__td-num">{row.stockQty}</td>
                            <td className="pur-erp__td-num">{row.minQty}</td>
                            <td className="pur-erp__td-planing" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                className="pur-erp__planing-input"
                                inputMode="decimal"
                                value={live.planning}
                                aria-label={`Planing ${row.itemCode}`}
                                onChange={e => updatePlanPlanning(row.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td className="pur-erp__td-num">{row.requestedQty}</td>
                            <td className={`pur-erp__td-num pur-erp__remain${remain > 0 ? ' is-warn' : ''}`}>
                              {row.remainingQty}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <Pagination
                embedded
                itemLabel="dòng"
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                totalItems={filtered.length}
              />
            </>
          )}
        </div>
      </div>

      <PlanYcmhHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <CreateYcmhFromPlansModal
        open={createOpen}
        planIds={ycmhEligible}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setSelected([])}
      />
      <PlanDetailModal
        plan={detail?.plan ?? null}
        mode={detail?.mode ?? null}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
