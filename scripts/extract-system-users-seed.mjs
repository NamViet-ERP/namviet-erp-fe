import fs from 'fs';

const srcPath = new URL('../src/constants/systemUsers.ts', import.meta.url);
const outPath = new URL('../src/data/systemUsersSeed.ts', import.meta.url);
const src = fs.readFileSync(srcPath, 'utf8');
const match = src.match(/const seedSystemUsers: SystemUser\[\] = (\[[\s\S]*?\n\]);/);
if (!match) {
  console.error('Could not find seedSystemUsers array');
  process.exit(1);
}
const arr = eval(match[1]);
const out = `import type { SystemUser } from '../types/systemUser';

export const SEED_SYSTEM_USERS: SystemUser[] = ${JSON.stringify(arr, null, 2)};
`;
fs.writeFileSync(outPath, out);
console.log(`Wrote ${arr.length} seed users`);
