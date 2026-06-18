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
