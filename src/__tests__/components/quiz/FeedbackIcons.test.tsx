import { describe, expect, it, vi } from 'vitest';
import { render } from '../../utils/render';
import { QuizFeedback } from '@/components/quiz/QuizFeedback';
import { QuizResult } from '@/components/quiz/QuizResult';
import { MagicCard } from '@/components/incentive/MagicCard';
import { AchievementCard } from '@/components/incentive/AchievementCard';
import { EmojiIllustration } from '@/components/common/EmojiIllustration';

function expectIllustrations(container: HTMLElement) {
  const images = container.querySelectorAll('[data-emoji-illustration] img');
  expect(images.length).toBeGreaterThan(0);
  for (const image of images)
    expect(image.getAttribute('src')).toMatch(/images\/quiz\/[a-f0-9-]+\.svg$/);
}

describe('feedback and reward icons without emoji fonts', () => {
  it('preserves text symbols and falls back to local art for unknown emoji', () => {
    const { container, rerender } = render(<EmojiIllustration>✓</EmojiIllustration>);
    expect(container).toHaveTextContent('✓');
    rerender(<EmojiIllustration>🫩</EmojiIllustration>);
    expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/2728\.svg$/));
  });
  it.each([true, false])('renders answer feedback as bundled graphics (%s)', isCorrect => {
    const { container } = render(
      <QuizFeedback isCorrect={isCorrect} correctAnswer="apple" onContinue={vi.fn()} />
    );
    expect(container.querySelectorAll('[data-emoji-illustration] img')).toHaveLength(
      isCorrect ? 22 : 1
    );
    expectIllustrations(container);
  });
  it.each([100, 80, 60, 0])('renders result grade and statistics (%s)', score => {
    const { container } = render(
      <QuizResult
        result={{
          score,
          totalQuestions: 3,
          hintsUsed: 0,
          answers: [],
          correctCount: 3,
          wrongCount: 0,
          timeSpent: 10,
          earnedMagicPower: 9,
        }}
        onFinish={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(container.querySelectorAll('[data-emoji-illustration] img')).toHaveLength(
      score >= 60 ? 6 : 7
    );
    expectIllustrations(container);
  });
  it('renders reward cards and unlocked and locked achievements', () => {
    const { container } = render(
      <>
        <MagicCard word="apple" meaningCn="苹果" emoji="🍎" rarity="gold" masteryLevel={1} />
        <AchievementCard
          name="First story"
          nameCn="第一个故事"
          description="读完一个故事"
          icon="🏆"
          unlocked
        />
        <AchievementCard
          name="Reader"
          nameCn="阅读家"
          description="继续阅读"
          icon="📚"
          unlocked={false}
        />
      </>
    );
    expect(container.querySelectorAll('[data-emoji-illustration] img')).toHaveLength(4);
    expectIllustrations(container);
  });
});
