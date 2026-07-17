import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import CreateSupplierModal from '../../components/purchasing/CreateSupplierModal';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';

/** Danh sách NCC — map ERP /admin/suppliers. */
export default function SupplierListPage() {
  const { suppliers: rows } = usePurchasingStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => [...new Set(rows.map(s => s.category))], [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(s => {
      if (status && s.status !== status) return false;
      if (category && s.category !== category) return false;
      if (!q) return true;
      return [s.code, s.name, s.contact, s.phone].some(v => v.toLowerCase().includes(q));
    });
  }, [rows, search, status, category]);

  const hasFilters = Boolean(search || status || category);

  return (
    <>
      <PurchasingListLayout
        eyebrow="Nhà cung cấp"
        title="Nhà cung cấp"
        subtitle="Danh sách nhà cung cấp."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm mã, tên, liên hệ…"
        hasFilters={hasFilters}
        onResetFilters={() => { setSearch(''); setStatus(''); setCategory(''); }}
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            Tạo nhà cung cấp
          </button>
        )}
        filters={(
          <>
            <div className="hrm-filter-select-wrap">
              <select className="hrm-filter-select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Ngành">
                <option value="">Tất cả ngành</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="hrm-filter-select-wrap">
              <select className="hrm-filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Trạng thái">
                <option value="">Tất cả trạng thái</option>
                <option value="Đang hợp tác">Đang hợp tác</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
              </select>
            </div>
          </>
        )}
      >
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table table-min-w--950">
            <thead>
              <tr>
                <th className="table-header-cell">Mã</th>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell">Liên hệ</th>
                <th className="table-header-cell">Ngành</th>
                <th className="table-header-cell">Xếp hạng</th>
                <th className="table-header-cell">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell whitespace-nowrap font-semibold">{row.code}</td>
                  <td className="table-cell">
                    <div className="font-semibold text-[var(--md-primary)]">{row.name}</div>
                    <div className="text-xs text-[var(--md-on-surface-variant)]">{row.email}</div>
                  </td>
                  <td className="table-cell">
                    <div>{row.contact}</div>
                    <div className="text-xs text-[var(--md-on-surface-variant)]">{row.phone}</div>
                  </td>
                  <td className="table-cell whitespace-nowrap">{row.category}</td>
                  <td className="table-cell">{row.rating}</td>
                  <td className="table-cell">
                    <PurchasingStatusBadge label={row.status} tone={row.statusTone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PurchasingListLayout>
      <CreateSupplierModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
