import { AlertTriangle, Globe } from 'lucide-react';
import PermissionGate from '../../../components/auth/PermissionGate';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import {
  getActionBadgeInfo,
  type PermissionModuleGroup,
} from '../../../lib/permissions/groupPermissionCatalog';
import { countSelected, keysOfGroup } from './rolePermissionHelpers';

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return text;
  const index = text.toLowerCase().indexOf(trimmed);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] rounded px-0.5">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

interface PermissionMatrixTableProps {
  displayGroups: PermissionModuleGroup[];
  activeGroup: PermissionModuleGroup | null;
  search: string;
  searchCrossModules: boolean;
  selected: Set<string>;
  canEdit: boolean;
  inViewKeys: string[];
  inViewCheckedCount: number;
  allInViewChecked: boolean;
  someInViewChecked: boolean;
  onTogglePermission: (key: string, checked: boolean) => void;
  onToggleKeys: (keys: string[], checked: boolean) => void;
}

export default function PermissionMatrixTable({
  displayGroups,
  activeGroup,
  search,
  searchCrossModules,
  selected,
  canEdit,
  inViewKeys,
  inViewCheckedCount,
  allInViewChecked,
  someInViewChecked,
  onTogglePermission,
  onToggleKeys,
}: PermissionMatrixTableProps) {
  return (
    <section
      className="admin-role-permissions-pane"
      aria-labelledby="admin-role-permissions-pane-title"
    >
      <header className="admin-role-permissions-pane__head">
        <div className="admin-role-permissions-pane__heading">
          <h2
            id="admin-role-permissions-pane-title"
            className="admin-role-permissions-pane__title"
          >
            {searchCrossModules
              ? 'Tất cả phân hệ'
              : activeGroup?.moduleLabel ?? 'Danh mục quyền'}
          </h2>
          <span className="admin-role-permissions-pane__meta tabular-nums">
            {inViewCheckedCount}/{inViewKeys.length} quyền đang bật trong danh sách này
          </span>
        </div>
        <PermissionGate permission="admin.roles.permissions.update">
          <label className="admin-role-permissions-pane__select-all">
            <input
              type="checkbox"
              checked={allInViewChecked}
              ref={el => {
                if (el) el.indeterminate = someInViewChecked;
              }}
              disabled={!canEdit || inViewKeys.length === 0}
              onChange={e => onToggleKeys(inViewKeys, e.target.checked)}
            />
            <span>Chọn tất cả ({inViewKeys.length})</span>
          </label>
        </PermissionGate>
      </header>

      <div className="admin-role-permissions-pane__body table-scroll">
        <table className="w-full border-collapse hrm-table admin-role-permissions-table">
          <thead>
            <tr>
              <th className="table-header-cell admin-role-permissions-col-on text-center w-14">
                Bật
              </th>
              <th className="table-header-cell w-20 text-center">
                Loại
              </th>
              <th className="table-header-cell">
                Tên quyền & Mô tả kỹ thuật
              </th>
            </tr>
          </thead>
          <tbody>
            {displayGroups.flatMap(group => {
              const showModuleBanner =
                searchCrossModules && displayGroups.length > 1;

              const resourceRows = group.resources.flatMap(resource => {
                const resourceKeys = resource.entries.map(e => e.key);
                const resourceCheckedCount = countSelected(
                  resourceKeys,
                  selected,
                );
                const resourceAllChecked =
                  resourceKeys.length > 0 &&
                  resourceCheckedCount === resourceKeys.length;
                const resourceSomeChecked =
                  resourceCheckedCount > 0 && !resourceAllChecked;

                const rows = resource.entries.map(entry => {
                  const checked = selected.has(entry.key);
                  const badge = getActionBadgeInfo(
                    entry.key,
                    entry.label,
                  );

                  return (
                    <tr
                      key={entry.key}
                      className={`table-row${
                        canEdit ? ' hrm-table-row--interactive' : ''
                      }${
                        checked
                          ? ' admin-role-permissions-table__row--on'
                          : ''
                      }`}
                      title={entry.key}
                      onClick={
                        canEdit
                          ? () => onTogglePermission(entry.key, !checked)
                          : undefined
                      }
                      {...(canEdit
                        ? getInteractiveRowProps(
                            () => onTogglePermission(entry.key, !checked),
                            `${checked ? 'Tắt' : 'Bật'} quyền ${entry.label}`,
                          )
                        : {})}
                    >
                      <td className="table-cell text-center admin-role-permissions-col-on">
                        <input
                          type="checkbox"
                          className="admin-role-permissions-table__checkbox"
                          checked={checked}
                          disabled={!canEdit}
                          onClick={e => e.stopPropagation()}
                          onChange={e =>
                            onTogglePermission(
                              entry.key,
                              e.target.checked,
                            )
                          }
                          aria-label={`Bật quyền ${entry.label}`}
                        />
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        <span
                          className={badge.badgeClass}
                          title={badge.tooltip}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-[var(--md-on-surface)]">
                              {highlightMatch(entry.label, search)}
                            </span>
                            {badge.isSensitive && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] border border-[var(--md-outline-variant)]">
                                <AlertTriangle size={11} aria-hidden />
                                Quyền nhạy cảm (Đơn giá & Giá trị tồn)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[var(--md-on-surface-variant)] font-mono opacity-80">
                            {highlightMatch(entry.key, search)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                });

                return [
                  <tr
                    key={`group-${group.module}-${resource.resource}`}
                    className="admin-role-permissions-group-row"
                  >
                    <td
                      className="admin-role-permissions-group"
                      colSpan={3}
                    >
                      <div className="admin-role-permissions-group__content">
                        <div className="flex items-center gap-2.5">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="admin-role-permissions-table__checkbox"
                              checked={resourceAllChecked}
                              ref={el => {
                                if (el)
                                  el.indeterminate =
                                    resourceSomeChecked;
                              }}
                              disabled={!canEdit}
                              onChange={e =>
                                onToggleKeys(
                                  resourceKeys,
                                  e.target.checked,
                                )
                              }
                              aria-label={`Chọn toàn bộ nhóm ${resource.resourceLabel}`}
                            />
                            <span className="admin-role-permissions-group__title">
                              {resource.resourceLabel}
                            </span>
                          </label>
                          <span className="admin-role-permissions-group__count tabular-nums">
                            {resourceCheckedCount}/{resourceKeys.length}{' '}
                            quyền
                          </span>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              className="text-[var(--md-primary)] hover:underline font-medium px-2 py-0.5 rounded hover:bg-[var(--tint-primary-hover)] transition-colors"
                              onClick={() =>
                                onToggleKeys(resourceKeys, true)
                              }
                              title={`Bật tất cả quyền trong nhóm ${resource.resourceLabel}`}
                            >
                              Bật hết
                            </button>
                            <span className="text-[var(--md-outline-variant02)]">
                              |
                            </span>
                            <button
                              type="button"
                              className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:underline font-medium px-2 py-0.5 rounded hover:bg-[var(--tint-primary-hover)] transition-colors"
                              onClick={() =>
                                onToggleKeys(resourceKeys, false)
                              }
                              title={`Tắt tất cả quyền trong nhóm ${resource.resourceLabel}`}
                            >
                              Tắt hết
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>,
                  ...rows,
                ];
              });

              if (!showModuleBanner) return resourceRows;

              return [
                <tr
                  key={`module-banner-${group.module}`}
                  className="admin-role-permissions-group-row"
                >
                  <td
                    colSpan={3}
                    className="bg-[var(--md-surface-container-high)] px-3 py-2 border-y border-[var(--md-outline-variant02)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--md-primary)] flex items-center gap-1.5">
                        <Globe size={14} aria-hidden />
                        Phân hệ: {group.moduleLabel}
                      </span>
                      <span className="text-xs text-[var(--md-on-surface-variant)] font-medium tabular-nums">
                        {countSelected(keysOfGroup(group), selected)}/
                        {keysOfGroup(group).length} quyền đang bật
                      </span>
                    </div>
                  </td>
                </tr>,
                ...resourceRows,
              ];
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
