import { EmojiIllustration } from '@/components/common/EmojiIllustration';
import { getQuizEmoji } from './quizIllustrations';

export function QuizIllustration({ image, className }: { image?: string; className?: string }) {
  const symbol = getQuizEmoji(image);
  return symbol ? (
    <span data-quiz-illustration>
      <EmojiIllustration className={className}>{symbol}</EmojiIllustration>
    </span>
  ) : null;
}
