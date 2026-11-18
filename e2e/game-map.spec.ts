import { test, expect } from '@playwright/test';

const root = '/magic-english-buddy/';

async function start(page: import('@playwright/test').Page) {
  await page.goto(root);
  await page.getByRole('button', { name: '直接开始，一起学英语' }).click();
  await expect(page.getByRole('heading', { name: '云端梦幻宫殿', exact: true })).toBeVisible();
}

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
  await page.getByRole('button', { name: 'LEVEL 1 云端梦幻宫殿', exact: true }).click();
  await expect(page.getByTestId('map-node-l1_001')).toHaveAccessibleName(
    '魔法苹果，已完成，可重温'
  );
  await page.getByRole('button', { name: '进入下一个世界' }).click();
  await expect(page.getByRole('heading', { name: '回声山谷', exact: true })).toBeVisible();
});
