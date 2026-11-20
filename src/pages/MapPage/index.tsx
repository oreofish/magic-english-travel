import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  Crown,
  Castle,
  Mountain,
  Waves,
  CloudSun,
  Stars,
  Hourglass,
  Gem,
  LocateFixed,
  LockKeyhole,
  Settings2,
  Sparkles,
  Star,
} from 'lucide-react';
import { db, type User, type UserProgress } from '@/db';
import { initializeAppData, needsInitialization } from '@/services/dataInitService';
import { getUserMapNodes } from '@/services/mapProgressService';
import { getStoryById } from '@/data';
import { findActiveNode, generateUnifiedMapData, type UnifiedMapNode } from '@/data/unifiedMap';
import { useAppStore } from '@/stores/useAppStore';
import { Button, Modal } from '@/components/common';
import DesktopMap from './DesktopMap';
import styles from './MapPage.module.css';

const mapData = generateUnifiedMapData();
const worlds = [
  {
    name: '萌芽之森',
    english: 'SPROUT FOREST',
    icon: '🌳',
    color: '#7caa79',
    sky: '#e5efda',
    description: '沿着溪边小路，收集故事皇冠。',
  },
  {
    name: '回声山谷',
    english: 'ECHO VALLEY',
    icon: '⛰️',
    color: '#9d8bd0',
    sky: '#e5e3fa',
    description: '听，山谷里的新朋友在呼唤你。',
  },
  {
    name: '闪耀之海',
    english: 'SHIMMERING SEA',
    icon: '🐚',
    color: '#58a8bf',
    sky: '#d4eff6',
    description: '跟着浪花，发现蓝色海洋里的秘密。',
  },
  {
    name: '云端之城',
    english: 'CITY OF CLOUDS',
    icon: '🎈',
    color: '#c88ba7',
    sky: '#fae4ec',
    description: '乘着气球，去云端寻找新的朋友。',
  },
  {
    name: '永恒星空',
    english: 'STARLIGHT KINGDOM',
    icon: '🌟',
    color: '#8e88bd',
    sky: '#e1dff5',
    description: '每读懂一个故事，就点亮一颗星星。',
  },
  {
    name: '时光回廊',
    english: 'GARDEN OF TIME',
    icon: '⏳',
    color: '#a08bba',
    sky: '#ece2f2',
    description: '推开时光之门，让好奇心带你去远方。',
  },
  {
    name: '创世之核',
    english: 'CRYSTAL HEART',
    icon: '💎',
    color: '#75a7ad',
    sky: '#def1ee',
    description: '带上所有的魔法，开启最后的奇妙旅程。',
  },
];
const typeLabels: Record<string, string> = {
  story: '故事阅读',
  boss: '区域挑战',
  challenge: '趣味练习',
  bonus: '奖励关卡',
};
const worldIcons = [Castle, Mountain, Waves, CloudSun, Stars, Hourglass, Gem];
const desktopQuery = '(min-width: 1024px) and (orientation: landscape)';
function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const isServerDesktop = () => false;
const STEP = 156;
const nodeX = (index: number) => [50, 27, 49, 73, 51, 28, 48, 72][index % 8]!;

