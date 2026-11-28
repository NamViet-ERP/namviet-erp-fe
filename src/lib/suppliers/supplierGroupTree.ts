import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';

export interface SupplierGroupTreeNode {
  group: SupplierGroupApiDto;
  children: SupplierGroupApiDto[];
}

export type ParentSelectionState = 'checked' | 'indeterminate' | 'unchecked';

export interface ParentSelectionInfo {
  state: ParentSelectionState;
  selectedChildCount: number;
  totalChildCount: number;
  hasLegacyParentOnly: boolean;
}

export interface FilteredSupplierGroupTree {
  nodes: SupplierGroupTreeNode[];
  autoExpandIds: number[];
}

function compareGroupNamesVi(a: SupplierGroupApiDto, b: SupplierGroupApiDto): number {
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
}

function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

/**
 * Compares two group names after trimming, stripping Vietnamese diacritics (`NFD` + `đ/Đ -> d`),
 * and lowercasing. Returns `false` if either trimmed value is empty.
 */
export function isSameGroupNameFolded(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeSearchText(a).trim();
  const right = normalizeSearchText(b).trim();
  if (!left || !right) return false;
  return left === right;
}

/**
 * Compares two group names using `trim().toLowerCase()` matching backend uniqueness checks.
 * Returns `false` if either trimmed value is empty.
 */
export function isSameGroupNameExact(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = (a ?? '').trim().toLowerCase();
  const right = (b ?? '').trim().toLowerCase();
  if (!left || !right) return false;
  return left === right;
}

/**
 * Builds a 2-level Vietnamese-sorted tree from flat supplier groups.
 * Orphan groups whose parent is absent from the input list are promoted to top-level safely.
 */
export function buildSupplierGroupTree(
  groups: readonly SupplierGroupApiDto[],
): SupplierGroupTreeNode[] {
  const groupById = new Map<number, SupplierGroupApiDto>();
  for (const group of groups) {
    groupById.set(group.id, group);
  }

  const rootGroups: SupplierGroupApiDto[] = [];
  const rootIdSet = new Set<number>();
  const potentialChildren: SupplierGroupApiDto[] = [];

  for (const group of groupById.values()) {
    if (
      group.parentGroupId == null ||
      group.parentGroupId === group.id ||
      !groupById.has(group.parentGroupId)
    ) {
      rootGroups.push(group);
      rootIdSet.add(group.id);
    } else {
      potentialChildren.push(group);
    }
  }

  const childrenByParent = new Map<number, SupplierGroupApiDto[]>();
  for (const child of potentialChildren) {
    const parentId = child.parentGroupId as number;
    if (rootIdSet.has(parentId)) {
      const bucket = childrenByParent.get(parentId) ?? [];
      bucket.push(child);
      childrenByParent.set(parentId, bucket);
    } else {
      rootGroups.push(child);
      rootIdSet.add(child.id);
    }
  }

  rootGroups.sort(compareGroupNamesVi);

  return rootGroups.map(group => {
    const children = [...(childrenByParent.get(group.id) ?? [])].sort(compareGroupNamesVi);
    return { group, children };
  });
}

/**
 * Formats a supplier group path as `"{ParentName} › {ChildName}"` for child groups
 * or `"{Name}"` for root groups, falling back to `group.parentGroupName` if parent is missing.
 */
export function formatSupplierGroupPath(
  groupId: number,
  groupMap: ReadonlyMap<number, SupplierGroupApiDto>,
): string {
  const group = groupMap.get(groupId);
  if (!group) return '';
  if (group.parentGroupId == null) return group.name;

  const parentName = groupMap.get(group.parentGroupId)?.name ?? group.parentGroupName;
  return parentName ? `${parentName} › ${group.name}` : group.name;
}

/**
 * Toggles a child group ID inside a deduplicated selection array and strips any bare parent ID
 * to keep leaf-only selection consistent once children exist.
 */
export function toggleChildGroupSelection(
  selectedIds: readonly number[],
  childId: number,
  parentId: number | null | undefined,
): number[] {
  const unique = Array.from(new Set(selectedIds));
  const stripped = parentId != null ? unique.filter(id => id !== parentId) : unique;
  const exists = stripped.includes(childId);
  return exists ? stripped.filter(id => id !== childId) : [...stripped, childId];
}

/**
 * Toggles a standalone parent directly, or selects/unselects all children for parents with children
 * while stripping the bare parent ID and preserving selections in other groups.
 */
export function toggleParentGroupSelection(
  selectedIds: readonly number[],
  node: SupplierGroupTreeNode,
): number[] {
  const unique = Array.from(new Set(selectedIds));

  if (node.children.length === 0) {
    return unique.includes(node.group.id)
      ? unique.filter(id => id !== node.group.id)
      : [...unique, node.group.id];
  }

  const childIds = node.children.map(child => child.id);
  const childIdSet = new Set(childIds);
  const selectedSet = new Set(unique);
  const allChildrenSelected = childIds.every(id => selectedSet.has(id));

  if (allChildrenSelected) {
    return unique.filter(id => id !== node.group.id && !childIdSet.has(id));
  }

  const preserved = unique.filter(id => id !== node.group.id);
  const missingChildren = childIds.filter(id => !selectedSet.has(id));
  return [...preserved, ...missingChildren];
}

