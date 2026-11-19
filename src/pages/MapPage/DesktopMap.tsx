import type { CSSProperties } from 'react';
import { Check, Crown, LockKeyhole } from 'lucide-react';
import type { UnifiedMapNode } from '@/data/unifiedMap';
import EchoValleyScenery from './EchoValleyScenery';
import styles from './DesktopMap.module.css';

interface DesktopWorld {
  name: string;
  icon: string;
  color: string;
  sky: string;
}

interface Props {
  overview: boolean;
  region: number;
  worlds: DesktopWorld[];
  nodes: UnifiedMapNode[];
  regionNodes: UnifiedMapNode[];
  activeNode?: UnifiedMapNode | null;
  onOpenRegion: (level: number) => void;
  onSelectNode: (node: UnifiedMapNode) => void;
}

// Percent coordinates measured along the road painted into desktop-sprout-forest.webp.
const forestRoad: [number, number][] = [
  [5, 69.4],
  [9.7, 65.8],
  [14.4, 60.4],
  [19.1, 55.7],
  [23.8, 54.8],
  [28.5, 56.8],
  [33.2, 60.3],
  [37.9, 62.5],
  [42.6, 61.4],
  [47.3, 57.7],
  [52, 49.9],
  [56.7, 43.4],
  [61.4, 40.1],
  [66.1, 40.7],
  [70.8, 43.1],
  [75.5, 43.6],
  [80.2, 42.2],
  [84.9, 38.7],
  [89.6, 30.1],
  [94.3, 24.6],
];

const forestLandmarks: Record<string, string> = {
  l1_001: '苹果树',
  l1_002: '猫咪小径',
  l1_003: '七彩花圃',
  l1_004: '林间小屋',
  l1_005: '晨光坡',
  l1_006: '数字石滩',
  l1_007: '小狗草地',
  l1_008: '森林公园',
  l1_009: '玩具树桩',
  l1_010: '月光小径',
  l1_b01: '调色花田',
  l1_b02: '动物足迹',
  l1_b03: '骰子石阵',
  l1_b04: '家庭野餐地',
  l1_b05: '单词拼图台',
  l1_c01: '速读树屋',
  l1_c02: '记忆石阵',
  l1_c03: '蜜蜂花园',
  l1_c04: '鸟鸣林',
  l1_boss: '守护树',
};

// From the foreground rapids to the distant gorge, with the third stop on the bridge.
const valleyCreek: [number, number][] = [
  [18, 84.5],
  [40, 81.5],
  [63.2, 66.1],
  [75.7, 63.5],
  [79, 58],
  [73.6, 54.7],
  [67.4, 50.9],
  [61.5, 48.1],
  [65.6, 44.8],
  [60.9, 41.5],
  [64, 36.7],
];

const valleyLandmarks: Record<string, string> = {
  l2_001: '鸟鸣溪滩',
  l2_002: '猫咪石滩',
  l2_003: '彩虹木桥',
  l2_004: '小鼠渡口',
  l2_005: '岩缝花园',
  l2_006: '藏宝石湾',
  l2_007: '风筝崖',
  l2_008: '小熊岩洞',
  l2_009: '农夫苗圃',
  l2_010: '月光浅滩',
  l2_boss: '回声峡口',
};

interface IllustratedMap {
  image: string;
  imageSources?: { file: string; width: number }[];
  coordinates: [number, number][];
  routeBendsAfterStop?: Partial<Record<number, [number, number][]>>;
  landmarks: Record<string, string>;
  direction: string;
}

const illustratedMaps: Partial<Record<number, IllustratedMap>> = {
  1: {
    image: 'desktop-sprout-forest.webp',
    coordinates: forestRoad,
    landmarks: forestLandmarks,
    direction: '沿步道从左向右前进',
  },
  2: {
    image: 'desktop-echo-valley.webp',
    imageSources: [
      { file: 'desktop-echo-valley.webp', width: 1672 },
      { file: 'desktop-echo-valley-4k.webp', width: 3840 },
    ],
    coordinates: valleyCreek,
    routeBendsAfterStop: {
      1: [
        [52, 79],
        [60, 74],
        [63, 71],
      ],
      2: [[70, 66]],
    },
    landmarks: valleyLandmarks,
    direction: '沿小溪向上游前进',
  },
};

const mapImageDirectory = `${import.meta.env.BASE_URL}images/maps/`;

function roadY(x: number) {
  return 55 + 12 * Math.sin((x - 3) / 9) - 0.09 * (x - 50);
}

