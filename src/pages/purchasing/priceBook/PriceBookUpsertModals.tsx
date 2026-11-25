import type React from 'react';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import MaterialByGroupFields from '../../../components/purchasing/MaterialByGroupFields';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import Modal from '../../../components/ui/Modal';
import type { MaterialApiDto, MaterialCategoryApiDto, WarehouseProjectApiDto } from '../../../types/wms';

export interface EstimateFormState {
  materialCode: string;
  projectCode: string;
  estimatePrice: string;
  effectiveDate: string;
  note: string;
}

export interface SellFormState {
  materialCode: string;
  projectCode: string;
  sellPrice: string;
  effectiveDate: string;
  note: string;
}

export function EstimatePriceModal({
  isOpen,
  onClose,
  categoryId,
  onCategoryChange,
  form,
  setForm,
  rootCategories,
  materials,
  projects,
  isPending,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number | '';
  onCategoryChange: (id: number | '') => void;
  form: EstimateFormState;
  setForm: React.Dispatch<React.SetStateAction<EstimateFormState>>;
  rootCategories: MaterialCategoryApiDto[];
  materials: MaterialApiDto[];
  projects: WarehouseProjectApiDto[];
  isPending: boolean;
  onSave: () => Promise<void>;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thiết lập giá dự toán" size="md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MaterialByGroupFields
          categoryId={categoryId}
          onCategoryChange={id => {
            onCategoryChange(id);
            setForm(f => ({ ...f, materialCode: '' }));
          }}
          materialCode={form.materialCode}
          onMaterialChange={materialCode => setForm(f => ({ ...f, materialCode }))}
          groups={rootCategories}
          materials={materials}
        />
        <FormField label="Dự án">
          <ProjectAutocomplete
            value={form.projectCode}
            onChange={projectCode => setForm(f => ({ ...f, projectCode }))}
            projects={projects}
          />
        </FormField>
        <FormField label="Giá dự toán" required>
          <CurrencyInput
            value={form.estimatePrice}
            onChange={estimatePrice => setForm(f => ({ ...f, estimatePrice }))}
          />
        </FormField>
        <FormField label="Ngày hiệu lực" required>
          <HrmDatePicker
            value={form.effectiveDate}
            onChange={effectiveDate => setForm(f => ({ ...f, effectiveDate }))}
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={isPending} onClick={() => void onSave()}>
          {isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </Modal>
  );
}

export function SellPriceModal({
  isOpen,
  onClose,
  form,
  setForm,
  materials,
  projects,
  isPending,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: SellFormState;
  setForm: React.Dispatch<React.SetStateAction<SellFormState>>;
  materials: MaterialApiDto[];
  projects: WarehouseProjectApiDto[];
  isPending: boolean;
  onSave: () => Promise<void>;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm giá bán / giá chào" size="md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Vật tư" required>
          <MaterialAutocomplete
            value={form.materialCode}
            onChange={materialCode => setForm(f => ({ ...f, materialCode }))}
            materials={materials}
          />
        </FormField>
        <FormField label="Dự án">
          <ProjectAutocomplete
            value={form.projectCode}
            onChange={projectCode => setForm(f => ({ ...f, projectCode }))}
            projects={projects}
          />
        </FormField>
        <FormField label="Giá bán" required>
          <CurrencyInput value={form.sellPrice} onChange={sellPrice => setForm(f => ({ ...f, sellPrice }))} />
        </FormField>
        <FormField label="Ngày hiệu lực" required>
          <HrmDatePicker
            value={form.effectiveDate}
            onChange={effectiveDate => setForm(f => ({ ...f, effectiveDate }))}
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={isPending} onClick={() => void onSave()}>
          {isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </Modal>
  );
}
