import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import assets from '@/data/emojiAssets.json';
import { allDictionary } from '@/data';
import { ACHIEVEMENTS } from '@/services/achievementService';
import { EVOLUTION_CONFIG, MOOD_CONFIG } from '@/services/buddyService';

const illustrations: Record<string, string[]> = assets;
describe('shared decorative illustrations', () => {
  it('ships actual SVGs for every registered icon', () => {
    for (const files of Object.values(illustrations))
      for (const file of files) {
        const path = resolve('public/images/quiz', file);
        expect(existsSync(path), file).toBe(true);
        expect(readFileSync(path, 'utf8'), file).toContain('<svg');
      }
  });
  it('covers all dictionary card, achievement, evolution and mood icons', () => {
    const symbols = [
      ...allDictionary.map(entry => entry.emoji),
      ...ACHIEVEMENTS.map(achievement => achievement.icon),
      ...Object.values(EVOLUTION_CONFIG).map(config => config.avatar),
      ...Object.values(MOOD_CONFIG).map(config => config.emoji),
    ].filter((symbol): symbol is string => !!symbol && /\p{Extended_Pictographic}|\u20e3/u.test(symbol));
    expect([...new Set(symbols)].filter(symbol => !illustrations[symbol])).toEqual([]);
  });
});
