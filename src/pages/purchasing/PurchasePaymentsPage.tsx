import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';

export default function PurchasePaymentsPage() {
  const { payments: rows } = usePurchasingStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.code, r.poCode, r.supplier, r.invoiceNo].some(v => v.toLowerCase().includes(q));
    });
  }, [rows, search, status]);

  const hasFilters = Boolean(search || status);

  return (
    <PurchasingListLayout
      title="5. Thanh toán (DNTT)"
      subtitle="Đề nghị thanh toán theo đơn đã nhận."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm mã DNTT, đơn hàng…"
      hasFilters={hasFilters}
      onResetFilters={() => { setSearch(''); setStatus(''); }}
      filters={(
        <div className="hrm-filter-select-wrap">
          <select className="hrm-filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Lọc trạng thái">
            <option value="">Tất cả trạng thái</option>
            <option value="Nháp">Nháp</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Sắp đến hạn">Sắp đến hạn</option>
            <option value="Đã chi">Đã chi</option>
          </select>
        </div>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--950">
          <thead>
            <tr>
              <th className="table-header-cell">Mã DNTT</th>
              <th className="table-header-cell">Đơn hàng</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell">Hóa đơn</th>
              <th className="table-header-cell">Số tiền</th>
              <th className="table-header-cell">Hạn TT</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell">Hồ sơ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="table-cell text-[var(--md-on-surface-variant)]" colSpan={8}>
                  Chưa có đề nghị thanh toán.
                </td>
              </tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="table-row">
                <td className="table-cell whitespace-nowrap font-semibold text-[var(--md-primary)]">{row.code}</td>
                <td className="table-cell whitespace-nowrap">
                  <Link
                    to="/purchasing/orders"
                    className="font-semibold text-[var(--md-primary)]"
                  >
                    {row.poCode}
                  </Link>
                </td>
                <td className="table-cell">{row.supplier}</td>
                <td className="table-cell whitespace-nowrap">{row.invoiceNo}</td>
                <td className="table-cell whitespace-nowrap">{row.amount}</td>
                <td className="table-cell whitespace-nowrap">{row.dueDate}</td>
                <td className="table-cell">
                  <PurchasingStatusBadge label={row.status} tone={row.statusTone} />
                </td>
                <td className="table-cell">
                  <Link to="/purchasing/documents" className="btn btn-outlined btn-sm">Kiểm tra hồ sơ</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PurchasingListLayout>
  );
}
