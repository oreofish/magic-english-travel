// Percent anchors shared by the 3D bubbles and their accessible HTML story buttons.
export const oceanStops: [number, number][] = [
  [7.3, 75],
  [13, 71],
  [19, 66],
  [25, 63],
  [31, 65],
  [37, 68],
  [43, 68],
  [49, 64],
  [55, 56],
  [62, 51],
  [68, 52.5],
  [74, 55],
  [80, 54],
  [87, 48],
  [94, 42],
];

export function oceanWaveAt(x: number, seconds: number): number {
  return Math.sin(seconds * 0.55 - x * 0.085) * 0.22 + Math.sin(seconds * 0.31 - x * 0.14) * 0.08;
}

export function oceanPointAt(x: number, y: number, seconds: number): [number, number] {
  return [x + Math.sin(seconds * 0.35 - x * 0.06) * 0.09, y + oceanWaveAt(x, seconds)];
}

export function oceanStopAt(index: number, seconds: number): [number, number] {
  const [x, y] = oceanStops[index]!;
  return oceanPointAt(x, y, seconds);
}

export const oceanFishCount = 36;

export function oceanFishAt(index: number, seconds: number, halfWidth: number) {
  const school = Math.floor(index / 6);
  const depth = school % 3;
  const scale = [0.45, 0.75, 1.25][depth]!;
  const member = index % 6;
  const direction = school % 2 ? -1 : 1;
  const progress =
    (0.12 + school * 0.137 + member * 0.018 * scale + seconds * (0.0025 + depth * 0.001)) % 1;
  const span = halfWidth * 2 + 1.2;
  return {
    x: (progress * span - span / 2) * direction,
    y:
      [1.1, 0.25, -1.15, -0.65, -2.4, -2.8][school]! +
      ((member % 3) - 1) * 0.085 * scale +
      Math.sin(seconds * 0.38 + school) * 0.06 +
      Math.sin(seconds * 0.5 + member) * 0.015,
    z: [-0.75, 0, 0.7][depth]!,
    scale,
    haze: [0.8, 0.42, 0][depth]!,
    direction,
  };
}
