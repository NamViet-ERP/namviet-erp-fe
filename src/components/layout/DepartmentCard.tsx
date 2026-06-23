import { ChevronRight } from 'lucide-react';
import type { Department, DepartmentSubItem } from '../../constants/departments';
import { ICON_SIZE } from '../../constants/icons';

interface DepartmentCardProps {
  dept: Department;
  onItemClick: (item: DepartmentSubItem, dept: Department) => void;
}

/** Shared mega-menu column card used by the Header launcher and Dashboard portal. */
export default function DepartmentCard({ dept, onItemClick }: DepartmentCardProps) {
  const DeptIcon = dept.icon;
  return (
    <div className="bg-[var(--md-surface-container)] rounded-2xl border border-[var(--md-outline-variant02)] p-4 shadow-sm h-full">
      <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-[var(--md-outline-variant)]">
        <div className="size-8 shrink-0 flex items-center justify-center rounded-xl bg-[var(--md-secondary-container)]">
          <DeptIcon size={ICON_SIZE.base} className="text-[var(--md-secondary)]" />
        </div>
        <h3 className="text-sm font-bold text-[var(--md-primary)] text-balance leading-tight">{dept.title}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {dept.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onItemClick(item, dept)}
              className="mega-menu-item group flex items-center justify-between w-full px-3 py-2.5 bg-[var(--md-surface-container-high)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded-xl transition-[background-color,border-color,transform] duration-150 ease-out hover:translate-x-0.5 active:scale-[0.99] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <ItemIcon size={ICON_SIZE.dense} className="text-[var(--md-on-surface-variant)] shrink-0" />
                <span className="text-[13px] text-[var(--md-on-surface)] truncate text-pretty">{item.label}</span>
              </div>
              <ChevronRight size={14} className="text-[var(--md-on-surface-variant)] shrink-0 ml-2 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[var(--md-secondary)]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
