import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Living Invariant 3: UI Anti-Slop & Text Wrapping Standards', () => {
  const modalFilePath = path.resolve(
    __dirname,
    '../../components/warehouse/AdminOpeningStockModal.tsx',
  );

  it('AdminOpeningStockModal exists and contains no cramped radio labels', () => {
    expect(fs.existsSync(modalFilePath)).toBe(true);
    const content = fs.readFileSync(modalFilePath, 'utf-8');

    // Invariant 3: Không rớt dòng nhãn radio (phải có whitespace-nowrap hoặc Segmented Switcher)
    expect(content).toContain('whitespace-nowrap');
    expect(content).toMatch(/Segmented.*Switcher/i);

    // Labels for target warehouses must not be isolated single characters or multiline split
    expect(content).not.toMatch(/Kho\s*\n\s*Dự\s*\n\s*Án/);
    expect(content).not.toMatch(/Kho\s*\n\s*Tổng/);
  });
});
