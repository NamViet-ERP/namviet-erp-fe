import { useState } from 'react';
import { Ban, RotateCcw } from 'lucide-react';
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
    technicalSpec: '',
    generalTechnicalSpec: '',
    qualityStandard: '',
    ceilingPrice: '',
  });
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

  const startEdit = () => {
    setEditSelection(selectionFromCategoryId(categories, material.categoryId));
    setEditForm({
      materialName: material.materialName,
      unit: material.unit,
      technicalSpec: material.technicalSpec ?? '',
      generalTechnicalSpec: material.generalTechnicalSpec ?? '',
      qualityStandard: material.qualityStandard ?? '',
      ceilingPrice: material.ceilingPrice != null ? String(material.ceilingPrice) : '',
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditSelection(selectionFromCategoryId(categories, material.categoryId));
    setEditForm({
      materialName: material.materialName,
      unit: material.unit,
      technicalSpec: material.technicalSpec ?? '',
      generalTechnicalSpec: material.generalTechnicalSpec ?? '',
      qualityStandard: material.qualityStandard ?? '',
      ceilingPrice: material.ceilingPrice != null ? String(material.ceilingPrice) : '',
    });
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
    if (categoryId && categoryLevel(categories, categoryId)! < 3) {
      errors.level3 = 'Vui lòng chọn đến cấp Loại vật tư';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateEdit()) return;
    const categoryId = resolveLeafCategoryId(editSelection);
    if (!categoryId) return;

    try {
      await updateMutation.mutateAsync({
        code: material.materialCode,
        body: {
          materialCode: material.materialCode,
          materialName: editForm.materialName.trim(),
          categoryId,
          unit: editForm.unit.trim(),
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

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={onBack}
        title={isEditing ? editForm.materialName || material.materialName : material.materialName}
        subtitle={`Mã vật tư: ${material.materialCode}${!isActive ? ' · Ngừng sử dụng' : ''}`}
        actions={
          <HrmEditActions
            isEditing={isEditing}
            isSaving={updateMutation.isPending}
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
            <FieldInput
              label="Quy cách"
              value={editForm.technicalSpec}
              onChange={v => setEditForm(f => ({ ...f, technicalSpec: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
            />
            <FieldTextarea
              className="col-span-full"
              label="Thông số kỹ thuật chung"
              value={editForm.generalTechnicalSpec}
              onChange={v => setEditForm(f => ({ ...f, generalTechnicalSpec: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
            />
            <FieldInput
              label="Tiêu chuẩn chất lượng"
              value={editForm.qualityStandard}
              onChange={v => setEditForm(f => ({ ...f, qualityStandard: v }))}
              placeholder={MATERIAL_FIELD_PLACEHOLDERS.qualityStandard}
            />
            <div className="hrm-field">
              <span className="hrm-field__label">Giá trần tham chiếu</span>
              <CurrencyInput
                value={editForm.ceilingPrice}
                onChange={ceilingPrice => setEditForm(f => ({ ...f, ceilingPrice }))}
                placeholder="Cảnh báo khi mua vượt giá"
              />
            </div>
          </DetailFieldGrid>
        ) : (
          <DetailFieldGrid layout="responsive">
            <FieldView label="Mã vật tư" value={material.materialCode} />
            <FieldView label="Tên" value={material.materialName} />
            <FieldView label="Đơn vị tính" value={material.unit} />
            <FieldView label="Quy cách" value={material.technicalSpec ?? undefined} />
            <FieldView
              className="col-span-full"
              label="Thông số kỹ thuật chung"
              value={material.generalTechnicalSpec ?? undefined}
              multiline
            />
            <FieldView label="Tiêu chuẩn chất lượng" value={material.qualityStandard ?? undefined} />
            <FieldView
              label="Giá trần tham chiếu"
              value={material.ceilingPrice != null ? formatCurrencyFull(material.ceilingPrice) : undefined}
            />
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
