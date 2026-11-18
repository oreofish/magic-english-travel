# 手机纵向冒险地图

首页采用独立全屏地图，顶部提供总地图、成长头像、魔力积分和设置入口。故事节点从下往上排列；进入地图时定位当前未完成关卡，使用现有档案数据和通关解锁规则。一个世界完成后，当前冒险进入下一个世界。已完成故事可重温，未解锁故事可查看前置条件。

总地图采用同样的纵向路径，每个节点代表一个 Level。所有世界都可预览，预览不会解锁课程。L2–L7 暂用主题色、图标和简化云层，后续替换插画即可。其他页面的手机导航移至顶部，首页不使用原来的底部导航。

## 第一世界美术

视觉名：云端梦幻宫殿。保留所有原有故事 ID、顺序、成绩和奖励。

素材：`public/images/maps/cloud-palace.webp`（1024 × 1536）。采用内置 Imagegen 生成，再转换 WebP；同一素材通过 CSS 取景用于伙伴头像与当前位置标记。背景独立于滚动路径，避免长地图重复拼接的接缝。素材被生产 Service Worker 预缓存。

生成提示词：

> Use case: illustration-story. Create a production game background illustration, portrait 2:3 aspect ratio, for a mobile vertical scrolling children's English adventure map. Dreamy western fairytale palace in the clouds, soft blush pink, lilac, warm cream and luminous sky blue, exquisite hand painted children's storybook game art, charming rounded shapes, richly detailed but serene. A magnificent pink-roof ivory castle with gold spires on floating clouds in the upper center distance, smaller floating gardens and cloud islands along left and right edges, rainbow arches, hanging flowers, tiny friendly ORIGINAL pastel winged ponies, white rabbits, squirrels and songbirds gathered on the side islands. Bottom foreground fluffy cloud meadow with flowers and a cute lavender pony and bunny. Clear airy center channel for interactive game nodes to be overlaid in code. Depth from larger foreground bottom to distant top. No path, no stepping stones, no game interface, NO TEXT, no letters, no numbers, no logos, no borders. Original character designs. Full bleed polished premium fairytale mobile game artwork.

## 验证

`e2e/game-map.spec.ts` 覆盖窄屏首次定位、故事上下顺序、锁定提示、总地图七个节点、锁定世界预览、返回当前冒险、成长和设置入口，以及完成整个世界后进入下一世界。现有手机学习测试继续覆盖实际完成第一课后解锁下一故事。

本轮验证：`pnpm build` 和 `pnpm type-check` 通过；34 个测试文件、291 项单元测试通过；Chrome 的新地图和现有手机学习回归共 7 项通过。构建后的 Service Worker 已包含地图 WebP。`pnpm lint` 因现有 ESLint 配置缺少 `@eslint/js` 依赖而无法启动。

WebKit 回归未执行成功：当前环境缺少对应浏览器运行文件，补装未能及时完成；未做手机真机验证。

全屏布局调整：地图画面覆盖屏幕顶部，标题与进度悬浮在上方；成长头像、总地图在左侧纵向排列，积分、设置在右侧纵向排列。320px 窄屏回归验证地图滚动区域覆盖整个视口，且功能入口左右分布。Chrome 两项地图回归通过。
