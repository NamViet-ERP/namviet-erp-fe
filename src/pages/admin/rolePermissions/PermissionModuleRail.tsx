import type { PermissionModuleGroup } from '../../../lib/permissions/groupPermissionCatalog';
import { countSelected, keysOfGroup } from './rolePermissionHelpers';

interface PermissionModuleRailProps {
  groups: PermissionModuleGroup[];
  visibleGroups: PermissionModuleGroup[];
  activeGroup: PermissionModuleGroup | null;
  selected: Set<string>;
  searchCrossModules: boolean;
  isFiltered: boolean;
  onSelectModule: (module: string) => void;
}

export default function PermissionModuleRail({
  groups,
  visibleGroups,
  activeGroup,
  selected,
  searchCrossModules,
  isFiltered,
  onSelectModule,
}: PermissionModuleRailProps) {
  return (
    <nav className="admin-role-permissions-rail" aria-label="Phân hệ">
      {groups.map(fullGroup => {
        const fullKeys = keysOfGroup(fullGroup);
        const fullChecked = countSelected(fullKeys, selected);
        const isSelectedModule =
          !searchCrossModules &&
          (fullGroup.module === (activeGroup?.module ?? visibleGroups[0]?.module));

        const matchingGroup = visibleGroups.find(
          g => g.module === fullGroup.module,
        );
        const matchingCount = matchingGroup
          ? matchingGroup.resources.reduce(
              (sum, r) => sum + r.entries.length,
              0,
            )
          : 0;

        return (
          <button
            key={fullGroup.module}
            type="button"
            className={`admin-role-permissions-rail__item${
              isSelectedModule
                ? ' admin-role-permissions-rail__item--active'
                : ''
            }`}
            aria-current={isSelectedModule ? 'true' : undefined}
            onClick={() => onSelectModule(fullGroup.module)}
          >
            <div className="flex flex-col min-w-0 text-left">
              <span className="admin-role-permissions-rail__label">
                {fullGroup.moduleLabel}
              </span>
              {isFiltered && (
                <span className="text-xs opacity-75">
                  {matchingCount > 0 ? `${matchingCount} kết quả` : '0 kết quả'}
                </span>
              )}
            </div>
            <span className="admin-role-permissions-rail__count tabular-nums">
              {fullChecked}/{fullKeys.length}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
