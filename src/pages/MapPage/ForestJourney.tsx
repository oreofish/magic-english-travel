import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  Crown,
  House,
  LockKeyhole,
  Rabbit,
  Sparkles,
  TreeDeciduous,
  Volume2,
} from 'lucide-react';
import type { UnifiedMapNode } from '@/data/unifiedMap';
import { ttsService } from '@/services/ttsService';
import styles from './ForestJourney.module.css';

interface Props {
  profileId?: string;
  magicPower?: number;
  nodes: UnifiedMapNode[];
  activeNode?: UnifiedMapNode | null;
  onSelectNode: (node: UnifiedMapNode) => void;
}

// Centre line of the broad road in desktop-sprout-forest-v2.webp.
const road = [
  [7, 70],
  [12, 65],
  [17, 59],
  [22, 55],
  [27, 54],
  [32, 56],
  [37, 59],
  [42, 60],
  [47, 59],
  [52, 55],
  [57, 49],
  [62, 43],
  [67, 40],
  [72, 39],
  [77, 37],
  [82, 34],
  [86, 30],
  [89, 28],
  [92, 26],
  [95, 24],
];
const landmarks = [
  { name: '林间小屋', word: 'house', hint: 'House · 小屋亮起了灯', x: 15, y: 34, icon: House },
  {
    name: '守护大树',
    word: 'tree',
    hint: 'Tree · 大树送来一片幸运叶',
    x: 50,
    y: 29,
    icon: TreeDeciduous,
  },
  {
    name: '草地里的兔子',
    word: 'rabbit',
    hint: 'Rabbit · 你好，小兔子！',
    x: 66,
    y: 77,
    icon: Rabbit,
  },
];
function point(index: number, count: number) {
  const offset = (index / Math.max(1, count - 1)) * (road.length - 1);
  const a = road[Math.floor(offset)]!;
  const b = road[Math.min(road.length - 1, Math.ceil(offset))]!;
  return [a[0]! + (b[0]! - a[0]!) * (offset % 1), a[1]! + (b[1]! - a[1]!) * (offset % 1)];
}
function savedProgress(key: string): { completed: number; power: number } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    return Number.isFinite(value?.completed) && Number.isFinite(value?.power) ? value : null;
  } catch {
    return null;
  }
}

