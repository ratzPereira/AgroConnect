const { chromium } = require('@playwright/test');
const fs = require('fs');

const APP = 'http://localhost:13000';
const BACKEND = 'http://localhost:18080';
const OUTDIR = 'C:\\Users\\João Pereira\\Desktop\\screenshots relatorio final';
const CREDS = {
  client: { email: 'joao.silva@email.com', password: 'password123' },
  provider: { email: 'agroservicos@email.com', password: 'password123' },
};
const results = [];
const ok = (n) => { results.push('OK   ' + n); console.log('OK   ' + n); };
const fail = (n, e) => { results.push('FAIL ' + n + ' :: ' + (e && e.message ? e.message : e)); console.log('FAIL ' + n + ' :: ' + (e && e.message ? e.message : e)); };

async function apiProxy(context) {
  await context.route('**/api/v1/**', async (route) => {
    try {
      const req = route.request(); const u = new URL(req.url());
      const headers = { ...req.headers() }; delete headers['origin']; delete headers['referer'];
      const resp = await route.fetch({ url: BACKEND + u.pathname + u.search, headers });
      await route.fulfill({ response: resp });
    } catch (e) { await route.abort(); }
  });
}
const settle = async (page, ms = 1600) => { try { await page.waitForLoadState('networkidle', { timeout: 9000 }); } catch {} await page.waitForTimeout(ms); };
const shoot = async (page, name, full = false) => { await page.screenshot({ path: OUTDIR + '\\' + name + '.png', fullPage: full }); ok(name); };
async function dismissCookies(page) {
  try { const b = page.getByRole('button', { name: /^Aceitar$/ }); await b.click({ timeout: 2500 }); await page.waitForTimeout(400); } catch {}
}
async function nav(page, route, ms) { await page.goto(APP + route, { waitUntil: 'domcontentloaded' }); await settle(page, ms); }
async function loginPage(context, persona) {
  const c = CREDS[persona]; const page = await context.newPage();
  for (let a = 1; a <= 4; a++) {
    await page.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700); await dismissCookies(page);
    await page.fill('#email', c.email); await page.fill('#password', c.password);
    await page.click('button:has-text("Entrar")');
    try { await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 12000 }); await settle(page, 1200); return page; }
    catch (e) {
      const body = await page.evaluate(() => document.body.innerText).catch(() => '');
      if (/muitas tentativas|demasiad|429|tente novamente/i.test(body)) { console.log(`  ${persona} rate-limited, wait 65s`); await page.waitForTimeout(65000); continue; }
      throw new Error('no redirect: ' + body.slice(0, 100));
    }
  }
  throw new Error('login failed');
}

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  console.log('cooldown 60s...');
  const browser = await chromium.launch();
  await browser.newContext().then((c) => c.newPage()).then((p) => p.waitForTimeout(60000));

  // PUBLIC (no auth) - dismiss cookies for clean shots
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await apiProxy(ctx);
    const page = await ctx.newPage();
    await nav(page, '/login', 800); await dismissCookies(page); await shoot(page, 'P233-login');
    await nav(page, '/register', 800); await shoot(page, 'P234-registo');
    await nav(page, '/landing', 1200); await shoot(page, 'P222-landing');
    await ctx.close();
  } catch (e) { fail('public', e); }

  // CLIENT
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await apiProxy(ctx);
    const page = await loginPage(ctx, 'client');
    await dismissCookies(page);
    try { await nav(page, '/dashboard'); await shoot(page, 'P222-dashboard'); } catch (e) { fail('P222-dashboard', e); }
    try { await nav(page, '/marketplace'); await shoot(page, 'P271-marketplace-lista'); } catch (e) { fail('P271-marketplace-lista', e); }
    try {
      const tok = await page.evaluate(() => localStorage.getItem('accessToken'));
      const r = await ctx.request.get(BACKEND + '/api/v1/listings?page=0&size=1', { headers: { Authorization: 'Bearer ' + tok } });
      const j = await r.json(); const id = (j.content && j.content[0] && j.content[0].id) || 4;
      await nav(page, '/marketplace/' + id, 2000); await shoot(page, 'P272-marketplace-detalhe');
    } catch (e) { fail('P272-marketplace-detalhe', e); }
    try { await nav(page, '/requests/new', 1400); await shoot(page, 'P239-wizard-categoria'); } catch (e) { fail('P239-wizard-categoria', e); }
    try {
      const card = page.locator('[class*="cursor-pointer"]').first();
      await card.click({ timeout: 3000 });
      await page.waitForTimeout(600);
      const next = page.locator('button:has-text("Continuar"), button:has-text("Seguinte")').first();
      await next.click({ timeout: 3000 });
      await settle(page, 1200);
      await shoot(page, 'P240-wizard-passo2-formulario');
    } catch (e) { fail('P240-wizard-passo2', e); }
    await ctx.close();
  } catch (e) { fail('client-context', e); }

  // PROVIDER
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await apiProxy(ctx);
    const page = await loginPage(ctx, 'provider');
    await dismissCookies(page);
    try { await nav(page, '/provider/inventory'); await shoot(page, 'P289-inventario'); } catch (e) { fail('P289-inventario', e); }
    try {
      const tok = await page.evaluate(() => localStorage.getItem('accessToken'));
      const r = await ctx.request.get(BACKEND + '/api/v1/providers/me/inventory', { headers: { Authorization: 'Bearer ' + tok } });
      const j = await r.json(); const arr = Array.isArray(j) ? j : (j.content || []);
      if (arr[0]) { await nav(page, '/provider/inventory/' + arr[0].id, 1800); await shoot(page, 'P289b-inventario-detalhe-timeline'); }
      else fail('P289b-inventario-detalhe', 'no items');
    } catch (e) { fail('P289b-inventario-detalhe', e); }
    try {
      await nav(page, '/provider/calendar', 2000);
      await shoot(page, 'P292-calendario-dia');
      // try Mês (month) view for a populated overview
      try { await page.getByRole('button', { name: /^M.s$/ }).click({ timeout: 2500 }); await page.waitForTimeout(1800); await shoot(page, 'P292-calendario-mes'); } catch (e) { fail('P292-calendario-mes', e); }
    } catch (e) { fail('P292-calendario', e); }
    try { await nav(page, '/provider/finance', 2000); await shoot(page, 'P297-financeiro'); } catch (e) { fail('P297-financeiro', e); }
    await ctx.close();
  } catch (e) { fail('provider-context', e); }

  await browser.close();
  console.log('\n===== RESULTS =====');
  for (const r of results) console.log(r);
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
