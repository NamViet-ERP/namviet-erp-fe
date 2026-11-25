import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import MaterialUnitSelect from '../../../components/warehouse/MaterialUnitSelect';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { useCreateMaterial } from '../../../hooks/useMaterials';
import { useCategoryCascade } from '../../../hooks/useCategories';
import {
  MATERIAL_FIELD_PLACEHOLDERS,
  isEquipmentCategory,
  isSteelCategory,
} from '../../../constants/materialCategoryLevels';
import { resolveLeafCategoryId } from '../../../lib/wms/materialCategoryTree';
import MaterialCategoryCascadeFields from './MaterialCategoryCascadeFields';
import MaterialOriginSection from './MaterialOriginSection';
import MaterialDynamicSpecsSection from './MaterialDynamicSpecsSection';
import MaterialImageField from './MaterialImageField';
import { useMaterialImageDraft } from './useMaterialImageDraft';
import {
  EMPTY_CATEGORY_SELECTION,
  buildMaterialUpsertBody,
  updateCategorySelection,
  uploadMaterialImageIfSelected,
  validateMaterialForm,
  type CategorySelection,
} from './materialFormHelpers';

interface MaterialCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = {
  materialCode: '',
  materialName: '',
  unit: '',
  origin: '',
  technicalSpec: '',
  generalTechnicalSpec: '',
  qualityStandard: '',
  ceilingPrice: '',
  imageUrl: '',
};

const emptyOrigin = { brand: '', country: '', region: '' };

