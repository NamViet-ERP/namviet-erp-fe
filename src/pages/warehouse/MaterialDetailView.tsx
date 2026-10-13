import { useState } from 'react';
import { Ban, RotateCcw, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import DetailSection from '../../components/hr/DetailSection';
import DetailFieldGrid from '../../components/hr/DetailFieldGrid';
import { FieldInput, FieldTextarea, FieldView } from '../../components/hr/DetailFields';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmEditActions from '../../components/hr/HrmEditActions';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useMaterial, useUpdateMaterial, useDiscontinueMaterial, useReactivateMaterial } from '../../hooks/useMaterials';
import { useCategoryCascade, useCategoryTree } from '../../hooks/useCategories';
import MaterialUnitSelect from '../../components/warehouse/MaterialUnitSelect';
import MaterialOriginSelect from '../../components/warehouse/MaterialOriginSelect';
import { materialsService } from '../../services/materialsService';
import { resolveMediaUrl } from '../../lib/hrm/employeeApiMapper';
import {
  MATERIAL_CATEGORY_LEVELS,
  MATERIAL_CREATE_REQUIRED_LEVELS,
  MATERIAL_FIELD_PLACEHOLDERS,
  MATERIAL_SELECT_PLACEHOLDER,
  materialInputError,
  materialSelectError,
} from '../../constants/materialCategoryLevels';
import {
  categoryLevel,
  resolveLeafCategoryId,
  selectionFromCategoryId,
} from '../../lib/wms/materialCategoryTree';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { MaterialApiDto } from '../../types/wms';

const emptySelection: Array<number | ''> = ['', '', '', '', ''];

function pathCell(m: MaterialApiDto, key: keyof MaterialApiDto['categoryPath']) {
  return m.categoryPath?.[key]?.trim() || '—';
}

