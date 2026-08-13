import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useMaterials } from '../../hooks/useMaterials';
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
import { formatCurrency } from '../../utils/formatCurrency';
import PurchasePlanCreateImportBar from './PurchasePlanCreateImportBar';
import PurchasePlanCreateLinesTable from './PurchasePlanCreateLinesTable';
import {
  MAX_BUDGET_UNIT_PRICE,
  dateToDraft,
  emptyLine,
  fromPreviewLines,
  lineAmount,
  numToDraft,
  parseNum,
  toApiLines,
  type DraftLine,
} from './createPurchasePlanDraft';

interface CreatePurchasePlanModalProps {
  open: boolean;
  onClose: () => void;
  editCode?: string | null;
  onCreated?: (planCode: string) => void;
  onSaved?: (planCode: string) => void;
  /** plan = KHMH; adhoc = mua hàng phát sinh */
  kind?: 'plan' | 'adhoc';
}

/** Tạo / sửa KHMH — bảng gọn kiểu kho + mở rộng chi tiết từng dòng. */
export default function CreatePurchasePlanModal({
  open,
  onClose,
  editCode,
  onCreated,
  onSaved,
  kind = 'plan',
}: CreatePurchasePlanModalProps) {
  const isEdit = Boolean(editCode);
  const isAdhoc = kind === 'adhoc';
  const entityLabel = isAdhoc ? 'mua hàng phát sinh' : 'KHMH';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200, status: 'Active' });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const { data: materialsPage } = useMaterials({ pageSize: 500 });
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
  const [hydratedCode, setHydratedCode] = useState<string | null>(null);

  const projects = projectsPage?.items ?? [];
  const suppliers = suppliersPage?.items ?? [];
  const materials = materialsPage?.items ?? [];
  const busy =
    createMutation.isPending
    || updateMutation.isPending
    || previewMutation.isPending
    || templateMutation.isPending;
  const linesLocked = busy;

  const totals = useMemo(() => {
    let budget = 0;
    let proposal = 0;
    let purchase = 0;
    let filled = 0;
    for (const line of lines) {
      if (line.materialCode.trim() && line.unit.trim() && (parseNum(line.quantity) ?? 0) > 0) {
        filled += 1;
      }
      budget += lineAmount(line.quantity, line.budgetUnitPrice);
      proposal += lineAmount(line.quantity, line.proposalUnitPrice);
      purchase += lineAmount(line.quantity, line.purchaseUnitPrice);
    }
    return { budget, proposal, purchase, filled };
  }, [lines]);

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
      const matched = riskRows.filter(r =>
        r.warn
        && r.materialCode.toLowerCase() === materialCode.toLowerCase()
        && (
          (r.supplierName && names.has(r.supplierName.toLowerCase()))
          || (r.supplierId != null && suppliers.some(s =>
            s.id === r.supplierId && names.has(s.supplierName.trim().toLowerCase())))
        ),
      );
      if (matched.length > 0) map.set(line.key, matched);
    }
    return map;
  }, [lines, riskRows, suppliers]);

  const reset = () => {
    setProjectCode('');
    setNote('');
    setLines([emptyLine()]);
    setExpanded({});
    setFile(null);
    setPreview(null);
    setHydratedCode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    const mapped = (editPlan.lines?.length ? editPlan.lines : []).map(l => ({
      key: `line-${l.id}`,
      materialCode: l.materialCode ?? '',
      productName: l.productName ?? '',
      unit: l.unit ?? '',
      quantity: String(l.quantity ?? 1),
      systemName: l.systemName ?? '',
      category: l.category ?? '',
      spec: l.spec ?? '',
      lineNote: l.lineNote ?? '',
      kgPerUnit: numToDraft(l.kgPerUnit),
      purchaseStatus: l.purchaseStatus ?? '',
      budgetUnitPrice: numToDraft(l.budgetUnitPrice),
      proposalUnitPrice: numToDraft(l.proposalUnitPrice),
      proposalSupplierName: l.proposalSupplierName ?? '',
      purchaseUnitPrice: numToDraft(l.purchaseUnitPrice),
      purchaseSupplierName: l.purchaseSupplierName ?? '',
      selectedUnitPrice: numToDraft(l.selectedUnitPrice),
      selectedSupplierName: l.selectedSupplierName ?? '',
      selectionReason: l.selectionReason ?? '',
      expectedDeliveryDate: dateToDraft(l.expectedDeliveryDate),
      actualReceiptDate: dateToDraft(l.actualReceiptDate),
      requiredDate: dateToDraft(l.requiredDate),
      quotes: (l.quotes ?? []).map((q, qi) => ({
        key: `eq-${l.id}-${qi}`,
        sortOrder: q.sortOrder ?? qi + 1,
        unitPrice: numToDraft(q.unitPrice),
        supplierName: q.supplierName ?? '',
        amount: numToDraft(q.amount),
      })),
    }));
    setLines(mapped.length ? mapped : [emptyLine()]);
    setHydratedCode(editPlan.code);
  }, [open, isEdit, editCode, editPlan, hydratedCode]);

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)));
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
      const price = parseNum(lines[i].budgetUnitPrice);
      if (price == null) continue;
      if (price < 0 || price > MAX_BUDGET_UNIT_PRICE) {
        showToast(
          'warning',
          `Dòng ${i + 1}: Đơn giá ngân sách phải từ 0 đến ${formatCurrency(MAX_BUDGET_UNIT_PRICE)}.`,
        );
        return;
      }
    }
    const apiLines = toApiLines(lines);
    const hasPartial = lines.some(l => l.materialCode.trim() || l.productName.trim() || l.unit.trim());
    if (hasPartial && apiLines.length === 0) {
      showToast('warning', 'Dòng hàng chưa đủ: cần chọn Tên vật tư, ĐVT và SL > 0.');
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
      showToast('error', getApiErrorMessage(err, isEdit ? `Không cập nhật được ${entityLabel}.` : `Không tạo được ${entityLabel}.`));
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
      const imported = fromPreviewLines(result.lines ?? []);
      setLines(imported);
      setExpanded({});
      if (result.validRowCount === 0) {
        showToast('warning', 'Không có dòng hợp lệ để đưa vào bảng. Kiểm tra lỗi bên dưới.');
      } else {
        showToast(
          'success',
          `Đã đưa ${result.validRowCount} dòng vào bảng. Kiểm tra rồi bấm Tạo KHMH.`,
        );
      }
    } catch (err) {
      setPreview(null);
      showToast('error', getApiErrorMessage(err, 'Không đọc được file Excel.'));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={isEdit ? `Sửa ${entityLabel} ${editCode}` : (isAdhoc ? 'Tạo mua hàng phát sinh' : 'Tạo kế hoạch mua hàng')}
      size="xl"
      footer={(
        <>
          <button type="button" className="btn btn-text" onClick={handleClose} disabled={busy}>
            Đóng
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { void saveManual(); }} disabled={busy}>
            {busy
              ? (isEdit ? 'Đang lưu…' : 'Đang tạo…')
              : (isEdit ? 'Lưu thay đổi' : (isAdhoc ? 'Tạo phiếu' : 'Tạo KHMH'))}
          </button>
        </>
      )}
    >
      <div className="pur-create-plan">
        <div className="pur-create-plan__header-grid">
          <FormField label="Dự án" required className="pur-create-plan__field-project">
            <select
              className="form-input form-input-md"
              value={projectCode}
              disabled={busy || isEdit}
              onChange={e => setProjectCode(e.target.value)}
              aria-label="Dự án"
            >
              <option value="">Chọn dự án</option>
              {projects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Ghi chú" className="pur-create-plan__field-note">
            <input
              className="form-input form-input-sm"
              value={note}
              disabled={busy}
              onChange={e => setNote(e.target.value)}
              aria-label="Ghi chú KHMH"
              placeholder="Tuỳ chọn"
            />
          </FormField>
        </div>

        {!isEdit && (
          <PurchasePlanCreateImportBar
            busy={busy}
            file={file}
            preview={preview}
            fileInputRef={fileInputRef}
            templatePending={templateMutation.isPending}
            previewPending={previewMutation.isPending}
            onDownloadTemplate={() => { void downloadTemplate(); }}
            onFileChange={next => {
              setFile(next);
              setPreview(null);
            }}
            onImport={() => { void runPreview(); }}
            onClear={clearFile}
          />
        )}

        <PurchasePlanCreateLinesTable
          lines={lines}
          expanded={expanded}
          materials={materials}
          suppliers={suppliers}
          linesLocked={linesLocked}
          totals={totals}
          risksByLineKey={risksByLineKey}
          onAddLine={() => setLines(prev => [...prev, emptyLine()])}
          onUpdateLine={updateLine}
          onRemoveLine={removeLine}
          onToggleExpand={toggleExpand}
        />
      </div>
    </Modal>
  );
}
