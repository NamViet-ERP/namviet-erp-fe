import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, Download, FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import CurrencyInput from '../ui/CurrencyInput';
import QtyStepper from '../ui/QtyStepper';
import SupplierAutocomplete from '../ui/SupplierAutocomplete';
import MaterialAutocomplete from '../ui/MaterialAutocomplete';
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
  CreatePurchasePlanLineRequest,
  PurchasePlanImportLinePreviewApiDto,
  PurchasePlanImportPreviewApiDto,
  SupplierMaterialRiskApiDto,
  SupplierMaterialRiskPairRequest,
} from '../../types/api/purchasingApi';
import { formatCurrency } from '../../utils/formatCurrency';

/** Trần đơn giá ngân sách (VNĐ) — tránh overflow / nhập nhầm. */
const MAX_BUDGET_UNIT_PRICE = 1_000_000_000_000;

interface DraftQuote {
  key: string;
  sortOrder: number;
  unitPrice: string;
  supplierName: string;
  amount: string;
}

interface DraftLine {
  key: string;
  materialCode: string;
  productName: string;
  unit: string;
  quantity: string;
  systemName: string;
  category: string;
  spec: string;
  lineNote: string;
  kgPerUnit: string;
  purchaseStatus: string;
  budgetUnitPrice: string;
  proposalUnitPrice: string;
  proposalSupplierName: string;
  purchaseUnitPrice: string;
  purchaseSupplierName: string;
  selectedUnitPrice: string;
  selectedSupplierName: string;
  selectionReason: string;
  expectedDeliveryDate: string;
  actualReceiptDate: string;
  requiredDate: string;
  quotes: DraftQuote[];
}

interface CreatePurchasePlanModalProps {
  open: boolean;
  onClose: () => void;
  editCode?: string | null;
  onCreated?: (planCode: string) => void;
  onSaved?: (planCode: string) => void;
  /** plan = KHMH; adhoc = mua hàng phát sinh */
  kind?: 'plan' | 'adhoc';
}

function emptyLine(): DraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    materialCode: '',
    productName: '',
    unit: '',
    quantity: '1',
    systemName: '',
    category: '',
    spec: '',
    lineNote: '',
    kgPerUnit: '',
    purchaseStatus: '',
    budgetUnitPrice: '',
    proposalUnitPrice: '',
    proposalSupplierName: '',
    purchaseUnitPrice: '',
    purchaseSupplierName: '',
    selectedUnitPrice: '',
    selectedSupplierName: '',
    selectionReason: '',
    expectedDeliveryDate: '',
    actualReceiptDate: '',
    requiredDate: '',
    quotes: [],
  };
}

