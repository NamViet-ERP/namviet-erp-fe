import type { PermissionCatalogEntryApiDto } from '../../services/rolePermissionsService';

export interface PermissionResourceGroup {
  resource: string;
  entries: PermissionCatalogEntryApiDto[];
}

export interface PermissionModuleGroup {
  module: string;
  moduleLabel: string;
  resources: PermissionResourceGroup[];
}

const MODULE_LABELS: Record<string, string> = {
  Core: 'Hệ thống',
  Admin: 'Quản trị',
  HRM: 'Nhân sự',
  WMS: 'Kho',
};

export function getModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}

export function groupPermissionCatalog(
  catalog: PermissionCatalogEntryApiDto[],
): PermissionModuleGroup[] {
  const byModule = new Map<string, Map<string, PermissionCatalogEntryApiDto[]>>();

  for (const entry of catalog) {
    if (!byModule.has(entry.module)) byModule.set(entry.module, new Map());
    const byResource = byModule.get(entry.module)!;
    if (!byResource.has(entry.resource)) byResource.set(entry.resource, []);
    byResource.get(entry.resource)!.push(entry);
  }

  const moduleOrder = ['Core', 'Admin', 'HRM', 'WMS'];

  return [...byModule.entries()]
    .sort(([a], [b]) => {
      const ai = moduleOrder.indexOf(a);
      const bi = moduleOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([module, resourcesMap]) => ({
      module,
      moduleLabel: getModuleLabel(module),
      resources: [...resourcesMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, entries]) => ({
          resource,
          entries: [...entries].sort((a, b) => a.key.localeCompare(b.key)),
        })),
    }));
}

export function filterPermissionGroups(
  groups: PermissionModuleGroup[],
  search: string,
): PermissionModuleGroup[] {
  const term = search.trim().toLowerCase();
  if (!term) return groups;

  return groups
    .map(group => ({
      ...group,
      resources: group.resources
        .map(resource => ({
          ...resource,
          entries: resource.entries.filter(entry =>
            entry.key.toLowerCase().includes(term)
            || entry.label.toLowerCase().includes(term)
            || entry.resource.toLowerCase().includes(term),
          ),
        }))
        .filter(resource => resource.entries.length > 0),
    }))
    .filter(group => group.resources.length > 0);
}