function position(x: number, y: number): CSSProperties {
  return { left: `${x}%`, top: `${y}%` };
}

export default function DesktopMap({
  overview,
  region,
  worlds,
  nodes,
  regionNodes,
  activeNode,
  onOpenRegion,
  onSelectNode,
}: Props) {
  const scene = overview ? undefined : illustratedMaps[region];
  const world = worlds[region - 1]!;
  const storyStops = regionNodes.map((node, index) => {
    const x = 7 + (index * 86) / Math.max(1, regionNodes.length - 1);
    return { node, coordinates: scene?.coordinates[index] ?? [x, roadY(x)] };
  });
  const storyRoute = storyStops
    .flatMap(({ coordinates }, index) => [
      coordinates,
      ...(scene?.routeBendsAfterStop?.[index] ?? []),
    ])
    .map(point => point.join(','))
    .join(' ');
  const route = Array.from({ length: 101 }, (_, x) => `${x},${roadY(x)}`).join(' ');
  return (
    <div
      id="adventure-map"
      tabIndex={0}
      className={`${styles.map} ${overview ? styles.atlas : ''}`}
      style={{ '--terrain': world.sky, '--terrain-shade': world.color } as CSSProperties}
      aria-label={
        overview
          ? '总地图，探索七个世界'
          : `${world.name}故事地图，${scene?.direction ?? '从左向右前进'}`
      }
    >
      {scene ? (
        <img
          className={styles.art}
          src={mapImageDirectory + scene.image}
          srcSet={scene.imageSources
            ?.map(({ file, width }) => `${mapImageDirectory}${file} ${width}w`)
            .join(', ')}
          sizes={scene.imageSources ? '100vw' : undefined}
          alt=""
        />
      ) : (
        <svg
          className={styles.road}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={route} className={styles.roadEdge} />
          <polyline points={route} className={styles.roadSurface} />
        </svg>
      )}
      {!overview && region === 2 && <EchoValleyScenery />}
      {!overview && (
        <svg
          className={styles.road}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={storyRoute} className={styles.storyRoute} />
        </svg>
      )}
      {overview ? (
        <ol className={styles.stops} aria-label="七个世界">
          {worlds.map((entry, index) => {
            const x = 8 + index * 14;
            const worldNodes = nodes.filter(node => node.level === index + 1);
            const completed = worldNodes.filter(node => node.completed).length;
            const unlocked = worldNodes.some(node => node.unlocked);
            return (
              <li className={styles.stop} style={position(x, roadY(x))} key={entry.name}>
                <button
                  type="button"
                  className={styles.world}
                  onClick={() => onOpenRegion(index + 1)}
                  aria-label={`LEVEL ${index + 1} ${entry.name}${unlocked ? '' : '，未解锁，可预览'}`}
                  aria-current={activeNode?.level === index + 1 ? 'location' : undefined}
                  style={{ '--island': entry.sky } as CSSProperties}
                >
                  <span className={styles.worldIcon} aria-hidden="true">
                    {entry.icon}
                  </span>
                  <strong>{entry.name}</strong>
                  <small>
                    {unlocked ? `${completed} / ${worldNodes.length} 个故事` : '可预览'}
                  </small>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className={styles.stops} aria-label="故事关卡">
          {storyStops.map(({ node, coordinates: [left, top] }, index) => {
            const place = scene?.landmarks[node.storyId ?? ''];
            const current = activeNode?.id === node.id && node.unlocked && !node.completed;
            return (
              <li
                className={`${styles.stop} ${styles.storyStop}`}
                style={position(left, top)}
                key={node.id}
              >
                <button
                  type="button"
                  data-testid={`map-node-${node.storyId || node.id}`}
                  className={styles.pin}
                  data-unlocked={node.unlocked}
                  data-completed={node.completed}
                  aria-current={current ? 'step' : undefined}
                  aria-label={`${node.titleCn}，${node.completed ? '已完成，可重温' : node.unlocked ? '可以开始' : '未解锁，查看条件'}`}
                  onClick={() => onSelectNode(node)}
                >
                  <span className={styles.dot} aria-hidden="true">
                    {node.completed && <Check size={14} strokeWidth={3} />}
                  </span>
                  {!node.completed && (
                    <span className={styles.balloon} aria-hidden="true">
                      <Crown size={17} />
                      {!node.unlocked && <LockKeyhole size={10} className={styles.lock} />}
                    </span>
                  )}
                  <span className={styles.pinLabel} aria-hidden="true">
                    <strong>
                      {index + 1}. {node.titleCn}
                    </strong>
                    {place && <small>{place}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
