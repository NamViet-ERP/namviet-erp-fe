import type { PermissionModuleGroup } from '../../../lib/permissions/groupPermissionCatalog';

export type StatusFilter = 'all' | 'granted' | 'ungranted';
export type ActionFilter = 'all' | 'view' | 'create_update' | 'approve' | 'price_report';

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function keysOfGroup(group: PermissionModuleGroup): string[] {
  return group.resources.flatMap(r => r.entries.map(e => e.key));
}

export function countSelected(keys: string[], selected: Set<string>): number {
  return keys.filter(k => selected.has(k)).length;
}
