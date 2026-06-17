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
    <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
        <DeptIcon size={ICON_SIZE.base} className="text-[var(--md-secondary)]" />
        <h3 className="text-[16px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {dept.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onItemClick(item, dept)}
              className="mega-menu-item group flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-[background-color,border-color,color,transform] duration-md ease-md hover:translate-x-0.5 active:scale-[0.99] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
              style={{ outlineOffset: '2px', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <ItemIcon size={ICON_SIZE.dense} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--md-on-surface)] truncate">{item.label}</span>
              </div>
              <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1 transition-transform duration-md ease-md group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
