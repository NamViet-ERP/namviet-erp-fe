import { describe, it, expect } from 'vitest';
import {
  parseOriginParts,
  formatOriginString,
  isSteelCategory,
  isEquipmentCategory,
  MATERIAL_TABLE_COLUMNS,
  materialCodeParts,
} from './materialCategoryLevels';

describe('materialCategoryLevels utilities', () => {
  describe('parseOriginParts', () => {
    it('returns empty fields for null, undefined or empty string', () => {
      expect(parseOriginParts(null)).toEqual({ brand: '', country: '', region: '' });
      expect(parseOriginParts(undefined)).toEqual({ brand: '', country: '', region: '' });
      expect(parseOriginParts('')).toEqual({ brand: '', country: '', region: '' });
      expect(parseOriginParts('   ')).toEqual({ brand: '', country: '', region: '' });
    });

    it('parses full brand, country and region pattern "Brand • Country (Region)"', () => {
      const parsed = parseOriginParts('Hòa Phát • Việt Nam (ĐNA)');
      expect(parsed).toEqual({
        brand: 'Hòa Phát',
        country: 'Việt Nam',
        region: 'ĐNA',
      });
    });

    it('parses pattern with dash "Wilo - Đức (G7)"', () => {
      const parsed = parseOriginParts('Wilo - Đức (G7)');
      expect(parsed).toEqual({
        brand: 'Wilo',
        country: 'Đức',
        region: 'G7',
      });
    });

    it('parses country and region only "Nhật Bản (G7)"', () => {
      const parsed = parseOriginParts('Nhật Bản (G7)');
      expect(parsed).toEqual({
        brand: '',
        country: 'Nhật Bản',
        region: 'G7',
      });
    });

    it('parses brand and country without region "SeAH • Hàn Quốc"', () => {
      const parsed = parseOriginParts('SeAH • Hàn Quốc');
      expect(parsed).toEqual({
        brand: 'SeAH',
        country: 'Hàn Quốc',
        region: '',
      });
    });

    it('falls back to treating raw string as country when no delimiters', () => {
      expect(parseOriginParts('Việt Nam')).toEqual({
        brand: '',
        country: 'Việt Nam',
        region: '',
      });
      expect(parseOriginParts('Hòa Phát')).toEqual({
        brand: '',
        country: 'Hòa Phát',
        region: '',
      });
    });
  });

  describe('formatOriginString', () => {
    it('formats 3 parts into "Brand • Country (Region)"', () => {
      expect(formatOriginString('Hòa Phát', 'Việt Nam', 'ĐNA')).toBe('Hòa Phát • Việt Nam (ĐNA)');
    });

    it('formats brand and country only without region', () => {
      expect(formatOriginString('Hòa Phát', 'Việt Nam', '')).toBe('Hòa Phát • Việt Nam');
    });

    it('formats country and region only without brand', () => {
      expect(formatOriginString('', 'Đức', 'G7')).toBe('Đức (G7)');
    });

    it('formats brand only', () => {
      expect(formatOriginString('Wilo', '', '')).toBe('Wilo');
    });

    it('returns empty string if all parts are empty', () => {
      expect(formatOriginString('', '', '')).toBe('');
    });
  });

  describe('isSteelCategory', () => {
    it('detects steel and raw material categories', () => {
      expect(isSteelCategory('NGUYÊN VẬT LIỆU')).toBe(true);
      expect(isSteelCategory('Thép tấm')).toBe(true);
      expect(isSteelCategory('Ống thép đúc')).toBe(true);
      expect(isSteelCategory('Inox 304')).toBe(true);
      expect(isSteelCategory('Kim loại màu')).toBe(true);
      expect(isSteelCategory('Động cơ điện')).toBe(false);
      expect(isSteelCategory(null)).toBe(false);
    });
  });

  describe('isEquipmentCategory', () => {
    it('detects pump, motor, fan and machinery categories', () => {
      expect(isEquipmentCategory('Máy bơm ly tâm')).toBe(true);
      expect(isEquipmentCategory('Động cơ giảm tốc')).toBe(true);
      expect(isEquipmentCategory('Quạt hút công nghiệp')).toBe(true);
      expect(isEquipmentCategory('Thiết bị đo lường')).toBe(true);
      expect(isEquipmentCategory('Thép hình')).toBe(false);
      expect(isEquipmentCategory(null)).toBe(false);
    });
  });
  describe('MATERIAL_TABLE_COLUMNS', () => {
    it('defines separate columns for materialCode, materialName, brand, and origin', () => {
      const keys = MATERIAL_TABLE_COLUMNS.map(c => c.key);
      expect(keys).toContain('materialCode');
      expect(keys).toContain('materialName');
      expect(keys).toContain('brand');
      expect(keys).toContain('origin');
      expect(keys).not.toContain('material');
      expect(keys).not.toContain('originBrand');
    });

    it('has exact 8 columns in spec order', () => {
      expect(MATERIAL_TABLE_COLUMNS).toEqual([
        { key: 'image', label: 'Ảnh' },
        { key: 'materialCode', label: 'Mã vật tư' },
        { key: 'materialName', label: 'Tên vật tư' },
        { key: 'categoryPath', label: 'Phân cấp danh mục' },
        { key: 'unit', label: 'ĐVT' },
        { key: 'specs', label: 'Quy cách / Thông số chính' },
        { key: 'brand', label: 'Hãng' },
        { key: 'origin', label: 'Xuất xứ' },
      ]);
    });
  });

  describe('materialCodeParts', () => {
    it('splits hyphen-separated code segments and trims whitespace', () => {
      expect(materialCodeParts('TE-PLT-012-SA516')).toEqual(['TE', 'PLT', '012', 'SA516']);
    });

    it('returns empty array for empty, null, or undefined code', () => {
      expect(materialCodeParts('')).toEqual([]);
      expect(materialCodeParts(null)).toEqual([]);
      expect(materialCodeParts(undefined)).toEqual([]);
    });

    it('filters empty parts from consecutive hyphens or trailing hyphens', () => {
      expect(materialCodeParts('TE--PLT-')).toEqual(['TE', 'PLT']);
    });

    it('handles single segment code without hyphens', () => {
      expect(materialCodeParts('SA516')).toEqual(['SA516']);
    });
  });
});
