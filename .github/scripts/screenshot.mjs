import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

// Apple TV native resolution
await page.setViewportSize({ width: 1920, height: 1080 });

try {
  await page.goto('http://localhost:4173', { waitUntil: 'load', timeout: 15000 });
  // Allow async rendering and any animations to settle
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/tvos-preview.png' });
  console.log('Screenshot saved: screenshots/tvos-preview.png');
} finally {
  await browser.close();
}
