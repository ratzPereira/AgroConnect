import { test, expect } from '@playwright/test';

// Payment flow — runs as cliente (storage state from `payment` project).
// V1004__demo_proposals_for_defesa.sql seeds at least one request in
// WITH_PROPOSALS state for joao.silva that has a PENDING proposal we can accept.

test.describe('Payment — proposal acceptance + PaymentModal opens', () => {
  test('client can accept a proposal and the Stripe PaymentModal renders', async ({ page }) => {
    await page.goto('/requests');

    // Pick the first "Com Propostas" tab to narrow the list to acceptable requests.
    await page.getByRole('button', { name: /Com Propostas/i }).click();

    // Open the first request card. RequestCard wraps its content in a link to
    // /requests/:id — we click whatever link/element lands inside the card.
    const firstRequestLink = page.locator('a[href^="/requests/"]').first();
    await expect(firstRequestLink).toBeVisible({ timeout: 15_000 });
    await firstRequestLink.click();

    await expect(page).toHaveURL(/\/requests\/\d+$/);

    // The proposal accept button is rendered by ProposalCard with text
    // "Aceitar proposta" (only shown to the request owner on PENDING proposals).
    const acceptButton = page.getByRole('button', { name: /Aceitar proposta/i }).first();
    await expect(acceptButton).toBeVisible({ timeout: 15_000 });
    await acceptButton.click();

    // Accept triggers POST /proposals/:id/accept which returns a clientSecret +
    // publishableKey; PaymentModal then mounts Stripe Elements. The modal has
    // title "Confirmar pagamento" (rendered as an <h2>).
    await expect(page.getByRole('heading', { name: /Confirmar pagamento/i })).toBeVisible({
      timeout: 20_000,
    });

    // PaymentForm renders "Pagamento seguro" inside the modal — this confirms
    // the Elements wrapper mounted and the inner form is visible.
    await expect(page.getByText(/Pagamento seguro/i)).toBeVisible();

    // Stripe Elements (PaymentElement) lives inside a cross-origin iframe
    // (`https://js.stripe.com/...`) that is fully controlled by Stripe.js.
    // Filling card details requires `page.frameLocator()` and works erratically
    // because Stripe re-mounts iframes on every redirect and rejects automated
    // input under test mode without a publishable test key dance. Mocking via
    // WireMock with a stripe-mock container is the cleanest path forward.
    //
    // For now we stop at "modal opened" so the rest of the flow stays green.
    test.fixme(
      true,
      'Stripe Elements iframe interaction requires WireMock stripe-mock stub — out of scope for PR4.C, deferred to follow-up.',
    );
  });
});
