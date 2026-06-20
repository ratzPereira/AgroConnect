import { test, expect } from '@playwright/test';

// Provider backoffice — runs as provider (storage state from `backoffice` project).
// Creates a new inventory item with an INITIAL stock movement, then records a
// PURCHASE movement and asserts WAC (weighted average cost) is non-negative.

test.describe('Provider backoffice — inventory item lifecycle', () => {
  test('provider can add an inventory item, record a purchase, and see updated WAC', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const productName = `E2E Adubo ${uniqueSuffix}`;
    const initialQuantity = 50;
    const initialCost = 1.25;
    const purchaseQuantity = 25;
    const purchaseUnitCost = 1.80;

    await page.goto('/provider/inventory');

    // The Inventory page has a "Adicionar" button in the header (size="sm").
    await page.getByRole('button', { name: /^Adicionar$/i }).first().click();

    // The inline form uses uncontrolled inputs with `name=...` (no <label>),
    // so we target by placeholder text.
    await page.getByPlaceholder('Nome do produto').fill(productName);
    await page.getByPlaceholder('Quantidade inicial').fill(String(initialQuantity));
    await page.getByPlaceholder('Custo inicial/unidade (€)').fill(String(initialCost));

    // The unit <select> defaults to KG — leave it.
    await page.getByRole('button', { name: /^Guardar$/i }).click();

    // After creation the list re-renders with the new item; click its row to
    // open the detail page where we can record a purchase movement.
    const itemRow = page.getByRole('row', { name: new RegExp(productName, 'i') });
    await expect(itemRow).toBeVisible({ timeout: 15_000 });
    await itemRow.click();

    await expect(page).toHaveURL(/\/provider\/inventory\/\d+$/);
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();

    // Open the "Registar compra" modal.
    await page.getByRole('button', { name: /Registar compra/i }).first().click();
    await expect(page.getByRole('heading', { name: /Registar compra/i })).toBeVisible();

    // Fill the purchase form. Labels are rendered via the FormField helper, so
    // we match by accessible name (label includes the unit suffix).
    await page.getByLabel(/Quantidade \(kg\)/i).fill(String(purchaseQuantity));
    await page.getByLabel(/Custo unitário pago/i).fill(String(purchaseUnitCost));

    // The submit button inside the modal also reads "Registar compra".
    await page.getByRole('button', { name: /^Registar compra$/i }).last().click();

    // Modal closes on success; the movement appears at the top of the history
    // table with a Compra badge. WAC should be a positive Euro amount, never
    // negative — assert the stat card shows a "€X" value (not "—").
    await expect(page.getByText(/Compra/i).first()).toBeVisible({ timeout: 10_000 });

    // The "Custo médio" StatCard renders an "€" prefix when WAC is known.
    const wacCard = page.getByText(/Custo médio/i).locator('..');
    await expect(wacCard).toContainText(/€\d/);
  });
});
