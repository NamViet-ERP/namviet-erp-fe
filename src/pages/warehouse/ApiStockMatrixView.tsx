import { useState } from 'react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import StockMaterialProjectModal from '../../components/warehouse/StockMaterialProjectModal';
import { useStockMatrix } from '../../hooks/useStockMatrix';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';
import {
  countActiveProjects,
  sumProjectActual,
  sumProjectPlannedExport,
  sumProjectPlannedImport,
  totalUsableQty,
} from '../../lib/wms/stockMatrixUtils';
import {
  COMBINED_AVAILABLE_LABEL,
  GENERAL_WAREHOUSE_LABEL,
  GENERAL_WAREHOUSE_LABEL_LOWER,
  PROJECT_STOCK_LABEL,
  STOCK_FORMULA_LEGEND,
} from '../../lib/wms/stockTerminology';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import type { StockMatrixRowApiDto } from '../../types/wms';
import { formatCurrencyVnd } from '../../utils/formatCurrency';

export default function ApiStockMatrixView() {
  const { data: rows = [], isLoading, isError } = useStockMatrix();
  /** Thủ kho không bao giờ thấy giá bình quân (BE PriceVisibility cũng mask). */
  const canViewPrices = useCanViewWmsPrices();
  const colSpan = canViewPrices ? 12 : 11;
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
    return (col?.actualQty ?? 0) !== 0 || (col?.plannedImportQty ?? 0) !== 0 || (col?.plannedExportQty ?? 0) !== 0 || (col?.pendingDefectQty ?? 0) !== 0;
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
                <th className="table-header-cell text-center stock-col-unit">Đơn vị</th>
                <th
                  className="table-header-cell text-right stock-col-qty"
                  title="Sổ kho công ty / kho tổng. Không tăng khi nhập mua vào dự án. Trừ khi xuất thẳng lấy từ kho này và đã xác nhận thực tế."
                >
                  {GENERAL_WAREHOUSE_LABEL}
                </th>
                <th
                  className="table-header-cell text-right stock-col-qty"
                  title="Tổng tồn các kho dự án. Cộng khi xác nhận nhập thực tế vào dự án. Không gồm kho trung tâm."
                >
                  {PROJECT_STOCK_LABEL}
                </th>
                <th
                  className="table-header-cell text-right stock-col-qty"
                  title="(Kho trung tâm − giữ) + Σ(tồn dự án − xuất/chuyển dự kiến − HL chờ duyệt)"
                >
                  {COMBINED_AVAILABLE_LABEL}
                </th>
                <th className="table-header-cell text-right stock-col-qty" title="Chỉ kho dự án">Nhập dự kiến</th>
                <th className="table-header-cell text-right stock-col-qty" title="Chỉ kho dự án">Xuất dự kiến</th>
                <th
                  className="table-header-cell text-right stock-col-qty"
                  title="Tổng SL phiếu hàng lỗi (HL) chưa từ chối theo mã vật tư"
                >
                  Hàng lỗi
                </th>
                <th className="table-header-cell text-right stock-col-qty" title="Tồn kho dự án + nhập/hoàn trả/chuyển kho dự kiến">Tồn DK dự án</th>
                {canViewPrices ? (
                  <th className="table-header-cell text-right stock-col-price" title="WAC từ phiếu nhập đã duyệt trong 12 tháng (ngày duyệt)">Giá bình quân</th>
                ) : null}
                <th className="table-header-cell text-center stock-col-projects">Dự án</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={colSpan} />
              ) : isError ? (
                <tr>
                  <td colSpan={colSpan}>
                    <EmptyState message={WMS_ERROR.loadStock} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
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
                      className="wms-inventory-row--interactive table-row"
                    >
                      <td className="table-cell stock-col-code">
                        <span className="entity-code stock-cell-truncate block" title={row.materialCode}>
                          {row.materialCode}
                        </span>
                      </td>
                      <td className="table-cell stock-col-name">
                        <span className="font-semibold stock-cell-truncate block" title={row.materialName}>
                          {row.materialName}
                        </span>
                        {row.isActive === false && (
                          <span className="wms-badge-inactive">Ngừng SD</span>
                        )}
                      </td>
                      <td className="table-cell text-center stock-col-unit">{row.unit}</td>
                      <td className="table-cell text-right font-bold tabular-nums stock-col-qty stock-cell-general">
                        {row.generalActualQty}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums stock-col-qty">
                        {projectActual}
                      </td>
                      <td className="table-cell text-right font-bold tabular-nums stock-col-qty text-[var(--md-success)]">
                        {usableQty}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-col-qty stock-qty--pending">
                        {fmtStockQtyOrDash(plannedImport)}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-col-qty stock-qty--reserved">
                        {fmtStockQtyOrDash(plannedExport)}
                      </td>
                      <td className="table-cell text-right tabular-nums stock-col-qty stock-qty--reserved">
                        {fmtStockQtyOrDash(Number(row.defectedQty) || 0)}
                      </td>
                      <td className="table-cell text-right font-semibold tabular-nums stock-col-qty">
                        {fmtPlannedStock(projectActual, plannedImport)}
                      </td>
                      {canViewPrices ? (
                        <td className="table-cell text-right tabular-nums stock-col-price text-[var(--md-on-surface)]">
                          {row.weightedAverageUnitCost > 0
                            ? formatCurrencyVnd(row.weightedAverageUnitCost)
                            : '—'}
                        </td>
                      ) : null}
                      <td className="table-cell text-center stock-col-projects">
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
