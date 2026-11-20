import { EmojiIllustration } from '@/components/common/EmojiIllustration';
/**
 * CardReveal 组件
 * 卡牌揭示/开包动画
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicCard } from '../MagicCard';
import type { CardData } from '@/services/cardCollectionService';
import { RARITY_CONFIG } from '@/services/cardCollectionService';
import { Button } from '@/components/common';
import styles from './CardReveal.module.css';

interface CardRevealProps {
  /** 要揭示的卡牌 */
  card: CardData;
  /** 关闭回调 */
  onClose: () => void;
  /** 是否新卡 */
  isNew?: boolean;
}

type RevealPhase = 'glow' | 'flip' | 'reveal' | 'complete';

export const CardReveal: React.FC<CardRevealProps> = ({ card, onClose, isNew = true }) => {
  const [phase, setPhase] = useState<RevealPhase>('glow');
  const config = RARITY_CONFIG[card.rarity];

  // 开始揭示
  const handleReveal = useCallback(async () => {
    setPhase('flip');
    await new Promise(resolve => setTimeout(resolve, 800));
    setPhase('reveal');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPhase('complete');
  }, []);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.container}>
        {/* 背景光效 */}
        <AnimatePresence>
          {(phase === 'reveal' || phase === 'complete') && (
            <motion.div
              className={styles.bgGlow}
              style={{
                background: `radial-gradient(circle, ${config.color}40 0%, transparent 70%)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </AnimatePresence>

        {/* 粒子效果 */}
        {phase === 'reveal' && (
          <div className={styles.particles}>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.particle}
                style={{ background: config.color }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )}

        {/* 卡牌展示 */}
        <div className={styles.cardStage}>
          <AnimatePresence mode="wait">
            {phase === 'glow' && (
              <motion.div
                key="pack"
                className={styles.cardPack}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0, rotateY: 90 }}
                onClick={handleReveal}
              >
                <div className={styles.packGlow} />
                <div className={styles.packIcon}>
                  <EmojiIllustration>{'🎁'}</EmojiIllustration>
                </div>
                <p className={styles.packText}>点击开启</p>
              </motion.div>
            )}

            {(phase === 'flip' || phase === 'reveal' || phase === 'complete') && (
              <motion.div
                key="card"
                className={styles.cardWrapper}
                initial={{ scale: 0.5, rotateY: -90, opacity: 0 }}
                animate={{
                  scale: phase === 'complete' ? 1 : 1.2,
                  rotateY: 0,
                  opacity: 1,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <MagicCard
                  word={card.word}
                  meaningCn={card.meaningCn}
                  emoji={card.emoji}
                  rarity={card.rarity}
                  masteryLevel={card.masteryLevel}
                  size="lg"
                  flippable={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 信息展示 */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              className={styles.info}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isNew ? (
                <>
                  <div className={styles.newBadge}>
                    <EmojiIllustration>{'✨'}</EmojiIllustration> 新卡牌！
                  </div>
                  <h2 className={styles.rarityTitle} style={{ color: config.color }}>
                    {config.nameCn}
                  </h2>
                </>
              ) : (
                <div className={styles.upgradeBadge}>
                  <EmojiIllustration>{'⬆️'}</EmojiIllustration> 掌握度提升！
                </div>
              )}

              <p className={styles.cardWord}>{card.word}</p>
              <p className={styles.cardMeaning}>{card.meaningCn}</p>

              <Button variant="primary" onClick={onClose}>
                太棒了！
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CardReveal;
