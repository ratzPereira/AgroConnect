const { chromium } = require('@playwright/test');
const fs = require('fs');

const APP = 'http://localhost:13000';
const BACKEND = 'http://localhost:18080';
const GRAFANA = 'http://localhost:13001';
const SWAGGER = 'http://localhost:18080/swagger-ui/index.html';
const OUTDIR = 'C:\\Users\\João Pereira\\Desktop\\screenshots relatorio final';

const CREDS = {
  client: { email: 'joao.silva@email.com', password: 'password123' },
  provider: { email: 'agroservicos@email.com', password: 'password123' },
  admin: { email: 'admin@agroconnect.pt', password: 'password123' },
};

const results = [];
function ok(n) { results.push('OK   ' + n); console.log('OK   ' + n); }
function fail(n, e) { results.push('FAIL ' + n + ' :: ' + (e && e.message ? e.message : e)); console.log('FAIL ' + n + ' :: ' + (e && e.message ? e.message : e)); }

async function apiProxy(context) {
  // Route all frontend /api/v1 calls to the backend (nginx is down). Server-side fetch => no CORS.
  await context.route('**/api/v1/**', async (route) => {
    try {
      const u = new URL(route.request().url());
      const target = BACKEND + u.pathname + u.search;
      const resp = await route.fetch({ url: target });
      await route.fulfill({ response: resp });
    } catch (e) {
      await route.abort();
    }
  });
}

async function shoot(page, name, { full = false } = {}) {
  const path = OUTDIR + '\\' + name + '.png';
  await page.screenshot({ path, fullPage: full });
  ok(name);
}

async function settle(page, ms = 1800) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
  await page.waitForTimeout(ms);
}

async function newContext(browser, persona) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await apiProxy(context);
  if (persona) {
    const page = await context.newPage();
    const c = CREDS[persona];
    await page.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', c.email);
    await page.fill('#password', c.password);
    await Promise.all([
      page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {}),
      page.click('button:has-text("Entrar")'),
    ]);
    await settle(page, 1500);
    await page.close();
  }
  return context;
}

