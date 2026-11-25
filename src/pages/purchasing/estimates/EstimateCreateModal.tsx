import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import type { MaterialApiDto } from '../../../services/materialsService';
import type { CreatePurchaseEstimateRequest } from '../../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { formatCurrencyFull, formatCurrencyVnd } from '../../../utils/formatCurrency';

type CreateLine = {
  key: string;
  materialCode: string;
  qty: string;
  price: string;
};

function emptyLine(): CreateLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialCode: '',
    qty: '',
    price: '',
  };
}

interface EstimateCreateModalProps {
  isOpen: boolean;
  initialProjectCode: string;
  projects: WarehouseProjectApiDto[];
  materials: MaterialApiDto[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (body: CreatePurchaseEstimateRequest) => Promise<void>;
}

export default function EstimateCreateModal({
  isOpen,
  initialProjectCode,
  projects,
  materials,
  isPending,
  onClose,
  onSubmit,
}: EstimateCreateModalProps) {
  const [createProject, setCreateProject] = useState(initialProjectCode);
  const [createLines, setCreateLines] = useState<CreateLine[]>(() => [emptyLine()]);

  const selectedProject = useMemo(
    () => projects.find(p => p.projectCode === createProject),
    [projects, createProject],
  );
  const createProjectName = selectedProject?.projectName ?? '';
  const budgetRemaining = selectedProject
    ? (selectedProject.materialBudgetRemaining ?? (selectedProject.materialBudget - (selectedProject.approvedImportValue ?? 0)))
    : 0;

  const createTotal = useMemo(
    () => createLines.reduce((sum, line) => {
      const qty = Number(String(line.qty).replace(/[^\d.-]/g, '')) || 0;
      const price = Number(String(line.price).replace(/[^\d.-]/g, '')) || 0;
      return sum + qty * price;
    }, 0),
    [createLines],
  );

  const isOverBudget = Boolean(
    selectedProject
    && selectedProject.materialBudget > 0
    && createTotal > budgetRemaining,
  );
  const filledLineCount = createLines.filter(l => l.materialCode).length;

  const handleSave = async () => {
    if (!createProject) {
      showToast('error', 'Chọn dự án.');
      return;
    }
    const lines = createLines
      .filter(l => l.materialCode)
      .map(l => ({
        materialCode: l.materialCode,
        newQty: Number(String(l.qty).replace(/[^\d.-]/g, '')) || 0,
        estimateUnitPrice: Number(String(l.price).replace(/[^\d.-]/g, '')) || 0,
      }));
    if (lines.length === 0) {
      showToast('error', 'Thêm ít nhất một vật tư.');
      return;
    }
    if (lines.some(l => l.newQty <= 0 || l.estimateUnitPrice <= 0)) {
      showToast('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0.');
      return;
    }
    await onSubmit({
      projectCode: createProject,
      title: createProjectName || createProject,
      lines,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isPending && onClose()}
      title="Tạo dự toán"
      size="xl"
      className="modal-form-bordered"
      subtitle="Chọn dự án, lập dòng vật tư rồi tạo phiếu để gửi duyệt."
      footer={(
        <>
          <Button type="button" variant="text" disabled={isPending} onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="filled" disabled={isPending} onClick={() => void handleSave()}>
            {isPending ? 'Đang tạo…' : 'Tạo dự toán'}
          </Button>
        </>
      )}
    >
      <div className="pur-create-plan">
        <div className="pur-create-plan__header-grid">
          <FormField label="Dự án" required className="pur-create-plan__field-project">
            <ProjectAutocomplete
              value={createProject}
              onChange={setCreateProject}
              projects={projects}
              placeholder="Chọn dự án…"
            />
          </FormField>
          <FormField label="Tiêu đề phiếu" className="pur-create-plan__field-note">
            <input
              className="form-input"
              value={createProject ? (createProjectName || createProject) : ''}
              readOnly
              placeholder="Tự lấy theo tên dự án"
              aria-label="Tiêu đề phiếu (theo dự án)"
            />
          </FormField>
        </div>

        {selectedProject ? (
          <div
            className={`p-3 rounded-lg border text-xs my-3 ${
              isOverBudget
                ? 'border-[var(--md-error)] bg-[color-mix(in_srgb,var(--md-error)_8%,transparent)] text-[var(--md-on-surface)]'
                : 'border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--md-primary)]">
                  Ngân sách dự toán vật tư:
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatCurrencyFull(selectedProject.materialBudget)}
                </span>
                <span className="text-[var(--md-on-surface-variant)]">
                  · Còn lại:{' '}
                  <strong className={`font-mono ${budgetRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}>
                    {formatCurrencyFull(budgetRemaining)}
                  </strong>
                </span>
              </div>
              {isOverBudget ? (
                <div className="flex items-center gap-1 font-semibold text-[var(--md-error)]">
                  <AlertTriangle size={14} aria-hidden />
                  <span>
                    Cảnh báo: Giá trị mua sắm ({formatCurrencyFull(createTotal)}) vượt quá ngân sách còn lại!
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="pur-create-plan__section" aria-label="Dòng vật tư dự toán">
          <div className="pur-create-plan__section-head">
            <div>
              <h3 className="pur-create-plan__section-title">Dòng vật tư</h3>
              <p className="pur-create-plan__section-hint">
                {filledLineCount > 0
                  ? `${filledLineCount} dòng · Tổng ${formatCurrencyVnd(createTotal)}`
                  : 'Chọn vật tư, nhập số lượng và giá dự toán.'}
              </p>
            </div>
            <Button
              type="button"
              variant="tonal"
              size="sm"
              leftIcon={Plus}
              onClick={() => setCreateLines(prev => [...prev, emptyLine()])}
            >
              Thêm vật tư
            </Button>
          </div>

          <div className="pur-create-plan__table-shell">
            <table className="form-table import-items-table pur-create-plan__table pur-estimate-create__table">
              <thead>
                <tr>
                  <th className="table-header-cell text-center">#</th>
                  <th className="table-header-cell">Vật tư *</th>
                  <th className="table-header-cell text-center">SL *</th>
                  <th className="table-header-cell text-right">Giá dự toán</th>
                  <th className="table-header-cell text-right">Thành tiền</th>
                  <th className="table-header-cell text-center" aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {createLines.map((line, index) => {
                  const qty = Number(String(line.qty).replace(/[^\d.-]/g, '')) || 0;
                  const price = Number(String(line.price).replace(/[^\d.-]/g, '')) || 0;
                  return (
                    <tr key={line.key} className="table-row">
                      <td className="table-cell text-center tabular-nums text-[var(--md-on-surface-variant)]">
                        {index + 1}
                      </td>
                      <td className="table-cell">
                        <MaterialAutocomplete
                          value={line.materialCode}
                          onChange={materialCode =>
                            setCreateLines(prev => prev.map(l => (l.key === line.key ? { ...l, materialCode } : l)))}
                          materials={materials}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          className="form-input text-center tabular-nums"
                          inputMode="decimal"
                          value={line.qty}
                          onChange={e =>
                            setCreateLines(prev => prev.map(l => (l.key === line.key ? { ...l, qty: e.target.value } : l)))}
                          aria-label={`Số lượng dòng ${index + 1}`}
                        />
                      </td>
                      <td className="table-cell">
                        <CurrencyInput
                          value={line.price}
                          onChange={next =>
                            setCreateLines(prev => prev.map(l => (l.key === line.key ? { ...l, price: next } : l)))}
                          suffix="VND"
                        />
                      </td>
                      <td className="table-cell text-right tabular-nums font-medium">
                        {formatCurrencyVnd(qty * price)}
                      </td>
                      <td className="table-cell text-center">
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          aria-label={`Xóa dòng ${index + 1}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            (e.currentTarget as HTMLButtonElement).blur();
                            setCreateLines(prev => {
                              if (prev.length <= 1) {
                                return prev.map(l => (
                                  l.key === line.key ? { ...l, materialCode: '', qty: '', price: '' } : l
                                ));
                              }
                              return prev.filter(l => l.key !== line.key);
                            });
                          }}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="table-row">
                  <td className="table-cell" colSpan={4}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
                      Tổng dự toán
                    </span>
                  </td>
                  <td className="table-cell text-right tabular-nums font-semibold">
                    {formatCurrencyVnd(createTotal)}
                  </td>
                  <td className="table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}
