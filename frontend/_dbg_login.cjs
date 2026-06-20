const { chromium } = require('@playwright/test');
const APP = 'http://localhost:13000';
const BACKEND = 'http://localhost:18080';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/**', async (route) => {
    const u = new URL(route.request().url());
    try {
      const resp = await route.fetch({ url: BACKEND + u.pathname + u.search });
      console.log('PROXY', route.request().method(), u.pathname, '->', resp.status());
      await route.fulfill({ response: resp });
    } catch (e) { console.log('PROXY-ERR', u.pathname, e.message); await route.abort(); }
  });
  const page = await ctx.newPage();
  page.on('console', (m) => console.log('PAGE:', m.type(), m.text()));
  page.on('response', (r) => { if (r.url().includes('/auth/')) console.log('RESP', r.status(), r.url()); });

  await page.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('#email', 'joao.silva@email.com');
  await page.fill('#password', 'password123');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(4000);
  console.log('URL after login:', page.url());
  const tok = await page.evaluate(() => localStorage.getItem('accessToken'));
  console.log('accessToken present:', tok ? ('yes len=' + tok.length) : 'NO');
  // visible error text?
  const body = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log('BODY:', body.replace(/\n+/g, ' | '));
  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
