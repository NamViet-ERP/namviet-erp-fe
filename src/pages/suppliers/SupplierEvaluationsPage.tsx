import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import { createSuppliersModuleSeed } from '../../data/suppliersMock';
import { showToast } from '../../components/ui/Toast';

const seed = createSuppliersModuleSeed();

function gradeTone(grade: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'warning';
  if (grade === 'C') return 'danger';
  return 'neutral';
}

export default function SupplierEvaluationsPage() {
  const [search, setSearch] = useState('');
  const rows = seed.evaluations;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.supplierName, r.period, r.grade, r.note].some(v => v.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  return (
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Đánh giá NCC"
      subtitle="Điểm đánh giá nhà cung cấp theo kỳ."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm NCC, kỳ, xếp hạng…"
      hasFilters={Boolean(search)}
      onResetFilters={() => setSearch('')}
      actions={(
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => showToast('info', 'Tạo đánh giá — UI demo, chưa lưu BE.')}
        >
          <Plus size={16} aria-hidden />
          Tạo đánh giá
        </button>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--950">
          <thead>
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Kỳ</th>
              <th className="table-header-cell">Điểm</th>
              <th className="table-header-cell">Xếp hạng</th>
              <th className="table-header-cell">Ngày đánh giá</th>
              <th className="table-header-cell">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} className="table-row">
                <td className="table-cell font-semibold">{row.supplierName}</td>
                <td className="table-cell whitespace-nowrap">{row.period}</td>
                <td className="table-cell whitespace-nowrap">{row.score}</td>
                <td className="table-cell">
                  <PurchasingStatusBadge label={row.grade} tone={gradeTone(row.grade)} />
                </td>
                <td className="table-cell whitespace-nowrap">{row.evaluatedAt}</td>
                <td className="table-cell">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PurchasingListLayout>
  );
}
