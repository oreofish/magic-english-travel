import { test, expect } from '@playwright/test';

const root = '/magic-english-buddy/';

test('shimmering sea uses underwater bubble stops and preserves locked previews', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  await page.getByRole('button', { name: '查看总地图' }).click();
  await page.getByRole('button', { name: 'LEVEL 3 闪耀之海，未解锁，可预览' }).click();
  const art = page.locator('#adventure-map img');
  await expect(art).toHaveAttribute('src', /desktop-shimmering-sea\.webp$/);
  await expect
    .poll(() => art.evaluate(el => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const stops = page.getByRole('list', { name: '故事关卡' }).getByRole('button');
  await expect(stops).toHaveCount(15);
  for (const stop of await stops.all()) {
    await expect(stop).toBeInViewport();
    const bounds = await stop.boundingBox();
    expect(bounds!.y).toBeGreaterThan(900 * 0.3);
  }
  await page.screenshot({ path: 'docs/ux-evidence/shimmering-sea-desktop.png', scale: 'css' });
  await page.getByTestId('map-node-l3_001').click();
  await expect(page.getByRole('dialog')).toContainText('先完成');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 780 });
  await expect(page.getByRole('heading', { name: '闪耀之海', exact: true })).toBeVisible();
  await expect(page.locator('#adventure-map img')).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(art).toHaveAttribute('src', /desktop-shimmering-sea\.webp$/);
});

async function start(page: import('@playwright/test').Page) {
  await page.goto(root);
  await page.getByRole('button', { name: '直接开始，一起学英语' }).click();
  await expect(page.getByRole('heading', { name: '萌芽之森', exact: true })).toBeVisible();
}

test('forest artwork stays on desktop and palace artwork belongs to mobile level four', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await start(page);
  const mapPage = page.getByTestId('map-page');
  const sceneBackground = () =>
    mapPage.evaluate(el => getComputedStyle(el, '::before').backgroundImage);
  expect(await sceneBackground()).not.toContain('cloud-palace.webp');
  await expect(page.getByTestId('map-node-l1_001')).toBeInViewport();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('#adventure-map img')).toHaveAttribute(
    'src',
    /desktop-sprout-forest-v2\.webp$/
  );
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByRole('button', { name: '查看总地图' }).click();
  await page.getByRole('button', { name: 'LEVEL 4 云端之城，未解锁，可预览' }).click();
  await expect(page.getByRole('heading', { name: '云端之城', exact: true })).toBeVisible();
  await expect.poll(sceneBackground).toContain('cloud-palace.webp');
});

