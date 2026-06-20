import { test, expect } from '@playwright/test';

// Cliente flow — storage state from `playwright/.auth/cliente.json` is injected
// by the `cliente` Playwright project, so we land on /dashboard already-authenticated.

test.describe('Cliente — create service request', () => {
  test('client can complete the 5-step wizard and publish a new request', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const title = `E2E Lavoura ${uniqueSuffix}`;
    const description = `Pedido criado por E2E em ${new Date().toISOString()}`;

    await page.goto('/requests/new');

    // ── Step 0: Category ─────────────────────────────────────────────────────
    // Categories come from the API; the seed always provides at least one.
    // We pick the first radio that becomes visible.
    const categoryRadios = page.locator('input[type="radio"][name="categoryId"]');
    await expect(categoryRadios.first()).toBeAttached({ timeout: 15_000 });
    await categoryRadios.first().check({ force: true });
    await page.getByRole('button', { name: /Seguinte/i }).click();

    // ── Step 1: Details ──────────────────────────────────────────────────────
    await page.getByLabel('Título').fill(title);
    await page.getByLabel('Descrição').fill(description);
    // Urgência is a <select> with a default value of "MEDIUM" — leave it.

    // If the chosen category has a dynamic form schema, its required fields would
    // block the wizard. The first seeded category is "lavoura" which historically
    // has optional fields only — if this assumption breaks, the test will fail
    // visibly at the next step. Refine selectors when the schema is finalised.
    await page.getByRole('button', { name: /Seguinte/i }).click();

    // ── Step 2: Location ─────────────────────────────────────────────────────
    // Selecting island + município auto-fills lat/lng via the `handleMunicipalityChange`
    // handler, so we avoid clicking the Leaflet map (which is brittle under Playwright).
    await page.getByLabel('Ilha *').selectOption('Terceira');
    await page.getByLabel('Município *').selectOption({ index: 1 });
    await page.getByRole('button', { name: /Seguinte/i }).click();

    // ── Step 3: Photos ───────────────────────────────────────────────────────
    // Skip — the wizard allows zero photos.
    await page.getByRole('button', { name: /Seguinte/i }).click();

    // ── Step 4: Review + Publish ─────────────────────────────────────────────
    await expect(page.getByText(title)).toBeVisible();
    await page.getByRole('button', { name: /Publicar Pedido/i }).click();

    // The wizard navigates to /requests/:id once the create+publish chain succeeds.
    await expect(page).toHaveURL(/\/requests\/\d+$/, { timeout: 20_000 });

    // Header on the detail page renders the title and a status badge — published
    // requests show "Publicado" (no proposals yet).
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(/Publicado/i).first()).toBeVisible();
  });
});
