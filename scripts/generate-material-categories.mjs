/**
 * Generate material-categories-tree.json from CÂY VẬT TƯ.xlsx (sheet 3).
 * Run: node scripts/generate-material-categories.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPathBe = join(
  __dirname,
  '../../WareHouse_Management_BE/src/Modules/Warehouse/NamViet.ERP.Modules.Warehouse.Infrastructure/Data/material-categories-tree.json',
);
const outPathFe = join(__dirname, '../src/data/materialCategoriesTree.json');

const dumpPath = join(__dirname, '../.agents/cay_vat_tu_full.json');
const dump = JSON.parse(readFileSync(dumpPath, 'utf-8'));
const rows = dump.sheets.sheet3;

function makeCode(pathParts) {
  const hash = createHash('md5').update(pathParts.join('|'), 'utf8').digest('hex').slice(0, 12).toUpperCase();
  return `CAT-${hash}`;
}

const state = ['', '', '', '', ''];
const cols = ['A', 'B', 'C', 'D', 'E'];
const nodes = new Map();
let order = 0;

for (const row of rows) {
  const cells = row.cells;
  const a = (cells.A ?? '').trim();
  const b = (cells.B ?? '').trim();
  if (a === 'Danh mục' && b === 'Nhóm vật tư') continue;

  let maxCol = -1;
  for (let i = 0; i < cols.length; i++) {
    const val = (cells[cols[i]] ?? '').trim();
    if (val) {
      state[i] = val;
      for (let j = i + 1; j < 5; j++) state[j] = '';
      maxCol = i;
    }
  }
  if (maxCol < 0) continue;

  for (let depth = 0; depth <= maxCol; depth++) {
    const pathParts = state.slice(0, depth + 1);
    const code = makeCode(pathParts);
    if (nodes.has(code)) continue;

    const parentPath = pathParts.slice(0, -1);
    const parentCode = parentPath.length ? makeCode(parentPath) : null;
    nodes.set(code, {
      code,
      name: pathParts[pathParts.length - 1],
      level: pathParts.length,
      parentCode,
      sortOrder: order++,
      isActive: true,
    });
  }
}

const list = [...nodes.values()].sort((a, b) => a.sortOrder - b.sortOrder);
mkdirSync(dirname(outPathBe), { recursive: true });
writeFileSync(outPathBe, JSON.stringify(list, null, 2), 'utf-8');
mkdirSync(dirname(outPathFe), { recursive: true });
copyFileSync(outPathBe, outPathFe);
console.log(`Wrote ${list.length} categories (L1=${list.filter((n) => n.level === 1).length})`);
