import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const servicesDir = path.join(root, 'src/services');

for (const file of fs.readdirSync(servicesDir)) {
  if (!file.endsWith('.ts')) continue;
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replaceAll("import('./mocks/", "import('../mocks/services/");
  content = content.replaceAll('import("./mocks/', 'import("../mocks/services/');
  content = content.replaceAll("from './mocks/", "from '../mocks/services/");
  content = content.replaceAll('from "./mocks/', 'from "../mocks/services/');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('fixed paths', file);
  }
}
