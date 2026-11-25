import { useState } from 'react';
import SectionCard from '../../components/ui/SectionCard';
import DetailFieldGrid from '../../components/hr/DetailFieldGrid';
import { FieldView } from '../../components/hr/DetailFields';
import PageHeader from '../../components/ui/PageHeader';
import HrmEditActions from '../../components/hr/HrmEditActions';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  useMaterial,
  useUpdateMaterial,
  useDiscontinueMaterial,
  useReactivateMaterial,
} from '../../hooks/useMaterials';
import { useCategoryCascade, useCategoryTree } from '../../hooks/useCategories';
import { resolveMediaUrl } from '../../lib/hrm/employeeApiMapper';
import {
  MATERIAL_CATEGORY_LEVELS,
  formatOriginString,
  parseOriginParts,
} from '../../constants/materialCategoryLevels';
import {
  resolveLeafCategoryId,
  selectionFromCategoryId,
} from '../../lib/wms/materialCategoryTree';
import type { MaterialApiDto } from '../../types/wms';
import MaterialCategoryCascadeFields from './materials/MaterialCategoryCascadeFields';
import MaterialDetailEditForm, { type MaterialDetailEditState } from './materials/MaterialDetailEditForm';
import {
  MaterialDetailInfoReadGrid,
  MaterialDetailStatusCard,
} from './materials/MaterialDetailReadView';
import { useMaterialImageDraft } from './materials/useMaterialImageDraft';
import {
  EMPTY_CATEGORY_SELECTION,
  buildMaterialUpsertBody,
  updateCategorySelection,
  uploadMaterialImageIfSelected,
  validateMaterialForm,
  type CategorySelection,
} from './materials/materialFormHelpers';

const emptyEditForm: MaterialDetailEditState = {
  materialName: '',
  unit: '',
  imageUrl: '',
  technicalSpec: '',
  generalTechnicalSpec: '',
  qualityStandard: '',
  ceilingPrice: '',
};

function pathCell(m: MaterialApiDto, key: keyof MaterialApiDto['categoryPath']) {
  return m.categoryPath?.[key]?.trim() || '—';
}

interface MaterialDetailViewProps {
  code: string;
  onBack: () => void;
}

