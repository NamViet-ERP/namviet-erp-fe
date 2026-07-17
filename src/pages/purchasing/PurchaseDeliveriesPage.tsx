import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import { markDeliveryReceived, usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../../components/ui/Toast';

export default function PurchaseDeliveriesPage() {
  const { deliveries: rows } = usePurchasingStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.poCode, r.project, r.supplier, r.shipment].some(v => v.toLowerCase().includes(q));
    });
  }, [rows, search, status]);

  const hasFilters = Boolean(search || status);

  const onReceive = (id: string, poCode: string) => {
    if (markDeliveryReceived(id)) {
      showToast('success', `Đã nhận ${poCode}. Sang bước thanh toán / hồ sơ khi cần.`);
    } else {
      showToast('warning', 'Không cập nhật được (có thể đã nhận).');
    }
  };

  return (
    <PurchasingListLayout
      title="4. Theo dõi giao hàng"
      subtitle="Tiến độ giao theo đơn."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm mã đơn, dự án…"
      hasFilters={hasFilters}
      onResetFilters={() => { setSearch(''); setStatus(''); }}
      filters={(
        <div className="hrm-filter-select-wrap">
          <select className="hrm-filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Lọc trạng thái">
            <option value="">Tất cả trạng thái</option>
            <option value="Sắp giao">Sắp giao</option>
            <option value="Đúng lịch">Đúng lịch</option>
            <option value="Trễ dự kiến">Trễ dự kiến</option>
            <option value="Đã giao">Đã giao</option>
          </select>
        </div>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--1400">
          <thead>
            <tr>
              <th className="table-header-cell">Đơn hàng</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell">Đợt</th>
              <th className="table-header-cell">Dự kiến</th>
              <th className="table-header-cell">Thực tế</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell">Nhận hàng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} className="table-row">
                <td className="table-cell whitespace-nowrap">
                  <Link
                    to="/purchasing/orders"
                    className="font-semibold text-[var(--md-primary)]"
                  >
                    {row.poCode}
                  </Link>
                </td>
                <td className="table-cell">{row.project}</td>
                <td className="table-cell">{row.supplier}</td>
                <td className="table-cell whitespace-nowrap">{row.shipment}</td>
                <td className="table-cell whitespace-nowrap">{row.plannedDate}</td>
                <td className="table-cell whitespace-nowrap">{row.actualDate}</td>
                <td className="table-cell">
                  <PurchasingStatusBadge label={row.status} tone={row.statusTone} />
                </td>
                <td className="table-cell whitespace-nowrap">
                  {row.status !== 'Đã giao' ? (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onReceive(row.id, row.poCode)}>
                      Đã nhận hàng
                    </button>
                  ) : (
                    <Link to="/purchasing/documents" className="btn btn-tonal btn-sm">Xem hồ sơ</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PurchasingListLayout>
  );
}