export default function ForestJourney({
  profileId,
  magicPower = 0,
  nodes,
  activeNode,
  onSelectNode,
}: Props) {
  const reduced = useReducedMotion();
  const completed = nodes.filter(node => node.completed).length;
  const activeIndex = Math.max(
    0,
    nodes.findIndex(node => node.id === activeNode?.id)
  );
  const storageKey = `forest-journey:${profileId ?? 'guest'}`;
  const [previous] = useState(() => savedProgress(storageKey));
  const [celebrating, setCelebrating] = useState(!!previous && completed > previous.completed);
  const [avatarIndex, setAvatarIndex] = useState(
    celebrating ? Math.max(0, activeIndex - 1) : activeIndex
  );
  const [pending, setPending] = useState<UnifiedMapNode | null>(null);
  const [trail, setTrail] = useState<number[]>([avatarIndex]);
  const [discovery, setDiscovery] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const voiceRequest = useRef(0);
  const [voiceError, setVoiceError] = useState(false);
  const stops = nodes.map((node, index) => ({ node, xy: point(index, nodes.length) }));
  const currentPoint = point(activeIndex, nodes.length);
  const destination = point(avatarIndex, nodes.length);
  const moving = !!pending;
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ completed, power: magicPower }));
    } catch {
      /* Storage is optional. */
    }
  }, [storageKey, completed, magicPower]);
  useEffect(() => {
    if (!celebrating) return;
    setTrail([Math.max(0, activeIndex - 1), activeIndex]);
    setAvatarIndex(activeIndex);
    const timer = window.setTimeout(() => setCelebrating(false), 4500);
    return () => window.clearTimeout(timer);
  }, [activeIndex, celebrating]);
  useEffect(
    () => () => {
      voiceRequest.current++;
      ttsService.stop();
    },
    []
  );

  function select(node: UnifiedMapNode, index: number) {
    if (moving) return;
    if (!node.unlocked || index === avatarIndex || reduced) {
      onSelectNode(node);
      return;
    }
    const direction = index > avatarIndex ? 1 : -1;
    setTrail(
      Array.from(
        { length: Math.abs(index - avatarIndex) + 1 },
        (_, step) => avatarIndex + step * direction
      )
    );
    setAvatarIndex(index);
    setPending(node);
  }
  async function discover(index: number) {
    setDiscovery(index);
    setVoiceError(false);
    const request = ++voiceRequest.current;
    try {
      await ttsService.speakWord(landmarks[index]!.word);
    } catch {
      if (request === voiceRequest.current) setVoiceError(true);
    }
  }
  const progressPoints = stops
    .slice(0, completed === nodes.length ? nodes.length : activeIndex + 1)
    .map(stop => stop.xy.join(','))
    .join(' ');
  return (
    <div
      id="adventure-map"
      tabIndex={0}
      className={styles.map}
      data-paused={paused || reduced}
      aria-label="萌芽之森故事地图，沿主路径探索关卡"
      data-testid="forest-journey"
    >
      <img
        className={styles.art}
        src={`${import.meta.env.BASE_URL}images/maps/desktop-sprout-forest-v2.webp`}
        alt=""
      />
      <div
        className={styles.mist}
        style={{ '--frontier': `${currentPoint[0]! + 10}%` } as CSSProperties}
      />
      <svg
        className={styles.paths}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={stops.map(stop => stop.xy.join(',')).join(' ')}
          className={styles.pathEdge}
        />
        <motion.polyline
          points={progressPoints}
          className={styles.pathDone}
          initial={{ pathLength: celebrating && !reduced ? 0 : 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        />
      </svg>
      <div className={styles.ambience} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      {discovery === 0 && <div className={styles.houseLight} aria-hidden="true" />}
      <div className={styles.tools}>
        <span>
          <b>{completed}</b> / {nodes.length} 皇冠
        </span>
        <button onClick={() => setPaused(value => !value)} aria-pressed={paused}>
          {paused ? '开启环境动态' : '暂停环境动态'}
        </button>
      </div>
      {landmarks.map((landmark, index) => (
        <button
          key={landmark.word}
          className={styles.landmark}
          data-discovered={discovery === index}
          style={{
            left: `${landmark.x}%`,
            top: index === 0 ? `max(${landmark.y}%, 280px)` : `${landmark.y}%`,
          }}
          aria-label={`探索${landmark.name}，听英语`}
          onClick={() => void discover(index)}
        >
          <span aria-hidden="true">
            <landmark.icon size={30} strokeWidth={1.5} />
          </span>
          <small>
            <Volume2 size={12} /> {landmark.word}
          </small>
        </button>
      ))}
      <div className={styles.discovery} role="status">
        {discovery !== null && (
          <>
            <Sparkles size={16} /> {landmarks[discovery]!.hint}
            {voiceError && '（语音暂不可用）'}
          </>
        )}
      </div>
      <ol className={styles.stops} aria-label="故事关卡">
        {stops.map(({ node, xy }, index) => (
          <li key={node.id} style={{ left: `${xy[0]}%`, top: `${xy[1]}%` }}>
            <button
              data-testid={`map-node-${node.storyId || node.id}`}
              className={styles.node}
              data-completed={node.completed}
              data-unlocked={node.unlocked}
              aria-current={activeNode?.id === node.id ? 'step' : undefined}
              disabled={moving}
              aria-label={`${node.titleCn}，${node.completed ? '已完成，可重温' : node.unlocked ? '可以开始' : '未解锁，查看条件'}`}
              onClick={() => select(node, index)}
            >
              {node.completed ? (
                <Check size={20} />
              ) : !node.unlocked ? (
                <LockKeyhole size={14} />
              ) : node.isLevelEnd ? (
                <Crown size={23} />
              ) : (
                index + 1
              )}
              <span className={styles.label}>
                {node.titleCn}
                <small>
                  {node.completed
                    ? '已完成 · 再读一次'
                    : node.unlocked
                      ? '点击出发'
                      : '点击查看解锁条件'}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <motion.div
        className={styles.avatar}
        data-moving={moving}
        data-facing={avatarIndex < trail[0]! ? 'left' : 'right'}
        data-testid="forest-avatar"
        aria-hidden="true"
        initial={{
          left: `${point(celebrating ? Math.max(0, activeIndex - 1) : activeIndex, nodes.length)[0]}%`,
          top: `${point(celebrating ? Math.max(0, activeIndex - 1) : activeIndex, nodes.length)[1]}%`,
        }}
        animate={{
          left: reduced ? `${destination[0]}%` : trail.map(i => `${point(i, nodes.length)[0]}%`),
          top: reduced ? `${destination[1]}%` : trail.map(i => `${point(i, nodes.length)[1]}%`),
        }}
        transition={{
          duration: reduced ? 0 : Math.min(2.5, Math.max(0.55, trail.length * 0.18)),
          ease: 'linear',
        }}
        onAnimationComplete={() => {
          if (pending) {
            onSelectNode(pending);
            setPending(null);
          }
        }}
      >
        <span className={styles.pony} />
        <small>{moving ? '出发！' : '我在这里'}</small>
      </motion.div>
      {celebrating && (
        <div className={styles.reward} role="status" data-testid="forest-reward">
          <Crown size={32} />
          <strong>故事皇冠点亮了！</strong>
          <span>
            {magicPower > (previous?.power ?? magicPower)
              ? `+${magicPower - previous!.power} 魔力 · `
              : ''}
            新的旅程已开启
          </span>
        </div>
      )}
      {celebrating && !reduced && (
        <motion.div
          className={styles.flyingReward}
          aria-hidden="true"
          initial={{
            left: `${currentPoint[0]}%`,
            top: `${currentPoint[1]}%`,
            opacity: 1,
            scale: 1.5,
          }}
          animate={{ left: '92%', top: '6%', opacity: 0, scale: 0.6 }}
          transition={{ duration: 1.5, delay: 0.7, ease: 'easeInOut' }}
        >
          <Sparkles size={32} />
        </motion.div>
      )}
    </div>
  );
}
