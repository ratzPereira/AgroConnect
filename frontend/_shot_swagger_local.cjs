const { chromium } = require('@playwright/test');
const URL = 'http://localhost:18080/api/swagger-ui/index.html';
const OUT = 'C:\\Users\\João Pereira\\Desktop\\screenshots relatorio final\\P572-swagger.png';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  try { await page.waitForSelector('.swagger-ui .opblock-tag, .swagger-ui .info .title', { timeout: 20000 }); } catch {}
  await page.waitForTimeout(3000);
  const hasUI = await page.locator('.swagger-ui').count();
  const tags = await page.locator('.opblock-tag').count();
  // viewport-only screenshot (API header + controller tag list) — not the whole expanded page
  await page.screenshot({ path: OUT, fullPage: false });
  console.log('swagger-ui nodes:', hasUI, '| tags:', tags);
  console.log('SAVED', OUT);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
