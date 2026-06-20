import { test, expect } from '@playwright/test';
import { CLIENTE_USER } from '../fixtures/users';

// Auth flows — runs without storage state (fresh, anonymous browser).
// The `auth` Playwright project in `playwright.config.ts` deliberately omits
// `storageState`, so each test starts from an empty session.

test.describe('Auth — register + forgot password', () => {
  test('register: new user can submit the form and reach the verify-email success state', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@test.pt`;

    await page.goto('/register');

    // Default role is CLIENT (no need to toggle radios).
    await page.getByLabel('Nome').fill('Utilizador E2E');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Palavra-passe', { exact: true }).fill('TestPassword123!');
    await page.getByLabel('Confirmar palavra-passe').fill('TestPassword123!');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Success state replaces the form with "Verifique o seu email" + return-to-login link.
    await expect(page.getByRole('heading', { name: /Verifique o seu email/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: /Ir para o login/i })).toBeVisible();
  });

  // The full register -> verify token -> login round trip cannot run yet because
  // we don't expose the last verification token via an admin endpoint. WireMock
  // intercepts the outbound email so we can't read it from Mailpit either.
  // TODO: add GET /api/v1/admin/test/last-verification-token endpoint in a follow-up.
  test.fixme('register: verify email token + login round-trip', async () => {
    // Intentionally empty — implementation deferred (see TODO above).
  });

  test('forgot-password: submitting a known email shows the success confirmation', async ({ page }) => {
    await page.goto('/login');

    // Login page links to the recovery page with the literal Portuguese label.
    await page.getByRole('link', { name: /Esqueceu a palavra-passe\?/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.getByLabel('Email').fill(CLIENTE_USER.email);
    await page.getByRole('button', { name: /Enviar Link/i }).click();

    // Backend always returns success to avoid email enumeration — the UI shows
    // the generic confirmation banner regardless of whether the email exists.
    await expect(
      page.getByText(/receberá um link para redefinir a palavra-passe/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Voltar ao login/i })).toBeVisible();
  });
});
