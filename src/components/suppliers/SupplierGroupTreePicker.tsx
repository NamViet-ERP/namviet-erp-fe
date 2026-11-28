import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';
import {
  buildSupplierGroupTree,
  filterSupplierGroupTree,
  formatSupplierGroupPath,
  getParentSelectionState,
  toggleChildGroupSelection,
  toggleParentGroupSelection,
  type SupplierGroupTreeNode,
} from '../../lib/suppliers/supplierGroupTree';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';

export interface SupplierGroupTreePickerProps {
  groups: SupplierGroupApiDto[];
  selectedIds: number[];
  onChange: (nextIds: number[]) => void;
  emptyMessage?: string;
}

function getInitiallyExpandedParentIds(
  tree: readonly SupplierGroupTreeNode[],
  selectedIds: readonly number[],
): Set<number> {
  const expanded = new Set<number>();
  for (const node of tree) {
    if (node.children.length === 0) continue;
    const { selectedChildCount, hasLegacyParentOnly } = getParentSelectionState(selectedIds, node);
    if (selectedChildCount > 0 || hasLegacyParentOnly) {
      expanded.add(node.group.id);
    }
  }
  return expanded;
}

export default function SupplierGroupTreePicker({
  groups,
  selectedIds,
  onChange,
  emptyMessage = 'Chưa có nhóm ngành hàng. Vào “Nhóm nhà cung cấp” để tạo trước.',
}: SupplierGroupTreePickerProps) {
  const [search, setSearch] = useState('');

  const groupMap = useMemo(() => {
    const map = new Map<number, SupplierGroupApiDto>();
    for (const g of groups) map.set(g.id, g);
    return map;
  }, [groups]);

  const tree = useMemo(() => buildSupplierGroupTree(groups), [groups]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const uniqueSelectedIds = useMemo(() => Array.from(new Set(selectedIds)), [selectedIds]);
  const filtered = useMemo(() => filterSupplierGroupTree(tree, search), [tree, search]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    getInitiallyExpandedParentIds(tree, selectedIds),
  );
  const [seededOnGroupsLoad, setSeededOnGroupsLoad] = useState(() => groups.length > 0);
  const [searchToggledIds, setSearchToggledIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!seededOnGroupsLoad && groups.length > 0) {
      setSeededOnGroupsLoad(true);
      setExpandedIds(getInitiallyExpandedParentIds(tree, selectedIds));
    }
  }, [seededOnGroupsLoad, groups.length, tree, selectedIds]);

  const isSearching = search.trim().length > 0;
  const autoExpandSet = useMemo(() => new Set(filtered.autoExpandIds), [filtered.autoExpandIds]);

  const isParentExpanded = (parentId: number) => {
    if (isSearching) {
      const base = autoExpandSet.has(parentId);
      return searchToggledIds.has(parentId) ? !base : base;
    }
    return expandedIds.has(parentId);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSearchToggledIds(new Set());
  };

  const toggleExpand = (parentId: number) => {
    if (isSearching) {
      setSearchToggledIds(prev => {
        const next = new Set(prev);
        if (next.has(parentId)) next.delete(parentId);
        else next.add(parentId);
        return next;
      });
      return;
    }
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  return (
    <div className="supplier-group-picker">
      {uniqueSelectedIds.length > 0 ? (
        <div className="supplier-group-picker__summary">
          <div className="supplier-group-picker__chips">
            {uniqueSelectedIds.map(id => {
              const label = formatSupplierGroupPath(id, groupMap) || `Nhóm #${id}`;
              return (
                <span key={id} className="supplier-group-picker__chip">
                  <span className="supplier-group-picker__chip-label">{label}</span>
                  <button
                    type="button"
                    className="supplier-group-picker__chip-remove"
                    aria-label={`Bỏ chọn ${label}`}
                    title={`Bỏ chọn ${label}`}
                    onClick={() => onChange(uniqueSelectedIds.filter(x => x !== id))}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
          {uniqueSelectedIds.length >= 1 ? (
            <button
              type="button"
              className="supplier-group-picker__clear-all"
              onClick={() => onChange([])}
            >
              Bỏ chọn tất cả
            </button>
          ) : null}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="supplier-group-picker__empty">
          <EmptyState message={emptyMessage} />
        </div>
      ) : (
        <>
          <div className="supplier-group-picker__search">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm nhóm hoặc mô tả…"
            />
          </div>

          {filtered.nodes.length === 0 ? (
            <div className="supplier-group-picker__empty">
              <EmptyState message="Không tìm thấy nhóm ngành hàng phù hợp." />
            </div>
          ) : (
            <div className="supplier-group-picker__list" role="group" aria-label="Danh sách nhóm ngành hàng">
              {filtered.nodes.map(node => {
                if (node.children.length === 0) {
                  const checked = selectedSet.has(node.group.id);
                  return (
                    <label key={node.group.id} className="supplier-group-picker__standalone-row">
                      <input
                        type="checkbox"
                        className="form-checkbox supplier-group-picker__checkbox"
                        checked={checked}
                        onChange={() => onChange(toggleParentGroupSelection(selectedIds, node))}
                      />
                      <span className="supplier-group-picker__item-text">
                        <span className="supplier-group-picker__parent-name">{node.group.name}</span>
                        {node.group.description ? (
                          <span className="supplier-group-picker__desc">{node.group.description}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                }

                const { state, selectedChildCount, totalChildCount, hasLegacyParentOnly } =
                  getParentSelectionState(selectedIds, node);
                const expanded = isParentExpanded(node.group.id);

                return (
                  <div key={node.group.id} className="supplier-group-picker__node">
                    <div className="supplier-group-picker__parent-row">
                      <input
                        type="checkbox"
                        className="form-checkbox supplier-group-picker__checkbox"
                        checked={state === 'checked'}
                        ref={el => {
                          if (el) el.indeterminate = state === 'indeterminate';
                        }}
                        onChange={() => onChange(toggleParentGroupSelection(selectedIds, node))}
                        aria-label={`Chọn tất cả mô tả trong ${node.group.name}`}
                        title="Chọn / bỏ chọn toàn bộ mô tả"
                      />
                      <button
                        type="button"
                        className="supplier-group-picker__parent-trigger"
                        aria-expanded={expanded}
                        data-group-id={node.group.id}
                        onClick={() => toggleExpand(node.group.id)}
                      >
                        <span className="supplier-group-picker__chevron" aria-hidden>
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <span className="supplier-group-picker__parent-name">{node.group.name}</span>
                        <span
                          className={`supplier-group-picker__count-badge${
                            selectedChildCount > 0 ? ' supplier-group-picker__count-badge--active' : ''
                          }`}
                        >
                          {selectedChildCount > 0
                            ? `${selectedChildCount}/${totalChildCount} đã chọn`
                            : `${totalChildCount} mô tả`}
                        </span>
                      </button>
                    </div>

                    {hasLegacyParentOnly ? (
                      <div className="supplier-group-picker__legacy-hint">
                        Đang gán nhóm chung — hãy tick mô tả cụ thể
                      </div>
                    ) : null}

                    {expanded ? (
                      <div className="supplier-group-picker__children">
                        {node.children.map(child => (
                          <label key={child.id} className="supplier-group-picker__child-row">
                            <input
                              type="checkbox"
                              className="form-checkbox supplier-group-picker__checkbox"
                              checked={selectedSet.has(child.id)}
                              onChange={() =>
                                onChange(
                                  toggleChildGroupSelection(
                                    selectedIds,
                                    child.id,
                                    node.group.id,
                                  ),
                                )
                              }
                            />
                            <span className="supplier-group-picker__item-text">
                              <span className="supplier-group-picker__child-name">{child.name}</span>
                              {child.description ? (
                                <span className="supplier-group-picker__desc">{child.description}</span>
                              ) : null}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
