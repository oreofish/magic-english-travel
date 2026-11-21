import * as THREE from 'three';

/** Actual transmissive sphere meshes; the lesson label remains an HTML overlay. */
export function createStoryBubbles(count: number) {
  const geometry = new THREE.SphereGeometry(1, 40, 28);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xf2fcff,
    metalness: 0,
    roughness: 0.04,
    transmission: 1,
    thickness: 0.06,
    ior: 1.15,
    opacity: 1,
    clearcoat: 0.65,
    clearcoatRoughness: 0.06,
    iridescence: 0.7,
    iridescenceIOR: 1.25,
    iridescenceThicknessMinimum: 90,
    iridescenceThicknessMaximum: 320,
    envMapIntensity: 1.1,
    depthWrite: false,
  });
  return new THREE.InstancedMesh(geometry, material, count);
}
