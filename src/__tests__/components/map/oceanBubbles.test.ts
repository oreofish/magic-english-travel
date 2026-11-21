import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createStoryBubbles } from '@/pages/MapPage/oceanBubbles';

describe('physical 3D story bubbles', () => {
  it('builds transmissive sphere meshes with real depth and no bubble image map', () => {
    const mesh = createStoryBubbles(15);
    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(15);
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
    expect(mesh.geometry.attributes.position.count).toBeGreaterThan(1000);
    mesh.geometry.computeBoundingBox();
    expect(mesh.geometry.boundingBox!.max.z - mesh.geometry.boundingBox!.min.z).toBeCloseTo(2);
    expect(mesh.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    expect(mesh.material.transmission).toBe(1);
    expect(mesh.material.map).toBeNull();
    expect(mesh.material.iridescence).toBeGreaterThan(0);
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh.dispose();
  });
});
