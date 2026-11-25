import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { materialsService } from '../../../services/materialsService';
import {
  MATERIAL_CATEGORY_LEVELS,
  MATERIAL_CREATE_REQUIRED_LEVELS,
  materialInputError,
  materialSelectError,
} from '../../../constants/materialCategoryLevels';
import { categoryLevel, resolveLeafCategoryId } from '../../../lib/wms/materialCategoryTree';
import type { MaterialCategoryApiDto } from '../../../types/wms';

export type CategorySelection = Array<number | ''>;

export const EMPTY_CATEGORY_SELECTION: CategorySelection = ['', '', '', '', ''];

export function isRequiredCategoryLevel(level: number): boolean {
  return (MATERIAL_CREATE_REQUIRED_LEVELS as readonly number[]).includes(level);
}

export function updateCategorySelection(
  prev: CategorySelection,
  levelIndex: number,
  value: number | '',
): CategorySelection {
  const next = [...prev];
  next[levelIndex] = value;
  for (let i = levelIndex + 1; i < 5; i++) next[i] = '';
  return next;
}

export function validateMaterialForm(params: {
  selection: CategorySelection;
  categories: MaterialCategoryApiDto[];
  materialCode?: string;
  materialName: string;
  unit: string;
  requireCode?: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const lvl of MATERIAL_CREATE_REQUIRED_LEVELS) {
    if (params.selection[lvl - 1] === '') {
      errors[`level${lvl}`] = materialSelectError(MATERIAL_CATEGORY_LEVELS[lvl - 1].label);
    }
  }
  if (params.requireCode && !params.materialCode?.trim()) {
    errors.materialCode = materialInputError('mã vật tư');
  }
  if (!params.materialName.trim()) errors.materialName = materialInputError('tên vật tư');
  if (!params.unit.trim()) errors.unit = materialSelectError('đơn vị tính');

  const categoryId = resolveLeafCategoryId(params.selection);
  if (categoryId && (categoryLevel(params.categories, categoryId) ?? 0) < 2) {
    errors.level2 = 'Vui lòng chọn đến cấp Nhóm vật tư';
  }
  return errors;
}

export function parseCeilingPrice(raw: string): number | null {
  if (!raw) return null;
  return Number(String(raw).replace(/[^\d.-]/g, '')) || null;
}

export function buildMaterialUpsertBody(params: {
  materialCode: string;
  materialName: string;
  categoryId: number;
  unit: string;
  origin: string;
  imageUrl: string | null;
  technicalSpec: string;
  generalTechnicalSpec: string;
  qualityStandard: string;
  ceilingPrice: string;
  isConsumable: boolean;
}) {
  return {
    materialCode: params.materialCode.trim(),
    materialName: params.materialName.trim(),
    categoryId: params.categoryId,
    unit: params.unit.trim(),
    origin: params.origin.trim() || null,
    imageUrl: params.imageUrl,
    technicalSpec: params.technicalSpec.trim() || null,
    generalTechnicalSpec: params.generalTechnicalSpec.trim() || null,
    qualityStandard: params.qualityStandard.trim() || null,
    ceilingPrice: parseCeilingPrice(params.ceilingPrice),
    isConsumable: params.isConsumable,
  };
}

export async function uploadMaterialImageIfSelected(
  file: File | null,
  fallbackImageUrl: string,
  materialCode: string,
): Promise<{ ok: true; imageUrl: string | null } | { ok: false }> {
  if (!file) {
    return { ok: true, imageUrl: fallbackImageUrl.trim() || null };
  }
  try {
    const res = await materialsService.uploadImage(file, materialCode.trim());
    return { ok: true, imageUrl: res.imageUrl };
  } catch (uploadErr) {
    showToast('error', getApiErrorMessage(uploadErr, 'Không thể tải ảnh lên'));
    return { ok: false };
  }
}
