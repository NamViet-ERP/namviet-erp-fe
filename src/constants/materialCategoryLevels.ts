/** Nhãn 5 cấp cây vật tư — theo CÂY VẬT TƯ.xlsx */
export const MATERIAL_CATEGORY_LEVELS = [
  { level: 1, key: 'danhMuc', label: 'Danh mục' },
  { level: 2, key: 'nhomVatTu', label: 'Nhóm vật tư' },
  { level: 3, key: 'loaiVatTu', label: 'Loại vật tư' },
  { level: 4, key: 'phanLoai', label: 'Phân loại' },
  { level: 5, key: 'kieu', label: 'Kiểu' },
] as const;

/** Cấp bắt buộc khi tạo mã vật tư (theo spec Excel) */
export const MATERIAL_CREATE_REQUIRED_LEVELS = [1, 2, 3] as const;

export const MATERIAL_TABLE_COLUMNS = [
  { key: 'danhMuc', label: 'Danh mục' },
  { key: 'nhomVatTu', label: 'Nhóm vật tư' },
  { key: 'loaiVatTu', label: 'Loại vật tư' },
  { key: 'phanLoai', label: 'Phân loại' },
  { key: 'kieu', label: 'Kiểu' },
  { key: 'materialCode', label: 'Mã vật tư' },
  { key: 'materialName', label: 'Tên' },
  { key: 'technicalSpec', label: 'Quy cách' },
  { key: 'qualityStandard', label: 'Tiêu chuẩn chất lượng' },
] as const;

/** Placeholder chung cho mọi dropdown trong form vật tư */
export const MATERIAL_SELECT_PLACEHOLDER = '— Chọn —' as const;

/**
 * Gợi ý nhập liệu — cùng một ví dụ: tấm thép SA516 dày 12mm.
 * Mã TE-PLT-012-SA516 ↔ tên ↔ quy cách ↔ tiêu chuẩn phải khớp nghĩa.
 */
export const MATERIAL_FIELD_PLACEHOLDERS = {
  materialCode: 'VD: TE-PLT-012-SA516',
  materialName: 'VD: Tấm thép SA516 Gr.70 dày 12mm',
  technicalSpec: 'VD: 2000×6000×12mm',
  qualityStandard: 'VD: ASTM A516 Gr.70',
} as const;

export function materialSelectError(label: string) {
  return `Vui lòng chọn ${label.toLowerCase()}`;
}

export function materialInputError(label: string) {
  return `Vui lòng nhập ${label.toLowerCase()}`;
}
