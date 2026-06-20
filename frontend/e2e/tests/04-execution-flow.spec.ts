import { test, expect } from '@playwright/test';

// Execution flow — runs as provider (storage state from `execution` project).
// Seed data has at least one IN_PROGRESS execution for agroservicos@email.com
// where the provider can perform check-in, upload photos, and mark complete.

test.describe('Execution — provider check-in + photo + mark complete', () => {
  test('provider navigates to an in-progress execution and the ExecutionPanel renders', async ({ page }) => {
    await page.goto('/requests');

    // Provider lands on "Pedidos Disponíveis" — switch to a request the provider
    // is actively working on. The easiest stable selector is to navigate via the
    // provider dashboard's active jobs list (rendered on /dashboard).
    await page.goto('/dashboard');

    // ProviderJobsList renders cards/links to /requests/:id for awarded jobs.
    // Click the first link that points to a request detail page.
    const jobLink = page.locator('a[href^="/requests/"]').first();
    await expect(jobLink).toBeVisible({ timeout: 15_000 });
    await jobLink.click();

    await expect(page).toHaveURL(/\/requests\/\d+$/);

    // The ExecutionPanel section header is "Execução do Serviço" — its presence
    // confirms the request is in an execution-eligible state.
    await expect(page.getByRole('heading', { name: /Execução do Serviço/i })).toBeVisible({
      timeout: 15_000,
    });

    // The full check-in + photo upload + complete sequence depends on:
    //   1. Knowing the request is in AWARDED/IN_PROGRESS (not already checked-in)
    //   2. The provider having an assignment for the request
    //   3. The MinIO presigned-PUT for execution photos resolving correctly under
    //      Playwright (it uses axios.put, not the page fetch — works in browser but
    //      requires MinIO reachable from the dev-server context).
    //
    // Each of these needs codegen verification with the e2e backend running.
    // The placeholder below tracks the work; the navigation + visual assertion
    // above already gives us the smoke-test coverage of the page rendering.
    test.fixme(
      true,
      'Full check-in + setInputFiles photo upload + mark-complete sequence needs codegen verification against docker-compose.e2e.yml — see PR4.D follow-up.',
    );
  });
});