export default function MaterialDetailView({ code, onBack }: MaterialDetailViewProps) {
  const { data: material, isLoading, isError } = useMaterial(code);
  const { data: categories = [] } = useCategoryTree();
  const updateMutation = useUpdateMaterial();
  const discontinueMutation = useDiscontinueMaterial();
  const reactivateMutation = useReactivateMaterial();

  const [isEditing, setIsEditing] = useState(false);
  const [showDiscontinueConfirm, setShowDiscontinueConfirm] = useState(false);
  const [editSelection, setEditSelection] = useState<CategorySelection>([...EMPTY_CATEGORY_SELECTION]);
  const [editForm, setEditForm] = useState<MaterialDetailEditState>({ ...emptyEditForm });
  const [originParts, setOriginParts] = useState({ brand: '', country: '', region: '' });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const { imageFile, imagePreview, selectFile, clearImage } = useMaterialImageDraft();

  const { optionsByLevel: editOptions, isLoading: editCategoriesLoading } =
    useCategoryCascade(editSelection);

  if (isLoading) return <HrmLoadingState />;
  if (isError || !material) {
    return <HrmNotFound message="Không tìm thấy vật tư." backLabel="Quay lại danh sách" onBack={onBack} />;
  }

  const resetEditFromMaterial = () => {
    setEditSelection(selectionFromCategoryId(categories, material.categoryId));
    setEditForm({
      materialName: material.materialName,
      unit: material.unit,
      imageUrl: material.imageUrl ?? '',
      technicalSpec: material.technicalSpec ?? '',
      generalTechnicalSpec: material.generalTechnicalSpec ?? '',
      qualityStandard: material.qualityStandard ?? '',
      ceilingPrice: material.ceilingPrice != null ? String(material.ceilingPrice) : '',
    });
    setOriginParts(parseOriginParts(material.origin));
    clearImage();
    setEditErrors({});
  };

  const handleRemoveImage = () => {
    clearImage();
    setEditForm(f => ({ ...f, imageUrl: '' }));
  };

  const startEdit = () => {
    resetEditFromMaterial();
    setIsEditing(true);
  };

  const cancelEdit = () => {
    resetEditFromMaterial();
    setIsEditing(false);
  };

  const handleSave = async () => {
    const nextErrors = validateMaterialForm({
      selection: editSelection,
      categories,
      materialName: editForm.materialName,
      unit: editForm.unit,
    });
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const categoryId = resolveLeafCategoryId(editSelection);
    if (!categoryId) return;

    try {
      setIsUploadingImage(Boolean(imageFile));
      const uploaded = await uploadMaterialImageIfSelected(imageFile, editForm.imageUrl, material.materialCode);
      setIsUploadingImage(false);
      if (!uploaded.ok) return;

      const finalOrigin = formatOriginString(originParts.brand, originParts.country, originParts.region);
      await updateMutation.mutateAsync({
        code: material.materialCode,
        body: buildMaterialUpsertBody({
          ...editForm,
          materialCode: material.materialCode,
          categoryId,
          origin: finalOrigin,
          imageUrl: uploaded.imageUrl,
          isConsumable: material.isConsumable,
        }),
      });
      showToast('success', 'Đã cập nhật thông tin vật tư');
      setIsEditing(false);
    } catch (err) {
      setIsUploadingImage(false);
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật vật tư'));
    }
  };

  const handleDiscontinueConfirm = async () => {
    try {
      await discontinueMutation.mutateAsync(material.materialCode);
      showToast('success', `Đã ngừng sử dụng "${material.materialName}"`);
      setShowDiscontinueConfirm(false);
      onBack();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể ngừng sử dụng vật tư'));
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync(material.materialCode);
      showToast('success', `Đã kích hoạt lại "${material.materialName}"`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể kích hoạt lại vật tư'));
    }
  };

  const isActive = material.isActive !== false;
  const currentPreview =
    imagePreview ?? (editForm.imageUrl ? (resolveMediaUrl(editForm.imageUrl) ?? null) : null);

  return (
    <div className="hrm-page w-full">
      <PageHeader
        variant="detail"
        onBack={onBack}
        title={isEditing ? editForm.materialName || material.materialName : material.materialName}
        subtitle={`Mã vật tư: ${material.materialCode}${!isActive ? ' · Ngừng sử dụng' : ''}`}
        actions={
          <HrmEditActions
            isEditing={isEditing}
            isSaving={updateMutation.isPending || isUploadingImage}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={() => void handleSave()}
          />
        }
      />

      <SectionCard variant="detail" title="Phân loại danh mục">
        {isEditing ? (
          <MaterialCategoryCascadeFields
            variant="hrm"
            selection={editSelection}
            optionsByLevel={editOptions}
            isLoading={editCategoriesLoading}
            errors={editErrors}
            onSelectLevel={(idx, val) => setEditSelection(prev => updateCategorySelection(prev, idx, val))}
          />
        ) : (
          <DetailFieldGrid layout="three">
            {MATERIAL_CATEGORY_LEVELS.map(lvl => (
              <FieldView key={lvl.key} label={lvl.label} value={pathCell(material, lvl.key)} />
            ))}
          </DetailFieldGrid>
        )}
      </SectionCard>

      <SectionCard variant="detail" title="Thông tin vật tư">
        {isEditing ? (
          <MaterialDetailEditForm
            materialCode={material.materialCode}
            form={editForm}
            errors={editErrors}
            originBrand={originParts.brand}
            originCountry={originParts.country}
            originRegion={originParts.region}
            imagePreview={currentPreview}
            onPatchForm={patch => setEditForm(f => ({ ...f, ...patch }))}
            onOriginChange={setOriginParts}
            onSelectImage={selectFile}
            onRemoveImage={handleRemoveImage}
          />
        ) : (
          <MaterialDetailInfoReadGrid material={material} />
        )}
      </SectionCard>

      {!isEditing && (
        <MaterialDetailStatusCard
          material={material}
          isActive={isActive}
          isReactivating={reactivateMutation.isPending}
          onRequestDiscontinue={() => setShowDiscontinueConfirm(true)}
          onReactivate={() => void handleReactivate()}
        />
      )}

      <ConfirmDialog
        isOpen={showDiscontinueConfirm}
        onClose={() => setShowDiscontinueConfirm(false)}
        onConfirm={() => void handleDiscontinueConfirm()}
        title="Ngừng sử dụng mã vật tư"
        message={
          <>
            Ngừng sử dụng{' '}
            <strong className="text-[var(--md-on-surface)]">
              &ldquo;{material.materialCode} — {material.materialName}&rdquo;
            </strong>
            ?
            <br />
            <span className="text-sm opacity-85">
              Tồn kho và phiếu cũ vẫn giữ nguyên. Không thể chọn mã này trong phiếu mới.
            </span>
          </>
        }
        confirmLabel="Ngừng sử dụng"
        cancelLabel="Hủy bỏ"
        isLoading={discontinueMutation.isPending}
      />
    </div>
  );
}
