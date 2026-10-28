import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile-360x800', width: 360, height: 800 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'laptop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1920x1080', width: 1920, height: 1080 }
];

test.describe('Virtual Science Lab Visual & Offline Tests', () => {
  for (const vp of VIEWPORTS) {
    test(`captures multi-viewport views for ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Home View (Persian RTL, Dark Mode)
      await page.goto('/#/');
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `home-${vp.name}-fa-dark.png`)
      });

      // 2. Experiment View (Persian RTL, Dark Mode)
      await page.goto('/#/experiment/physics/motion/projectile');
      await page.waitForTimeout(1000);

      // Play simulation a bit to show trajectory
      const playBtn = page.locator('button.primary.tool-btn');
      if (await playBtn.isVisible()) {
        await playBtn.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `experiment-${vp.name}-fa-dark.png`)
      });

      // 3. Persian Light Mode
      await page.goto('/#/settings');
      await page.waitForTimeout(600);
      const lightBtn = page.locator('button:has-text("روشن")');
      if (await lightBtn.isVisible()) {
        await lightBtn.click();
        await page.waitForTimeout(400);
      }
      await page.goto('/#/experiment/physics/motion/projectile');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `experiment-${vp.name}-fa-light.png`)
      });

      // 4. English LTR Dark Mode
      await page.goto('/#/settings');
      await page.waitForTimeout(600);
      const darkBtn = page.locator('button:has-text("تاریک")');
      if (await darkBtn.isVisible()) {
        await darkBtn.click();
        await page.waitForTimeout(300);
      }
      const enBtn = page.locator('button:has-text("English")');
      if (await enBtn.isVisible()) {
        await enBtn.click();
        await page.waitForTimeout(400);
      }
      await page.goto('/#/experiment/physics/motion/projectile');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `experiment-${vp.name}-en-dark.png`)
      });
    });
  }

  test('offline-first PWA test: service worker caching and offline simulation', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Initial load online
    await page.goto('/#/experiment/physics/motion/projectile');
    await page.waitForTimeout(2000);

    // Simulate Network Offline
    await context.setOffline(true);

    // Reload page offline
    await page.reload();
    await page.waitForTimeout(1500);

    const canvas = page.locator('canvas.simulation-canvas');
    await expect(canvas).toBeVisible();

    // Verify simulation runs offline
    const playBtn = page.locator('button.primary.tool-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await page.waitForTimeout(1200);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'offline-verification.png')
    });
  });
});