function isRequiredOnCreate(level: number) {
  return (MATERIAL_CREATE_REQUIRED_LEVELS as readonly number[]).includes(level);
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
  const [editSelection, setEditSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [editForm, setEditForm] = useState({
    materialName: '',
    unit: '',
    origin: '',
    imageUrl: '',
    technicalSpec: '',
    generalTechnicalSpec: '',
    qualityStandard: '',
    ceilingPrice: '',
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { optionsByLevel: editOptions, isLoading: editCategoriesLoading } =
    useCategoryCascade(editSelection);

  if (isLoading) return <HrmLoadingState />;
  if (isError || !material) {
    return (
      <HrmNotFound
        message="Không tìm thấy vật tư."
        backLabel="Quay lại danh sách"
        onBack={onBack}
      />
    );
  }

  const setEditLevel = (levelIndex: number, value: number | '') => {
    setEditSelection(prev => {
      const next = [...prev];
      next[levelIndex] = value;
      for (let i = levelIndex + 1; i < 5; i++) next[i] = '';
      return next;
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('warning', 'Kích thước ảnh tối đa là 10MB');
      return;
    }
    setEditImageFile(file);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setEditImageFile(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    setEditForm(f => ({ ...f, imageUrl: '' }));
  };

  const startEdit = () => {
    setEditSelection(selectionFromCategoryId(categories, material.categoryId));
    setEditForm({
      materialName: material.materialName,
      unit: material.unit,
      origin: material.origin ?? '',
      imageUrl: material.imageUrl ?? '',
      technicalSpec: material.technicalSpec ?? '',
      generalTechnicalSpec: material.generalTechnicalSpec ?? '',
      qualityStandard: material.qualityStandard ?? '',
      ceilingPrice: material.ceilingPrice != null ? String(material.ceilingPrice) : '',
    });
    setEditImageFile(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    setEditErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditSelection(selectionFromCategoryId(categories, material.categoryId));
    setEditForm({
      materialName: material.materialName,
      unit: material.unit,
      origin: material.origin ?? '',
      imageUrl: material.imageUrl ?? '',
      technicalSpec: material.technicalSpec ?? '',
      generalTechnicalSpec: material.generalTechnicalSpec ?? '',
      qualityStandard: material.qualityStandard ?? '',
      ceilingPrice: material.ceilingPrice != null ? String(material.ceilingPrice) : '',
    });
    setEditImageFile(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    setEditErrors({});
    setIsEditing(false);
  };

  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {};
    for (const lvl of MATERIAL_CREATE_REQUIRED_LEVELS) {
      if (editSelection[lvl - 1] === '') {
        errors[`level${lvl}`] = materialSelectError(MATERIAL_CATEGORY_LEVELS[lvl - 1].label);
      }
    }
    if (!editForm.materialName.trim()) errors.materialName = materialInputError('tên vật tư');
    if (!editForm.unit.trim()) errors.unit = materialSelectError('đơn vị tính');

    const categoryId = resolveLeafCategoryId(editSelection);
    if (categoryId && categoryLevel(categories, categoryId)! < 2) {
      errors.level2 = 'Vui lòng chọn đến cấp Nhóm vật tư';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateEdit()) return;
    const categoryId = resolveLeafCategoryId(editSelection);
    if (!categoryId) return;

    try {
      let finalImageUrl = editForm.imageUrl.trim() || null;
      if (editImageFile) {
        setIsUploadingImage(true);
        try {
          const res = await materialsService.uploadImage(editImageFile, material.materialCode);
          finalImageUrl = res.imageUrl;
        } catch (uploadErr) {
          showToast('error', getApiErrorMessage(uploadErr, 'Không thể tải ảnh lên'));
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }

      await updateMutation.mutateAsync({
        code: material.materialCode,
        body: {
          materialCode: material.materialCode,
          materialName: editForm.materialName.trim(),
          categoryId,
          unit: editForm.unit.trim(),
          origin: editForm.origin.trim() || null,
          imageUrl: finalImageUrl,
          technicalSpec: editForm.technicalSpec.trim() || null,
          generalTechnicalSpec: editForm.generalTechnicalSpec.trim() || null,
          qualityStandard: editForm.qualityStandard.trim() || null,
          ceilingPrice: editForm.ceilingPrice
            ? Number(String(editForm.ceilingPrice).replace(/[^\d.-]/g, '')) || null
            : null,
          isConsumable: material.isConsumable,
        },
      });
      showToast('success', 'Đã cập nhật thông tin vật tư');
      setIsEditing(false);
    } catch (err) {
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
    editImagePreview || (editForm.imageUrl ? resolveMediaUrl(editForm.imageUrl) : null);

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
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

      <DetailSection title="Phân loại danh mục">
        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => (
              <label key={lvl.key} className="hrm-field">
                <span className="hrm-field__label">
                  {lvl.label}
                  {isRequiredOnCreate(lvl.level) && (
                    <span className="text-[var(--md-error)]"> *</span>
                  )}
                </span>
                <select
                  className="hrm-field-select"
                  disabled={editCategoriesLoading || (idx > 0 && editSelection[idx - 1] === '')}
                  value={editSelection[idx]}
                  onChange={e => {
                    const v = e.target.value;
                    setEditLevel(idx, v === '' ? '' : Number(v));
                  }}
                >
                  <option value="">{MATERIAL_SELECT_PLACEHOLDER}</option>
                  {editOptions[idx]
                    ?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED')
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {editErrors[`level${lvl.level}`] && (
                  <p className="hrm-field__error">{editErrors[`level${lvl.level}`]}</p>
                )}
              </label>
            ))}
          </div>
        ) : (
          <DetailFieldGrid layout="three">
            {MATERIAL_CATEGORY_LEVELS.map(lvl => (
              <FieldView key={lvl.key} label={lvl.label} value={pathCell(material, lvl.key)} />
            ))}
          </DetailFieldGrid>
        )}
      </DetailSection>

      <DetailSection title="Thông tin vật tư">
        {isEditing ? (
          <DetailFieldGrid layout="responsive">
            <FieldView label="Mã vật tư" value={material.materialCode} />
            <FieldInput
              label="Tên vật tư *"
              value={editForm.materialName}
              onChange={v => setEditForm(f => ({ ...f, materialName: v }))}
              error={editErrors.materialName}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialName}
            />
            <MaterialUnitSelect
              value={editForm.unit}
              onChange={unit => setEditForm(f => ({ ...f, unit }))}
              required
              error={editErrors.unit}
              preserveUnknownValue
              variant="hrm"
            />
            <MaterialOriginSelect
              value={editForm.origin}
              onChange={origin => setEditForm(f => ({ ...f, origin }))}
              preserveUnknownValue
              variant="hrm"
            />
            <FieldInput
              label="Quy cách"
              value={editForm.technicalSpec}
              onChange={v => setEditForm(f => ({ ...f, technicalSpec: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
            />
            <div className="hrm-field">
              <span className="hrm-field__label">Giá trần tham chiếu</span>
              <CurrencyInput
                value={editForm.ceilingPrice}
                onChange={ceilingPrice => setEditForm(f => ({ ...f, ceilingPrice }))}
                placeholder="Cảnh báo khi mua vượt giá"
              />
            </div>
            <FieldInput
              className="col-span-full"
              label="Tiêu chuẩn chất lượng"
              value={editForm.qualityStandard}
              onChange={v => setEditForm(f => ({ ...f, qualityStandard: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.qualityStandard}
            />
            <FieldTextarea
              className="col-span-full"
              label="Thông số kỹ thuật chung"
              value={editForm.generalTechnicalSpec}
              onChange={v => setEditForm(f => ({ ...f, generalTechnicalSpec: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
            />
            <div className="col-span-full border-t border-[var(--color-border)] pt-3">
              <label className="hrm-field__label block mb-1.5 font-medium">Hình ảnh vật tư</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-hover)]/30">
                {currentPreview ? (
                  <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0 shadow-xs">
                    <img
                      src={currentPreview}
                      alt="Xem trước ảnh vật tư"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-xs font-medium cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
                    <ImageIcon size={28} className="opacity-40 mb-1" />
                    <span className="text-[11px]">Chưa có ảnh</span>
                  </div>
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="btn btn-sm btn-outline cursor-pointer inline-flex items-center gap-1.5">
                      <Upload size={14} />
                      <span>{currentPreview ? 'Đổi ảnh khác' : 'Chọn ảnh tải lên'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>
                    {currentPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1 inline" />
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Kích thước tối đa 10MB.
                  </p>
                </div>
              </div>
            </div>
          </DetailFieldGrid>
        ) : (
          <DetailFieldGrid layout="responsive">
            <FieldView label="Mã vật tư" value={material.materialCode} />
            <FieldView label="Tên" value={material.materialName} />
            <FieldView label="Đơn vị tính" value={material.unit} />
            <FieldView label="Xuất xứ" value={material.origin ?? undefined} />
            <FieldView label="Quy cách" value={material.technicalSpec ?? undefined} />
            <FieldView
              label="Giá trần tham chiếu"
              value={material.ceilingPrice != null ? formatCurrencyFull(material.ceilingPrice) : undefined}
            />
            <FieldView label="Tiêu chuẩn chất lượng" value={material.qualityStandard ?? undefined} />
            <FieldView
              className="col-span-full"
              label="Thông số kỹ thuật chung"
              value={material.generalTechnicalSpec ?? undefined}
              multiline
            />
            <div className="col-span-full pt-2">
              <span className="hrm-field__label block mb-2 font-medium">Hình ảnh vật tư</span>
              {material.imageUrl?.trim() ? (
                <div className="flex items-start gap-4">
                  <a
                    href={resolveMediaUrl(material.imageUrl.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-[var(--color-border)] shadow-xs hover:opacity-90 transition-opacity"
                    title="Bấm để mở ảnh kích thước gốc"
                  >
                    <img
                      src={resolveMediaUrl(material.imageUrl.trim())}
                      alt={material.materialName}
                      className="w-32 h-32 object-cover bg-[var(--color-surface)]"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </a>
                  <div className="text-xs text-[var(--color-text-muted)] pt-1 space-y-1">
                    <p className="font-medium text-[var(--color-text)]">Đã tải lên ảnh đại diện vật tư</p>
                    <p>Bấm vào ảnh để xem kích thước gốc trong tab mới.</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] italic">Chưa có hình ảnh</p>
              )}
            </div>
          </DetailFieldGrid>
        )}
      </DetailSection>

      {!isEditing && (
        <section
          className={`hrm-detail-section ${isActive ? 'hrm-detail-section--status-active' : 'hrm-detail-section--status-inactive'}`}
        >
          <div className="hrm-detail-section__head">
            <h3 className="hrm-detail-section__title">
              {isActive ? 'Ngừng sử dụng' : 'Kích hoạt lại'}
            </h3>
            <p className="hrm-detail-section__desc">
              {isActive
                ? 'Ẩn khỏi danh sách tạo phiếu mới; giữ nguyên tồn kho và lịch sử dự án.'
                : 'Cho phép chọn vật tư trong phiếu nhập/xuất mới.'}
            </p>
          </div>
          <div className="hrm-detail-section__body">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--md-on-surface)]">
                  {material.materialCode} — {material.materialName}
                </p>
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
                  {isActive
                    ? 'Dùng khi mã không còn nhập mới nhưng dự án cũ vẫn cần đối soát.'
                    : 'Vật tư hiện không xuất hiện khi lập phiếu mới.'}
                </p>
              </div>
              {isActive ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm rounded-full px-4 flex items-center gap-2 shrink-0 text-[var(--md-error)] border-[var(--md-error)]"
                  onClick={() => setShowDiscontinueConfirm(true)}
                >
                  <Ban size={15} />
                  Ngừng sử dụng
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm rounded-full px-4 flex items-center gap-2 shrink-0"
                  disabled={reactivateMutation.isPending}
                  onClick={() => void handleReactivate()}
                >
                  <RotateCcw size={15} />
                  Kích hoạt lại
                </button>
              )}
            </div>
          </div>
        </section>
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
