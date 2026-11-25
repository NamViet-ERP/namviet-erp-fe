import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import Modal from '../../components/ui/Modal';
import QtyStepper from '../../components/ui/QtyStepper';
import SelectField from '../../components/ui/SelectField';
import { showToast } from '../../components/ui/Toast';
import { useProjectInventory } from '../../hooks/useProjects';
import { useCreateStocktake } from '../../hooks/useStocktakes';
import { getApiErrorMessage } from '../../lib/apiClient';
import { fmtStocktakeDiff } from '../../lib/wms/stockQtyFormat';
import type { Material } from '../../types';
import type { WarehouseProjectApiDto } from '../../types/wms';
import {
  buildStocktakeCreateDto,
  createEmptyStocktakeForm,
  diffTone,
  validateStocktakeForm,
  type FormErrors,
  type FormItem,
  type StocktakeForm,
} from './stocktakeHelpers';

interface StocktakeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: WarehouseProjectApiDto[];
  materials: Material[];
}

export default function StocktakeCreateModal({
  isOpen,
  onClose,
  projects,
  materials,
}: StocktakeCreateModalProps) {
  const createMutation = useCreateStocktake();
  const [form, setForm] = useState<StocktakeForm>(createEmptyStocktakeForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const populatedProjectRef = useRef<string | null>(null);

  const { data: projectInventory = [], isFetching: isInventoryFetching } = useProjectInventory(
    isOpen && form.projectCode ? form.projectCode : undefined,
  );

  const inventoryByCode = useMemo(
    () => new Map(projectInventory.map(row => [row.materialCode, row.actualInventoryQty])),
    [projectInventory],
  );
  const inventoryNameByCode = useMemo(
    () => new Map(projectInventory.map(row => [row.materialCode, row.materialName])),
    [projectInventory],
  );

  useEffect(() => {
    if (!isOpen || !form.projectCode) {
      populatedProjectRef.current = null;
      return;
    }
    if (populatedProjectRef.current === form.projectCode) return;

    if (projectInventory.length > 0) {
      populatedProjectRef.current = form.projectCode;
      setForm(prev =>
        prev.projectCode === form.projectCode
          ? {
              ...prev,
              items: projectInventory.map(r => ({
                materialCode: r.materialCode,
                systemQty: String(r.actualInventoryQty ?? 0),
                actualQty: String(r.actualInventoryQty ?? 0),
                reason: '',
              })),
            }
          : prev,
      );
    } else if (!isInventoryFetching) {
      populatedProjectRef.current = form.projectCode;
      setForm(prev =>
        prev.projectCode === form.projectCode
          ? { ...prev, items: [{ materialCode: '', systemQty: '', actualQty: '', reason: '' }] }
          : prev,
      );
    }
  }, [isOpen, form.projectCode, projectInventory, isInventoryFetching]);

  const resetAndClose = () => {
    populatedProjectRef.current = null;
    setForm(createEmptyStocktakeForm());
    setErrors({});
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    const errs = validateStocktakeForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const whName = projects.find(p => p.projectCode === form.projectCode)?.projectName ?? form.projectCode;
    const dto = buildStocktakeCreateDto(form, whName, materials, inventoryNameByCode);
    try {
      const created = await createMutation.mutateAsync(dto);
      resetAndClose();
      showToast(
        'success',
        `Phiếu kiểm kê ${created.voucherCode} đã được tạo. Vật tư đã đóng băng cho đến khi duyệt.`,
        'Tạo phiếu thành công',
      );
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu kiểm kê'));
    }
  };

  const addItem = () =>
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { materialCode: '', systemQty: '', actualQty: '', reason: '' }],
    }));

  const removeItem = (i: number) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i: number, field: keyof FormItem, val: string) => {
    setForm(prev => {
      const items = [...prev.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'materialCode' && val) {
        const sys = inventoryByCode.get(val);
        items[i].systemQty = sys !== undefined ? String(sys) : '0';
        if (items[i].actualQty === '') items[i].actualQty = items[i].systemQty;
      }
      return { ...prev, items };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Tạo phiếu kiểm kê"
      size="full"
      footer={
        <>
          <Button type="button" variant="outlined" onClick={resetAndClose}>Hủy bỏ</Button>
          <Button
            type="button"
            variant="filled"
            loading={createMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            Tạo phiếu kiểm kê
          </Button>
        </>
      }
    >
      <div className="space-y-4 modal-form-bordered">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SelectField
            label="Kho dự án kiểm kê"
            required
            error={errors.projectCode}
            placeholder="— Chọn kho dự án —"
            value={form.projectCode}
            onChange={projectCode => {
              populatedProjectRef.current = null;
              setForm(prev => ({ ...createEmptyStocktakeForm(), projectCode, note: prev.note }));
              setErrors({});
            }}
            options={projects.map(p => ({ value: p.projectCode, label: `${p.projectCode} — ${p.projectName}` }))}
          />
          <FormField label="Ghi chú">
            <input
              className="form-input"
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Kiểm kê cuối tháng..."
            />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <h4 className="wms-section-heading">Danh sách vật tư kiểm kê</h4>
          <Button type="button" variant="outlined" size="sm" leftIcon={Plus} onClick={addItem} disabled={!form.projectCode}>
            Thêm dòng
          </Button>
        </div>

        <div className="alert-banner alert-banner--info mb-3 text-xs">
          <p>
            Danh sách vật tư và <strong>Tồn hệ thống</strong> được tự động tải từ kho dự án đã chọn.
            Chỉ cần tăng hoặc giảm <strong>SL thực tế</strong> nếu có sai lệch (+ thừa, − thiếu, 0 khớp).
          </p>
        </div>

        {!form.projectCode && (
          <p className="text-xs text-[var(--md-on-surface-variant)] mb-2">Chọn kho dự án để hiển thị vật tư kiểm kê.</p>
        )}
        {form.projectCode && isInventoryFetching && projectInventory.length === 0 && (
          <p className="text-xs text-[var(--md-primary)] mb-2">Đang tải danh sách vật tư từ kho dự án...</p>
        )}
        {form.projectCode && !isInventoryFetching && projectInventory.length === 0 && (
          <p className="text-xs text-[var(--md-on-surface-variant)] mb-2">
            Kho dự án này hiện chưa có dữ liệu tồn kho. Bạn có thể bấm &quot;+ Thêm dòng&quot; để thêm thủ công.
          </p>
        )}
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}

        <div className="overflow-x-auto table-scroll">
          <table className="form-table text-xs table-min-w--850">
            <thead>
              <tr>
                <th className="table-header-cell w-12">STT</th>
                <th className="table-header-cell min-w-[220px]">Vật tư</th>
                <th className="table-header-cell w-28">Tồn hệ thống</th>
                <th className="table-header-cell w-28">SL thực tế</th>
                <th className="table-header-cell w-24 text-right">Chênh lệch</th>
                <th className="table-header-cell min-w-[180px]">Lý do chênh lệch</th>
                <th className="table-header-cell w-12" />
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => {
                const sys = it.systemQty === '' ? NaN : Number(it.systemQty);
                const act = it.actualQty === '' ? NaN : Number(it.actualQty);
                const diffClass = it.materialCode && !Number.isNaN(sys) && !Number.isNaN(act) ? diffTone(sys, act) : '';
                return (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-center">{i + 1}</td>
                    <td className="table-cell">
                      <MaterialAutocomplete
                        value={it.materialCode}
                        onChange={code => updateItem(i, 'materialCode', code)}
                        materials={materials}
                        fallbackLabel={inventoryNameByCode.get(it.materialCode)}
                        disabled={!form.projectCode}
                        placeholder={form.projectCode ? 'Chọn vật tư...' : 'Chọn kho trước'}
                      />
                    </td>
                    <td className="table-cell w-28">
                      <input type="text" readOnly tabIndex={-1} aria-readonly className="form-input text-right tabular-nums cursor-default" value={it.systemQty || '—'} />
                    </td>
                    <td className="table-cell w-28">
                      <div className={!it.materialCode ? 'opacity-40 pointer-events-none' : undefined}>
                        <QtyStepper
                          value={it.actualQty === '' ? '0' : it.actualQty}
                          onChange={val => updateItem(i, 'actualQty', val)}
                          min={0}
                          className={errors[`actqty_${i}`] ? 'ring-1 ring-[var(--md-error)] rounded-md' : ''}
                        />
                      </div>
                      {errors[`actqty_${i}`] && <p className="text-[var(--md-error)] text-xs mt-1">{errors[`actqty_${i}`]}</p>}
                    </td>
                    <td className={`table-cell text-right font-bold text-sm tabular-nums w-24 min-w-24 ${diffClass}`}>
                      <span className="inline-block min-w-[4rem] text-right">
                        {it.materialCode && !Number.isNaN(sys) && !Number.isNaN(act) ? fmtStocktakeDiff(sys, act) : '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <input
                        type="text"
                        className="form-input text-xs"
                        value={it.reason}
                        onChange={e => updateItem(i, 'reason', e.target.value)}
                        placeholder="Lý do chênh lệch (nếu có)..."
                      />
                    </td>
                    <td className="table-cell text-center">
                      {form.items.length > 1 && (
                        <Button type="button" variant="text" size="sm" className="btn-icon text-[var(--md-error)]" aria-label="Xóa dòng" onClick={() => removeItem(i)}>
                          <X size={14} aria-hidden />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
