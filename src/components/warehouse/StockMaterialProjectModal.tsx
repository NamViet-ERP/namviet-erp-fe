import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Modal from '../ui/Modal';
import type { StockMatrixRowApiDto } from '../../types/wms';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';

interface Props {
  row: StockMatrixRowApiDto | null;
  onClose: () => void;
}

function StockMaterialProjectContent({ row, onClose }: { row: StockMatrixRowApiDto; onClose: () => void }) {
  const [q, setQ] = useState('');

  const activeProjects = useMemo(() => {
    return row.projects
      .filter(p => p.actualQty !== 0 || p.plannedQty !== 0 || p.reservedQty !== 0)
      .filter(p => {
        if (!q.trim()) return true;
        const needle = q.toLowerCase();
        return (
          p.projectName.toLowerCase().includes(needle) ||
          p.projectCode.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => b.actualQty - a.actualQty);
  }, [row, q]);

  const projectActualTotal = row.projects.reduce((s, p) => s + p.actualQty, 0);
  const projectPlannedImportTotal = row.projects.reduce((s, p) => s + p.plannedQty, 0);
  const usableQty = Math.max(0, row.generalActualQty - row.generalReservedQty) + projectActualTotal;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="stock-modal-stat">
          <span className="stock-modal-stat-label">Kho tổng</span>
          <span className="stock-modal-stat-value tabular-nums">{row.generalActualQty}</span>
        </div>
        <div className="stock-modal-stat">
          <span className="stock-modal-stat-label">Khả dụng</span>
          <span className="stock-modal-stat-value tabular-nums text-[var(--md-success)]">{usableQty}</span>
        </div>
        <div className="stock-modal-stat">
          <span className="stock-modal-stat-label">Xuất dự kiến</span>
          <span className="stock-modal-stat-value tabular-nums stock-qty--reserved">{row.generalReservedQty}</span>
        </div>
        <div className="stock-modal-stat">
          <span className="stock-modal-stat-label">Tồn dự án thực tế</span>
          <span className="stock-modal-stat-value tabular-nums">{projectActualTotal}</span>
        </div>
        <div className="stock-modal-stat">
          <span className="stock-modal-stat-label">Tồn dự kiến</span>
          <span className="stock-modal-stat-value tabular-nums">
            {fmtPlannedStock(projectActualTotal, projectPlannedImportTotal)}
          </span>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
        <input
          type="search"
          className="form-input pl-9 text-sm w-full"
          placeholder="Lọc theo tên hoặc mã dự án..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {activeProjects.length === 0 ? (
        <p className="text-sm text-center text-[var(--md-on-surface-variant)] py-6">
          Không có dự án nào đang giữ hoặc sử dụng vật tư này.
        </p>
      ) : (
        <div className="stock-modal-table-wrap">
          <table className="w-full text-xs stock-modal-table">
            <thead>
              <tr className="border-b border-[var(--md-outline-variant)]">
                <th className="table-header-cell text-left py-2.5 pl-3">Dự án / công trình</th>
                <th className="table-header-cell text-right py-2.5 w-24">Tồn TT</th>
                <th className="table-header-cell text-right py-2.5 w-24">Nhập DK</th>
                <th className="table-header-cell text-right py-2.5 w-24">Xuất DK</th>
                <th className="table-header-cell text-right py-2.5 w-24 pr-3">Tồn DK</th>
              </tr>
            </thead>
            <tbody>
              {activeProjects.map(p => (
                <tr key={p.projectCode} className="border-b border-[var(--md-outline-variant)] hover:bg-[var(--tint-primary-weak)]">
                  <td className="table-cell py-2.5 pl-3">
                    <Link
                      to={`/warehouse/projects/${p.projectCode}`}
                      className="font-semibold text-[var(--md-primary)] hover:underline text-pretty line-clamp-2"
                      onClick={onClose}
                    >
                      {p.projectName}
                    </Link>
                    <div className="text-[10px] text-[var(--md-on-surface-variant)] font-mono">{p.projectCode}</div>
                  </td>
                  <td className="table-cell text-right font-bold tabular-nums">{p.actualQty}</td>
                  <td className="table-cell text-right tabular-nums stock-qty--pending">
                    {fmtStockQtyOrDash(p.plannedQty)}
                  </td>
                  <td className="table-cell text-right tabular-nums stock-qty--reserved">
                    {fmtStockQtyOrDash(p.reservedQty)}
                  </td>
                  <td className="table-cell text-right font-semibold tabular-nums pr-3">
                    {fmtPlannedStock(p.actualQty, p.plannedQty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-[var(--md-on-surface-variant)]">
        {activeProjects.length} dự án · Khả dụng = (Kho tổng − Xuất dự kiến) + Tồn dự án thực tế · Tồn dự kiến = Tồn thực tế + Nhập dự kiến
      </p>
    </div>
  );
}

export default function StockMaterialProjectModal({ row, onClose }: Props) {
  return (
    <Modal
      isOpen={!!row}
      onClose={onClose}
      title={row ? `${row.materialCode} — ${row.materialName}` : ''}
      size="xl"
      footer={
        <div className="flex w-full justify-between items-center gap-2">
          <Link
            to="/warehouse/materials"
            state={{ highlightCode: row?.materialCode }}
            className="text-xs text-[var(--md-primary)] hover:underline"
            onClick={onClose}
          >
            Xem danh mục vật tư
          </Link>
          <button type="button" className="btn btn-outline" onClick={onClose}>Đóng</button>
        </div>
      }
    >
      {row && <StockMaterialProjectContent key={row.materialCode} row={row} onClose={onClose} />}
    </Modal>
  );
}
