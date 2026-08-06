import { ChevronRight, Lock } from 'lucide-react';
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
    <article className={`portal-dept-card portal-dept-card--${dept.tone}`}>
      <header className="portal-dept-card__head">
        <div className="portal-dept-card__icon" aria-hidden>
          <DeptIcon size={ICON_SIZE.base} />
        </div>
        <h3 className="portal-dept-card__title">{dept.title}</h3>
      </header>
      <div className="portal-dept-card__items">
        {dept.items.map((item) => {
          const ItemIcon = item.icon;
          const locked = !isNavItemAccessible(permissions, item);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onItemClick(item, dept)}
              className={`portal-dept-card__item mega-menu-item${locked ? ' mega-menu-item--locked' : ''}`}
            >
              <span className="portal-dept-card__item-main">
                <ItemIcon size={ICON_SIZE.dense} className="portal-dept-card__item-icon" aria-hidden />
                <span className="portal-dept-card__item-label">{item.label}</span>
              </span>
              {locked ? (
                <Lock size={12} className="portal-dept-card__item-lock" aria-hidden />
              ) : (
                <ChevronRight size={14} className="portal-dept-card__item-chevron" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}
