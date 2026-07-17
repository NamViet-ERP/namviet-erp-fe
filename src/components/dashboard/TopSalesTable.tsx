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
    <section className="surface-panel surface-panel--table portal-rank-panel">
      <header className="surface-panel__header">
        <h3 className="surface-panel__header-title">{title}</h3>
      </header>
      <div className="overflow-x-auto table-scroll">
        <table className="portal-rank-table">
          <thead>
            <tr>
              <th className="portal-rank-table__th portal-rank-table__th--rank">#</th>
              <th className="portal-rank-table__th portal-rank-table__th--icon">Ảnh</th>
              <th className="portal-rank-table__th portal-rank-table__th--code">{codeLabel}</th>
              <th className="portal-rank-table__th">Tên</th>
              <th className="portal-rank-table__th portal-rank-table__th--qty">SL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const RowIcon = row.imageIcon;
              return (
                <tr key={row.code} className="portal-rank-table__row">
                  <td className="portal-rank-table__td portal-rank-table__td--center">
                    <span className="portal-rank-table__rank">{index + 1}</span>
                  </td>
                  <td className="portal-rank-table__td portal-rank-table__td--center">
                    <div className="portal-rank-table__icon-wrap">
                      <RowIcon size={14} aria-hidden />
                    </div>
                  </td>
                  <td className="portal-rank-table__td portal-rank-table__td--code">{row.code}</td>
                  <td className="portal-rank-table__td portal-rank-table__td--name">
                    <span className="line-clamp-2 text-pretty" title={row.name}>{row.name}</span>
                  </td>
                  <td className="portal-rank-table__td portal-rank-table__qty">{row.qty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
