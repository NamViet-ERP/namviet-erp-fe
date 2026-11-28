import { describe, expect, it } from 'vitest';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';
import {
  buildSupplierGroupTree,
  filterSupplierGroupTree,
  formatSupplierGroupPath,
  getParentSelectionState,
  isSameGroupNameExact,
  isSameGroupNameFolded,
  toggleChildGroupSelection,
  toggleParentGroupSelection,
} from './supplierGroupTree';

function makeGroup(
  overrides: Partial<SupplierGroupApiDto> & Pick<SupplierGroupApiDto, 'id' | 'name'>,
): SupplierGroupApiDto {
  return {
    description: null,
    supplierCount: 0,
    parentGroupId: null,
    parentGroupName: null,
    childCount: 0,
    ...overrides,
  };
}

describe('supplierGroupTree', () => {
  const sampleGroups: SupplierGroupApiDto[] = [
    makeGroup({ id: 2, name: 'Vật tư Điện', description: 'Thiết bị điện công nghiệp', childCount: 2 }),
    makeGroup({ id: 1, name: 'Cơ khí & Thép', description: 'Kết cấu thép', childCount: 1 }),
    makeGroup({ id: 3, name: 'An toàn lao động', description: 'Bảo hộ PCCC', childCount: 0 }),
    makeGroup({
      id: 22,
      name: 'Đèn chiếu sáng',
      description: 'Đèn LED nhà xưởng',
      parentGroupId: 2,
      parentGroupName: 'Vật tư Điện',
    }),
    makeGroup({
      id: 21,
      name: 'Dây cáp điện',
      description: 'Cáp hạ thế & trung thế',
      parentGroupId: 2,
      parentGroupName: 'Vật tư Điện',
    }),
    makeGroup({
      id: 11,
      name: 'Thép hình',
      description: 'Thép I, H, U, V',
      parentGroupId: 1,
      parentGroupName: 'Cơ khí & Thép',
    }),
  ];

  it('buildSupplierGroupTree builds 2-level tree sorted by Vietnamese locale and promotes orphans safely', () => {
    const withOrphan: SupplierGroupApiDto[] = [
      ...sampleGroups,
      makeGroup({
        id: 99,
        name: 'Bơm nước (Mồ côi)',
        parentGroupId: 999,
        parentGroupName: 'Nhóm đã xóa',
      }),
    ];

    const tree = buildSupplierGroupTree(withOrphan);

    expect(tree.map(n => n.group.name)).toEqual([
      'An toàn lao động',
      'Bơm nước (Mồ côi)',
      'Cơ khí & Thép',
      'Vật tư Điện',
    ]);

    const electric = tree.find(n => n.group.id === 2)!;
    expect(electric.children.map(c => c.name)).toEqual([
      'Dây cáp điện',
      'Đèn chiếu sáng',
    ]);

    const orphan = tree.find(n => n.group.id === 99)!;
    expect(orphan.children).toEqual([]);
  });

  it('formatSupplierGroupPath formats Parent › Child, falls back to parentGroupName, and handles roots', () => {
    const map = new Map(sampleGroups.map(g => [g.id, g]));

    expect(formatSupplierGroupPath(21, map)).toBe('Vật tư Điện › Dây cáp điện');
    expect(formatSupplierGroupPath(3, map)).toBe('An toàn lao động');
    expect(formatSupplierGroupPath(999, map)).toBe('');

    const orphanMap = new Map<number, SupplierGroupApiDto>([
      [
        50,
        makeGroup({
          id: 50,
          name: 'Cáp đồng',
          parentGroupId: 5,
          parentGroupName: 'Vật tư Điện',
        }),
      ],
    ]);
    expect(formatSupplierGroupPath(50, orphanMap)).toBe('Vật tư Điện › Cáp đồng');
  });

  it('toggleChildGroupSelection deduplicates, toggles childId, and strips bare parentId', () => {
    expect(toggleChildGroupSelection([2, 3, 2], 21, 2)).toEqual([3, 21]);
    expect(toggleChildGroupSelection([3, 21, 2], 21, 2)).toEqual([3]);
    expect(toggleChildGroupSelection([], 21, 2)).toEqual([21]);
  });

  it('toggleParentGroupSelection toggles standalone parents and selects/unselects all children for parent nodes', () => {
    const tree = buildSupplierGroupTree(sampleGroups);
    const standalone = tree.find(n => n.group.id === 3)!;
    const electric = tree.find(n => n.group.id === 2)!;

    expect(toggleParentGroupSelection([], standalone)).toEqual([3]);
    expect(toggleParentGroupSelection([3, 11], standalone)).toEqual([11]);

    // Partial or legacy parent -> selects all children, strips bare parentId, keeps other groups
    expect(toggleParentGroupSelection([2, 11, 21], electric)).toEqual([11, 21, 22]);

    // All children selected -> unselects all children, preserves other groups
    expect(toggleParentGroupSelection([11, 21, 22], electric)).toEqual([11]);
  });

  it('getParentSelectionState returns checked, indeterminate, unchecked, and hasLegacyParentOnly', () => {
    const tree = buildSupplierGroupTree(sampleGroups);
    const electric = tree.find(n => n.group.id === 2)!;
    const standalone = tree.find(n => n.group.id === 3)!;

    expect(getParentSelectionState([], electric)).toEqual({
      state: 'unchecked',
      selectedChildCount: 0,
      totalChildCount: 2,
      hasLegacyParentOnly: false,
    });

    expect(getParentSelectionState([21], electric)).toEqual({
      state: 'indeterminate',
      selectedChildCount: 1,
      totalChildCount: 2,
      hasLegacyParentOnly: false,
    });

    expect(getParentSelectionState([21, 22], electric)).toEqual({
      state: 'checked',
      selectedChildCount: 2,
      totalChildCount: 2,
      hasLegacyParentOnly: false,
    });

    expect(getParentSelectionState([2], electric)).toEqual({
      state: 'indeterminate',
      selectedChildCount: 0,
      totalChildCount: 2,
      hasLegacyParentOnly: true,
    });

    expect(getParentSelectionState([3], standalone)).toEqual({
      state: 'checked',
      selectedChildCount: 0,
      totalChildCount: 0,
      hasLegacyParentOnly: false,
    });
  });

  it('filterSupplierGroupTree normalizes Vietnamese diacritics + đ/Đ across name & description and computes autoExpandIds', () => {
    const tree = buildSupplierGroupTree(sampleGroups);

    expect(filterSupplierGroupTree(tree, '   ')).toEqual({
      nodes: tree,
      autoExpandIds: [],
    });

    // Parent match keeps all its children and auto-expands parent
    const parentMatch = filterSupplierGroupTree(tree, 'vat tu dien');
    expect(parentMatch.nodes).toHaveLength(1);
    expect(parentMatch.nodes[0]!.group.id).toBe(2);
    expect(parentMatch.nodes[0]!.children.map(c => c.id)).toEqual([21, 22]);
    expect(parentMatch.autoExpandIds).toEqual([2]);

    // Child-only match (with đ/Đ normalization and description match) keeps parent + matching child
    const childNameMatch = filterSupplierGroupTree(tree, 'den chieu sang');
    expect(childNameMatch.nodes).toHaveLength(1);
    expect(childNameMatch.nodes[0]!.group.id).toBe(2);
    expect(childNameMatch.nodes[0]!.children.map(c => c.id)).toEqual([22]);
    expect(childNameMatch.autoExpandIds).toEqual([2]);

    const childDescMatch = filterSupplierGroupTree(tree, 'trung the');
    expect(childDescMatch.nodes).toHaveLength(1);
    expect(childDescMatch.nodes[0]!.children.map(c => c.id)).toEqual([21]);
    expect(childDescMatch.autoExpandIds).toEqual([2]);
  });

  it('isSameGroupNameFolded compares trimmed Vietnamese diacritics + đ/Đ case-insensitively and rejects empty values', () => {
    expect(isSameGroupNameFolded('Bảo Ôn', 'bao on')).toBe(true);
    expect(isSameGroupNameFolded('  Đèn Chiếu Sáng ', 'den chieu sang')).toBe(true);
    expect(isSameGroupNameFolded('đường ống', 'ĐƯỜNG ỐNG')).toBe(true);
    expect(isSameGroupNameFolded('Vật tư Điện', 'Vật tư Nước')).toBe(false);
    expect(isSameGroupNameFolded('', '')).toBe(false);
    expect(isSameGroupNameFolded('   ', '   ')).toBe(false);
    expect(isSameGroupNameFolded(null, 'Bảo Ôn')).toBe(false);
    expect(isSameGroupNameFolded('Bảo Ôn', undefined)).toBe(false);
  });

  it('isSameGroupNameExact matches trim().toLowerCase() preserving Vietnamese diacritics and rejects empty values', () => {
    expect(isSameGroupNameExact('  Bảo Ôn ', 'bảo ôn')).toBe(true);
    expect(isSameGroupNameExact('Đèn LED', 'đèn led')).toBe(true);
    expect(isSameGroupNameExact('Bảo Ôn', 'bao on')).toBe(false);
    expect(isSameGroupNameExact('Đường ống', 'Duong ong')).toBe(false);
    expect(isSameGroupNameExact('', '')).toBe(false);
    expect(isSameGroupNameExact('   ', '   ')).toBe(false);
    expect(isSameGroupNameExact(null, 'Bảo Ôn')).toBe(false);
    expect(isSameGroupNameExact('Bảo Ôn', undefined)).toBe(false);
  });
});
