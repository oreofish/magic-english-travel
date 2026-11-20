import assets from '@/data/emojiAssets.json';

// Resolve legacy filenames as well as emoji-valued lessons to local illustrations.
const legacyIllustrations: Record<string, string> = {
  bird_singing: '🐦🎵',
  bird_flying: '🐦🪽',
  bird_eating: '🐦🌾',
  owl: '🦉',
  rabbit: '🐰',
  bear: '🐻',
  mouse: '🐭',
  cat: '🐱',
  dog: '🐶',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  balloons: '🎈',
  kites: '🪁',
  birds: '🐦',
};

export function getQuizEmoji(image?: string): string | undefined {
  if (!image) return undefined;
  if (/^(?:https?:|data:|\/)|\.(?:webp|png|jpg|svg|mp3|wav|ogg)$/i.test(image)) {
    const name =
      image
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') ?? '';
    return legacyIllustrations[name];
  }
  return image;
}

export function getQuizIllustrationFiles(image?: string): string[] | undefined {
  const illustration = getQuizEmoji(image);
  return illustration ? (assets as Record<string, string[]>)[illustration] : undefined;
}
