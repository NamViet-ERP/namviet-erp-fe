import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import StockMaterialProjectModal from '../../components/warehouse/StockMaterialProjectModal';
import { useStockMatrix } from '../../hooks/useStockMatrix';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';
import {
  countActiveProjects,
  sumProjectActual,
  sumProjectPlannedExport,
  sumProjectPlannedImport,
  totalUsableQty,
} from '../../lib/wms/stockMatrixUtils';
import {
  GENERAL_WAREHOUSE_LABEL,
  GENERAL_WAREHOUSE_LABEL_LOWER,
  STOCK_FORMULA_LEGEND,
} from '../../lib/wms/stockTerminology';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import type { StockMatrixRowApiDto } from '../../types/wms';
import { formatCurrency } from '../../utils/formatCurrency';

const STOCK_COL_SPAN = 12;

export default function ApiStockMatrixView() {
  const { data: rows = [], isLoading, isError } = useStockMatrix();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRow, setSelectedRow] = useState<StockMatrixRowApiDto | null>(null);

  const projects = rows[0]?.projects ?? [];

  const filtered = rows.filter(row => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      row.materialCode.toLowerCase().includes(q) ||
      row.materialName.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (projectFilter === 'all') return true;
    if (projectFilter === 'general') return row.generalActualQty > 0 || row.generalReservedQty > 0;
    const col = row.projects.find(p => p.projectCode === projectFilter);
    return (col?.actualQty ?? 0) !== 0 || (col?.plannedImportQty ?? 0) !== 0 || (col?.plannedExportQty ?? 0) !== 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="surface-panel surface-panel--rounded-xl p-4 mb-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between page-filter-bar">
          <select
            className="form-select w-full md:w-72 text-sm"
            value={projectFilter}
            onChange={e => { setProjectFilter(e.target.value); setPage(1); }}
          >
            <option value="all">Tất cả vật tư</option>
            <option value="general">Chỉ còn tại {GENERAL_WAREHOUSE_LABEL_LOWER}</option>
            {projects.map(p => (
              <option key={p.projectCode} value={p.projectCode}>{p.projectName}</option>
            ))}
          </select>
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Tìm mã vật tư, tên vật tư..."
          />
        </div>
        <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-3 text-pretty">
          Nhấn dòng vật tư để mở chi tiết phân bổ theo dự án. {STOCK_FORMULA_LEGEND}
        </p>
      </div>

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card stock-matrix-panel">
        <div className="overflow-x-auto wms-inventory-table-wrap wms-inventory-table-wrap--flush-top">
          <table className="wms-inventory-table stock-matrix-table">
            <thead>
              <tr>
                <th className="table-header-cell text-left stock-col-code">Mã vật tư</th>
                <th className="table-header-cell text-left stock-col-name">Tên vật tư</th>
                <th className="table-header-cell text-center w-14">ĐVT</th>
                <th className="table-header-cell text-right w-20">{GENERAL_WAREHOUSE_LABEL}</th>
                <th className="table-header-cell text-right w-20" title="Tồn thực tế − xuất/chuyển dự kiến (kèm kho trung tâm − giữ)">Khả dụng</th>
                <th className="table-header-cell text-right w-20">Nhập dự kiến</th>
                <th className="table-header-cell text-right w-20">Xuất dự kiến</th>
                <th className="table-header-cell text-right stock-col-project whitespace-nowrap">Tồn thực tế</th>
                <th
                  className="table-header-cell text-right w-20 whitespace-nowrap"
                  title="Tổng SL phiếu hàng lỗi (HL) chưa từ chối theo mã vật tư"
                >
                  Hàng lỗi
                </th>
                <th className="table-header-cell text-right stock-col-project whitespace-nowrap" title="Tồn thực tế + nhập/hoàn trả/chuyển kho dự kiến">Tồn dự kiến</th>
                <th className="table-header-cell text-right w-24" title="WAC từ phiếu nhập đã duyệt trong 12 tháng (ngày duyệt)">Giá BQ</th>
                <th className="table-header-cell text-center w-14">Dự án</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={STOCK_COL_SPAN} />
              ) : isError ? (
                <tr>
                  <td colSpan={STOCK_COL_SPAN}>
                    <EmptyState message={WMS_ERROR.loadStock} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={STOCK_COL_SPAN}>
                    <EmptyState message={WMS_EMPTY.noStock} />
                  </td>
                </tr>
              ) : (
                paginated.map((row: StockMatrixRowApiDto) => {
                  const projectActual = sumProjectActual(row);
                  const plannedImport = sumProjectPlannedImport(row);
                  const plannedExport = sumProjectPlannedExport(row);
                  const activeCount = countActiveProjects(row);
                  const usableQty = totalUsableQty(row);

                  return (
                    <tr
                      key={row.materialCode}
                      onClick={() => setSelectedRow(row)}
                      className="wms-inventory-row--interactive stock-matrix-row table-row border-b border-[var(--md-outline-variant)] cursor-pointer"
                    >
                      <td className="table-cell font-mono font-bold stock-col-code" onClick={e => e.stopPropagation()}>
                        <Link
                          to="/warehouse/materials"
                          state={{ highlightCode: row.materialCode }}
                          className="text-[var(--md-primary)] hover:underline stock-cell-truncate"
                          title={row.materialCode}
                        >
                          {row.materialCode}
                        </Link>
                      </td>
                      <td className="table-cell stock-col-name">
                        <span className="font-semibold stock-cell-truncate block" title={row.materialName}>
                          {row.materialName}
                        </span>
                        {row.isActive === false && (
                          <span className="wms-badge-inactive">Ngừng SD</span>
                        )}
                      </td>
                      <td className="table-cell text-center">{row.unit}</td>
                      <td className="table-cell text-right font-bold tabular-nums stock-cell-general">
                        {row.generalActualQty}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums text-[var(--md-success)]">
                        {usableQty}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-qty--pending">
                        {fmtStockQtyOrDash(plannedImport)}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-qty--reserved">
                        {fmtStockQtyOrDash(plannedExport)}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums">
                        {projectActual}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-qty--reserved">
                        {fmtStockQtyOrDash(Number(row.defectedQty) || 0)}
                      </td>
                      <td className="table-cell text-right font-semibold tabular-nums">
                        {fmtPlannedStock(projectActual, plannedImport)}
                      </td>
                      <td className="table-cell text-right tabular-nums text-[var(--md-on-surface)]">
                        {row.weightedAverageUnitCost > 0
                          ? formatCurrency(row.weightedAverageUnitCost)
                          : '—'}
                      </td>
                      <td className="table-cell text-center">
                        {activeCount > 0 ? (
                          <span className="stock-project-badge tabular-nums">{activeCount}</span>
                        ) : (
                          <span className="text-[var(--md-on-surface-variant)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="surface-panel__footer px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              totalItems={filtered.length}
            />
          </div>
        )}
      </div>

      <StockMaterialProjectModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
}
