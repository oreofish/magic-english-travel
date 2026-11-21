import { describe, expect, it } from 'vitest';
import {
  oceanStops,
  oceanStopAt,
  oceanFishAt,
  oceanFishCount,
  oceanWaveAt,
  oceanPointAt,
} from '@/pages/MapPage/oceanLayout';

describe('ocean motion shared by 3D bubbles and story buttons', () => {
  it('keeps every story underwater and limits the bob to a few pixels', () => {
    expect(oceanStops).toHaveLength(15);
    oceanStops.forEach(([x, y], index) => {
      for (const time of [0, 1, 5, 10, 100]) {
        const point = oceanStopAt(index, time);
        expect(Math.abs(point[0] - x)).toBeLessThanOrEqual(0.091);
        expect(Math.abs(point[1] - y)).toBeLessThanOrEqual(0.301);
        expect(point[1]).toBeGreaterThan(30);
      }
      expect(oceanStopAt(index, 1)).not.toEqual(oceanStopAt(index, 0));
    });
  });
  it('drifts the entire bubble chain along one smooth travelling water wave', () => {
    for (const time of [0, 2, 10, 30]) {
      for (let x = 5; x < 95; x++) {
        expect(Math.abs(oceanWaveAt(x, time) - oceanWaveAt(x + 1, time))).toBeLessThan(0.04);
        expect(oceanPointAt(x, 60, time)[1]).toBeCloseTo(60 + oceanWaveAt(x, time));
      }
    }
    expect(oceanWaveAt(20, 0)).not.toBe(oceanWaveAt(20, 3));
  });
  it('moves all small fish gently, without a visible jump when they wrap', () => {
    for (let index = 0; index < oceanFishCount; index++) {
      const before = oceanFishAt(index, 10, 6.4);
      const after = oceanFishAt(index, 11, 6.4);
      expect(Math.abs(after.x - before.x)).toBeGreaterThan(0.01);
      expect(Math.abs(after.x - before.x)).toBeLessThan(0.1);
      expect(after.y).toBeLessThan(1.6);
      expect(after.y).toBeGreaterThan(-3.5);
      for (const time of [0, 20, 200, 1000]) {
        const fish = oceanFishAt(index, time, 6.4);
        expect(Math.abs(fish.x)).toBeLessThanOrEqual(7);
      }
    }
  });
  it('keeps distant schools smaller, darker and slower than nearby schools', () => {
    for (const start of [0, 18]) {
      const far = oceanFishAt(start, 10, 6.4);
      const middle = oceanFishAt(start + 6, 10, 6.4);
      const near = oceanFishAt(start + 12, 10, 6.4);
      expect(far.scale).toBeLessThan(middle.scale);
      expect(middle.scale).toBeLessThan(near.scale);
      expect(far.haze).toBeGreaterThan(middle.haze);
      expect(middle.haze).toBeGreaterThan(near.haze);
      expect(far.z).toBeLessThan(middle.z);
      expect(middle.z).toBeLessThan(near.z);
      const farSpeed = Math.abs(oceanFishAt(start, 11, 6.4).x - far.x);
      const nearSpeed = Math.abs(oceanFishAt(start + 12, 11, 6.4).x - near.x);
      expect(farSpeed).toBeLessThan(nearSpeed);
    }
  });
});
