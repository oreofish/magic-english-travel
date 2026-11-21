import { test, expect } from '@playwright/test';

test.use({
  // GPU readbacks from tracing distort software WebGL timings.
  trace: 'off',
  deviceScaleFactor: 1,
  launchOptions: {
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  },
});

async function start(page: import('@playwright/test').Page) {
  await page.goto('/magic-english-buddy/');
  await page.getByRole('button', { name: '直接开始，一起学英语' }).click();
  await expect(page.getByTestId('map-page')).toBeVisible();
}

test.describe('Three.js sea scenery', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Software WebGL configuration is Chromium-specific'
  );

  async function openSea(page: import('@playwright/test').Page) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await start(page);
    await page.bringToFront();
    await page.getByRole('button', { name: '查看总地图' }).click();
    await page.getByRole('button', { name: 'LEVEL 3 闪耀之海，未解锁，可预览' }).click();
  }
  test('renders, pauses, resizes and releases the scene without blocking lessons', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await openSea(page);
    const layer = page.getByTestId('ocean-3d');
    const canvas = layer.locator('canvas');
    await expect(layer).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    const density = await page.evaluate(() => Math.min(window.devicePixelRatio, 2));
    await expect(canvas).toHaveJSProperty('width', Math.floor(1440 * density));
    await expect(canvas).toHaveJSProperty('height', Math.floor(900 * density));
    await expect.poll(() => canvas.getAttribute('data-frames').then(Number)).toBeGreaterThan(2);
    const before = Number(await canvas.getAttribute('data-frames'));
    await expect
      .poll(() => layer.evaluate(el => Number(el.querySelector('canvas')?.dataset.frames ?? 0)), {
        timeout: 15_000,
      })
      .toBeGreaterThan(before);
    await expect(page.locator('#adventure-map')).toHaveAttribute('data-ocean-rendered', 'true');
    await expect(canvas).toHaveAttribute('data-story-bubbles', '15');
    await expect(canvas).toHaveAttribute('data-path-bubbles', '56');
    await expect(page.getByTestId('ocean-bubble-path')).toBeHidden();
    await expect(canvas).toHaveAttribute('data-fish-count', '36');
    const firstStory = page.getByTestId('map-node-l3_001');
    await expect(firstStory).toHaveCSS('background-image', 'none');
    await expect(firstStory).toHaveCSS('border-top-width', '0px');
    const anchor = await firstStory.boundingBox();
    await expect
      .poll(
        async () => {
          const next = await firstStory.boundingBox();
          return Math.hypot(next!.x - anchor!.x, next!.y - anchor!.y);
        },
        { timeout: 15_000 }
      )
      .toBeGreaterThan(0.05);
    const drift = await firstStory.boundingBox();
    expect(Math.hypot(drift!.x - anchor!.x, drift!.y - anchor!.y)).toBeLessThan(6);
    // Click the moving target as a user would, without waiting for animation to stop.
    await page.mouse.click(drift!.x + drift!.width / 2, drift!.y + drift!.height / 2);
    await expect(page.getByRole('dialog')).toContainText('先完成');
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await page.getByRole('button', { name: '暂停海洋动态' }).click();
    await expect(layer).toHaveAttribute('data-state', 'paused');
    await expect(canvas).toHaveCount(0);
    await expect(page.locator('#adventure-map')).not.toHaveAttribute('data-ocean-rendered', 'true');
    await expect(firstStory).not.toHaveCSS('background-image', 'none');
    await expect(firstStory).toHaveCSS('border-top-width', '0px');
    await expect(page.getByTestId('ocean-bubble-path')).toBeVisible();
    await page.getByTestId('map-node-l3_001').click();
    await expect(page.getByRole('dialog')).toContainText('先完成');
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await page.getByRole('button', { name: '开启海洋动态' }).click();
    // Resuming creates a new WebGL context, just like the initial render.
    await expect(layer).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(canvas).toHaveCount(1);
    await page.setViewportSize({ width: 1100, height: 740 });
    await expect
      .poll(() => canvas.evaluate(el => (el as HTMLCanvasElement).width))
      .toBe(Math.floor(1100 * density));
    await canvas.evaluate(el => {
      (el as HTMLCanvasElement)
        .getContext('webgl2')!
        .getExtension('WEBGL_lose_context')!
        .loseContext();
    });
    await expect(layer).toHaveAttribute('data-state', 'fallback');
    await expect(canvas).toHaveCount(0);
    await expect(page.getByTestId('map-node-l3_001')).toBeInViewport();
    await page.getByRole('button', { name: '查看总地图' }).click();
    await expect(layer).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test.describe('high density screens', () => {
    test.use({ deviceScaleFactor: 2 });
    test('keeps bubbles sharp at twice the CSS resolution', async ({ page }) => {
      test.setTimeout(90_000);
      await openSea(page);
      const layer = page.getByTestId('ocean-3d');
      const canvas = layer.locator('canvas');
      await expect(layer).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
      await expect(canvas).toHaveJSProperty('width', 2880);
      await expect(canvas).toHaveJSProperty('height', 1800);
      await expect(canvas).toHaveAttribute('data-fish-count', '36');
      await expect.poll(() => canvas.getAttribute('data-frames').then(Number)).toBeGreaterThan(2);
      await page.screenshot({ path: 'docs/ux-evidence/shimmering-sea-three.png', scale: 'css' });
      await page.screenshot({
        path: 'docs/ux-evidence/shimmering-sea-bubbles-detail.png',
        clip: { x: 250, y: 520, width: 450, height: 160 },
        scale: 'device',
      });
    });
  });

  test('reduced motion avoids loading the renderer and static fallback handles unavailable WebGL', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const rendererRequests: string[] = [];
    page.on('request', request => {
      if (/createOceanScene/.test(request.url())) rendererRequests.push(request.url());
    });
    await openSea(page);
    await expect(page.getByTestId('ocean-3d')).toHaveAttribute('data-state', 'reduced');
    await expect(page.getByRole('button', { name: '已减少动态效果' })).toBeDisabled();
    await expect(page.locator('#adventure-map canvas')).toHaveCount(0);
    expect(rendererRequests).toEqual([]);
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
        return type.startsWith('webgl') ? null : Reflect.apply(original, this, [type, ...args]);
      } as typeof original;
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.getByRole('button', { name: '查看总地图' }).click();
    await page.getByRole('button', { name: 'LEVEL 3 闪耀之海，未解锁，可预览' }).click();
    await expect(page.getByTestId('ocean-3d')).toHaveAttribute('data-state', 'fallback');
    await expect(page.getByTestId('map-node-l3_001')).toHaveCSS('border-top-width', '0px');
    await expect(page.getByTestId('ocean-bubble-path')).toBeVisible();
    await expect(page.locator('#adventure-map img')).toHaveAttribute(
      'src',
      /desktop-shimmering-sea-clean\.webp$/
    );
    await page.getByTestId('map-node-l3_001').click();
    await expect(page.getByRole('dialog')).toContainText('先完成');
  });
});
