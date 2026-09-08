import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import EmptyState from '../../components/ui/EmptyState';
import SearchBar from '../../components/ui/SearchBar';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Skeleton from '../../components/ui/Skeleton';
import HrmPanel from '../../components/hr/HrmPanel';
import SupplierPayablesOverview from '../../components/suppliers/SupplierPayablesOverview';
import { usePermission } from '../../hooks/usePermission';
import { useSupplierPayables } from '../../hooks/useSupplierPayables';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { SupplierPayableLineApiDto } from '../../types/api/purchasingApi';

const LINE_COL_COUNT = 9;

type StatusFilter = '' | 'unpaid' | 'partial' | 'overdue' | 'paid';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: '', label: 'Tất cả' },
  { id: 'unpaid', label: 'Chưa thanh toán' },
  { id: 'partial', label: 'Thanh toán 1 phần' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'paid', label: 'Đã thanh toán đủ' },
];

function lineStatusLabel(line: SupplierPayableLineApiDto) {
  if (line.lineStatus === 'paid') return 'Đã TT đủ';
  if (line.lineStatus === 'overdue') return `Quá hạn ${line.daysOverdue} ngày`;
  if (line.lineStatus === 'partial') return `TT một phần - còn ${formatCurrencyFull(line.outstanding)}`;
  return 'Chưa TT';
}

function lineStatusClass(line: SupplierPayableLineApiDto) {
  if (line.lineStatus === 'paid') return 'badge badge-success';
  if (line.lineStatus === 'overdue') return 'badge badge-error';
  return 'badge badge-warning';
}

