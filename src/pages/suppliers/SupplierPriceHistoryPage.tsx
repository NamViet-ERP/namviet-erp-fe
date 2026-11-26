import { useId, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import TableShell from '../../components/ui/TableShell';
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
  return `${row.materialCode} - ${row.materialName}`;
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
  const materialSelectId = useId();
  const supplierSelectId = useId();
  const poSelectId = useId();

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
    <PageShell className="sup-price-history">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Lịch sử giá"
        subtitle="Đơn giá từng vật tư theo từng PO / nhà cung cấp - dùng đối chiếu khi mua lại."
      />

      <div className="sup-analytics__help">
        Mỗi khi tạo PO, đơn giá của từng mặt hàng theo từng NCC được tổng hợp tại đây - lần mua sau
        chỉ cần đối chiếu giá đã có.
      </div>

      <SectionCard noPadding className="sup-price-history-board">
        <div className="sup-price-history-board__head">
          <h2 className="sup-price-history-board__title">Lịch sử giá theo mặt hàng - nhà cung cấp</h2>
          <p className="sup-price-history-board__desc">
            Mỗi dòng là đơn giá 1 đơn vị vật tư trên phiếu PO (không phải thành tiền dòng).
          </p>
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="sup-analytics__filters">
              <div className="sup-analytics__filter-field">
                <label htmlFor={materialSelectId}>Hàng hoá</label>
                <SelectField
                  id={materialSelectId}
                  aria-label="Hàng hoá"
                  selectClassName="form-input form-input-md"
                  value={materialCode}
                  onChange={val => {
                    setMaterialCode(val);
                    setPage(1);
                  }}
                  placeholder="Tất cả hàng hoá"
                  options={materialOptions}
                />
              </div>
              <div className="sup-analytics__filter-field">
                <label htmlFor={supplierSelectId}>Nhà cung cấp</label>
                <SelectField
                  id={supplierSelectId}
                  aria-label="Nhà cung cấp"
                  selectClassName="form-input form-input-md"
                  value={supplierName}
                  onChange={val => {
                    setSupplierName(val);
                    setPage(1);
                  }}
                  placeholder="Tất cả nhà cung cấp"
                  options={supplierOptions}
                />
              </div>
              <div className="sup-analytics__filter-field">
                <label htmlFor={poSelectId}>Mã PO</label>
                <SelectField
                  id={poSelectId}
                  aria-label="Mã PO"
                  selectClassName="form-input form-input-md"
                  value={poCode}
                  onChange={val => {
                    setPoCode(val);
                    setPage(1);
                  }}
                  placeholder="Tất cả mã PO"
                  options={poOptions}
                />
              </div>
              {hasFilters ? (
                <div className="sup-analytics__filter-actions">
                  <Button type="button" variant="text" size="sm" onClick={resetFilters}>
                    Xóa lọc
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <TableShell
          tableClassName="wms-inventory-table"
          colSpan={6}
          loading={isLoading}
          skeletonRows={8}
          error={isError ? getApiErrorMessage(error, 'Không tải được lịch sử giá.') : null}
          isEmpty={paginated.length === 0}
          emptyMessage={
            hasFilters
              ? 'Không tìm thấy dòng giá phù hợp.'
              : 'Chưa có lịch sử giá - sẽ xuất hiện khi có dòng vật tư trên PO.'
          }
          header={(
            <tr>
              <th className="table-header-cell">Ngày PO</th>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell text-right">Đơn giá</th>
              <th className="table-header-cell">Mã PO</th>
              <th className="table-header-cell">Dự án</th>
            </tr>
          )}
          pagination={
            filtered.length > 0 && !isLoading
              ? {
                  itemLabel: 'dòng giá',
                  currentPage: pageSafe,
                  totalPages,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: s => {
                    setPageSize(s);
                    setPage(1);
                  },
                  totalItems: filtered.length,
                }
              : undefined
          }
        >
          {paginated.map(row => (
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
              <td className="table-cell">
                {row.projectCode ? (
                  <EntityCodeLink
                    code={row.projectCode}
                    to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                  />
                ) : '-'}
              </td>
            </tr>
          ))}
        </TableShell>
      </SectionCard>
    </PageShell>
  );
}
