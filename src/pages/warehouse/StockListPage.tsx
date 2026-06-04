import { useState } from 'react';
import { Download } from 'lucide-react';
import { products } from '../../data/products';
import { warehouses } from '../../data/warehouses';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import type { Product } from '../../types';

/** Product extended with stock quantities per warehouse */
interface StockItem extends Product {
  stockByWarehouse: Record<string, number>;
  totalStock: number;
}

// Generate mock stock data based on products and warehouses
const initialStock: StockItem[] = products.map(p => {
  const stockByWarehouse: Record<string, number> = {};
  let totalStock = 0;
  warehouses.forEach(w => {
    // Random stock for demo
    const qty = Math.floor(Math.random() * 50);
    stockByWarehouse[w.id] = qty;
    totalStock += qty;
  });
  return { ...p, stockByWarehouse, totalStock };
});

export default function StockListPage() {
  const [stockList] = useState<StockItem[]>(initialStock);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  const filtered = stockList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase());
    const hasStock = selectedWarehouse === 'all' ? true : s.stockByWarehouse[selectedWarehouse] > 0;
    return matchesSearch && hasStock;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="KHO HÀNG"
        title="TỒN KHO MÁY"
        actions={<button className="btn btn-outline"><Download size={16} /> Xuất báo cáo</button>}
      />

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select className="form-select w-full md:w-48 text-sm" value={selectedWarehouse}
              onChange={e => { setSelectedWarehouse(e.target.value); setPage(1); }}>
              <option value="all">Tất cả kho hàng</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <SearchBar value={search} onChange={e => { setSearch(e); setPage(1); }} placeholder="Tìm kiếm theo mã SKU, tên sản phẩm..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy sản phẩm nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header-cell">Mã SKU</th>
                <th className="table-header-cell">Sản phẩm</th>
                <th className="table-header-cell">Đơn vị</th>
                <th className="table-header-cell">Phân loại</th>
                {selectedWarehouse === 'all' ? (
                  <th className="table-header-cell text-center">Tổng tồn kho</th>
                ) : (
                  <th className="table-header-cell text-center">Tồn tại kho chọn</th>
                )}
                <th className="table-header-cell text-center">Dự kiến xuất</th>
                <th className="table-header-cell text-center">Khả dụng</th>
              </tr></thead>
              <tbody>
                {paginated.map((s) => {
                  const stock = selectedWarehouse === 'all' ? s.totalStock : s.stockByWarehouse[selectedWarehouse];
                  // Mock reserved stock for demo
                  const reserved = Math.floor(stock * 0.2); 
                  const available = stock - reserved;

                  return (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell font-semibold text-[var(--md-primary)]">{s.sku}</td>
                      <td className="table-cell font-medium">{s.name}</td>
                      <td className="table-cell">{s.unit}</td>
                      <td className="table-cell">{s.category}</td>
                      <td className="table-cell text-center font-bold">{stock}</td>
                      <td className="table-cell text-center text-[var(--md-error)] font-medium">{reserved}</td>
                      <td className="table-cell text-center text-[var(--md-success)] font-bold">{available}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}
            pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
        </div>
      </div>
    </div>
  );
}
