import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import { createSuppliersModuleSeed } from '../../data/suppliersMock';
import { showToast } from '../../components/ui/Toast';

const seed = createSuppliersModuleSeed();

export default function SupplierGroupsPage() {
  const [search, setSearch] = useState('');
  const rows = seed.groups;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => [r.name, r.description].some(v => v.toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Nhóm nhà cung cấp"
      subtitle="Phân nhóm NCC theo ngành / loại."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm nhóm…"
      hasFilters={Boolean(search)}
      onResetFilters={() => setSearch('')}
      actions={(
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => showToast('info', 'Tạo nhóm — UI demo, chưa lưu BE.')}
        >
          <Plus size={16} aria-hidden />
          Tạo mới
        </button>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--720">
          <thead>
            <tr>
              <th className="table-header-cell">#</th>
              <th className="table-header-cell">Nhóm nhà cung cấp</th>
              <th className="table-header-cell">Mô tả</th>
              <th className="table-header-cell">Số NCC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} className="table-row">
                <td className="table-cell whitespace-nowrap">{i + 1}</td>
                <td className="table-cell font-semibold text-[var(--md-primary)]">{row.name}</td>
                <td className="table-cell">{row.description}</td>
                <td className="table-cell whitespace-nowrap">{row.supplierCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PurchasingListLayout>
  );
}
