import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  lineAmount,
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
  const { data: materialsPage } = useMaterials({ all: true });
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

  const knownMaterialCodes = useMemo(() => {
    return new Set(materials.map(m => m.materialCode.trim().toLowerCase()));
  }, [materials]);

  const missingMaterialLines = useMemo(() => {
    if (!materialsPage || materials.length === 0) return [];
    return lines
      .map((line, idx) => ({ line, rowNumber: idx + 1 }))
      .filter(({ line }) => {
        const isMaterial = (line.lineType || 'material') === 'material';
        const code = line.materialCode?.trim().toLowerCase() ?? '';
        return isMaterial && Boolean(code) && !knownMaterialCodes.has(code);
      });
  }, [lines, materialsPage, materials, knownMaterialCodes]);

  const totals = useMemo(() => {
    let budget = 0;
    let proposal = 0;
    let purchase = 0;
    let filled = 0;
    for (const line of lines) {
      const isMaterial = (line.lineType ?? 'material') === 'material';
      const isFilled = isMaterial
        ? Boolean(line.materialCode.trim() && line.unit.trim() && (parseNum(line.quantity) ?? 0) > 0)
        : Boolean(line.productName.trim() && line.unit.trim() && (parseNum(line.quantity) ?? 0) > 0);
      if (isFilled) {
        filled += 1;
      }
      budget += lineAmount(line.quantity, line.budgetUnitPrice, isMaterial ? line.kgPerUnit : undefined);
      proposal += lineAmount(line.quantity, line.proposalUnitPrice, isMaterial ? line.kgPerUnit : undefined);
      purchase += lineAmount(line.quantity, line.purchaseUnitPrice, isMaterial ? line.kgPerUnit : undefined);
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
    setLines(fromExistingPlanLines(editPlan.lines));
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
    if (missingMaterialLines.length > 0) {
      const previewDetails = missingMaterialLines
        .slice(0, 5)
        .map(m => `Dòng ${m.rowNumber}: mã '${m.line.materialCode}'`)
        .join('; ');
      const extra =
        missingMaterialLines.length > 5
          ? ` và ${missingMaterialLines.length - 5} dòng khác...`
          : '.';
      showToast(
        'error',
        `Không thể tạo ${entityLabel} do có ${missingMaterialLines.length} dòng vật tư chưa có trong danh mục: ${previewDetails}${extra} Vui lòng tạo mã vật tư trước hoặc chỉnh sửa lại.`,
      );
      return;
    }
    const apiLines = toApiLines(lines);
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
    if (isEdit && editPlan) {
      setLines(fromExistingPlanLines(editPlan.lines));
    } else {
      setLines([emptyLine()]);
    }
    setExpanded({});
    showToast('info', 'Đã xóa kết quả file và làm mới danh sách dòng hàng.');
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={isEdit ? `Sửa ${entityLabel} ${editCode}` : (isAdhoc ? 'Tạo mua hàng phát sinh' : 'Tạo kế hoạch mua hàng')}
      size="wide"
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

        {missingMaterialLines.length > 0 && (
          <div className="mb-3 p-3 rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="font-semibold text-red-700 dark:text-red-300">
                Phát hiện {missingMaterialLines.length} dòng vật tư chưa có trong danh mục hệ thống:
              </div>
              <div className="text-[11px] leading-relaxed max-h-24 overflow-y-auto pr-1">
                {missingMaterialLines.map(m => (
                  <span
                    key={m.rowNumber}
                    className="inline-block mr-2 mb-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/60 rounded border border-red-200 dark:border-red-800"
                  >
                    <strong>Dòng {m.rowNumber}:</strong> {m.line.materialCode} ({m.line.productName || 'Chưa có tên'})
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-red-600 dark:text-red-400 italic">
                * Vui lòng khai báo các mã vật tư này trên hệ thống trước, hoặc chọn mã vật tư đã có trong danh mục.
              </div>
            </div>
          </div>
        )}

        <PurchasePlanCreateLinesTable
          lines={lines}
          expanded={expanded}
          materials={materials}
          suppliers={suppliers}
          linesLocked={linesLocked}
          totals={totals}
          risksByLineKey={risksByLineKey}
          knownMaterialCodes={knownMaterialCodes}
          onAddLine={(type) => setLines(prev => [...prev, emptyLine(type)])}
          onUpdateLine={updateLine}
          onRemoveLine={removeLine}
          onToggleExpand={toggleExpand}
        />
      </div>
    </Modal>
  );
}