export default function MaterialCreateModal({ isOpen, onClose }: MaterialCreateModalProps) {
  const [selection, setSelection] = useState<CategorySelection>([...EMPTY_CATEGORY_SELECTION]);
  const [form, setForm] = useState({ ...emptyForm });
  const [originParts, setOriginParts] = useState({ ...emptyOrigin });
  const [resetSeed, setResetSeed] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { imageFile, imagePreview, selectFile, clearImage } = useMaterialImageDraft();

  const { categories, optionsByLevel, isLoading: categoriesLoading } = useCategoryCascade(selection);
  const createMutation = useCreateMaterial();

  const selectedL1Cat = categories.find(c => c.id === selection[0]);
  const dynamicSpecMode = isSteelCategory(selectedL1Cat?.name)
    ? 'steel'
    : isEquipmentCategory(selectedL1Cat?.name)
      ? 'equipment'
      : null;

  const resetForm = useCallback(() => {
    setSelection([...EMPTY_CATEGORY_SELECTION]);
    setForm({ ...emptyForm });
    setOriginParts({ ...emptyOrigin });
    setResetSeed(s => s + 1);
    clearImage();
    setErrors({});
  }, [clearImage]);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRemoveImage = () => {
    clearImage();
    setForm(f => ({ ...f, imageUrl: '' }));
  };

  const handleCreate = async () => {
    const nextErrors = validateMaterialForm({
      selection,
      categories,
      materialCode: form.materialCode,
      materialName: form.materialName,
      unit: form.unit,
      requireCode: true,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const categoryId = resolveLeafCategoryId(selection);
    if (!categoryId) return;

    try {
      setIsUploadingImage(Boolean(imageFile));
      const uploaded = await uploadMaterialImageIfSelected(imageFile, form.imageUrl, form.materialCode);
      setIsUploadingImage(false);
      if (!uploaded.ok) return;

      await createMutation.mutateAsync(
        buildMaterialUpsertBody({
          ...form,
          categoryId,
          imageUrl: uploaded.imageUrl,
          isConsumable: false,
        }),
      );
      showToast('success', 'Đã tạo mã vật tư mới');
      handleClose();
    } catch (err) {
      setIsUploadingImage(false);
      showToast('error', getApiErrorMessage(err, 'Không thể tạo vật tư'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo mã vật tư mới"
      size="xl"
      footer={
        <>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="filled"
            disabled={createMutation.isPending || isUploadingImage}
            onClick={() => void handleCreate()}
          >
            {isUploadingImage ? 'Đang tải ảnh...' : createMutation.isPending ? 'Đang lưu...' : 'Tạo mới'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 modal-form-bordered mat-catalog-create">
        {!categoriesLoading && (optionsByLevel[0]?.length ?? 0) === 0 && (
          <p className="alert-banner alert-banner--error">
            Chưa có dữ liệu cây vật tư. Vào <strong>SLC - Thiết lập - Cây vật tư</strong> để khai báo trước khi tạo vật tư mới.
          </p>
        )}
        <MaterialCategoryCascadeFields
          selection={selection}
          optionsByLevel={optionsByLevel}
          isLoading={categoriesLoading}
          errors={errors}
          onSelectLevel={(idx, val) => setSelection(prev => updateCategorySelection(prev, idx, val))}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Mã vật tư" required error={errors.materialCode}>
            <input
              className="form-input w-full"
              value={form.materialCode}
              onChange={e => setForm(f => ({ ...f, materialCode: e.target.value }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialCode}
            />
          </FormField>
          <FormField label="Tên vật tư" required error={errors.materialName}>
            <input
              className="form-input w-full"
              value={form.materialName}
              onChange={e => setForm(f => ({ ...f, materialName: e.target.value }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialName}
            />
          </FormField>
          <MaterialUnitSelect
            value={form.unit}
            onChange={unit => setForm(f => ({ ...f, unit }))}
            required
            error={errors.unit}
          />
          <MaterialOriginSection
            className="sm:col-span-2"
            brand={originParts.brand}
            country={originParts.country}
            region={originParts.region}
            onChange={({ brand, country, region, composed }) => {
              setOriginParts({ brand, country, region });
              setForm(f => ({ ...f, origin: composed }));
            }}
          />
          <MaterialDynamicSpecsSection
            key={resetSeed}
            className="sm:col-span-2"
            mode={dynamicSpecMode}
            technicalSpecPreview={form.technicalSpec}
            generalSpecPreview={form.generalTechnicalSpec}
            onSteelChange={({ technicalSpec, qualityStandard }) =>
              setForm(f => ({ ...f, technicalSpec, qualityStandard: qualityStandard || f.qualityStandard }))
            }
            onEquipmentChange={generalTechnicalSpec => setForm(f => ({ ...f, generalTechnicalSpec }))}
          />
          <FormField label="Quy cách chi tiết">
            <input
              className="form-input w-full"
              value={form.technicalSpec}
              onChange={e => setForm(f => ({ ...f, technicalSpec: e.target.value }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
            />
          </FormField>
          <FormField label="Giá trần tham chiếu">
            <CurrencyInput
              value={form.ceilingPrice}
              onChange={ceilingPrice => setForm(f => ({ ...f, ceilingPrice }))}
              placeholder="Dùng cảnh báo khi mua vượt giá"
            />
          </FormField>
          <FormField label="Tiêu chuẩn chất lượng" className="sm:col-span-2">
            <input
              className="form-input w-full"
              value={form.qualityStandard}
              onChange={e => setForm(f => ({ ...f, qualityStandard: e.target.value }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.qualityStandard}
            />
          </FormField>
          <FormField label="Thông số kỹ thuật chung / Diễn giải" className="sm:col-span-2">
            <textarea
              className="form-input w-full"
              rows={3}
              value={form.generalTechnicalSpec}
              onChange={e => setForm(f => ({ ...f, generalTechnicalSpec: e.target.value }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
            />
          </FormField>
          <MaterialImageField
            className="sm:col-span-2"
            previewUrl={imagePreview}
            onSelectFile={selectFile}
            onRemove={handleRemoveImage}
            hint="Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Kích thước tối đa 10MB. Ảnh tải lên sẽ được lưu và gắn vào danh mục vật tư."
          />
        </div>
      </div>
    </Modal>
  );
}
