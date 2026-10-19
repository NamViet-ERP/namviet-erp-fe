/** Nhãn 5 cấp cây vật tư — theo CÂY VẬT TƯ.xlsx */
export const MATERIAL_CATEGORY_LEVELS = [
  { level: 1, key: 'danhMuc', label: 'Danh mục' },
  { level: 2, key: 'nhomVatTu', label: 'Nhóm vật tư' },
  { level: 3, key: 'loaiVatTu', label: 'Loại vật tư' },
  { level: 4, key: 'phanLoai', label: 'Phân loại' },
  { level: 5, key: 'kieu', label: 'Kiểu' },
] as const;

/** Cấp bắt buộc khi tạo mã vật tư (theo spec Excel) */
export const MATERIAL_CREATE_REQUIRED_LEVELS = [1, 2] as const;

export const MATERIAL_TABLE_COLUMNS = [
  { key: 'image', label: 'Ảnh' },
  { key: 'material', label: 'Mã & Tên vật tư' },
  { key: 'categoryPath', label: 'Phân cấp danh mục' },
  { key: 'unit', label: 'ĐVT' },
  { key: 'specs', label: 'Quy cách / Thông số chính' },
  { key: 'originBrand', label: 'Hãng & Xuất xứ' },
] as const;

export interface ParsedOrigin {
  brand: string;
  country: string;
  region: string;
}

export const REGION_OPTIONS = ['G7', 'EU', 'ĐNA', 'Nhóm 1', 'Khác'] as const;

export const COMMON_ORIGIN_COUNTRIES = [
  'Việt Nam',
  'Trung Quốc',
  'Hàn Quốc',
  'Nhật Bản',
  'Đài Loan',
  'Thái Lan',
  'Malaysia',
  'Singapore',
  'Indonesia',
  'Ấn Độ',
  'Đức',
  'Ý',
  'Pháp',
  'Anh',
  'Mỹ',
  'Thụy Điển',
  'Thụy Sĩ',
  'Tây Ban Nha',
  'Nga',
  'Thổ Nhĩ Kỳ',
] as const;

export function parseOriginParts(rawOrigin?: string | null): ParsedOrigin {
  if (!rawOrigin || !rawOrigin.trim()) {
    return { brand: '', country: '', region: '' };
  }
  const text = rawOrigin.trim();

  // Pattern: "Brand • Country (Region)" or "Brand - Country (Region)"
  const matchParen = text.match(/^(.+?)\s*(?:•|-|\|)\s*(.+?)\s*\((.+?)\)$/);
  if (matchParen) {
    return {
      brand: matchParen[1].trim(),
      country: matchParen[2].trim(),
      region: matchParen[3].trim(),
    };
  }

  // Pattern: "Country (Region)"
  const matchCountryRegion = text.match(/^(.+?)\s*\((.+?)\)$/);
  if (matchCountryRegion) {
    return {
      brand: '',
      country: matchCountryRegion[1].trim(),
      region: matchCountryRegion[2].trim(),
    };
  }

  // Pattern: "Brand | Country | Region" or "Brand - Country - Region"
  const parts = text.split(/\s*(?:•|-|\|)\s*/).filter(Boolean);
  if (parts.length >= 3) {
    return {
      brand: parts[0].trim(),
      country: parts[1].trim(),
      region: parts.slice(2).join(' ').replace(/[()]/g, '').trim(),
    };
  }
  if (parts.length === 2) {
    const last = parts[1].trim();
    const isRegion = REGION_OPTIONS.some(r => r.toLowerCase() === last.toLowerCase());
    if (isRegion) {
      return { brand: '', country: parts[0].trim(), region: last };
    }
    return { brand: parts[0].trim(), country: last, region: '' };
  }

  return { brand: '', country: text, region: '' };
}

export function formatOriginString(brand: string, country: string, region: string): string {
  const b = brand.trim();
  const c = country.trim();
  const r = region.trim();

  if (b && c && r) return `${b} • ${c} (${r})`;
  if (b && c) return `${b} • ${c}`;
  if (c && r) return `${c} (${r})`;
  if (b && r) return `${b} (${r})`;
  return b || c || r || '';
}

export function isSteelCategory(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes('thép') ||
    n.includes('thep') ||
    n.includes('inox') ||
    n.includes('kim khí') ||
    n.includes('kim loại') ||
    n.includes('kim loai') ||
    n.includes('nguyên vật liệu') ||
    n.includes('nguyen vat lieu') ||
    n.includes('tấm') ||
    n.includes('tam') ||
    n.includes('ống') ||
    n.includes('ong') ||
    n.includes('hình') ||
    n.includes('hinh')
  );
}

export function isEquipmentCategory(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes('động cơ') ||
    n.includes('dong co') ||
    n.includes('bơm') ||
    n.includes('bom') ||
    n.includes('quạt') ||
    n.includes('quat') ||
    n.includes('thiết bị') ||
    n.includes('thiet bi') ||
    n.includes('máy') ||
    n.includes('may')
  );
}

/** Placeholder chung cho mọi dropdown trong form vật tư */
export const MATERIAL_SELECT_PLACEHOLDER = '- Chọn -' as const;

/**
 * Gợi ý nhập liệu — cùng một ví dụ: tấm thép SA516 dày 12mm.
 * Mã TE-PLT-012-SA516 ↔ tên ↔ quy cách ↔ tiêu chuẩn phải khớp nghĩa.
 */
export const MATERIAL_FIELD_PLACEHOLDERS = {
  materialCode: 'VD: TE-PLT-012-SA516',
  materialName: 'VD: Tấm thép SA516 Gr.70 dày 12mm',
  technicalSpec: 'VD: 2000×6000×12mm',
  generalTechnicalSpec: 'VD: Q=80m3/h, H=15m, điện áp 380V',
  qualityStandard: 'VD: ASTM A516 Gr.70',
} as const;

export function materialSelectError(label: string) {
  return `Vui lòng chọn ${label.toLowerCase()}`;
}

export function materialInputError(label: string) {
  return `Vui lòng nhập ${label.toLowerCase()}`;
}
