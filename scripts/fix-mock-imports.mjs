import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const servicesDir = path.join(root, 'src/mocks/services');

for (const file of fs.readdirSync(servicesDir)) {
  if (!file.endsWith('.ts')) continue;
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/mock['"]/g, "from '../index'");
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/mockLocalStore['"]/g, "from '../localStore'");
  content = content.replace(/from ['"]\.\.\/\.\.\/data\//g, "from '../data/");
  content = content.replace(/from ['"]\.\.\/([a-zA-Z]+Service)['"]/g, "from '../../services/$1'");
  fs.writeFileSync(filePath, content);
}

const serviceFiles = fs.readdirSync(path.join(root, 'src/services')).filter((f) => f.endsWith('.ts'));
for (const file of serviceFiles) {
  const filePath = path.join(root, 'src/services', file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import\('\.\/mocks\//g, "import('../mocks/services/");
  fs.writeFileSync(filePath, content);
}

const consumerFiles = [
  'src/constants/systemUsers.ts',
  'src/pages/stocktake/StocktakeListPage.tsx',
  'src/pages/warehouse/WarehouseListPage.tsx',
  'src/services/membersService.ts',
];

for (const rel of consumerFiles) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/from ['"]\.\.\/data\//g, "from '../mocks/data/");
  content = content.replace(/from ['"]\.\.\/\.\.\/data\//g, "from '../../mocks/data/");
  content = content.replace(/from ['"]\.\.\/data\/members['"]/g, "from '../mocks/data/members'");
  fs.writeFileSync(filePath, content);
}

console.log('Fixed mock import paths.');
