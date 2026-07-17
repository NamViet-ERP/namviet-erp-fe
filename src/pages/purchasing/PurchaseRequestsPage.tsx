import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import CreateRequestModal from '../../components/purchasing/CreateRequestModal';
import CreateOrderModal, { type OrderPrefill } from '../../components/purchasing/CreateOrderModal';
import type { PurchaseRequestRow } from '../../data/purchasingMock';
import { approveRequest, usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import { showToast } from '../../components/ui/Toast';

export default function PurchaseRequestsPage() {
  const { requests: rows } = usePurchasingStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [orderPrefill, setOrderPrefill] = useState<OrderPrefill | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.code, r.project, r.requester, r.planCode ?? '', r.orderCode ?? ''].some(v => v.toLowerCase().includes(q));
    });
  }, [rows, search, status]);

  const hasFilters = Boolean(search || status);

  const onApprove = (row: PurchaseRequestRow) => {
    if (approveRequest(row.id)) showToast('success', `Đã duyệt ${row.code}`);
    else showToast('warning', 'Không duyệt được (sai trạng thái).');
  };

  const openPo = (row: PurchaseRequestRow) => {
    setOrderPrefill({
      requestId: row.id,
      project: row.project,
      amount: row.amount,
    });
  };

  return (
    <>
      <PurchasingListLayout
        title="2. Yêu cầu mua hàng"
        subtitle="Duyệt phiếu rồi tạo đơn đặt hàng."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm mã yêu cầu, dự án…"
        hasFilters={hasFilters}
        onResetFilters={() => { setSearch(''); setStatus(''); }}
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            Tạo yêu cầu
          </button>
        )}
        filters={(
          <div className="hrm-filter-select-wrap">
            <select className="hrm-filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Lọc trạng thái">
              <option value="">Tất cả trạng thái</option>
              <option value="Nháp">Nháp</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã Duyệt">Đã Duyệt</option>
              <option value="Kết thúc">Kết thúc</option>
            </select>
          </div>
        )}
      >
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table table-min-w--1400">
            <thead>
              <tr>
                <th className="table-header-cell">Mã yêu cầu</th>
                <th className="table-header-cell">Từ kế hoạch</th>
                <th className="table-header-cell">Dự án / hàng</th>
                <th className="table-header-cell">Người yêu cầu</th>
                <th className="table-header-cell">Ước tính</th>
                <th className="table-header-cell">Đơn hàng</th>
                <th className="table-header-cell">Tình trạng</th>
                <th className="table-header-cell">Tạo đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell whitespace-nowrap font-semibold text-[var(--md-primary)]">{row.code}</td>
                  <td className="table-cell whitespace-nowrap">
                    {row.planCode ? (
                      <Link to="/purchasing/plans" className="font-semibold text-[var(--md-primary)]">{row.planCode}</Link>
                    ) : '—'}
                  </td>
                  <td className="table-cell">
                    <div>{row.project}</div>
                    <div className="text-xs text-[var(--md-on-surface-variant)]">{row.item}</div>
                  </td>
                  <td className="table-cell whitespace-nowrap">{row.requester}</td>
                  <td className="table-cell whitespace-nowrap">{row.amount}</td>
                  <td className="table-cell whitespace-nowrap">
                    {row.orderCode ? (
                      <Link to="/purchasing/orders" className="font-semibold text-[var(--md-primary)]">
                        {row.orderCode}
                      </Link>
                    ) : 'Chưa'}
                  </td>
                  <td className="table-cell">
                    <PurchasingStatusBadge label={row.status} tone={row.statusTone} />
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(row.status === 'Nháp' || row.status === 'Chờ duyệt') && (
                        <button type="button" className="btn btn-tonal btn-sm" onClick={() => onApprove(row)}>Duyệt</button>
                      )}
                      {!row.orderId && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openPo(row)}>Tạo đơn hàng</button>
                      )}
                      {row.orderId && (
                        <span className="text-xs text-[var(--md-on-surface-variant)]">Đã sang bước 3</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PurchasingListLayout>

      <CreateRequestModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CreateOrderModal
        open={Boolean(orderPrefill)}
        onClose={() => setOrderPrefill(null)}
        prefill={orderPrefill}
      />
    </>
  );
}
