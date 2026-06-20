const { chromium } = require('@playwright/test');

const REPORT = 'file:///C:/AgroConnect/backend/target/site/jacoco-merged/index.html';
const OUT = 'C:\\Users\\João Pereira\\Desktop\\jacoco-merged.png';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 2,
  });
  await page.goto(REPORT, { waitUntil: 'load' });
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  console.log('SAVED ' + OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
