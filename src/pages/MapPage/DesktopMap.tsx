import type { CSSProperties } from 'react';
import { EmojiIllustration } from '@/components/common/EmojiIllustration';
import { Check, Crown, LockKeyhole } from 'lucide-react';
import type { UnifiedMapNode } from '@/data/unifiedMap';
import EchoValleyScenery from './EchoValleyScenery';
import ForestJourney from './ForestJourney';
import OceanScene from './OceanScene';
import { oceanStops } from './oceanLayout';
import styles from './DesktopMap.module.css';

interface DesktopWorld {
  name: string;
  icon: string;
  color: string;
  sky: string;
}

interface Props {
  profileId?: string;
  magicPower?: number;
  overview: boolean;
  region: number;
  worlds: DesktopWorld[];
  nodes: UnifiedMapNode[];
  regionNodes: UnifiedMapNode[];
  activeNode?: UnifiedMapNode | null;
  onOpenRegion: (level: number) => void;
  onSelectNode: (node: UnifiedMapNode) => void;
}

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
  7: {
    image: 'desktop-genesis-core.webp',
    coordinates: [
      [11, 84.5],
      [25, 74.5],
      [42, 76.3],
      [61, 78],
      [78, 72],
      [82.7, 64.2],
      [71.5, 58.7],
      [59.7, 53.8],
    ],
    routeBendsAfterStop: {
      0: [
        [17.5, 78.5],
        [21, 75.7],
      ],
      1: [[32, 74.4]],
      2: [[51, 77.7]],
      3: [
        [69, 76.5],
        [74, 74.6],
      ],
      4: [[81.2, 68.8]],
      5: [
        [80.3, 61.7],
        [77, 60.2],
      ],
      6: [
        [65, 57],
        [61, 55.9],
      ],
    },
    landmarks: {
      l7_001: '星港入口',
      l7_002: '信息中枢',
      l7_003: '全息街区',
      l7_004: '未来环线',
      l7_005: '连接之桥',
      l7_006: '神经网络站',
      l7_c01: '核心接入站',
      l7_boss: '超级大脑核心',
    },
    direction: '沿高架星光轨道前往超级大脑核心',
  },
  3: {
    image: 'desktop-shimmering-sea-clean.webp',
    coordinates: oceanStops,
    landmarks: {},
    direction: '沿海底气泡小路前进',
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
  profileId,
  magicPower,
  overview,
  region,
  worlds,
  nodes,
  regionNodes,
  activeNode,
  onOpenRegion,
  onSelectNode,
}: Props) {
  if (!overview && region === 1) {
    return (
      <ForestJourney
        key={profileId}
        profileId={profileId}
        magicPower={magicPower}
        nodes={regionNodes}
        activeNode={activeNode}
        onSelectNode={onSelectNode}
      />
    );
  }
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
  const theme = overview
    ? styles.atlas
    : region === 3
      ? styles.sea
      : region === 7
        ? styles.coreCity
        : '';
  return (
    <div
      id="adventure-map"
      tabIndex={0}
      className={`${styles.map} ${theme}`}
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
      {!overview && region === 3 && <OceanScene />}
      {!overview && region === 3 && (
        <div className={styles.bubblePath} aria-hidden="true" data-testid="ocean-bubble-path">
          {oceanStops.slice(1).flatMap(([x, y], index) => {
            const [previousX, previousY] = oceanStops[index]!;
            return Array.from({ length: 4 }, (_, step) => {
              const fraction = (step + 1) / 5;
              return (
                <span
                  key={`${index}-${step}`}
                  style={{
                    ...position(
                      previousX + (x - previousX) * fraction,
                      previousY + (y - previousY) * fraction
                    ),
                    width: step % 2 ? 12 : 8,
                    height: step % 2 ? 12 : 8,
                  }}
                />
              );
            });
          })}
        </div>
      )}
      {!overview && region !== 3 && (
        <svg
          className={styles.road}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={storyRoute} className={styles.storyRoute} />
          {region === 7 && (
            <polyline
              points={storyRoute}
              className={styles.cityTraffic}
              data-testid="genesis-traffic"
            />
          )}
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
                    <EmojiIllustration>{entry.icon}</EmojiIllustration>
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
                data-ocean-stop={region === 3 ? index : undefined}
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
                  {region === 3 || region === 7 ? (
                    <>
                      {node.completed ? (
                        <Check size={18} />
                      ) : node.isLevelEnd ? (
                        <Crown size={19} />
                      ) : (
                        index + 1
                      )}
                      {!node.unlocked && <LockKeyhole size={10} className={styles.lock} />}
                    </>
                  ) : (
                    <>
                      <span className={styles.dot} aria-hidden="true">
                        {node.completed && <Check size={14} strokeWidth={3} />}
                      </span>
                      {!node.completed && (
                        <span className={styles.balloon} aria-hidden="true">
                          <Crown size={17} />
                          {!node.unlocked && <LockKeyhole size={10} className={styles.lock} />}
                        </span>
                      )}
                    </>
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
