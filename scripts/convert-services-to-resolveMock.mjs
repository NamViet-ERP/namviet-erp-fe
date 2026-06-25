import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const servicesDir = path.join(root, 'src/services');

const skipFiles = new Set(['authService.ts', 'filesService.ts', 'queryKeys.ts']);

function ensureResolveMockImport(content) {
  const stillUsesMockFlag = /\bUSE_MOCK\b/.test(content);
  const hasResolveMock = content.includes('resolveMock');

  if (!content.includes("from '../mocks'") && !content.includes('from "../mocks"')) {
    if (content.includes("import { USE_MOCK, mockDelay } from '../lib/mock';")) {
      content = content.replace(
        "import { USE_MOCK, mockDelay } from '../lib/mock';",
        stillUsesMockFlag
          ? "import { resolveMock, USE_MOCK, mockDelay } from '../mocks';"
          : "import { resolveMock, mockDelay } from '../mocks';",
      );
    } else if (content.includes("import { USE_MOCK } from '../lib/mock';")) {
      content = content.replace(
        "import { USE_MOCK } from '../lib/mock';",
        stillUsesMockFlag
          ? "import { resolveMock, USE_MOCK } from '../mocks';"
          : "import { resolveMock } from '../mocks';",
      );
    } else if (hasResolveMock) {
      // already converted import partially
    }
  } else if (hasResolveMock && stillUsesMockFlag && !content.includes('USE_MOCK')) {
    content = content.replace(
      "import { resolveMock } from '../mocks';",
      "import { resolveMock, USE_MOCK } from '../mocks';",
    );
  }

  return content;
}

function convertMockBranches(content) {
  const pattern = /if \(USE_MOCK\) \{\s*const mock = await import\((['"][^'"]+['"])\);\s*return (mock\.[\s\S]*?);\s*\}\s*return ([^;]+);/g;

  return content.replace(pattern, (_, importPath, mockCall, realCall) => {
    const mappedCall = mockCall.replace(/^mock\./, 'm.');
    return `return resolveMock(
      () => import(${importPath}).then((m) => ${mappedCall}),
      () => ${realCall},
    );`;
  });
}

function convertAwaitDelete(content) {
  const pattern = /if \(USE_MOCK\) \{\s*const mock = await import\((['"][^'"]+['"])\);\s*return (mock\.[\s\S]*?);\s*\}\s*await ([^;]+);/g;

  return content.replace(pattern, (_, importPath, mockCall, realCall) => {
    const mappedCall = mockCall.replace(/^mock\./, 'm.');
    return `return resolveMock(
      () => import(${importPath}).then((m) => ${mappedCall}),
      async () => { await ${realCall}; },
    );`;
  });
}

let changed = 0;

for (const file of fs.readdirSync(servicesDir)) {
  if (!file.endsWith('.ts') || skipFiles.has(file)) continue;
  const filePath = path.join(servicesDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  if (!original.includes('if (USE_MOCK)')) continue;

  let content = original;
  content = convertMockBranches(content);
  content = convertAwaitDelete(content);
  content = ensureResolveMockImport(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changed += 1;
    console.log('converted', file);
  }
}

console.log(`Done. ${changed} service file(s) updated.`);
