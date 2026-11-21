import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import styles from './OceanScene.module.css';

export default function OceanScene() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (reduced || paused || failed || !host.current) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    setReady(false);
    // Load the renderer only when this sea scene needs animation.
    void import('./createOceanScene')
      .then(({ createOceanScene }) => {
        if (cancelled || !host.current) return;
        dispose = createOceanScene(host.current, () => setFailed(true));
        host.current.parentElement?.setAttribute('data-ocean-rendered', 'true');
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    const map = host.current.parentElement;
    return () => {
      map?.removeAttribute('data-ocean-rendered');
      cancelled = true;
      dispose?.();
    };
  }, [reduced, paused, failed]);

  return (
    <>
      <div
        ref={host}
        className={styles.layer}
        aria-hidden="true"
        data-testid="ocean-3d"
        data-state={
          failed
            ? 'fallback'
            : reduced
              ? 'reduced'
              : paused
                ? 'paused'
                : ready
                  ? 'ready'
                  : 'loading'
        }
      />
      {!failed && (
        <button
          className={styles.control}
          disabled={!!reduced}
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
        >
          {reduced ? '已减少动态效果' : paused ? '开启海洋动态' : '暂停海洋动态'}
        </button>
      )}
    </>
  );
}