async function go(context, route) {
  const page = await context.newPage();
  await page.goto(APP + route, { waitUntil: 'domcontentloaded' });
  await settle(page);
  return page;
}

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const browser = await chromium.launch();

  // ---------- PUBLIC ----------
  try {
    const ctx = await newContext(browser, null);
    let p = await go(ctx, '/login'); await shoot(p, 'P233-login'); await p.close();
    p = await go(ctx, '/register'); await shoot(p, 'P234-registo'); await p.close();
    p = await go(ctx, '/landing'); await shoot(p, 'P222-landing'); await p.close();
    await ctx.close();
  } catch (e) { fail('public-context', e); }

  // ---------- CLIENT ----------
  try {
    const ctx = await newContext(browser, 'client');
    try { const p = await go(ctx, '/dashboard'); await shoot(p, 'P222-dashboard'); await p.close(); } catch (e) { fail('P222-dashboard', e); }
    try { const p = await go(ctx, '/marketplace'); await shoot(p, 'P271-marketplace-lista'); await p.close(); } catch (e) { fail('P271-marketplace-lista', e); }
    // marketplace detail (first card)
    try {
      const p = await go(ctx, '/marketplace');
      const card = p.locator('a[href^="/marketplace/"]').first();
      await card.click({ timeout: 6000 });
      await settle(p);
      await shoot(p, 'P272-marketplace-detalhe');
      await p.close();
    } catch (e) { fail('P272-marketplace-detalhe', e); }
    // request detail with proposals (first request)
    try {
      const p = await go(ctx, '/requests');
      await shoot(p, 'P246b-pedidos-lista');
      const row = p.locator('a[href^="/requests/"]').first();
      await row.click({ timeout: 6000 });
      await settle(p);
      await shoot(p, 'P246-propostas');
      await p.close();
    } catch (e) { fail('P246-propostas', e); }
    // wizard
    try {
      const p = await go(ctx, '/requests/new');
      await shoot(p, 'P239-wizard-categoria');
      // try to advance: click first category card then a next button
      try {
        const cat = p.locator('button, [role="button"], .cursor-pointer').filter({ hasText: /solo|lavoura|poda|plant|colheit|pulveriz|jardin|transp/i }).first();
        await cat.click({ timeout: 4000 });
        await p.waitForTimeout(800);
        const next = p.getByRole('button', { name: /seguinte|continuar|pr.ximo|avan/i }).first();
        await next.click({ timeout: 4000 });
        await settle(p, 1200);
        await shoot(p, 'P240-wizard-formulario');
        const next2 = p.getByRole('button', { name: /seguinte|continuar|pr.ximo|avan/i }).first();
        await next2.click({ timeout: 4000 });
        await settle(p, 1500);
        await shoot(p, 'P241-wizard-mapa');
      } catch (e) { fail('P240/P241-wizard-steps', e); }
      await p.close();
    } catch (e) { fail('P239-wizard-categoria', e); }
    await ctx.close();
  } catch (e) { fail('client-context', e); }

  // ---------- PROVIDER ----------
  try {
    const ctx = await newContext(browser, 'provider');
    try { const p = await go(ctx, '/provider/inventory'); await shoot(p, 'P289-inventario'); await p.close(); } catch (e) { fail('P289-inventario', e); }
    try {
      const p = await go(ctx, '/provider/inventory');
      const row = p.locator('a[href^="/provider/inventory/"]').first();
      await row.click({ timeout: 6000 });
      await settle(p);
      await shoot(p, 'P289b-inventario-detalhe-timeline');
      await p.close();
    } catch (e) { fail('P289b-inventario-detalhe', e); }
    try { const p = await go(ctx, '/provider/calendar'); await shoot(p, 'P292-calendario-gantt'); await p.close(); } catch (e) { fail('P292-calendario-gantt', e); }
    try { const p = await go(ctx, '/provider/finance'); await shoot(p, 'P297-financeiro'); await p.close(); } catch (e) { fail('P297-financeiro', e); }
    await ctx.close();
  } catch (e) { fail('provider-context', e); }

  // ---------- ADMIN ----------
  try {
    const ctx = await newContext(browser, 'admin');
    try { const p = await go(ctx, '/admin/dashboard'); await shoot(p, 'P302-admin-dashboard'); await p.close(); } catch (e) { fail('P302-admin-dashboard', e); }
    try { const p = await go(ctx, '/admin/users'); await shoot(p, 'P303-admin-utilizadores'); await p.close(); } catch (e) { fail('P303-admin-utilizadores', e); }
    await ctx.close();
  } catch (e) { fail('admin-context', e); }

  // ---------- SWAGGER ----------
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(SWAGGER, { waitUntil: 'domcontentloaded' });
    await settle(p, 2500);
    await shoot(p, 'P572-swagger', { full: true });
    await p.close(); await ctx.close();
  } catch (e) { fail('P572-swagger', e); }

  // ---------- GRAFANA ----------
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(GRAFANA + '/login', { waitUntil: 'domcontentloaded' });
    await settle(p, 1200);
    try {
      await p.fill('input[name="user"]', 'admin');
      await p.fill('input[name="password"]', 'admin');
      await p.click('button[type="submit"]');
      await p.waitForTimeout(2500);
      // skip "change password" screen if present
      try { await p.getByRole('button', { name: /skip|ignorar/i }).click({ timeout: 2500 }); } catch {}
    } catch (e) { /* maybe already logged in */ }
    for (const [uid, name] of [['agroconnect-system', 'P428-grafana-system'], ['agroconnect-business', 'P429-grafana-business']]) {
      try {
        await p.goto(GRAFANA + '/d/' + uid + '?kiosk&from=now-24h&to=now', { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(3500);
        await shoot(p, name);
      } catch (e) { fail(name, e); }
    }
    await p.close(); await ctx.close();
  } catch (e) { fail('grafana', e); }

  // ---------- JACOCO (into folder) ----------
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto('file:///C:/AgroConnect/backend/target/site/jacoco-merged/index.html', { waitUntil: 'load' });
    await shoot(p, 'P374-jacoco-merged', { full: true });
    await p.close(); await ctx.close();
  } catch (e) { fail('P374-jacoco', e); }

  await browser.close();
  console.log('\n===== RESULTS =====');
  for (const r of results) console.log(r);
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
