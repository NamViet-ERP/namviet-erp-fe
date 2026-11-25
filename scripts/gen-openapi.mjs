/**
 * Generate OpenAPI TS types with Windows-safe write (unique temp + retry replace).
 * Avoids:
 * - concurrent api:sync + afterFileEdit both writing the same openapi.ts.tmp
 * - intermittent UNKNOWN / errno -4094 when openapi.ts is briefly locked
 * - ENOENT if the CLI temp file is cleaned before replace
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const swagger = path.join(root, 'openapi', 'swagger.json');
const out = path.join(root, 'src', 'types', 'generated', 'openapi.ts');
const cli = path.join(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js');

fs.mkdirSync(path.dirname(out), { recursive: true });

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-openapi-gen-'));
const tmp = path.join(tmpDir, 'openapi.ts');

const gen = spawnSync(
  process.execPath,
  [cli, swagger, '-o', tmp],
  { cwd: root, stdio: 'inherit' },
);

if (gen.status !== 0) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  process.exit(gen.status ?? 1);
}

if (!fs.existsSync(tmp)) {
  console.error(`openapi-typescript reported success but did not write ${tmp}`);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  process.exit(1);
}

const delaysMs = [0, 100, 250, 500, 1000, 2000];
let lastErr;
for (const delay of delaysMs) {
  if (delay > 0) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
  }
  try {
    try {
      fs.copyFileSync(tmp, out);
    } catch {
      const contents = fs.readFileSync(tmp);
      fs.writeFileSync(out, contents);
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    process.exit(0);
  } catch (err) {
    lastErr = err;
  }
}

console.error('Failed to replace openapi.ts after retries:', lastErr);
try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(1);
