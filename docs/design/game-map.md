# 手机纵向冒险地图

## 电脑版萌芽之森交互试版

Level 1 使用独立的 `ForestJourney` 场景：宽主路径、外围低细节树林、三个探索地标。底图为 `public/images/maps/desktop-sprout-forest-v2.webp`，独立透明伙伴为 `public/images/maps/forest-pony.webp`，均由内置 Imagegen 生成，原底图保留。完整底图生成提示词见 `forest-assets-prompts.txt`。

点击可进入或已完成的关卡，伙伴沿道路移动后打开原故事预览；锁定节点只展示解锁条件。通关返回后，根据当前档案本次会话的实际完成数量变化，显示皇冠、魔力增量与路径点亮，并移向当前关卡；刷新和重温不重复显示庆祝，也不额外写入任何奖励。小屋、大树、兔子可点击查看英语单词并通过现有 TTS 发音，发音失败保留文字反馈。环境落叶、伙伴待机可暂停；系统减少动态效果时关闭位移动画并直接打开预览。手机版森林场景仍待实现。

截图：`docs/ux-evidence/forest-journey-desktop.png`。下文旧版验证记录保留作历史记录。

本次验证：生产构建通过；Chrome 地图 5 项测试通过，覆盖手机场景归属、手机关卡流程、整世界完成、桌面地标和锁定预览、真实通关反馈、刷新不重复庆祝、重温移动与减少动态效果模式。WebKit 运行库仍缺失，未做真机验证。角色当前使用透明静态素材配合位移、呼吸和跳步动画，尚非逐帧行走或眨眼动画。

首页采用独立全屏地图，顶部提供总地图、成长头像、魔力积分和设置入口。故事节点从下往上排列；进入地图时定位当前未完成关卡，使用现有档案数据和通关解锁规则。一个世界完成后，当前冒险进入下一个世界。已完成故事可重温，未解锁故事可查看前置条件。

总地图采用同样的纵向路径，每个节点代表一个 Level。所有世界都可预览，预览不会解锁课程。L1 萌芽之森的手机版场景待实现，暂保留主题色和简化关卡路径；电脑版继续使用森林插画。L4 云端之城使用原云端梦幻宫殿插画，L2、L3、L5–L7 手机版暂用主题色、图标和简化云层。其他页面的手机导航移至顶部，首页不使用原来的底部导航。

## 第三世界美术

电脑版海洋使用去除全部鱼与气泡的底图 `public/images/maps/desktop-shimmering-sea-clean.webp`。Three.js 图层（`OceanScene` / `createOceanScene`）绘制 36 条小型慢游鱼（6 群，分为远、中、近三层）、15 个故事气泡及其间的细小连接气泡，另保留少量上升气泡、海带网格、水面高光和海底光斑。故事气泡即关卡本体；HTML 仅承载编号、状态、键盘焦点和点击区域，通过 `oceanLayout` 与 3D 气泡共用坐标及轻微浮动，不叠加第二套圆形标记。小鱼保留微型体量，远、中、近三层尺寸系数分别为 0.45、0.75、1.25；远景融入更暗的蓝色水雾，中景适度降低饱和度，近景稍大且颜色更清楚。各群以错落队形和不同缓慢游速前进，近景的轻微视差更明显。故事点使用 40 × 28 细分的真实球面网格与 MeshPhysicalMaterial，包含透射、轻微折射、清漆高光和薄膜虹彩；气泡材质没有气泡图片贴图。故事点和 56 个连接小气泡共用透明球面材质，没有描边或实心圆点连接线。反射由本地蓝色环境与两处柔和光源生成，干净海景作为折射参照，避免室内灯板造成密集白点。故事点与连接气泡使用同一个行进水波函数，轻微起伏和形变，编号及点击区域同帧同步。引擎通过动态导入按需执行，生产 Service Worker 仍预缓存该模块以支持离线。

环境动画可手动暂停；减少动态效果时不创建渲染器；无 WebGL2 或上下文丢失时保留插画与关卡。渲染按屏幕密度最高 2 倍、以 4K 总像素预算绘制，最低保留 CSS 原生分辨率，避免低分辨率画布放大造成气泡像素感；透射使用完整分辨率，反射环境提升至 256。帧率上限仍为 24；后台停绘，切换世界时停止循环并释放几何体、材质、渲染器与 WebGL 上下文。该版本为插画与 3D 动态混合场景，尚未把整张海底重建为 3D 地形。

3D 版本验证：生产构建通过，球面深度、物理材质、水波连贯性和小鱼速度与鱼群远近层次的 5 项单元测试通过；Chrome 4 项海洋回归通过，包含 2 倍屏幕密度清晰度、真实软件 WebGL2 连续绘制、暂停与恢复、画布缩放、上下文丢失、禁用 WebGL、减少动态效果、原关卡预览及手机尺寸切换。实际场景截图为 `../ux-evidence/shimmering-sea-three.png`，高分屏气泡局部截图为 `../ux-evidence/shimmering-sea-bubbles-detail.png`。未做 WebKit 与真机性能验证。

Level 3 电脑版「闪耀之海」的底图只保留夕阳海面、海鸥、蓝色海底、珊瑚、虾蟹贝类、海星和海带；所有小鱼均由代码驱动，底图没有固定鱼或固定气泡链。故事点气泡由 3D 绘制并缓慢微动；暂停、减少动态效果或无 WebGL 时显示静态可点击气泡与 56 个连接小气泡，采用透明中心及柔和局部高光；所有状态均无白色描边，不再使用 SVG 虚线圆点。锁定预览与学习解锁规则沿用原逻辑；手机版仍用简化场景。内置 Imagegen 的提示词见 `sea-assets-prompts.txt`，页面截图见 `../ux-evidence/shimmering-sea-desktop.png`。

验证：生产构建通过，Chrome 地图回归 6 项通过，覆盖海底 15 个节点均在可见区域、水下位置、海洋图片实际加载、锁定预览和手机尺寸切换，并复验森林通关流程。

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

## 第七世界美术：创世之核

电脑版 Level 7 使用未来金属城市夜景。中央巨型建筑以钛金属骨架、玻璃穹顶与发光神经网络构成 AI 超级大脑，周围布置金属楼群、环形高架轨道、交通桥和星点般的冷暖窗灯。宽阔的高架主路径从左下前景环绕城市并通向核心入口，保留安静路面以突出 8 个关卡节点。

背景为内置 Imagegen 生成的 `public/images/maps/desktop-genesis-core.webp`（1672 × 941），提示词归档于 `genesis-core-assets-prompts.txt`。关卡使用金属质感发光站点，保留原有故事 ID、顺序、锁定预览及学习解锁逻辑。主路的交通流光由轻量 SVG/CSS 绘制，减少动态效果时停用，不启动额外的 Three.js 场景。手机版沿用简化关卡布局。

页面截图：`docs/ux-evidence/genesis-core-desktop.png`。地图回归覆盖背景加载、8 个节点可见、核心入口位置、锁定预览、轨道流光、减少动态效果，以及窗口缩放和手机版切换。

本轮验证：生产构建、格式检查与 3 项 Chrome 地图回归通过（创世之核、海洋、森林及云端场景归属）；新图片已进入离线预缓存。未做 WebKit 与真机验证。
