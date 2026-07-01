import type { LucideIcon } from 'lucide-react';

export interface DashboardTopRow {
  imageIcon: LucideIcon;
  code: string;
  name: string;
  qty: number;
}

interface TopSalesTableProps {
  title: string;
  rows: DashboardTopRow[];
  codeLabel?: string;
}

export default function TopSalesTable({ title, rows, codeLabel = 'Mã thành phẩm' }: TopSalesTableProps) {
  return (
    <section className="surface-panel surface-panel--table">
      <header className="surface-panel__header">
        <h3 className="surface-panel__header-title">{title}</h3>
      </header>
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-10 text-center">#</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-16 text-center">Ảnh</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-[108px]">{codeLabel}</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)]">Tên</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-20 text-right">SL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const RowIcon = row.imageIcon;
              return (
                <tr
                  key={row.code}
                  className="border-b border-[var(--md-outline-variant)] last:border-b-0 hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                >
                  <td className="px-3 py-2.5 text-center">
                    <span className="portal-rank-table__rank">{index + 1}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="portal-rank-table__icon-wrap">
                      <RowIcon size={14} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-[var(--md-on-surface)] tabular-nums">{row.code}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--md-on-surface)] font-medium leading-snug">
                    <span className="line-clamp-2 text-pretty" title={row.name}>{row.name}</span>
                  </td>
                  <td className="px-3 py-2.5 portal-rank-table__qty">{row.qty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