test('portrait map starts at the hero, previews locked stories and opens all four entries', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await start(page);
  const mapBounds = await page.locator('#adventure-map').boundingBox();
  expect(mapBounds).toMatchObject({ x: 0, y: 0, width: 320, height: 740 });
  const avatar = await page.getByRole('link', { name: '成长记录', exact: true }).boundingBox();
  const worldEntry = await page.getByRole('button', { name: '查看总地图' }).boundingBox();
  const settings = await page.getByRole('link', { name: '设置', exact: true }).boundingBox();
  expect(worldEntry!.y).toBeGreaterThan(avatar!.y + avatar!.height);
  expect(settings!.x).toBeGreaterThan(worldEntry!.x + worldEntry!.width);
  await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(0);
  await expect(page.getByTestId('map-node-l1_001')).toBeInViewport();
  await expect(page.getByRole('button', { name: '开始第一个故事' })).toBeInViewport();
  const first = await page.getByTestId('map-node-l1_001').boundingBox();
  const second = await page.getByTestId('map-node-l1_002').boundingBox();
  expect(first!.y).toBeGreaterThan(second!.y);
  await expect(page.getByLabel('积分 0 魔力')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId('map-node-l1_002').click();
  await expect(page.getByRole('dialog')).toContainText('先完成「魔法苹果」');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '查看总地图' }).click();
  await expect(page.getByRole('list', { name: '七个世界' }).getByRole('listitem')).toHaveCount(7);
  await page.getByRole('button', { name: 'LEVEL 3 闪耀之海，未解锁，可预览' }).click();
  await expect(page.getByRole('heading', { name: '闪耀之海', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始第一个故事' })).toHaveCount(0);
  await page.getByRole('button', { name: '回到我的冒险' }).click();
  await expect(page.getByTestId('map-node-l1_001')).toBeInViewport();
  await page.getByRole('link', { name: '成长记录', exact: true }).click();
  await expect(page).toHaveURL(/scroll$/);
  await page.getByRole('link', { name: '魔法地图', exact: true }).click();
  await page.getByRole('link', { name: '设置', exact: true }).click();
  await expect(page).toHaveURL(/settings$/);
});

test('finishing a world places the hero in the next world and preserves completed stories', async ({
  page,
}) => {
  await start(page);
  // Fixture represents a saved profile that has passed all L1 stories.
  await page.evaluate(async () => {
    const request = indexedDB.open('MagicEnglishBuddy');
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(['mapNodes', 'userProgress'], 'readwrite');
        const nodeRequest = tx.objectStore('mapNodes').getAll();
        nodeRequest.onsuccess = () => {
          const completed = nodeRequest.result
            .filter(node => node.storyId?.startsWith('l1_'))
            .map(node => node.id);
          const progressRequest = tx.objectStore('userProgress').getAll();
          progressRequest.onsuccess = () => {
            for (const progress of progressRequest.result)
              tx.objectStore('userProgress').put({
                ...progress,
                completedNodes: completed,
                unlockedNodes: completed,
              });
          };
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      database.close();
    }
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: '回声山谷', exact: true })).toBeVisible();
  await expect(page.getByTestId('map-node-l2_001')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('map-node-l2_001')).toBeInViewport();
  await page.getByRole('button', { name: '查看总地图' }).click();
  await page.getByRole('button', { name: 'LEVEL 1 萌芽之森', exact: true }).click();
  await expect(page.getByTestId('map-node-l1_001')).toHaveAccessibleName(
    '魔法苹果，已完成，可重温'
  );
  await page.getByRole('button', { name: '进入下一个世界' }).click();
  await expect(page.getByRole('heading', { name: '回声山谷', exact: true })).toBeVisible();
});

test('desktop forest supports discovery, locked previews and responsive atlas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  await expect(page.getByTestId('forest-journey')).toBeVisible();
  await expect(page.getByTestId('forest-avatar')).toBeVisible();
  await page.getByRole('button', { name: '探索草地里的兔子，听英语' }).click();
  await expect(page.getByRole('status')).toContainText('Rabbit');
  await page.getByRole('button', { name: '暂停环境动态' }).click();
  await expect(page.getByTestId('forest-journey')).toHaveAttribute('data-paused', 'true');
  await page.getByTestId('map-node-l1_002').click();
  await expect(page.getByRole('dialog')).toContainText('先完成「魔法苹果」');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '定位当前关卡' }).click();
  await expect(page.getByTestId('map-node-l1_001')).toBeFocused();
  await page.screenshot({ path: 'docs/ux-evidence/forest-journey-desktop.png', scale: 'css' });
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(page.getByTestId('map-node-l1_001')).toBeInViewport();
  await expect(page.getByRole('button', { name: '探索林间小屋，听英语' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '查看总地图' }).click();
  await expect(page.getByRole('list', { name: '七个世界' }).getByRole('listitem')).toHaveCount(7);
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(
    page.getByRole('button', { name: 'LEVEL 1 萌芽之森', exact: true })
  ).toBeInViewport();
  await page.setViewportSize({ width: 360, height: 780 });
  await expect(
    page.getByRole('button', { name: 'LEVEL 1 萌芽之森', exact: true })
  ).toBeInViewport();
});

test('desktop forest celebrates real completion once and walks to replay', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  await page.getByRole('button', { name: '开始第一个故事' }).click();
  await page.getByRole('button', { name: /读完了，去练一练/ }).click();
  for (const answer of ['Red', 'Rabbit', 'Happy']) {
    await page.getByRole('button', { name: new RegExp(`^${answer}$`) }).click();
    await page.getByRole('button', { name: /继续/ }).click();
  }
  await page.getByRole('button', { name: /完成/ }).click();
  await expect(page.getByTestId('forest-reward')).toContainText('+19 魔力');
  await expect(page.getByTestId('map-node-l1_002')).toHaveAttribute('aria-current', 'step');
  await page.getByTestId('map-node-l1_001').click();
  await expect(page.getByRole('dialog')).toContainText('魔法苹果');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('forest-journey')).toBeVisible();
  await expect(page.getByTestId('forest-reward')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('map-node-l1_001').click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
