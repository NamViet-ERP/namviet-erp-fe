import DetailFieldGrid from '../../../components/hr/DetailFieldGrid';
import { FieldInput, FieldTextarea } from '../../../components/hr/DetailFields';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import MaterialUnitSelect from '../../../components/warehouse/MaterialUnitSelect';
import { MATERIAL_FIELD_PLACEHOLDERS } from '../../../constants/materialCategoryLevels';
import MaterialOriginSection from './MaterialOriginSection';
import MaterialImageField from './MaterialImageField';

export interface MaterialDetailEditState {
  materialCode: string;
  materialName: string;
  unit: string;
  imageUrl: string;
  technicalSpec: string;
  generalTechnicalSpec: string;
  qualityStandard: string;
  ceilingPrice: string;
}

export interface MaterialDetailEditFormProps {
  originalMaterialCode: string;
  form: MaterialDetailEditState;
  errors: Record<string, string>;
  originBrand: string;
  originCountry: string;
  originRegion: string;
  imagePreview: string | null;
  onPatchForm: (patch: Partial<MaterialDetailEditState>) => void;
  onOriginChange: (next: { brand: string; country: string; region: string }) => void;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
}

export default function MaterialDetailEditForm({
  originalMaterialCode,
  form,
  errors,
  originBrand,
  originCountry,
  originRegion,
  imagePreview,
  onPatchForm,
  onOriginChange,
  onSelectImage,
  onRemoveImage,
}: MaterialDetailEditFormProps) {
  return (
    <DetailFieldGrid layout="responsive">
      <FieldInput
        label="Mã vật tư *"
        value={form.materialCode}
        onChange={materialCode => onPatchForm({ materialCode })}
        error={errors.materialCode}
        placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialCode}
        hint={
          form.materialCode.trim() !== originalMaterialCode
            ? 'Đổi mã sẽ tự động đồng bộ sang tồn kho, dự án và các phiếu liên quan.'
            : undefined
        }
      />
      <FieldInput
        label="Tên vật tư *"
        value={form.materialName}
        onChange={materialName => onPatchForm({ materialName })}
        error={errors.materialName}
        placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialName}
      />
      <MaterialUnitSelect
        value={form.unit}
        onChange={unit => onPatchForm({ unit })}
        required
        error={errors.unit}
        preserveUnknownValue
        variant="hrm"
      />
      <FieldInput
        label="Quy cách"
        value={form.technicalSpec}
        onChange={technicalSpec => onPatchForm({ technicalSpec })}
        placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
      />
      <div className="hrm-field">
        <span className="hrm-field__label">Giá trần tham chiếu</span>
        <CurrencyInput
          value={form.ceilingPrice}
          onChange={ceilingPrice => onPatchForm({ ceilingPrice })}
          placeholder="Cảnh báo khi mua vượt giá"
        />
      </div>
      <MaterialOriginSection
        className="col-span-full"
        variant="hrm"
        title="Xuất xứ (Nhãn hiệu, Nước sản xuất, Nhóm nước)"
        brand={originBrand}
        country={originCountry}
        region={originRegion}
        preserveExistingRegion
        onChange={({ brand, country, region }) => onOriginChange({ brand, country, region })}
      />
      <FieldInput
        className="col-span-full"
        label="Tiêu chuẩn chất lượng"
        value={form.qualityStandard}
        onChange={qualityStandard => onPatchForm({ qualityStandard })}
        placeholder={MATERIAL_FIELD_PLACEHOLDERS.qualityStandard}
      />
      <FieldTextarea
        className="col-span-full"
        label="Thông số kỹ thuật chung"
        value={form.generalTechnicalSpec}
        onChange={generalTechnicalSpec => onPatchForm({ generalTechnicalSpec })}
        placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
      />
      <MaterialImageField
        className="col-span-full"
        variant="hrm"
        previewUrl={imagePreview}
        onSelectFile={onSelectImage}
        onRemove={onRemoveImage}
      />
    </DetailFieldGrid>
  );
}