function parseNum(v: string): number | null {
  const t = v.trim().replace(/,/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function lineAmount(qty: string, unitPrice: string): number {
  const q = parseNum(qty) ?? 0;
  const p = parseNum(unitPrice) ?? 0;
  return q > 0 && p > 0 ? q * p : 0;
}

function numToDraft(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  return String(v);
}

function dateToDraft(v: string | null | undefined): string {
  if (!v) return '';
  return v.slice(0, 10);
}

function toApiLines(drafts: DraftLine[]): CreatePurchasePlanLineRequest[] {
  return drafts
    .map(d => {
      const quantity = parseNum(d.quantity) ?? 0;
      return {
        materialCode: d.materialCode.trim(),
        productName: d.productName.trim(),
        unit: d.unit.trim(),
        quantity,
        systemName: d.systemName.trim() || null,
        category: d.category.trim() || null,
        spec: d.spec.trim() || null,
        lineNote: d.lineNote.trim() || null,
        kgPerUnit: parseNum(d.kgPerUnit),
        purchaseStatus: d.purchaseStatus.trim() || null,
        budgetUnitPrice: parseNum(d.budgetUnitPrice),
        proposalUnitPrice: parseNum(d.proposalUnitPrice),
        proposalSupplierName: d.proposalSupplierName.trim() || null,
        purchaseUnitPrice: parseNum(d.purchaseUnitPrice),
        purchaseSupplierName: d.purchaseSupplierName.trim() || null,
        selectedUnitPrice: parseNum(d.selectedUnitPrice),
        selectedSupplierName: d.selectedSupplierName.trim() || null,
        selectionReason: d.selectionReason.trim() || null,
        requiredDate: d.requiredDate.trim() || null,
        expectedDeliveryDate: d.expectedDeliveryDate.trim() || null,
        actualReceiptDate: d.actualReceiptDate.trim() || null,
        quotes: d.quotes
          .filter(q => q.supplierName.trim() || parseNum(q.unitPrice) != null)
          .map((q, i) => ({
            sortOrder: q.sortOrder || i + 1,
            unitPrice: parseNum(q.unitPrice),
            amount: parseNum(q.amount),
            supplierName: q.supplierName.trim() || null,
          })),
      };
    })
    .filter(l => l.materialCode && l.unit && l.quantity > 0);
}

function fromPreviewLines(previewLines: PurchasePlanImportLinePreviewApiDto[]): DraftLine[] {
  const valid = previewLines.filter(l => l.isValid && l.materialCode?.trim());
  if (valid.length === 0) return [emptyLine()];
  return valid.map((l, i) => ({
    key: `import-${l.rowNumber}-${i}-${Date.now()}`,
    materialCode: l.materialCode ?? '',
    productName: l.productName ?? '',
    unit: l.unit ?? '',
    quantity: String(l.quantity > 0 ? l.quantity : 1),
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
      key: `q-${l.rowNumber}-${qi}`,
      sortOrder: q.sortOrder ?? qi + 1,
      unitPrice: numToDraft(q.unitPrice),
      supplierName: q.supplierName ?? '',
      amount: numToDraft(q.amount),
    })),
  }));
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
          <section className="pur-create-plan__import" aria-label="Import Excel">
            <div className="pur-create-plan__import-bar">
              <span className="pur-create-plan__import-label">Import Excel</span>
              <div className="pur-create-plan__import-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => { void downloadTemplate(); }}
                >
                  <Download size={14} aria-hidden />
                  {templateMutation.isPending ? 'Đang tải…' : 'Tải mẫu'}
                </button>

                <label className="btn btn-outline btn-sm">
                  <Upload size={14} aria-hidden />
                  Chọn file
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    disabled={busy}
                    onChange={e => {
                      setFile(e.target.files?.[0] ?? null);
                      setPreview(null);
                    }}
                    aria-label="File Excel KHMH"
                  />
                </label>

                {file ? (
                  <span className="pur-create-plan__file-name" title={file.name}>{file.name}</span>
                ) : (
                  <span className="pur-create-plan__file-placeholder">Chưa chọn file</span>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={busy || !file}
                  onClick={() => { void runPreview(); }}
                >
                  <FileSpreadsheet size={14} aria-hidden />
                  {previewMutation.isPending ? 'Đang import…' : 'Import'}
                </button>

                {preview ? (
                  <button type="button" className="btn btn-text btn-sm" disabled={busy} onClick={clearFile}>
                    Xóa kết quả file
                  </button>
                ) : null}
              </div>
            </div>

            {preview && (
              <div className="pur-create-plan__preview">
                <span>Sheet: <strong>{preview.sheetName || '—'}</strong></span>
                <span>Hợp lệ: <strong>{preview.validRowCount}</strong>/{preview.totalRows}</span>
                {preview.errorRowCount > 0 ? (
                  <span className="pur-create-plan__preview-error">
                    Lỗi: <strong>{preview.errorRowCount}</strong>
                  </span>
                ) : (
                  <span className="pur-create-plan__preview-ok">Đã đổ vào bảng bên dưới</span>
                )}
                {preview.errors?.length ? (
                  <ul className="pur-create-plan__preview-errors">
                    {preview.errors.slice(0, 5).map((err, i) => (
                      <li key={`${err.rowNumber}-${err.field}-${i}`}>
                        Dòng Excel {err.rowNumber}: {err.message}
                      </li>
                    ))}
                    {preview.errors.length > 5 ? (
                      <li>…và {preview.errors.length - 5} lỗi khác</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            )}
          </section>
        )}

        <section className="pur-create-plan__section" aria-label="Dòng hàng nhập tay">
          <div className="pur-create-plan__section-head">
            <div>
              <h3 className="pur-create-plan__section-title">Dòng hàng</h3>
              <p className="pur-create-plan__section-hint">
                Chọn tên vật tư từ danh mục. Chưa có → tạo trong Danh mục vật tư trước.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={linesLocked}
              onClick={() => setLines(prev => [...prev, emptyLine()])}
            >
              <Plus size={14} aria-hidden />
              Thêm dòng
            </button>
          </div>

          <div className="pur-create-plan__table-shell">
            <table className="form-table import-items-table pur-create-plan__table">
              <thead>
                <tr>
                  <th className="table-header-cell text-center">#</th>
                  <th className="table-header-cell">Tên vật tư *</th>
                  <th className="table-header-cell text-center">ĐVT *</th>
                  <th className="table-header-cell text-center">SL *</th>
                  <th className="table-header-cell text-right">Đơn giá dự toán</th>
                  <th className="table-header-cell text-right">Thành tiền dự toán</th>
                  <th className="table-header-cell text-center" aria-label="Chi tiết" />
                  <th className="table-header-cell text-center" aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const openDetail = Boolean(expanded[line.key]);
                  const amount = lineAmount(line.quantity, line.budgetUnitPrice);
                  const unitLocked = Boolean(line.materialCode.trim());
                  return (
                    <Fragment key={line.key}>
                      <tr className="table-row">
                        <td className="table-cell text-center tabular-nums text-[var(--md-on-surface-variant)]">
                          {index + 1}
                        </td>
                        <td className="table-cell">
                          <MaterialAutocomplete
                            compact
                            displayLabel="name"
                            value={line.materialCode}
                            materials={materials}
                            disabled={linesLocked}
                            placeholder="Chọn tên vật tư…"
                            onChange={code => {
                              if (!code.trim()) {
                                updateLine(line.key, { materialCode: '', productName: '', unit: '' });
                                return;
                              }
                              const mat = materials.find(m => m.materialCode === code);
                              updateLine(line.key, {
                                materialCode: code,
                                productName: mat?.materialName ?? line.productName,
                                unit: mat?.unit ?? line.unit,
                              });
                            }}
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            className="form-input form-input-sm text-center"
                            value={line.unit}
                            disabled={linesLocked || unitLocked}
                            readOnly={unitLocked}
                            onChange={e => updateLine(line.key, { unit: e.target.value })}
                            placeholder="Kg"
                            aria-label={`ĐVT dòng ${index + 1}`}
                          />
                        </td>
                        <td className="table-cell">
                          <QtyStepper
                            value={line.quantity}
                            min={0}
                            className={linesLocked ? 'opacity-60 pointer-events-none' : ''}
                            onChange={qty => updateLine(line.key, { quantity: qty })}
                            ariaLabel={`Số lượng dòng ${index + 1}`}
                          />
                        </td>
                        <td className="table-cell">
                          <CurrencyInput
                            className="form-input form-input-sm text-right input-no-spinner"
                            value={line.budgetUnitPrice}
                            min={0}
                            max={MAX_BUDGET_UNIT_PRICE}
                            onChange={(_raw, numeric) => {
                              if (linesLocked) return;
                              updateLine(line.key, {
                                budgetUnitPrice: numeric > 0 ? String(numeric) : '',
                              });
                            }}
                            placeholder="0"
                          />
                        </td>
                        <td className="table-cell text-right tabular-nums font-semibold">
                          <div className="import-cell-placeholder import-cell-placeholder--end">
                            {amount > 0 ? formatCurrency(amount) : '—'}
                          </div>
                        </td>
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            className={`pur-create-plan__expand${openDetail ? ' is-open' : ''}`}
                            disabled={linesLocked}
                            aria-expanded={openDetail}
                            aria-label={openDetail ? 'Thu gọn chi tiết' : 'Mở chi tiết'}
                            onClick={() => toggleExpand(line.key)}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </td>
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            disabled={linesLocked}
                            aria-label={`Xóa dòng ${index + 1}`}
                            title="Xóa dòng"
                            onClick={() => removeLine(line.key)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                      {openDetail ? (
                        <tr className="pur-create-plan__detail-row">
                          <td colSpan={8} className="table-cell">
                            <div className="pur-create-plan__detail">
                              <div className="pur-create-plan__detail-grid">
                                <FormField label="Hệ" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm" value={line.systemName} disabled={linesLocked} onChange={e => updateLine(line.key, { systemName: e.target.value })} />
                                </FormField>
                                <FormField label="Danh mục" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm" value={line.category} disabled={linesLocked} onChange={e => updateLine(line.key, { category: e.target.value })} />
                                </FormField>
                                <FormField label="Quy cách" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm" value={line.spec} disabled={linesLocked} onChange={e => updateLine(line.key, { spec: e.target.value })} />
                                </FormField>
                                <FormField label="KG/ĐVT" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm pur-create-plan__input--num" inputMode="decimal" value={line.kgPerUnit} disabled={linesLocked} onChange={e => updateLine(line.key, { kgPerUnit: e.target.value })} />
                                </FormField>
                                <FormField label="Tình trạng" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm" value={line.purchaseStatus} disabled={linesLocked} onChange={e => updateLine(line.key, { purchaseStatus: e.target.value })} placeholder="chưa mua" />
                                </FormField>
                                <FormField label="Ghi chú dòng" className="pur-create-plan__ff">
                                  <input className="form-input form-input-sm" value={line.lineNote} disabled={linesLocked} onChange={e => updateLine(line.key, { lineNote: e.target.value })} />
                                </FormField>
                                <FormField label="Ngày cần hàng" className="pur-create-plan__ff">
                                  <input type="date" className="form-input form-input-sm" value={line.requiredDate} disabled={linesLocked} onChange={e => updateLine(line.key, { requiredDate: e.target.value })} />
                                </FormField>
                                <FormField label="Ngày giao dự kiến" className="pur-create-plan__ff">
                                  <input type="date" className="form-input form-input-sm" value={line.expectedDeliveryDate} disabled={linesLocked} onChange={e => updateLine(line.key, { expectedDeliveryDate: e.target.value })} />
                                </FormField>
                                <FormField label="Ngày nhận thực tế" className="pur-create-plan__ff">
                                  <input type="date" className="form-input form-input-sm" value={line.actualReceiptDate} disabled={linesLocked} onChange={e => updateLine(line.key, { actualReceiptDate: e.target.value })} />
                                </FormField>
                              </div>

                              <div className="pur-create-plan__price-row pur-create-plan__price-row--3" role="group" aria-label="So sánh giá và chọn nhà cung cấp">
                                <div className="pur-create-plan__price-box pur-create-plan__price-box--proposal">
                                  <header className="pur-create-plan__price-head">
                                    <span className="pur-create-plan__price-step" aria-hidden>1</span>
                                    <div className="pur-create-plan__price-head-text">
                                      <p className="pur-create-plan__price-title">Đề xuất mua</p>
                                      <p className="pur-create-plan__price-hint">Giá / NCC đề xuất từ Excel</p>
                                    </div>
                                  </header>
                                  <div className="pur-create-plan__price-fields">
                                    <FormField label="Đơn giá đề xuất" className="pur-create-plan__ff">
                                      <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.proposalUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) updateLine(line.key, { proposalUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                    </FormField>
                                    <FormField label="NCC đề xuất" className="pur-create-plan__ff">
                                      <SupplierAutocomplete compact disabled={linesLocked} value={line.proposalSupplierName} suppliers={suppliers} onChange={v => updateLine(line.key, { proposalSupplierName: v })} placeholder="Chọn NCC…" />
                                    </FormField>
                                  </div>
                                </div>
                                <div className="pur-create-plan__price-box pur-create-plan__price-box--purchase">
                                  <header className="pur-create-plan__price-head">
                                    <span className="pur-create-plan__price-step" aria-hidden>2</span>
                                    <div className="pur-create-plan__price-head-text">
                                      <p className="pur-create-plan__price-title">Giá mua thực tế</p>
                                      <p className="pur-create-plan__price-hint">Sau khi đặt / nhận báo giá</p>
                                    </div>
                                  </header>
                                  <div className="pur-create-plan__price-fields">
                                    <FormField label="Đơn giá mua" className="pur-create-plan__ff">
                                      <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.purchaseUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) updateLine(line.key, { purchaseUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                    </FormField>
                                    <FormField label="NCC mua hàng" className="pur-create-plan__ff">
                                      <SupplierAutocomplete compact disabled={linesLocked} value={line.purchaseSupplierName} suppliers={suppliers} onChange={v => updateLine(line.key, { purchaseSupplierName: v })} placeholder="Chọn NCC…" />
                                    </FormField>
                                  </div>
                                </div>
                                <div className="pur-create-plan__price-box pur-create-plan__price-box--select">
                                  <header className="pur-create-plan__price-head">
                                    <span className="pur-create-plan__price-step" aria-hidden>3</span>
                                    <div className="pur-create-plan__price-head-text">
                                      <p className="pur-create-plan__price-title">NCC được chọn</p>
                                      <p className="pur-create-plan__price-hint">Kết quả chốt cho dòng này</p>
                                    </div>
                                  </header>
                                  <div className="pur-create-plan__price-fields">
                                    <FormField label="Giá chọn" className="pur-create-plan__ff">
                                      <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.selectedUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) updateLine(line.key, { selectedUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                    </FormField>
                                    <FormField label="NCC chọn" className="pur-create-plan__ff">
                                      <SupplierAutocomplete compact disabled={linesLocked} value={line.selectedSupplierName} suppliers={suppliers} onChange={v => updateLine(line.key, { selectedSupplierName: v })} placeholder="Chọn NCC…" />
                                    </FormField>
                                    <FormField label="Lý do chọn" className="pur-create-plan__ff pur-create-plan__ff--span">
                                      <input className="form-input form-input-sm" value={line.selectionReason} disabled={linesLocked} onChange={e => updateLine(line.key, { selectionReason: e.target.value })} placeholder="Ví dụ: giá thấp nhất, tồn kho…" />
                                    </FormField>
                                  </div>
                                </div>
                              </div>

                              {line.quotes.length > 0 ? (
                                <div className="pur-create-plan__quotes">
                                  <p className="pur-create-plan__price-title">Báo giá ({line.quotes.length})</p>
                                  <div className="pur-create-plan__quotes-grid">
                                    {line.quotes.map(q => (
                                      <div key={q.key} className="pur-create-plan__quote-card">
                                        <span>#{q.sortOrder}</span>
                                        <strong>{q.supplierName || '—'}</strong>
                                        <span className="tabular-nums">{q.unitPrice ? formatCurrency(Number(q.unitPrice)) : '—'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {(risksByLineKey.get(line.key) ?? []).length > 0 ? (
                                <div className="pur-create-plan__risk-list" role="status">
                                  {(risksByLineKey.get(line.key) ?? []).map(risk => (
                                    <div
                                      key={`${risk.materialCode}|${risk.supplierId ?? ''}|${risk.supplierName ?? ''}`}
                                      className="pur-create-plan__risk-banner"
                                    >
                                      <AlertTriangle size={16} aria-hidden />
                                      <div>
                                        <strong>
                                          Cảnh báo NCC {risk.supplierName || '—'} / {risk.materialCode}
                                        </strong>
                                        {risk.reasons.map(reason => (
                                          <p key={reason}>{reason}</p>
                                        ))}
                                        <p>Chỉ cảnh báo mềm - vẫn lưu / duyệt bình thường.</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="table-cell text-right font-semibold text-[var(--md-on-surface-variant)]">
                    {totals.filled} dòng · Tổng dự toán
                  </td>
                  <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)]">
                    {totals.budget > 0 ? `${formatCurrency(totals.budget)} đ` : '—'}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          {(totals.proposal > 0 || totals.purchase > 0) && (
            <div className="pur-create-plan__subtotals">
              {totals.proposal > 0 ? (
                <span>Đề xuất: <strong>{formatCurrency(totals.proposal)} đ</strong></span>
              ) : null}
              {totals.purchase > 0 ? (
                <span>Mua hàng: <strong>{formatCurrency(totals.purchase)} đ</strong></span>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
