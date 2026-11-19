import { useId } from 'react';
import styles from './DesktopMap.module.css';

export default function EchoValleyScenery() {
  const id = useId();
  const detail = `${id}-detail`;
  const head = `${id}-head`;
  const rock = `${id}-rock`;
  const soften = `${id}-soften`;

  return (
    <svg
      className={styles.valleyScenery}
      viewBox="0 0 1672 941"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <image
          id={detail}
          href={`${import.meta.env.BASE_URL}images/maps/echo-valley-goat-detail.png`}
          x="1320"
          y="90"
          width="125"
          height="65"
        />
        <clipPath id={head}>
          <path d="M1376 112 L1380 111 L1384 116 L1385 108 L1389 104 L1390 107 L1388 115 L1390 116 L1397 108 L1400 107 L1399 110 L1393 116 L1400 120 L1408 121 Q1410 129 1404 137 L1396 137 L1386 130 L1382 133 L1378 132 L1379 126 L1382 118 Z" />
        </clipPath>
        <filter id={soften} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <mask id={rock} maskUnits="userSpaceOnUse" x="1368" y="98" width="47" height="48">
          <path
            d="M1372 105 Q1386 97 1407 102 L1406 114 L1400 119 L1400 135 L1395 139 L1386 133 L1381 136 L1374 133 L1376 123 Z"
            fill="white"
            filter={`url(#${soften})`}
          />
        </mask>
      </defs>
      <g className={styles.creekGlints}>
        <path
          className={styles.distantGlints}
          d="M1051 341 Q1084 344 1050 354 T1055 370 Q1079 375 1034 387 Q1010 396 1069 409 Q1111 422 1051 441 Q1005 454 1110 479 C1180 498 1282 505 1328 552 Q1345 583 1258 622"
        />
        <path d="M1084 668 C1021 694 929 729 838 746 S663 768 561 789 S370 797 248 835 S78 877 8 911" />
        <path
          className={styles.outerGlints}
          d="M1071 693 C1004 737 866 774 759 788 S556 812 458 817 S269 850 176 876 S68 903 2 929"
        />
      </g>
      <path
        d="M1399 164 Q1398 158 1394 156 M1399 164 Q1400 158 1399 154 M1399 164 Q1402 159 1404 158"
        fill="none"
        stroke="#788741"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <g className={styles.grazingGoat}>
        <g mask={`url(#${rock})`}>
          <use href={`#${detail}`} x="47" />
        </g>
        <g className={styles.goatHead}>
          <use href={`#${detail}`} clipPath={`url(#${head})`} />
        </g>
      </g>
    </svg>
  );
}
