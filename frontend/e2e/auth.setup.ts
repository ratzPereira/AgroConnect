import { test as setup, expect } from '@playwright/test';
import { CLIENTE_USER, PROVIDER_USER, ADMIN_USER } from './fixtures/users';

const API_BASE = 'http://localhost:8080/api';
const RESET_URL = `${API_BASE}/v1/admin/test/reset-demo-data`;

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Palavra-passe').fill(password);
  await page.getByRole('button', { name: /Entrar/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

async function clearSession(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
}

setup('reset demo data + capture storage states', async ({ request, page }) => {
  const resetResp = await request.post(RESET_URL);
  expect(resetResp.status()).toBe(204);

  await login(page, CLIENTE_USER.email, CLIENTE_USER.password);
  await page.context().storageState({ path: 'playwright/.auth/cliente.json' });

  await clearSession(page);
  await login(page, PROVIDER_USER.email, PROVIDER_USER.password);
  await page.context().storageState({ path: 'playwright/.auth/provider.json' });

  await clearSession(page);
  await login(page, ADMIN_USER.email, ADMIN_USER.password);
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
