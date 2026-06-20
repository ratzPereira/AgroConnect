const { chromium } = require('@playwright/test');
const URL = 'https://agroconnect.pt/swagger-ui.html';
const OUT = 'C:\\Users\\João Pereira\\Desktop\\screenshots relatorio final\\P572-swagger.png';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // wait for swagger-ui to render the operations
  try { await page.waitForSelector('.swagger-ui .opblock-tag, .swagger-ui .info', { timeout: 20000 }); } catch {}
  await page.waitForTimeout(3500);
  const title = await page.title();
  const hasUI = await page.locator('.swagger-ui').count();
  await page.screenshot({ path: OUT, fullPage: true });
  console.log('title:', title, '| swagger-ui nodes:', hasUI);
  console.log('SAVED', OUT);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