export default function MapPage() {
  const navigate = useNavigate();
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, isServerDesktop);
  const currentUserId = useAppStore(s => s.currentUserId);
  const [nodes, setNodes] = useState<UnifiedMapNode[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [region, setRegion] = useState(1);
  const [overview, setOverview] = useState(false);
  const [selected, setSelected] = useState<UnifiedMapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const viewport = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (needsInitialization()) {
        const result = await initializeAppData();
        if (!result.success) throw new Error('Content initialization failed');
      }
      const activeProfileId = (await db.learningMeta.get('activeProfileId'))?.value;
      const savedUser = activeProfileId
        ? await db.users.get(activeProfileId)
        : currentUserId
          ? await db.users.get(currentUserId)
          : await db.users.orderBy('createdAt').last();
      if (!savedUser) {
        navigate('/onboarding', { replace: true });
        return;
      }
      if (activeProfileId === savedUser.id && currentUserId !== savedUser.id) {
        useAppStore.getState().activateLearningProfile(savedUser);
      }
      const userNodes = await getUserMapNodes(savedUser.id);
      // A profile switch can finish a newer request while this older request is
      // still resolving. Do not paint the old profile's map in that case.
      const latestActiveProfileId = (await db.learningMeta.get('activeProfileId'))?.value;
      if (latestActiveProfileId && latestActiveProfileId !== savedUser.id) return;
      const merged = mapData.nodes.map(node => {
        const userNode = userNodes.find(
          saved => saved.id === node.id || saved.storyId === node.storyId
        );
        return userNode
          ? {
              ...node,
              ...userNode,
              level: node.level,
              globalIndex: node.globalIndex,
              levelIndex: node.levelIndex,
              theme: node.theme,
              isLevelStart: node.isLevelStart,
              isLevelEnd: node.isLevelEnd,
            }
          : node;
      });
      setUser(savedUser);
      setProgress((await db.userProgress.get(savedUser.id)) ?? null);
      setNodes(merged);
      setRegion(findActiveNode(merged)?.level ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, navigate]);
  useEffect(() => {
    void load();
  }, [load]);
  const activeNode = findActiveNode(nodes);
  const world = worlds[region - 1]!;
  const regionNodes = nodes.filter(n => n.level === region);
  const completed = regionNodes.filter(n => n.completed).length;
  const selectedStory = selected?.storyId ? getStoryById(selected.storyId) : null;
  const current = regionNodes.find(n => n.id === activeNode?.id);
  const focusIndex = overview
    ? (activeNode?.level ?? 1) - 1
    : Math.max(
        0,
        regionNodes.findIndex(n => n.id === activeNode?.id)
      );
  const count = overview ? worlds.length : regionNodes.length;
  const mapHeight = count * STEP + 450;
  const nodeY = (index: number) => mapHeight - 180 - index * STEP;
  const locate = useCallback(() => {
    const el = viewport.current;
    if (el) el.scrollTop = mapHeight - 180 - focusIndex * STEP - el.clientHeight + 190;
  }, [mapHeight, focusIndex]);
  useEffect(() => {
    if (loading || !viewport.current) return;
    locate();
    const observer = new ResizeObserver(locate);
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [loading, region, overview, desktop, locate]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  const startNode = (node: UnifiedMapNode) => {
    if (!node.unlocked || !node.storyId) return;
    navigate(
      `/${node.type === 'challenge' || node.type === 'bonus' ? 'quiz' : 'reader'}/${node.storyId}`
    );
  };
  const points = Array.from({ length: count }, (_, i) => ({ x: nodeX(i), y: nodeY(i) }));
  const path = points
    .map((p, i) =>
      i === 0
        ? `M ${p.x} ${p.y}`
        : `C ${points[i - 1]!.x} ${p.y + STEP * 0.5}, ${p.x} ${p.y + STEP * 0.5}, ${p.x} ${p.y}`
    )
    .join(' ');
  const openRegion = (level: number) => {
    setRegion(level);
    setOverview(false);
  };
  return (
    <div
      className={`${styles.game} ${desktop ? styles.desktop : !overview && region === 4 ? styles.cloudWorld : ''}`}
      style={{ '--world-color': world.color, '--world-sky': world.sky } as CSSProperties}
      data-desktop-valley={desktop && !overview && region === 2 ? true : undefined}
      data-testid="map-page"
    >
      <a className={styles.skip} href="#adventure-map">
        跳到冒险地图
      </a>
      <header className={styles.hud}>
        <button
          className={styles.worldButton}
          onClick={() => setOverview(v => !v)}
          aria-label={overview ? '返回关卡地图' : '查看总地图'}
        >
          {overview ? <ArrowLeft size={22} /> : <Compass size={23} />}
          <span>{overview ? '返回' : '总地图'}</span>
        </button>
        <Link to="/scroll" className={styles.avatarLink} aria-label="成长记录">
          <span className={styles.avatar} aria-hidden="true">
            <span className={styles.ponyPortrait} />
          </span>
          <span className={styles.avatarLevel}>Lv.{progress?.buddyStage ?? 1}</span>
        </Link>
        <div className={styles.score} aria-label={`积分 ${progress?.magicPower ?? 0} 魔力`}>
          <Star size={20} fill="currentColor" />
          <strong>{progress?.magicPower ?? 0}</strong>
          <span>魔力</span>
        </div>
        <Link to="/settings" className={styles.settings} aria-label="设置">
          <Settings2 size={23} />
        </Link>
      </header>
      <section className={styles.worldTitle}>
        <span className={styles.eyebrow}>
          {overview ? 'YOUR MAGICAL WORLDS' : `LEVEL ${region} · ${world.english}`}
        </span>
        <h1>{overview ? '七个世界，一场奇遇' : world.name}</h1>
        <p>
          {overview
            ? desktop
              ? '选择一个世界，沿道路探索故事。'
              : '从森林出发，把每个世界都变成你的故事。'
            : world.description}
        </p>
        {!overview && (
          <div className={styles.progressLine}>
            <span>故事旅程</span>
            <progress
              value={completed}
              max={regionNodes.length || 1}
              aria-label={`${world.name}完成进度`}
            />
            <b>
              {completed}
              <span> / {regionNodes.length}</span>
            </b>
          </div>
        )}
        {offline && (
          <span className={styles.offline} role="status">
            当前离线 · 已下载的故事仍可冒险
          </span>
        )}
      </section>
      {loading ? (
        <div className={styles.status} role="status">
          正在展开你的魔法地图…
        </div>
      ) : error ? (
        <div className={styles.status} role="alert">
          <h2>地图暂时没有打开</h2>
          <p>你的学习记录仍在这台设备上，请再试一次。</p>
          <Button onClick={load}>重新加载</Button>
        </div>
      ) : (
        <>
          {desktop ? (
            <DesktopMap
              profileId={user?.id}
              magicPower={progress?.magicPower}
              overview={overview}
              region={region}
              worlds={worlds}
              nodes={nodes}
              regionNodes={regionNodes}
              activeNode={activeNode}
              onOpenRegion={openRegion}
              onSelectNode={setSelected}
            />
          ) : (
            <div
              ref={viewport}
              className={styles.viewport}
              id="adventure-map"
              tabIndex={0}
              aria-label={
                overview ? '总地图，从下往上探索七个世界' : `第${region}级故事地图，从下往上前进`
              }
            >
              <div
                className={`${styles.terrain} ${!overview && region === 4 ? styles.palace : styles.simpleTerrain}`}
                style={{ height: mapHeight }}
              >
                <div className={styles.destination}>
                  <Crown size={26} />
                  <strong>
                    {overview
                      ? '每个世界，都有新的魔法'
                      : region === 7
                        ? '魔法冒险家，终点见！'
                        : `通往 ${worlds[region]?.name}`}
                  </strong>
                  {!overview && completed === regionNodes.length && region < 7 && (
                    <button onClick={() => openRegion(region + 1)}>
                      进入下一个世界 <ArrowRight size={15} />
                    </button>
                  )}
                </div>
                <svg
                  className={styles.route}
                  viewBox={`0 0 100 ${mapHeight}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d={path} className={styles.pathShadow} />
                  <path d={path} className={styles.path} />
                </svg>
                <ol className={styles.nodes} aria-label={overview ? '七个世界' : '故事关卡'}>
                  {overview
                    ? worlds.map((w, i) => {
                        const WorldIcon = worldIcons[i]!;
                        const worldNodes = nodes.filter(n => n.level === i + 1);
                        const done = worldNodes.filter(n => n.completed).length;
                        const unlocked = worldNodes.some(n => n.unlocked);
                        return (
                          <li
                            key={w.name}
                            className={`${styles.node} ${styles.worldNode} ${!unlocked ? styles.locked : ''}`}
                            style={{ left: `${nodeX(i)}%`, top: nodeY(i) }}
                          >
                            <button
                              onClick={() => openRegion(i + 1)}
                              aria-label={`LEVEL ${i + 1} ${w.name}${unlocked ? '' : '，未解锁，可预览'}`}
                            >
                              <span className={styles.worldDisc}>
                                <WorldIcon size={36} />
                              </span>
                              <span className={styles.nodeLabel}>
                                <small>LEVEL {i + 1}</small>
                                <strong>{w.name}</strong>
                                <span>
                                  {unlocked
                                    ? `${done} / ${worldNodes.length} 个故事`
                                    : '未解锁 · 可以先看看'}
                                </span>
                              </span>
                            </button>
                            {activeNode?.level === i + 1 && (
                              <span className={styles.here}>我们在这里</span>
                            )}
                          </li>
                        );
                      })
                    : regionNodes.map((node, i) => (
                        <li
                          key={node.id}
                          className={`${styles.node} ${!node.unlocked ? styles.locked : ''} ${node.completed ? styles.completed : ''} ${activeNode?.id === node.id ? styles.current : ''}`}
                          style={{ left: `${nodeX(i)}%`, top: nodeY(i) }}
                        >
                          {activeNode?.id === node.id && (
                            <div
                              className={styles.character}
                              aria-label={`${user?.buddyName || '伙伴'}所在位置`}
                            >
                              <span className={styles.ponyPortrait} />
                              <b>到这里啦！</b>
                            </div>
                          )}
                          <button
                            data-testid={`map-node-${node.storyId || node.id}`}
                            onClick={() => setSelected(node)}
                            aria-label={`${node.titleCn}，${node.completed ? '已完成，可重温' : node.unlocked ? '可以开始' : '未解锁，查看条件'}`}
                            aria-current={activeNode?.id === node.id ? 'step' : undefined}
                          >
                            <span className={styles.disc}>
                              {node.completed ? (
                                <Check size={26} strokeWidth={3} />
                              ) : !node.unlocked ? (
                                <LockKeyhole size={22} />
                              ) : node.isLevelEnd ? (
                                <Crown size={27} />
                              ) : (
                                <Star size={28} fill="currentColor" />
                              )}
                            </span>
                            <span className={styles.stars} aria-hidden="true">
                              {node.completed ? '✦ ✦ ✦' : `— ${String(i + 1).padStart(2, '0')} —`}
                            </span>
                            <span className={styles.nodeLabel}>
                              <strong>{node.titleCn}</strong>
                            </span>
                          </button>
                        </li>
                      ))}
                </ol>
                <div className={styles.startSign}>
                  <Sparkles size={17} />
                  {overview ? '从这里，开启你的魔法世界' : '每一个小故事，都是向前的一步'}
                </div>
              </div>
            </div>
          )}
          <button
            className={styles.locate}
            onClick={() => {
              if (desktop) {
                const map = document.getElementById('adventure-map');
                (map?.querySelector<HTMLElement>('[aria-current]') ?? map)?.focus();
              } else {
                locate();
              }
            }}
            aria-label="定位当前关卡"
          >
            <LocateFixed size={21} />
          </button>
          {!overview && current && (
            <div className={styles.quest}>
              <span className={styles.questIcon}>✦</span>
              <div>
                <small>
                  {current.completed
                    ? '世界已通关 · 重温故事'
                    : `下一段冒险 · 第 ${current.levelIndex + 1} 站`}
                </small>
                <strong>{current.titleCn}</strong>
              </div>
              <button
                onClick={() => startNode(current)}
                aria-label={
                  current.completed
                    ? '再读一次'
                    : progress?.totalStoriesRead
                      ? '继续学习'
                      : '开始第一个故事'
                }
              >
                {current.completed ? '重温' : '出发'}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          {!overview && !current && (
            <button
              className={styles.returnCurrent}
              onClick={() =>
                openRegion(
                  desktop && completed === regionNodes.length && region < 7
                    ? region + 1
                    : (activeNode?.level ?? 1)
                )
              }
            >
              {desktop && completed === regionNodes.length && region < 7
                ? '进入下一个世界'
                : '回到我的冒险'}{' '}
              <ArrowRight size={16} />
            </button>
          )}
        </>
      )}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.unlocked ? '准备开始冒险' : '下一站的惊喜'}
        size="sm"
      >
        {selected && (
          <div className={styles.preview} data-testid="node-preview">
            <span className={styles.previewEmoji} aria-hidden="true">
              {selected.emoji || '📖'}
            </span>
            <span className={styles.eyebrow}>
              LEVEL {selected.level} · {typeLabels[selected.type] || '故事冒险'}
            </span>
            <h2>{selected.titleCn}</h2>
            <p lang="en">{selected.title}</p>
            {selectedStory && (
              <div className={styles.previewMeta}>
                <span>
                  <BookOpen size={15} />
                  {selectedStory.metadata.wordCount} 词
                </span>
                <span>
                  <Clock3 size={15} />约 {selectedStory.metadata.estimatedTime} 分钟
                </span>
              </div>
            )}
            {desktop && selectedStory && (
              <p>
                {selected.completed
                  ? '已获得皇冠'
                  : `首次通关获得皇冠及 ${selectedStory.rewards.magicPower} 魔力`}
              </p>
            )}
            {selected.unlocked ? (
              <Button
                fullWidth
                onClick={() => startNode(selected)}
                rightIcon={<ArrowRight size={17} />}
              >
                {selected.completed ? '重温故事' : '开始学习'}
              </Button>
            ) : (
              <>
                <p>
                  先完成
                  {selected.prerequisites.length
                    ? `「${nodes.find(n => n.id === selected.prerequisites[0])?.titleCn || '前一个关卡'}」`
                    : '前一个关卡'}
                  ，就能解锁这里。
                </p>
                <Button
                  fullWidth
                  onClick={() => {
                    if (activeNode) {
                      openRegion(activeNode.level);
                      setSelected(activeNode);
                    }
                  }}
                >
                  查看当前关卡
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
