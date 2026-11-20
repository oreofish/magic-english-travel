import { EmojiIllustration } from '@/components/common/EmojiIllustration';
/**
 * CardGallery 组件
 * 卡牌图鉴展示页面
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicCard } from '../MagicCard';
import type { CardData } from '@/services/cardCollectionService';
import { RARITY_CONFIG, type CardRarity } from '@/services/cardCollectionService';
import styles from './CardGallery.module.css';

interface CardGalleryProps {
  /** 卡牌列表 */
  cards: CardData[];
  /** 当前等级总卡牌数 */
  totalCards?: number;
  /** 点击卡牌回调 */
  onCardClick?: (card: CardData) => void;
}

type FilterType = 'all' | CardRarity;

export const CardGallery: React.FC<CardGalleryProps> = ({
  cards,
  totalCards = 60,
  onCardClick,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rarity' | 'mastery'>('recent');

  // 过滤卡牌
  const filteredCards = cards.filter(card => {
    if (filter === 'all') return true;
    return card.rarity === filter;
  });

  // 排序卡牌
  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.obtainedAt - a.obtainedAt;
      case 'rarity': {
        const rarityOrder: CardRarity[] = ['gold', 'blue', 'green', 'white'];
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
      }
      case 'mastery':
        return b.masteryLevel - a.masteryLevel;
      default:
        return 0;
    }
  });

  // 统计各稀有度数量
  const rarityStats = cards.reduce(
    (acc, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    },
    {} as Record<CardRarity, number>
  );

  const filterOptions: Array<{ value: FilterType; label: string; count: number }> = [
    { value: 'all', label: '全部', count: cards.length },
    { value: 'gold', label: '传说', count: rarityStats.gold || 0 },
    { value: 'blue', label: '稀有', count: rarityStats.blue || 0 },
    { value: 'green', label: '精良', count: rarityStats.green || 0 },
    { value: 'white', label: '普通', count: rarityStats.white || 0 },
  ];

  return (
    <div className={styles.container}>
      {/* 收集进度 */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressTitle}>
            <EmojiIllustration>{'📚'}</EmojiIllustration> 收集进度
          </span>
          <span className={styles.progressCount}>
            {cards.length} / {totalCards}
          </span>
        </div>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${(cards.length / totalCards) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 筛选器 */}
      <div className={styles.filters}>
        <div className={styles.filterTabs}>
          {filterOptions.map(option => (
            <button
              key={option.value}
              className={`${styles.filterTab} ${filter === option.value ? styles.active : ''}`}
              onClick={() => setFilter(option.value)}
              style={{
                borderColor:
                  option.value !== 'all'
                    ? RARITY_CONFIG[option.value as CardRarity]?.color
                    : undefined,
              }}
            >
              <span>{option.label}</span>
              <span className={styles.filterCount}>{option.count}</span>
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="recent">最近获得</option>
          <option value="rarity">按稀有度</option>
          <option value="mastery">按掌握度</option>
        </select>
      </div>

      {/* 卡牌网格 */}
      <div className={styles.cardGrid}>
        <AnimatePresence>
          {sortedCards.map((card, index) => (
            <motion.div
              key={card.id}
              className={styles.cardWrapper}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onCardClick?.(card)}
            >
              <MagicCard
                word={card.word}
                meaningCn={card.meaningCn}
                emoji={card.emoji}
                rarity={card.rarity}
                masteryLevel={card.masteryLevel}
                size="sm"
              />
              {card.isNew && <div className={styles.newBadge}>NEW</div>}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空位占位 */}
        {Array.from({ length: Math.max(0, 8 - sortedCards.length) }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptySlot}>
            <span className={styles.emptyIcon}>
              <EmojiIllustration>{'❓'}</EmojiIllustration>
            </span>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {sortedCards.length === 0 && filter !== 'all' && (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>
            <EmojiIllustration>{'🔍'}</EmojiIllustration>
          </span>
          <p>还没有{filterOptions.find(f => f.value === filter)?.label}卡牌</p>
          <p className={styles.emptyHint}>继续学习来获得更多卡牌！</p>
        </div>
      )}
    </div>
  );
};

export default CardGallery;
