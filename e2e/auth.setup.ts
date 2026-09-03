import fs from 'node:fs';
import path from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { e2eEnv } from './helpers/env';

const authFile = path.join('e2e', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/login');
  await page.getByPlaceholder('vd: tuan.nguyen@mayzer.vn').fill(e2eEnv.username);
  await page.locator('input[type="password"]').fill(e2eEnv.password);
  await page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' }).check();
  await page.getByRole('button', { name: 'ĐĂNG NHẬP' }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
  await page.waitForFunction(() => Boolean(localStorage.getItem('nv-session-user')));
  await page.context().storageState({ path: authFile });
});
