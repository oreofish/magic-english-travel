import assets from '@/data/emojiAssets.json';

/** Local artwork keeps decorative icons visible without system emoji fonts. */
export function EmojiIllustration({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const files = (assets as Record<string, string[]>)[children]
    ?? (/\p{Extended_Pictographic}|\u20e3/u.test(children) ? assets['✨'] : undefined);
  if (!files) return <span className={className} aria-hidden="true">{children}</span>;
  return (
    <span
      className={className}
      aria-hidden="true"
      data-emoji-illustration
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        gap: '0.08em',
        lineHeight: 1,
      }}
    >
      {files.map((file, index) => (
        <img
          key={`${file}-${index}`}
          src={`${import.meta.env.BASE_URL}images/quiz/${file}`}
          alt=""
          draggable={false}
          width="56"
          height="56"
          style={{ width: '1em', height: '1em', objectFit: 'contain' }}
        />
      ))}
    </span>
  );
}
