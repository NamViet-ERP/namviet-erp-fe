import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useMaterials } from '../../hooks/useMaterials';
import { useServiceExpenseItems } from '../../hooks/useServiceExpenseItems';
import {
  useCreatePurchasePlan,
  usePurchasePlan,
  usePurchasePlanImportPreview,
  usePurchasePlanImportTemplate,
  useSupplierMaterialRisks,
  useUpdatePurchasePlan,
} from '../../hooks/usePurchasePlans';
import { findSupplierByName } from '../../services/suppliersService';
import type {
  PurchasePlanImportPreviewApiDto,
  SupplierMaterialRiskApiDto,
  SupplierMaterialRiskPairRequest,
} from '../../types/api/purchasingApi';
import { formatCurrencyVnd } from '../../utils/formatCurrency';
import {
  MAX_BUDGET_UNIT_PRICE,
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  isUnknownPlanItem,
  parseNum,
  parseOptionalCurrency,
  resolveDraftStageAmount,
  toApiLines,
  type DraftLine,
  type PlanAmountSourceMode,
  type PurchasePlanLineType,
} from './createPurchasePlanDraft';
import { buildPurchasePlanReconciliation } from './purchasePlanReconciliation';

interface UseCreatePurchasePlanFormParams {
  open: boolean;
  onClose: () => void;
  editCode?: string | null;
  onCreated?: (planCode: string) => void;
  onSaved?: (planCode: string) => void;
  kind: 'plan' | 'adhoc';
}

