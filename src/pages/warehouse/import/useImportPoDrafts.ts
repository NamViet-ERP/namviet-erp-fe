import { useEffect, useMemo, useRef, useState } from 'react';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';
import {
  defaultPoLineDrafts,
  draftsFromExistingItems,
  poDraftsToItems,
  type PoLineDraft,
  type PoLineQtyCap,
} from './importCreatePoDrafts';

interface UseImportPoDraftsArgs {
  isOpen: boolean;
  isCreateMode: boolean;
  isPoBoundEdit: boolean;
  selectedPoCode: string;
  issueFromGeneralWarehouse: boolean;
  poPreviewLines: PoImportLinePreviewApiDto[];
  items: MaterialQtyPriceLine[];
  editVoucherCode?: string;
  onItemsChange: (items: MaterialQtyPriceLine[]) => void;
  getQtyCap?: PoLineQtyCap;
}

export function useImportPoDrafts({
  isOpen,
  isCreateMode,
  isPoBoundEdit,
  selectedPoCode,
  issueFromGeneralWarehouse,
  poPreviewLines,
  items,
  editVoucherCode,
  onItemsChange,
  getQtyCap,
}: UseImportPoDraftsArgs) {
  const [poLineDrafts, setPoLineDrafts] = useState<Record<number, PoLineDraft>>({});
  const editPoSeedKeyRef = useRef('');
  const draftsRef = useRef(poLineDrafts);
  const latestRef = useRef({ poPreviewLines, items, onItemsChange, getQtyCap });

  useEffect(() => {
    draftsRef.current = poLineDrafts;
  }, [poLineDrafts]);

  useEffect(() => {
    latestRef.current = { poPreviewLines, items, onItemsChange, getQtyCap };
  });

  const poPreviewKey = useMemo(
    () =>
      `${selectedPoCode}|${issueFromGeneralWarehouse ? 'general' : 'project'}|${poPreviewLines
        .map(l => `${l.poItemId}:${l.available}:${l.generalAvailableQty ?? ''}`)
        .join(',')}`,
    [selectedPoCode, issueFromGeneralWarehouse, poPreviewLines],
  );

  // Sync PO line drafts when PO selection / preview lines change (refs keep parent callback stable).
  useEffect(() => {
    const { poPreviewLines: lines, onItemsChange: syncItems } = latestRef.current;
    if (!isCreateMode || !selectedPoCode) {
      if (isCreateMode) {
        draftsRef.current = {};
        setPoLineDrafts({});
      }
      return;
    }
    if (lines.length === 0) {
      draftsRef.current = {};
      setPoLineDrafts({});
      syncItems([]);
      return;
    }
    const cap: PoLineQtyCap | undefined = issueFromGeneralWarehouse
      ? line => {
          if (line.generalAvailableQty == null) return 0;
          const qty = Number(line.generalAvailableQty);
          return Number.isFinite(qty) ? Math.max(0, qty) : 0;
        }
      : undefined;
    const nextDrafts = defaultPoLineDrafts(lines, cap);
    draftsRef.current = nextDrafts;
    setPoLineDrafts(nextDrafts);
    syncItems(poDraftsToItems(lines, nextDrafts));
  }, [isCreateMode, selectedPoCode, issueFromGeneralWarehouse, poPreviewKey]);

  // Seed PO line drafts once when opening an existing PO-bound voucher for edit.
  useEffect(() => {
    if (!isOpen) {
      editPoSeedKeyRef.current = '';
      return;
    }
    const {
      poPreviewLines: lines,
      items: currentItems,
      onItemsChange: syncItems,
      getQtyCap: capFn,
    } = latestRef.current;
    if (!isPoBoundEdit || !selectedPoCode || lines.length === 0) return;
    const key = `${editVoucherCode ?? ''}|${poPreviewKey}`;
    if (editPoSeedKeyRef.current === key) return;
    editPoSeedKeyRef.current = key;
    const nextDrafts = draftsFromExistingItems(lines, currentItems, capFn);
    draftsRef.current = nextDrafts;
    setPoLineDrafts(nextDrafts);
    syncItems(poDraftsToItems(lines, nextDrafts));
  }, [isOpen, isPoBoundEdit, selectedPoCode, poPreviewKey, editVoucherCode]);

  const setPoLine = (poItemId: number, patch: Partial<PoLineDraft>) => {
    const prev = draftsRef.current;
    const next = {
      ...prev,
      [poItemId]: { ...(prev[poItemId] ?? { selected: false, qty: '0' }), ...patch },
    };
    draftsRef.current = next;
    setPoLineDrafts(next);
    onItemsChange(poDraftsToItems(poPreviewLines, next));
  };

  const toggleSelectAllPoLines = (checked: boolean) => {
    const next = { ...draftsRef.current };
    for (const line of poPreviewLines) {
      const cap = getQtyCap ? getQtyCap(line) : Number(line.available) || 0;
      if (!(Number.isFinite(cap) && cap > 0)) continue;
      const fallbackQty = Number.isFinite(cap) && cap > 0 ? String(cap) : '1';
      const existing = next[line.poItemId] ?? { selected: false, qty: fallbackQty };
      const qtyNum = Number(existing.qty) || 0;
      next[line.poItemId] = {
        ...existing,
        selected: checked,
        qty: checked && qtyNum <= 0 ? fallbackQty : existing.qty,
      };
    }
    draftsRef.current = next;
    setPoLineDrafts(next);
    onItemsChange(poDraftsToItems(poPreviewLines, next));
  };

  const selectedPoLineCount = useMemo(
    () => Object.values(poLineDrafts).filter(d => d.selected).length,
    [poLineDrafts],
  );

  const poDraftGrandTotal = useMemo(
    () =>
      poPreviewLines.reduce((sum, line) => {
        const draft = poLineDrafts[line.poItemId];
        if (!draft?.selected) return sum;
        const qty = Number(draft.qty) || 0;
        if (qty <= 0) return sum;
        return sum + qty * (Number(line.unitPrice) || 0);
      }, 0),
    [poPreviewLines, poLineDrafts],
  );

  return {
    poLineDrafts,
    selectedPoLineCount,
    poDraftGrandTotal,
    setPoLine,
    toggleSelectAllPoLines,
  };
}