/**
 * Computes checked/indeterminate/unchecked state and legacy bare-parent detection for a tree node.
 */
export function getParentSelectionState(
  selectedIds: readonly number[],
  node: SupplierGroupTreeNode,
): ParentSelectionInfo {
  const selectedSet = new Set(selectedIds);
  const totalChildCount = node.children.length;

  if (totalChildCount === 0) {
    return {
      state: selectedSet.has(node.group.id) ? 'checked' : 'unchecked',
      selectedChildCount: 0,
      totalChildCount: 0,
      hasLegacyParentOnly: false,
    };
  }

  let selectedChildCount = 0;
  for (const child of node.children) {
    if (selectedSet.has(child.id)) selectedChildCount += 1;
  }

  const hasLegacyParentOnly = selectedChildCount === 0 && selectedSet.has(node.group.id);

  let state: ParentSelectionState;
  if (selectedChildCount === totalChildCount) {
    state = 'checked';
  } else if (selectedChildCount > 0 || hasLegacyParentOnly) {
    state = 'indeterminate';
  } else {
    state = 'unchecked';
  }

  return {
    state,
    selectedChildCount,
    totalChildCount,
    hasLegacyParentOnly,
  };
}

function matchesGroupQuery(group: SupplierGroupApiDto, normalizedQuery: string): boolean {
  return (
    normalizeSearchText(group.name).includes(normalizedQuery) ||
    normalizeSearchText(group.description).includes(normalizedQuery)
  );
}

/**
 * Filters a 2-level supplier group tree using Vietnamese diacritics-insensitive matching
 * across `name` and `description`, returning filtered nodes and parent IDs to auto-expand.
 */
export function filterSupplierGroupTree(
  tree: readonly SupplierGroupTreeNode[],
  query: string,
): FilteredSupplierGroupTree {
  const normalizedQuery = normalizeSearchText(query).trim();
  if (!normalizedQuery) {
    return { nodes: [...tree], autoExpandIds: [] };
  }

  const nodes: SupplierGroupTreeNode[] = [];
  const autoExpandIds: number[] = [];

  for (const node of tree) {
    if (matchesGroupQuery(node.group, normalizedQuery)) {
      nodes.push({ group: node.group, children: [...node.children] });
      if (node.children.length > 0) {
        autoExpandIds.push(node.group.id);
      }
      continue;
    }

    const matchingChildren = node.children.filter(child =>
      matchesGroupQuery(child, normalizedQuery),
    );
    if (matchingChildren.length > 0) {
      nodes.push({ group: node.group, children: matchingChildren });
      autoExpandIds.push(node.group.id);
    }
  }

  return { nodes, autoExpandIds };
}

export interface GroupedIndustryTagCluster {
  key: string;
  parent: string;
  children: string[];
  rawItems: string[];
}

const INDUSTRY_GROUP_SEPARATOR = ' › ';

/**
 * Parses trimmed supplier industry group labels (`"{Parent} › {Child}"` or standalone `"{Parent}"`),
 * grouping child tags under their parent in first-seen order without duplicate children.
 */
export function groupIndustryTags(
  groups: readonly string[],
): GroupedIndustryTagCluster[] {
  const clusters: GroupedIndustryTagCluster[] = [];
  const byParentKey = new Map<
    string,
    { cluster: GroupedIndustryTagCluster; seenChildKeys: Set<string>; seenRawKeys: Set<string> }
  >();

  for (const rawEntry of groups) {
    const trimmed = rawEntry.trim();
    if (!trimmed) continue;

    const sepIdx = trimmed.indexOf(INDUSTRY_GROUP_SEPARATOR);
    let parent = trimmed;
    let child: string | null = null;

    if (sepIdx !== -1) {
      const left = trimmed.slice(0, sepIdx).trim();
      const right = trimmed.slice(sepIdx + INDUSTRY_GROUP_SEPARATOR.length).trim();
      if (left && right) {
        parent = left;
        child = right;
      } else {
        parent = left || right;
      }
    }

    if (!parent) continue;

    const key = parent.toLowerCase();
    let entry = byParentKey.get(key);
    if (!entry) {
      const cluster: GroupedIndustryTagCluster = {
        key,
        parent,
        children: [],
        rawItems: [],
      };
      entry = {
        cluster,
        seenChildKeys: new Set<string>(),
        seenRawKeys: new Set<string>(),
      };
      byParentKey.set(key, entry);
      clusters.push(cluster);
    }

    if (child !== null) {
      const childKey = child.toLowerCase();
      if (!entry.seenChildKeys.has(childKey)) {
        entry.seenChildKeys.add(childKey);
        entry.cluster.children.push(child);
        const rawKey = `${key}${INDUSTRY_GROUP_SEPARATOR}${childKey}`;
        if (!entry.seenRawKeys.has(rawKey)) {
          entry.seenRawKeys.add(rawKey);
          entry.cluster.rawItems.push(trimmed);
        }
      }
    } else if (!entry.seenRawKeys.has(key)) {
      entry.seenRawKeys.add(key);
      entry.cluster.rawItems.push(trimmed);
    }
  }

  return clusters;
}
