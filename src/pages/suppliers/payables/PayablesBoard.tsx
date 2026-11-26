import type { ReactNode } from 'react';
import SectionCard from '../../../components/ui/SectionCard';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { SupplierPayableLineApiDto } from '../../../types/api/purchasingApi';
import {
  lineStatusClass,
  lineStatusLabel,
  STATUS_FILTERS,
  type StatusFilter,
} from './payablesUtils';

export function LineStatusBadge({ line }: { line: SupplierPayableLineApiDto }) {
  const paidTime = line.lineStatus === 'paid' ? formatDateTimeVi(line.paidAt ?? undefined) : undefined;
  const paidBy = line.lineStatus === 'paid' ? (line.paidByName?.trim() || '') : '';
  return (
    <div className="pur-plan-status-cell">
      <span className={lineStatusClass(line)}>{lineStatusLabel(line)}</span>
      {paidTime || paidBy ? (
        <div className="pur-plan-status-meta">
          {paidTime ? <div className="tabular-nums">{paidTime}</div> : null}
          {paidBy ? <div className="pur-plan-status-meta__name" title={paidBy}>{paidBy}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function ApFilterTabs({ value, onChange }: { value: StatusFilter; onChange: (id: StatusFilter) => void }) {
  return (
    <div className="ops-projects-tabs" role="tablist" aria-label="Lọc trạng thái thanh toán">
      {STATUS_FILTERS.map(item => (
        <button
          key={item.id || 'all'}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`ops-projects-tabs__btn${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ApBoard({
  title,
  desc,
  toolbar,
  children,
}: {
  title: string;
  desc: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionCard noPadding className="ops-projects-board">
      <div className="ops-projects-board__head">
        <h2 className="ops-projects-board__title">{title}</h2>
        <p className="ops-projects-board__desc">{desc}</p>
      </div>
      {toolbar ? (
        <div className="hrm-list-toolbar">
          <div className="ops-projects__toolbar">{toolbar}</div>
        </div>
      ) : null}
      {children}
    </SectionCard>
  );
}
