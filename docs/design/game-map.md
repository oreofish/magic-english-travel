# 手机纵向冒险地图

## 电脑版萌芽之森交互试版

Level 1 使用独立的 `ForestJourney` 场景：宽主路径、外围低细节树林、三个探索地标。底图为 `public/images/maps/desktop-sprout-forest-v2.webp`，独立透明伙伴为 `public/images/maps/forest-pony.webp`，均由内置 Imagegen 生成，原底图保留。完整底图生成提示词见 `forest-assets-prompts.txt`。

点击可进入或已完成的关卡，伙伴沿道路移动后打开原故事预览；锁定节点只展示解锁条件。通关返回后，根据当前档案本次会话的实际完成数量变化，显示皇冠、魔力增量与路径点亮，并移向当前关卡；刷新和重温不重复显示庆祝，也不额外写入任何奖励。小屋、大树、兔子可点击查看英语单词并通过现有 TTS 发音，发音失败保留文字反馈。环境落叶、伙伴待机可暂停；系统减少动态效果时关闭位移动画并直接打开预览。手机版森林场景仍待实现。

截图：`docs/ux-evidence/forest-journey-desktop.png`。下文旧版验证记录保留作历史记录。

本次验证：生产构建通过；Chrome 地图 5 项测试通过，覆盖手机场景归属、手机关卡流程、整世界完成、桌面地标和锁定预览、真实通关反馈、刷新不重复庆祝、重温移动与减少动态效果模式。WebKit 运行库仍缺失，未做真机验证。角色当前使用透明静态素材配合位移、呼吸和跳步动画，尚非逐帧行走或眨眼动画。

首页采用独立全屏地图，顶部提供总地图、成长头像、魔力积分和设置入口。故事节点从下往上排列；进入地图时定位当前未完成关卡，使用现有档案数据和通关解锁规则。一个世界完成后，当前冒险进入下一个世界。已完成故事可重温，未解锁故事可查看前置条件。

总地图采用同样的纵向路径，每个节点代表一个 Level。所有世界都可预览，预览不会解锁课程。L1 萌芽之森的手机版场景待实现，暂保留主题色和简化关卡路径；电脑版继续使用森林插画。L4 云端之城使用原云端梦幻宫殿插画，L2、L3、L5–L7 手机版暂用主题色、图标和简化云层。其他页面的手机导航移至顶部，首页不使用原来的底部导航。

## 第四世界美术

Level 4：云端之城。使用原「云端梦幻宫殿」手机场景图。Level 1 在手机与电脑上统一命名为「萌芽之森」。此次仅调整场景归属和展示，保留所有原有故事 ID、顺序、成绩和奖励。

素材：`public/images/maps/cloud-palace.webp`（1024 × 1536）。采用内置 Imagegen 生成，再转换 WebP；同一素材通过 CSS 取景用于伙伴头像与当前位置标记。背景独立于滚动路径，避免长地图重复拼接的接缝。素材被生产 Service Worker 预缓存。

生成提示词：

> Use case: illustration-story. Create a production game background illustration, portrait 2:3 aspect ratio, for a mobile vertical scrolling children's English adventure map. Dreamy western fairytale palace in the clouds, soft blush pink, lilac, warm cream and luminous sky blue, exquisite hand painted children's storybook game art, charming rounded shapes, richly detailed but serene. A magnificent pink-roof ivory castle with gold spires on floating clouds in the upper center distance, smaller floating gardens and cloud islands along left and right edges, rainbow arches, hanging flowers, tiny friendly ORIGINAL pastel winged ponies, white rabbits, squirrels and songbirds gathered on the side islands. Bottom foreground fluffy cloud meadow with flowers and a cute lavender pony and bunny. Clear airy center channel for interactive game nodes to be overlaid in code. Depth from larger foreground bottom to distant top. No path, no stepping stones, no game interface, NO TEXT, no letters, no numbers, no logos, no borders. Original character designs. Full bleed polished premium fairytale mobile game artwork.

## 验证

`e2e/game-map.spec.ts` 覆盖窄屏首次定位、故事上下顺序、锁定提示、总地图七个节点、锁定世界预览、返回当前冒险、成长和设置入口，以及完成整个世界后进入下一世界。现有手机学习测试继续覆盖实际完成第一课后解锁下一故事。

本轮验证：`pnpm build` 和 `pnpm type-check` 通过；34 个测试文件、291 项单元测试通过；Chrome 的新地图和现有手机学习回归共 7 项通过。构建后的 Service Worker 已包含地图 WebP。`pnpm lint` 因现有 ESLint 配置缺少 `@eslint/js` 依赖而无法启动。

WebKit 回归未执行成功：当前环境缺少对应浏览器运行文件，补装未能及时完成；未做手机真机验证。

全屏布局调整：地图画面覆盖屏幕顶部，标题与进度悬浮在上方；成长头像、总地图在左侧纵向排列，积分、设置在右侧纵向排列。320px 窄屏回归验证地图滚动区域覆盖整个视口，且功能入口左右分布。Chrome 两项地图回归通过。

## 大屏与滚动适配

地图隐藏浏览器滚动条，同时保留触摸、鼠标滚轮和键盘滚动。900px 及以上宽度使用更宽的关卡路径（最大 1120px），适当放大节点、文字与入口。宫殿插画保持比例，左右用同一场景的模糊背景与渐隐边缘延展；未另外制作横版插画。窗口缩放或屏幕旋转时通过 ResizeObserver 定位当前冒险，避免角色落到可视区之外。

Chrome 三项地图回归通过，覆盖 1440 × 900 桌面、820 × 1180 平板、360px / 320px 手机，以及鼠标滚轮、PageUp 和定位按钮。桌面截图：`docs/ux-evidence/desktop-map.png`。
