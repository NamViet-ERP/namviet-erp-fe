import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATERIAL_TABLE_COLUMNS } from '../../constants/materialCategoryLevels';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('Living Invariant: Material Table Columns & Code Parts Standards', () => {
  const materialsPagePath = path.resolve(
    currentDir,
    '../../pages/warehouse/MaterialsPage.tsx',
  );
  const materialsRowPath = path.resolve(
    currentDir,
    '../../pages/warehouse/materials/MaterialsTableRow.tsx',
  );

  it('MATERIAL_TABLE_COLUMNS separates materialCode, materialName, brand, and origin', () => {
    const keys = MATERIAL_TABLE_COLUMNS.map(col => col.key);

    // 1. Must have separate columns
    expect(keys).toContain('materialCode');
    expect(keys).toContain('materialName');
    expect(keys).toContain('brand');
    expect(keys).toContain('origin');

    // Strictly ban combined columns
    expect(keys).not.toContain('material');
    expect(keys).not.toContain('originBrand');

    // Verify labels
    const codeCol = MATERIAL_TABLE_COLUMNS.find(c => c.key === 'materialCode');
    const nameCol = MATERIAL_TABLE_COLUMNS.find(c => c.key === 'materialName');
    const brandCol = MATERIAL_TABLE_COLUMNS.find(c => c.key === 'brand');
    const originCol = MATERIAL_TABLE_COLUMNS.find(c => c.key === 'origin');

    expect(codeCol?.label).toBe('Mã vật tư');
    expect(nameCol?.label).toBe('Tên vật tư');
    expect(brandCol?.label).toBe('Hãng');
    expect(originCol?.label).toBe('Xuất xứ');
  });

  it('MaterialsPage delegates rows to MaterialsTableRow and renders code chips, brand and origin tags', () => {
    expect(fs.existsSync(materialsPagePath)).toBe(true);
    expect(fs.existsSync(materialsRowPath)).toBe(true);
    const pageContent = fs.readFileSync(materialsPagePath, 'utf-8');
    const rowContent = fs.readFileSync(materialsRowPath, 'utf-8');

    expect(pageContent).toContain('MaterialsTableRow');

    // Must import and use materialCodeParts
    expect(rowContent).toContain('materialCodeParts');
    expect(rowContent).toMatch(/const\s+codeParts\s*=\s*materialCodeParts\(/);

    // Must render badge and segmented chip parts
    expect(rowContent).toContain('mat-code-cell');
    expect(rowContent).toContain('mat-code-cell__badge');
    expect(rowContent).toContain('mat-code-cell__parts');
    expect(rowContent).toContain('mat-code-cell__part');
    expect(rowContent).toMatch(/mat-code-cell__part--\$\{\(i % 4\) \+ 1\}/);

    // Must have brand and origin chips in mat-code-cell
    expect(rowContent).toContain('parsedOrigin.brand');
    expect(rowContent).toContain('parsedOrigin.country');

    // Must have mat-name-cell for materialName
    expect(rowContent).toContain('mat-name-cell');
    expect(rowContent).toContain('mat-name-cell__title');
  });
});