export function useCreatePurchasePlanForm({
  open,
  onClose,
  editCode,
  onCreated,
  onSaved,
  kind,
}: UseCreatePurchasePlanFormParams) {
  const isEdit = Boolean(editCode);
  const isAdhoc = kind === 'adhoc';
  const entityLabel = isAdhoc ? 'mua hàng phát sinh' : 'KHMH';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200, status: 'Active' }, { enabled: open });
  const { data: suppliersPage } = useSuppliers({ all: true }, { enabled: open });
  const { data: materialsPage } = useMaterials({ all: true }, { enabled: open });
  const { data: serviceItemsPage } = useServiceExpenseItems({ all: true }, { enabled: open });
  const { data: editPlan } = usePurchasePlan(open && editCode ? editCode : undefined);

  const createMutation = useCreatePurchasePlan();
  const updateMutation = useUpdatePurchasePlan();
  const previewMutation = usePurchasePlanImportPreview();
  const templateMutation = usePurchasePlanImportTemplate();

  const [projectCode, setProjectCode] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PurchasePlanImportPreviewApiDto | null>(null);
  const [amountSourceMode, setAmountSourceMode] = useState<PlanAmountSourceMode>('excel');
  const [hydratedCode, setHydratedCode] = useState<string | null>(null);

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);
  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const serviceItems = useMemo(() => serviceItemsPage?.items ?? [], [serviceItemsPage?.items]);

  const projectOptions = useMemo(
    () => projects.map(p => ({ value: p.projectCode, label: `${p.projectCode} — ${p.projectName}` })),
    [projects],
  );

  const busy =
    createMutation.isPending
    || updateMutation.isPending
    || previewMutation.isPending
    || templateMutation.isPending;

  const knownMaterialCodes = useMemo(
    () => new Set(materials.map(m => (m.materialCode ?? '').trim().toLowerCase()).filter(Boolean)),
    [materials],
  );

  const knownServiceCodes = useMemo(
    () => new Set(serviceItems.map(s => (s.code ?? '').trim().toLowerCase()).filter(Boolean)),
    [serviceItems],
  );

  const missingMaterialLines = useMemo(() => {
    if ((!materialsPage || materials.length === 0) && (!serviceItemsPage || serviceItems.length === 0)) {
      return [];
    }
    return lines
      .map((line, idx) => ({ line, rowNumber: idx + 1 }))
      .filter(({ line }) => isUnknownPlanItem(line, knownMaterialCodes, knownServiceCodes));
  }, [lines, materialsPage, materials, serviceItemsPage, serviceItems, knownMaterialCodes, knownServiceCodes]);

  const reconciliation = useMemo(
    () => (preview && !isEdit ? buildPurchasePlanReconciliation(lines) : null),
    [preview, isEdit, lines],
  );

  const totals = useMemo(() => {
    const effectiveMode: PlanAmountSourceMode = isEdit ? 'excel' : amountSourceMode;
    let budget = 0;
    let proposal = 0;
    let purchase = 0;
    let filled = 0;
    for (const line of lines) {
      const isMaterial = (line.lineType ?? 'material') === 'material';
      const isFilled = isMaterial
        ? Boolean(line.materialCode.trim() && line.unit.trim() && (parseNum(line.quantity) ?? 0) > 0)
        : Boolean(line.productName.trim() && line.unit.trim() && (parseNum(line.quantity) ?? 0) > 0);
      if (isFilled) filled += 1;
      budget += resolveDraftStageAmount(line, 'budget', effectiveMode) ?? 0;
      proposal += resolveDraftStageAmount(line, 'proposal', effectiveMode) ?? 0;
      purchase += (resolveDraftStageAmount(line, 'selected', effectiveMode) ?? resolveDraftStageAmount(line, 'purchase', effectiveMode)) ?? 0;
    }
    return { budget, proposal, purchase, filled };
  }, [lines, isEdit, amountSourceMode]);

  const riskPairs = useMemo((): SupplierMaterialRiskPairRequest[] => {
    const seen = new Set<string>();
    const pairs: SupplierMaterialRiskPairRequest[] = [];
    for (const line of lines) {
      const materialCode = line.materialCode.trim();
      if (!materialCode) continue;
      const names = [
        line.selectedSupplierName,
        line.purchaseSupplierName,
        line.proposalSupplierName,
        ...line.quotes.map(q => q.supplierName),
      ]
        .map(n => n.trim())
        .filter(Boolean);
      for (const supplierName of names) {
        const key = `${materialCode.toLowerCase()}|${supplierName.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const matched = findSupplierByName(suppliers, supplierName);
        pairs.push({
          materialCode,
          supplierName,
          supplierId: matched?.id ?? null,
        });
      }
    }
    return pairs;
  }, [lines, suppliers]);

  const { data: riskRows = [] } = useSupplierMaterialRisks(riskPairs, open);

  const risksByLineKey = useMemo(() => {
    const map = new Map<string, SupplierMaterialRiskApiDto[]>();
    if (riskRows.length === 0) return map;
    for (const line of lines) {
      const materialCode = line.materialCode.trim();
      if (!materialCode) continue;
      const names = new Set(
        [
          line.selectedSupplierName,
          line.purchaseSupplierName,
          line.proposalSupplierName,
          ...line.quotes.map(q => q.supplierName),
        ]
          .map(n => n.trim().toLowerCase())
          .filter(Boolean),
      );
      const matched = riskRows.filter(
        r =>
          r.warn
          && r.materialCode.toLowerCase() === materialCode.toLowerCase()
          && (
            (r.supplierName && names.has(r.supplierName.toLowerCase()))
            || (r.supplierId != null && suppliers.some(
              s => s.id === r.supplierId && names.has(s.supplierName.trim().toLowerCase()),
            ))
          ),
      );
      if (matched.length > 0) map.set(line.key, matched);
    }
    return map;
  }, [lines, riskRows, suppliers]);

  const reset = useCallback(() => {
    setProjectCode('');
    setNote('');
    setLines([emptyLine()]);
    setExpanded({});
    setFile(null);
    setPreview(null);
    setAmountSourceMode('excel');
    setHydratedCode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (!isEdit) {
      setHydratedCode(null);
      return;
    }
    if (!editPlan || editPlan.code !== editCode || hydratedCode === editPlan.code) return;
    setProjectCode(editPlan.projectCode);
    setNote(editPlan.note ?? '');
    setLines(fromExistingPlanLines(editPlan.lines));
    setHydratedCode(editPlan.code);
  }, [open, isEdit, editCode, editPlan, hydratedCode, reset]);

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const addLine = (type?: PurchasePlanLineType) => {
    setLines(prev => [...prev, emptyLine(type)]);
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines(prev => prev.map(l => {
      if (l.key !== key) return l;
      const next: DraftLine = { ...l, ...patch };
      const budgetInputsChanged =
        (patch.quantity !== undefined && patch.quantity !== l.quantity)
        || (patch.kgPerUnit !== undefined && patch.kgPerUnit !== l.kgPerUnit)
        || (patch.budgetUnitPrice !== undefined && patch.budgetUnitPrice !== l.budgetUnitPrice);
      if (budgetInputsChanged && !('budgetAmount' in patch) && !('lockBudgetAmount' in patch)) {
        next.lockBudgetAmount = false;
        next.budgetAmount = '';
      }
      const proposalKgChanged = patch.proposalKgPerUnit !== undefined && patch.proposalKgPerUnit !== l.proposalKgPerUnit;
      const proposalPriceChanged = patch.proposalUnitPrice !== undefined && patch.proposalUnitPrice !== l.proposalUnitPrice;
      if (
        (proposalKgChanged || proposalPriceChanged)
        && !('proposalAmount' in patch)
        && !('lockProposalAmount' in patch)
      ) {
        next.lockProposalAmount = false;
        next.proposalAmount = '';
      }
      const purchaseKgChanged = patch.purchaseKgPerUnit !== undefined && patch.purchaseKgPerUnit !== l.purchaseKgPerUnit;
      const purchasePriceChanged = patch.purchaseUnitPrice !== undefined && patch.purchaseUnitPrice !== l.purchaseUnitPrice;
      if (
        (purchaseKgChanged || purchasePriceChanged)
        && !('purchaseAmount' in patch)
        && !('lockPurchaseAmount' in patch)
      ) {
        next.lockPurchaseAmount = false;
        next.purchaseAmount = '';
      }
      const selectedPriceChanged = patch.selectedUnitPrice !== undefined && patch.selectedUnitPrice !== l.selectedUnitPrice;
      const selectedInputsChanged =
        selectedPriceChanged
        || purchaseKgChanged
        || (proposalKgChanged && !next.purchaseKgPerUnit.trim());
      if (
        selectedInputsChanged
        && !('selectedAmount' in patch)
        && !('lockSelectedAmount' in patch)
      ) {
        next.lockSelectedAmount = false;
        next.selectedAmount = '';
      }
      return next;
    }));
  };

  const removeLine = (key: string) => {
    setLines(prev => (prev.length <= 1 ? [emptyLine()] : prev.filter(l => l.key !== key)));
    setExpanded(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveManual = async () => {
    if (!projectCode) {
      showToast('warning', 'Vui lòng chọn dự án.');
      return;
    }
    for (let i = 0; i < lines.length; i += 1) {
      const price = parseOptionalCurrency(lines[i].budgetUnitPrice);
      if (price == null) continue;
      if (price < 0 || price > MAX_BUDGET_UNIT_PRICE) {
        showToast(
          'warning',
          `Dòng ${i + 1}: Đơn giá ngân sách phải từ 0 đến ${formatCurrencyVnd(MAX_BUDGET_UNIT_PRICE)}.`,
        );
        return;
      }
    }
    if (missingMaterialLines.length > 0) {
      const previewDetails = missingMaterialLines
        .slice(0, 5)
        .map(m => `Dòng ${m.rowNumber}: mã '${m.line.materialCode}'`)
        .join('; ');
      const extra = missingMaterialLines.length > 5
        ? ` và ${missingMaterialLines.length - 5} dòng khác...`
        : '.';
      showToast(
        'error',
        `Không thể tạo ${entityLabel} do có ${missingMaterialLines.length} dòng vật tư chưa có trong danh mục: ${previewDetails}${extra} Vui lòng tạo mã vật tư trước hoặc chỉnh sửa lại.`,
      );
      return;
    }
    const apiLines = toApiLines(lines, isEdit ? 'excel' : amountSourceMode);
    const hasPartial = lines.some(l => l.materialCode.trim() || l.productName.trim() || l.unit.trim());
    if (hasPartial && apiLines.length === 0) {
      showToast('warning', 'Dòng hàng chưa đủ: cần chọn Tên vật tư / Dịch vụ, ĐVT và SL > 0.');
      return;
    }
    try {
      if (isEdit && editCode) {
        const plan = await updateMutation.mutateAsync({
          code: editCode,
          body: { note: note.trim() || null, lines: apiLines },
        });
        showToast('success', `Đã cập nhật ${entityLabel} ${plan.code}.`);
        reset();
        onClose();
        onSaved?.(plan.code);
        return;
      }
      const plan = await createMutation.mutateAsync({
        projectCode,
        note: note.trim() || null,
        kind,
        lines: apiLines.length > 0 ? apiLines : null,
      });
      showToast('success', `Đã tạo ${entityLabel} ${plan.code}.`);
      reset();
      onClose();
      onCreated?.(plan.code);
    } catch (err) {
      showToast(
        'error',
        getApiErrorMessage(err, isEdit ? `Không cập nhật được ${entityLabel}.` : `Không tạo được ${entityLabel}.`),
      );
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await templateMutation.mutateAsync();
      const saved = await saveBlob(blob, 'Mau_import_KHMH.xlsx');
      if (saved) showToast('success', 'Đã tải mẫu import KHMH.');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Không tải được mẫu Excel.');
      if (/403|forbidden|quyền|permission/i.test(msg)) {
        showToast('error', 'Tài khoản chưa có quyền import KHMH (purchasing.plans.import).');
        return;
      }
      showToast('error', msg);
    }
  };

  const runPreview = async () => {
    if (!projectCode) {
      showToast('warning', 'Vui lòng chọn dự án trước khi import.');
      return;
    }
    if (!file) {
      showToast('warning', 'Vui lòng chọn file Excel.');
      return;
    }
    try {
      const result = await previewMutation.mutateAsync({ projectCode, file });
      setPreview(result);
      setAmountSourceMode('excel');
      setLines(fromPreviewLines(result.lines ?? []));
      setExpanded({});
      if (result.validRowCount === 0) {
        showToast('warning', 'Không có dòng hợp lệ để đưa vào bảng. Kiểm tra lỗi bên dưới.');
      } else {
        showToast('success', `Đã đưa ${result.validRowCount} dòng vào bảng. Kiểm tra rồi bấm Tạo KHMH.`);
      }
    } catch (err) {
      setPreview(null);
      showToast('error', getApiErrorMessage(err, 'Không đọc được file Excel.'));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setAmountSourceMode('excel');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLines(isEdit && editPlan ? fromExistingPlanLines(editPlan.lines) : [emptyLine()]);
    setExpanded({});
    showToast('info', 'Đã xóa kết quả file và làm mới danh sách dòng hàng.');
  };

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setPreview(null);
  };

  return {
    isEdit,
    isAdhoc,
    entityLabel,
    fileInputRef,
    projectCode,
    setProjectCode,
    projectOptions,
    note,
    setNote,
    lines,
    expanded,
    file,
    preview,
    amountSourceMode,
    setAmountSourceMode,
    reconciliation,
    suppliers,
    materials,
    serviceItems,
    busy,
    templatePending: templateMutation.isPending,
    previewPending: previewMutation.isPending,
    knownMaterialCodes,
    knownServiceCodes,
    missingMaterialLines,
    totals,
    risksByLineKey,
    handleClose,
    addLine,
    updateLine,
    removeLine,
    toggleExpand,
    saveManual,
    downloadTemplate,
    runPreview,
    clearFile,
    handleFileChange,
  };
}
