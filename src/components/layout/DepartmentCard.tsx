import { ChevronRight } from 'lucide-react';
import type { Department, DepartmentSubItem } from '../../constants/departments';
import { ICON_SIZE } from '../../constants/icons';
import { isNavItemAccessible } from '../../lib/protectedNavigation';
import type { PermissionKey } from '../../lib/permissions';

interface DepartmentCardProps {
  dept: Department;
  permissions: readonly PermissionKey[];
  onItemClick: (item: DepartmentSubItem, dept: Department) => void;
}

/** Shared mega-menu column card used by the Header launcher and Dashboard portal. */
export default function DepartmentCard({ dept, permissions, onItemClick }: DepartmentCardProps) {
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
          const locked = !isNavItemAccessible(permissions, item);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onItemClick(item, dept)}
              className={`mega-menu-item group flex items-center justify-between w-full px-3 py-2.5 bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] rounded-xl transition-[background-color,border-color,transform] duration-150 ease-out text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]${
                locked
                  ? ' mega-menu-item--locked'
                  : ' hover:bg-[var(--nv-sidebar-item-hover)] hover:border-[var(--md-secondary)] hover:translate-x-0.5 active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <ItemIcon size={ICON_SIZE.dense} className="text-[var(--md-on-surface-variant)] shrink-0" />
                <span className="text-[13px] text-[var(--md-on-surface)] truncate text-pretty">{item.label}</span>
              </div>
              {!locked && (
                <ChevronRight size={14} className="text-[var(--md-on-surface-variant)] shrink-0 ml-2 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[var(--md-secondary)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