function lineStatusBadge(line: SupplierPayableLineApiDto) {
  const paidTime = line.lineStatus === 'paid' ? formatDateTimeVi(line.paidAt ?? undefined) : undefined;
  const paidBy = line.lineStatus === 'paid' ? (line.paidByName?.trim() || '') : '';
  return (
    <div className="pur-plan-status-cell">
      <span className={lineStatusClass(line)}>{lineStatusLabel(line)}</span>
      {paidTime || paidBy ? (
        <div className="pur-plan-status-meta">
          {paidTime ? <div className="tabular-nums">{paidTime}</div> : null}
          {paidBy ? (
            <div className="pur-plan-status-meta__name" title={paidBy}>{paidBy}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

function exportLinesCsv(lines: SupplierPayableLineApiDto[]) {
  const header = [
    'NCC', 'Mã NCC', 'Dự án', 'PO', 'DNTT', 'Ngày PO', 'Giá trị', 'Điều khoản',
    'Hạn TT', 'Đã thanh toán', 'Còn nợ', 'Trạng thái', 'Số ngày quá hạn',
  ];
  const rows = lines.map(line => [
    csvCell(line.supplierName),
    csvCell(line.supplierCode),
    csvCell(line.projectName || line.projectCode),
    csvCell(line.poCode),
    csvCell(line.paymentCode),
    csvCell(line.poDate),
    csvCell(line.requested),
    csvCell(line.paymentTerm),
    csvCell(line.dueDate),
    csvCell(line.paid),
    csvCell(line.outstanding),
    csvCell(
      line.lineStatus === 'paid' && (line.paidAt || line.paidByName)
        ? [lineStatusLabel(line), formatDateTimeVi(line.paidAt ?? undefined), line.paidByName?.trim()]
          .filter(Boolean)
          .join(' - ')
        : lineStatusLabel(line),
    ),
    csvCell(line.daysOverdue),
  ].join(','));
  const blob = new Blob(['\uFEFF' + [header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CongNo_NCC_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ApFilterTabs({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (id: StatusFilter) => void;
}) {
  return (
    <div className="ops-projects-tabs" role="tablist" aria-label="Lọc trạng thái thanh toán">
      {STATUS_FILTERS.map(item => {
        const active = value === item.id;
        return (
          <button
            key={item.id || 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ops-projects-tabs__btn${active ? ' is-active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ApBoard({
  title,
  desc,
  toolbar,
  children,
}: {
  title: string;
  desc: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <HrmPanel noPadding className="ops-projects-board">
      <div className="ops-projects-board__head">
        <h2 className="ops-projects-board__title">{title}</h2>
        <p className="ops-projects-board__desc">{desc}</p>
      </div>
      {toolbar ? (
        <div className="hrm-list-toolbar">
          <div className="ops-projects__toolbar">{toolbar}</div>
        </div>
      ) : null}
      {children}
    </HrmPanel>
  );
}

export default function SupplierPayablesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierIdRaw = searchParams.get('supplierId');
  const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
  const [status, setStatus] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const { hasAny } = usePermission();
  const canPay = hasAny(['purchasing.payments.pay', 'purchasing.payments.view']);

  const params = useMemo(
    () => ({
      supplierId: Number.isFinite(supplierId) ? supplierId : undefined,
      status: status || undefined,
      search: search.trim() || undefined,
    }),
    [supplierId, status, search],
  );
  const { data, isLoading, isFetching, isPlaceholderData, isError, error } = useSupplierPayables(params);
  const showInitialLoading = isLoading && !data;
  const isRefetching = isFetching && isPlaceholderData;

  const kpis = data?.kpis;
  const aging = data?.aging ?? [];
  const suppliers = data?.suppliers ?? [];
  const upcoming = data?.upcoming ?? [];
  const lines = data?.lines ?? [];
  const filteredSupplierName = suppliers.find(s => s.supplierId === supplierId)?.supplierName;
  const hasFilters = Boolean(supplierId || status || search.trim());

  const setSupplierFilter = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set('supplierId', next);
    else nextParams.delete('supplierId');
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setStatus('');
    setSearch('');
    setSupplierFilter('');
  };

  return (
    <div className="page-shell sup-ap">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Công nợ NCC"
        subtitle="Công nợ lấy từ DNTT còn phải trả. PO chưa lập đề nghị không phát sinh nợ."
        actions={(
          <button
            type="button"
            className="btn btn-outline"
            disabled={lines.length === 0}
            onClick={() => exportLinesCsv(lines)}
          >
            <Download size={15} aria-hidden />
            Xuất CSV
          </button>
        )}
      />

      {isError ? (
        <ApBoard
          title="Công nợ NCC"
          desc="Không tải được dữ liệu công nợ."
        >
          <div className="ops-projects-board__body">
            <EmptyState message={getApiErrorMessage(error, 'Không tải được công nợ NCC.')} />
          </div>
        </ApBoard>
      ) : (
        <>
          <ApBoard
            title="Tổng quan công nợ"
            desc="Còn phải trả theo DNTT đã lập."
          >
            {showInitialLoading || !kpis ? (
              <div className="ops-projects-board__body">
                <Skeleton variant="rect" height={196} />
              </div>
            ) : (
              <SupplierPayablesOverview
                kpis={kpis}
                aging={aging}
                upcoming7Total={data?.upcoming7Total ?? 0}
                upcoming30Total={data?.upcoming30Total ?? 0}
              />
            )}
          </ApBoard>

          <ApBoard
            title="Công nợ theo nhà cung cấp"
            desc="Tổng hợp đề nghị, đã trả và còn nợ theo từng NCC."
          >
            <div
              className={`wms-inventory-table-wrap overflow-x-auto table-scroll${isRefetching ? ' is-refetching' : ''}`}
              aria-busy={isRefetching || undefined}
            >
              <table className="wms-inventory-table">
                <thead>
                  <tr>
                    <th className="table-header-cell">Nhà cung cấp</th>
                    <th className="table-header-cell text-right">Số PO / dự án</th>
                    <th className="table-header-cell text-right">Đã đề nghị TT</th>
                    <th className="table-header-cell text-right">Đã thanh toán</th>
                    <th className="table-header-cell text-right">Còn nợ</th>
                    <th className="table-header-cell text-right">Hạn mức</th>
                    <th className="table-header-cell">Tình trạng</th>
                    <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {showInitialLoading ? (
                    <TableSkeletonRows colSpan={8} rows={6} />
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState message="Chưa có đề nghị thanh toán nào được lập." />
                      </td>
                    </tr>
                  ) : (
                    suppliers.map(row => (
                      <tr key={row.supplierId} className="table-row">
                        <td className="table-cell sup-ap-col-ncc">
                          <span className="sup-analytics__code">{row.supplierCode}</span>
                          {' '}
                          {row.supplierName}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {row.poCount} / {row.projectCount}
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrencyFull(row.requested)}
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrencyFull(row.paid)}
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrencyFull(row.outstanding)}
                        </td>
                        <td className="table-cell text-right">
                          {row.creditLimit
                            ? (
                              <>
                                <span className="tabular-nums whitespace-nowrap">{formatCurrencyFull(row.creditLimit)}</span>
                                {row.overLimit ? (
                                  <div><span className="badge badge-error">Vượt hạn mức</span></div>
                                ) : null}
                              </>
                            )
                            : <span className="sup-ap-meta">Không giới hạn</span>}
                        </td>
                        <td className="table-cell">
                          {row.overdueCount > 0 ? (
                            <span className="badge badge-error">
                              {row.overdueCount} DNTT quá hạn - {formatCurrencyFull(row.overdueAmount)}
                            </span>
                          ) : row.unpaidCount > 0 ? (
                            <span className="badge badge-warning">{row.unpaidCount} DNTT chưa đến hạn</span>
                          ) : (
                            <span className="badge badge-success">Không nợ</span>
                          )}
                        </td>
                        <td className="table-cell hrm-table-col-actions">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              setSupplierFilter(String(row.supplierId));
                              const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                              document.getElementById('sup-ap-lines')?.scrollIntoView({
                                behavior: reduceMotion ? 'auto' : 'smooth',
                                block: 'start',
                              });
                            }}
                          >
                            Lọc DNTT
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ApBoard>

          {!showInitialLoading && upcoming.length > 0 ? (
            <ApBoard
              title="Lịch thanh toán sắp tới"
              desc="Khoản còn nợ chưa quá hạn trong 30 ngày - phục vụ kế hoạch dòng tiền."
            >
              <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
                <table className="wms-inventory-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Hạn TT</th>
                      <th className="table-header-cell">Nhà cung cấp</th>
                      <th className="table-header-cell">Dự án</th>
                      <th className="table-header-cell">PO / DNTT</th>
                      <th className="table-header-cell text-right">Còn nợ</th>
                      <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map(row => (
                      <tr key={row.paymentCode} className="table-row">
                        <td className="table-cell">
                          {formatDateCell(row.dueDate)}
                          <div className="sup-ap-meta">còn {row.daysUntilDue} ngày</div>
                        </td>
                        <td className="table-cell">{row.supplierName || '-'}</td>
                        <td className="table-cell">
                          {row.projectCode ? (
                            <EntityCodeLink
                              code={row.projectCode}
                              to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                            />
                          ) : (
                            <span className="entity-code">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <EntityCodeLink
                            code={row.poCode}
                            to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                          />
                          <div className="sup-ap-meta sup-ap-meta--mono">{row.paymentCode}</div>
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrencyFull(row.outstanding)}
                        </td>
                        <td className="table-cell hrm-table-col-actions">
                          {canPay ? (
                            <Link className="btn btn-primary" to={`/purchasing/payments/${encodeURIComponent(row.paymentCode)}`}>
                              Ghi nhận TT
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ApBoard>
          ) : null}

          <ApBoard
            title="DNTT và công nợ chi tiết"
            desc={
              filteredSupplierName
                ? `Đang lọc theo ${filteredSupplierName}.`
                : 'Từng đề nghị thanh toán đã lập. PO chưa có DNTT không xuất hiện.'
            }
            toolbar={(
              <>
                <label className="ops-projects__filter-field">
                  Nhà cung cấp
                  <select
                    className="form-input form-input-md"
                    value={supplierId ? String(supplierId) : ''}
                    onChange={e => setSupplierFilter(e.target.value)}
                  >
                    <option value="">Tất cả NCC</option>
                    {suppliers.map(s => (
                      <option key={s.supplierId} value={s.supplierId}>{s.supplierCode} - {s.supplierName}</option>
                    ))}
                  </select>
                </label>
                <ApFilterTabs value={status} onChange={setStatus} />
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Tìm PO, DNTT hoặc NCC"
                />
                {hasFilters ? (
                  <button type="button" className="btn btn-text" onClick={resetFilters} title="Đặt lại bộ lọc">
                    Xóa lọc
                  </button>
                ) : null}
              </>
            )}
          >
            <div
              id="sup-ap-lines"
              className={`wms-inventory-table-wrap overflow-x-auto table-scroll${isRefetching ? ' is-refetching' : ''}`}
              aria-busy={isRefetching || undefined}
            >
              <table className="wms-inventory-table">
                <thead>
                  <tr>
                    <th className="table-header-cell">Nhà cung cấp</th>
                    <th className="table-header-cell">Dự án</th>
                    <th className="table-header-cell">PO / DNTT</th>
                    <th className="table-header-cell">Ngày PO</th>
                    <th className="table-header-cell text-right">Giá trị</th>
                    <th className="table-header-cell">Điều khoản</th>
                    <th className="table-header-cell">Hạn TT</th>
                    <th className="table-header-cell">Trạng thái</th>
                    <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {showInitialLoading ? (
                    <TableSkeletonRows colSpan={LINE_COL_COUNT} rows={8} />
                  ) : lines.length === 0 ? (
                    <tr>
                      <td colSpan={LINE_COL_COUNT}>
                        <EmptyState message="Không có DNTT nào phù hợp bộ lọc." />
                      </td>
                    </tr>
                  ) : (
                    lines.map(line => (
                      <tr key={line.paymentCode} className="table-row">
                        <td className="table-cell sup-ap-col-ncc">
                          {line.supplierCode ? <span className="sup-analytics__code">{line.supplierCode}</span> : null}
                          {' '}
                          {line.supplierName || '-'}
                        </td>
                        <td className="table-cell">
                          {line.projectCode ? (
                            <EntityCodeLink
                              code={line.projectCode}
                              to={`/warehouse/projects/${encodeURIComponent(line.projectCode)}`}
                            />
                          ) : (
                            <span className="entity-code">-</span>
                          )}
                          {line.projectName ? (
                            <div className="sup-ap-meta">{line.projectName}</div>
                          ) : null}
                        </td>
                        <td className="table-cell">
                          <EntityCodeLink
                            code={line.poCode}
                            to={`/purchasing/orders/${encodeURIComponent(line.poCode)}`}
                          />
                          <div className="sup-ap-meta sup-ap-meta--mono">
                            {line.paymentCode}
                            {line.stageNumber > 1 ? ` - đợt ${line.stageNumber}` : ''}
                          </div>
                        </td>
                        <td className="table-cell">{formatDateCell(line.poDate ?? undefined)}</td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrencyFull(line.requested)}
                        </td>
                        <td className="table-cell">{line.paymentTerm || '-'}</td>
                        <td className="table-cell">{formatDateCell(line.dueDate)}</td>
                        <td className="table-cell sup-ap-col-status">{lineStatusBadge(line)}</td>
                        <td className="table-cell hrm-table-col-actions">
                          {line.lineStatus === 'paid' ? (
                            <Link className="btn btn-outline" to={`/purchasing/orders/${encodeURIComponent(line.poCode)}`}>
                              Xem PO
                            </Link>
                          ) : canPay ? (
                            <Link className="btn btn-primary" to={`/purchasing/payments/${encodeURIComponent(line.paymentCode)}`}>
                              Xác nhận TT
                            </Link>
                          ) : (
                            <Link className="btn btn-outline" to={`/purchasing/payments/${encodeURIComponent(line.paymentCode)}`}>
                              Xem DNTT
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ApBoard>
        </>
      )}
    </div>
  );
}
