import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { showToast } from '../../../components/ui/Toast';
import { usePurchasePlan, usePurchasePlans } from '../../../hooks/usePurchasePlans';
import { useCreatePurchaseOrder } from '../../../hooks/usePurchaseOrders';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { findSupplierByName, suppliersService } from '../../../services/suppliersService';
import { addDaysIso, supplierOf, unitPriceOf } from './poDetailHelpers';

export function useCreatePurchaseOrderForm(onCreated: (code: string) => void) {
  const createMutation = useCreatePurchaseOrder();
  const { data: plansPage, isLoading: plansLoading } = usePurchasePlans({ page: 1, pageSize: 200 });
  const { data: suppliersPage } = useQuery({
    queryKey: ['warehouse-suppliers', 'po-create'],
    queryFn: () => suppliersService.list({ page: 1, pageSize: 200 }),
  });

  const [planCode, setPlanCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [qtyByLine, setQtyByLine] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState('');

  const { data: plan, isLoading: planLoading, isError: planError, error: planErr } = usePurchasePlan(
    planCode || undefined,
  );

  const plans = plansPage?.items ?? [];
  const masterSuppliers = suppliersPage?.items ?? [];
  const allLines = useMemo(() => plan?.lines ?? [], [plan?.lines]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    for (const line of allLines) {
      const s = supplierOf(line);
      if (s) set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allLines]);

  const supplierLines = useMemo(() => {
    if (!supplierName) return [];
    return allLines.filter(l => supplierOf(l) === supplierName && l.remainingOrderableQty > 0);
  }, [allLines, supplierName]);

  const visibleSupplierLines = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return supplierLines;
    return supplierLines.filter(l => l.productName.toLowerCase().includes(q));
  }, [supplierLines, productSearch]);

  const matchedSupplier = useMemo(
    () => findSupplierByName(masterSuppliers, supplierName),
    [masterSuppliers, supplierName],
  );

  const dueDatePreview = useMemo(
    () => (matchedSupplier ? addDaysIso(matchedSupplier.maxDebtDays) : null),
    [matchedSupplier],
  );

  const allVisibleSelected = visibleSupplierLines.length > 0
    && visibleSupplierLines.every(l => selectedLineIds.includes(l.id));
  const someVisibleSelected = visibleSupplierLines.some(l => selectedLineIds.includes(l.id));

  const selectPlan = (next: string) => {
    setPlanCode(next);
    setSupplierName('');
    setSelectedLineIds([]);
    setQtyByLine({});
    setProductSearch('');
  };

  const selectSupplier = (next: string) => {
    setSupplierName(next);
    setSelectedLineIds([]);
    setQtyByLine({});
    setProductSearch('');
  };

  const toggleLine = (id: number, checked: boolean) => {
    setSelectedLineIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
    if (checked) {
      const line = supplierLines.find(l => l.id === id);
      if (line) {
        setQtyByLine(prev => ({ ...prev, [id]: String(line.remainingOrderableQty) }));
      }
    }
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    const visibleIds = visibleSupplierLines.map(l => l.id);
    if (checked) {
      setSelectedLineIds(prev => [...new Set([...prev, ...visibleIds])]);
      setQtyByLine(prev => {
        const next = { ...prev };
        for (const line of visibleSupplierLines) {
          next[line.id] = next[line.id] ?? String(line.remainingOrderableQty);
        }
        return next;
      });
    } else {
      setSelectedLineIds(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };

  const submit = async () => {
    if (!planCode) {
      showToast('warning', 'Vui lòng chọn mã KHMH.');
      return;
    }
    if (!supplierName) {
      showToast('warning', 'Vui lòng chọn nhà cung cấp theo KHMH.');
      return;
    }
    if (!matchedSupplier) {
      showToast(
        'error',
        `Không đối chiếu được NCC "${supplierName}" với danh mục. Vào Nhà cung cấp → Nhà cung cấp để tạo/sửa NCC (đúng tên + hạn công nợ).`,
      );
      return;
    }
    if (selectedLineIds.length === 0) {
      showToast('warning', 'Chọn ít nhất một dòng hàng.');
      return;
    }

    const lines = selectedLineIds.map(id => {
      const line = supplierLines.find(l => l.id === id)!;
      const qty = Number(String(qtyByLine[id] ?? '').replace(/[^\d.-]/g, '')) || 0;
      return {
        planLineId: id,
        qty,
        unitPrice: unitPriceOf(line),
        note: line.lineNote ?? null,
      };
    });

    if (lines.some(l => l.qty <= 0)) {
      showToast('warning', 'Số lượng đặt phải lớn hơn 0.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        planCode,
        supplierId: matchedSupplier.id,
        note: note.trim() || null,
        lines,
      });
      showToast('success', `Đã tạo PO ${created.code}.`);
      onCreated(created.code);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được đơn hàng.'));
    }
  };

  return {
    createPending: createMutation.isPending,
    plans,
    plansLoading,
    plan,
    planLoading,
    planError,
    planErr,
    planCode,
    supplierName,
    suppliers,
    note,
    setNote,
    productSearch,
    setProductSearch,
    selectedLineIds,
    qtyByLine,
    setQtyByLine,
    supplierLines,
    visibleSupplierLines,
    matchedSupplier,
    dueDatePreview,
    allVisibleSelected,
    someVisibleSelected,
    selectPlan,
    selectSupplier,
    toggleLine,
    toggleSelectAllVisible,
    submit,
  };
}
