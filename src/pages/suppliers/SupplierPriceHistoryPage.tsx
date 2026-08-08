import { useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Pagination from '../../components/ui/Pagination';
import HrmPanel from '../../components/hr/HrmPanel';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { useSupplierPriceHistory } from '../../hooks/useSupplierPoAnalytics';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { SupplierPriceHistoryRow } from '../../lib/suppliers/supplierPoAnalytics';

function materialOptionKey(row: SupplierPriceHistoryRow) {
  return row.materialCode;
}

function materialOptionLabel(row: SupplierPriceHistoryRow) {
  return `${row.materialCode} — ${row.materialName}`;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
}

export default function SupplierPriceHistoryPage() {
  const { data = [], isLoading, isError, error } = useSupplierPriceHistory();
  const [materialCode, setMaterialCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [poCode, setPoCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

  const materialOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const row of data) {
      if (!byCode.has(row.materialCode)) {
        byCode.set(row.materialCode, materialOptionLabel(row));
      }
    }
    return [...byCode.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data]);

  const supplierOptions = useMemo(
    () => uniqueSorted(data.map(r => r.supplierName)),
    [data],
  );

  const poOptions = useMemo(
    () => uniqueSorted(data.map(r => r.poCode)),
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter(row => {
      if (materialCode && materialOptionKey(row) !== materialCode) return false;
      if (supplierName && row.supplierName !== supplierName) return false;
      if (poCode && row.poCode !== poCode) return false;
      return true;
    });
  }, [data, materialCode, supplierName, poCode]);

  const hasFilters = Boolean(materialCode || supplierName || poCode);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const resetFilters = () => {
    setMaterialCode('');
    setSupplierName('');
    setPoCode('');
    setPage(1);
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Lịch sử giá"
        subtitle="Đơn giá từng vật tư theo từng PO / nhà cung cấp — dùng đối chiếu khi mua lại."
      />

      <div className="sup-analytics__help">
        Mỗi khi tạo PO, đơn giá của từng mặt hàng theo từng NCC được tổng hợp tại đây — lần mua sau
        chỉ cần đối chiếu giá đã có.
      </div>

      <HrmPanel>
        <div className="sup-analytics__head">
          <h2 className="sup-analytics__title">Lịch sử giá theo mặt hàng — nhà cung cấp</h2>
          <p className="sup-analytics__desc">
            Mỗi dòng là đơn giá 1 đơn vị vật tư trên phiếu PO (không phải thành tiền dòng).
          </p>
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="sup-analytics__filters">
              <label className="sup-analytics__filter-field">
                <span>Hàng hoá</span>
                <select
                  className="form-input form-input-md"
                  value={materialCode}
                  onChange={e => {
                    setMaterialCode(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả hàng hoá</option>
                  {materialOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="sup-analytics__filter-field">
                <span>Nhà cung cấp</span>
                <select
                  className="form-input form-input-md"
                  value={supplierName}
                  onChange={e => {
                    setSupplierName(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả nhà cung cấp</option>
                  {supplierOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="sup-analytics__filter-field">
                <span>Mã PO</span>
                <select
                  className="form-input form-input-md"
                  value={poCode}
                  onChange={e => {
                    setPoCode(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả mã PO</option>
                  {poOptions.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </label>
              {hasFilters ? (
                <div className="sup-analytics__filter-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
                    Xóa lọc
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="wms-inventory-table sup-analytics__table">
            <thead>
              <tr>
                <th className="table-header-cell">Ngày PO</th>
                <th className="table-header-cell">Hàng hoá</th>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell text-right">Đơn giá</th>
                <th className="table-header-cell">Mã PO</th>
                <th className="table-header-cell">Dự án</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={6} rows={8} />
              ) : isError ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message={getApiErrorMessage(error, 'Không tải được lịch sử giá.')} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      message={
                        hasFilters
                          ? 'Không tìm thấy dòng giá phù hợp.'
                          : 'Chưa có lịch sử giá — sẽ xuất hiện khi có dòng vật tư trên PO.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginated.map(row => (
                  <tr key={row.id}>
                    <td className="table-cell whitespace-nowrap tabular-nums">
                      {formatDateCell(row.orderDate)}
                    </td>
                    <td className="table-cell">
                      <span className="sup-analytics__code">{row.materialCode}</span>
                      {' '}
                      {row.materialName}
                    </td>
                    <td className="table-cell">{row.supplierName}</td>
                    <td className="table-cell text-right tabular-nums whitespace-nowrap">
                      {formatCurrencyFull(row.unitPrice)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      <EntityCodeLink
                        code={row.poCode}
                        to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                      />
                    </td>
                    <td className="table-cell font-mono text-sm">{row.projectCode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && !isLoading ? (
          <Pagination
            embedded
            itemLabel="dòng giá"
            currentPage={pageSafe}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => {
              setPageSize(s);
              setPage(1);
            }}
            totalItems={filtered.length}
          />
        ) : null}
      </HrmPanel>
    </div>
  );
}
