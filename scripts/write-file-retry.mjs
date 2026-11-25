/**
 * Windows-safe write: temp file + retry copy/replace.
 * Avoids UNKNOWN / errno -4094 when the IDE or indexer briefly locks the dest.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DELAYS_MS = [0, 100, 250, 500, 1000, 2000];

function sleepMs(ms) {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function writeFileRetry(dest, contents, encoding = 'utf8') {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-write-'));
  const tmp = path.join(tmpDir, path.basename(dest));
  fs.writeFileSync(tmp, contents, encoding);

  let lastErr;
  for (const delay of DELAYS_MS) {
    sleepMs(delay);
    try {
      try {
        fs.copyFileSync(tmp, dest);
      } catch {
        fs.writeFileSync(dest, contents, encoding);
      }
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      return;
    } catch (err) {
      lastErr = err;
    }
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  throw lastErr;
}

export function readFileRetry(file, encoding = 'utf8') {
  let lastErr;
  for (const delay of DELAYS_MS) {
    sleepMs(delay);
    try {
      return fs.readFileSync(file, encoding);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
