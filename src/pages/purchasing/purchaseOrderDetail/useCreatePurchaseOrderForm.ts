import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { showToast } from '../../../components/ui/Toast';
import { usePurchasePlan, usePurchasePlans } from '../../../hooks/usePurchasePlans';
import { useCreatePurchaseOrder } from '../../../hooks/usePurchaseOrders';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { findSupplierByName, suppliersService } from '../../../services/suppliersService';
import { addDaysIso, supplierOf, unitPriceOf } from './poDetailHelpers';
import type { PoInstallmentDraft } from './PoInstallmentCreatePanels';

const INSTALLMENT_DOC_TYPES = ['CO', 'CQ', 'DNTT', 'CONTRACT', 'INVOICE', 'BBNT', 'BBGH', 'OTHER'];

function createInstallmentDrafts(count: number): PoInstallmentDraft[] {
  const base = Math.floor((100 / count) * 100) / 100;
  const remainder = Number((100 - base * count).toFixed(2));
  return Array.from({ length: count }, (_, index) => ({
    percent: String(Number((base + (index === 0 ? remainder : 0)).toFixed(2))),
    requiredDocTypes: [],
  }));
}

export function useCreatePurchaseOrderForm(onCreated: (code: string) => void) {
  const createMutation = useCreatePurchaseOrder();
  const [sourceKind, setSourceKind] = useState<'plan' | 'adhoc'>('plan');
  const [planCode, setPlanCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [qtyByLine, setQtyByLine] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState<PoInstallmentDraft[]>(
    () => createInstallmentDrafts(1),
  );

  const { data: plansPage, isLoading: plansLoading } = usePurchasePlans({
    page: 1,
    pageSize: 200,
    kind: sourceKind,
    status: 'approved',
  });
  const { data: suppliersPage } = useQuery({
    queryKey: ['warehouse-suppliers', 'po-create'],
    queryFn: () => suppliersService.list({ page: 1, pageSize: 200 }),
  });

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

  const selectSourceKind = (next: 'plan' | 'adhoc') => {
    setSourceKind(next);
    selectPlan('');
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

  const changeInstallmentCount = (count: number) => {
    setInstallmentCount(count);
    setInstallments(createInstallmentDrafts(count));
  };

  const changeInstallmentPercent = (index: number, value: string) => {
    setInstallments(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, percent: value } : item
    )));
  };

  const addInstallmentDocType = (index: number) => {
    setInstallments(prev => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const nextType = INSTALLMENT_DOC_TYPES.find(
        type => !item.requiredDocTypes.includes(type),
      ) ?? 'OTHER';
      return { ...item, requiredDocTypes: [...item.requiredDocTypes, nextType] };
    }));
  };

  const changeInstallmentDocType = (
    installmentIndex: number,
    docIndex: number,
    value: string,
  ) => {
    setInstallments(prev => prev.map((item, itemIndex) => {
      if (itemIndex !== installmentIndex) return item;
      return {
        ...item,
        requiredDocTypes: item.requiredDocTypes.map(
          (docType, currentDocIndex) => currentDocIndex === docIndex ? value : docType,
        ),
      };
    }));
  };

  const removeInstallmentDocType = (installmentIndex: number, docIndex: number) => {
    setInstallments(prev => prev.map((item, itemIndex) => (
      itemIndex === installmentIndex
        ? {
            ...item,
            requiredDocTypes: item.requiredDocTypes.filter((_, index) => index !== docIndex),
          }
        : item
    )));
  };

  const submit = async () => {
    if (!planCode) {
      showToast('warning', sourceKind === 'adhoc'
        ? 'Vui lòng chọn phiếu mua hàng phát sinh.'
        : 'Vui lòng chọn mã KHMH.');
      return;
    }
    if (!supplierName) {
      showToast('warning', 'Vui lòng chọn nhà cung cấp theo phiếu nguồn.');
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

    const installmentPercents = installments.map(item => Number(item.percent));
    if (installments.length < 1) {
      showToast('warning', 'PO phải có ít nhất một đợt thanh toán.');
      return;
    }
    if (installmentPercents.some(percent => !Number.isFinite(percent) || percent <= 0 || percent > 100)) {
      showToast('warning', 'Tỷ lệ mỗi đợt phải lớn hơn 0 và không vượt quá 100%.');
      return;
    }
    const installmentTotal = installmentPercents.reduce((sum, percent) => sum + percent, 0);
    if (Math.abs(installmentTotal - 100) >= 0.001) {
      showToast('warning', 'Tổng tỷ lệ các đợt thanh toán phải bằng 100%.');
      return;
    }
    if (installments.some(item => item.requiredDocTypes.length === 0)) {
      showToast('warning', 'Mỗi đợt thanh toán phải có ít nhất một loại chứng từ bắt buộc.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        planCode,
        supplierId: matchedSupplier.id,
        note: note.trim() || null,
        lines,
        // BE: chỉ một trong hai — gửi chi tiết đợt (có % + chứng từ), không kèm installmentCount
        installments: installments.map((item, index) => ({
          stageNumber: index + 1,
          percent: Number(item.percent),
          requiredDocTypes: [...new Set(item.requiredDocTypes)],
        })),
      });
      showToast('success', `Đã tạo PO ${created.code}.`);
      onCreated(created.code);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được đơn hàng.'));
    }
  };

  return {
    createPending: createMutation.isPending,
    sourceKind,
    selectSourceKind,
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
    installmentCount,
    installments,
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
    changeInstallmentCount,
    changeInstallmentPercent,
    addInstallmentDocType,
    changeInstallmentDocType,
    removeInstallmentDocType,
    submit,
  };
}
