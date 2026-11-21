import * as THREE from 'three';
import { createStoryBubbles } from './oceanBubbles';
import { oceanStops, oceanStopAt, oceanFishAt, oceanFishCount, oceanPointAt } from './oceanLayout';

/** Transparent 3D scenery aligned with the illustrated sea and HTML lesson stops. */
export function createOceanScene(host: HTMLElement, onContextLost: () => void): () => void {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.transmissionResolutionScale = 1;
  const canvas = renderer.domElement;
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const map = host.parentElement;
  const stopElements = oceanStops.map((_, index) =>
    map?.querySelector<HTMLElement>(`[data-ocean-stop="${index}"]`)
  );
  let viewHeight = 900;
  canvas.dataset.fishCount = String(oceanFishCount);
  canvas.dataset.storyBubbles = String(oceanStops.length);
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 40);
  camera.position.z = 12;
  let disposed = false;
  // A quiet blue environment and two soft reflections, rather than indoor light panels.
  const reflectionScene = new THREE.Scene();
  reflectionScene.background = new THREE.Color(0x9ddde8);
  const reflectionGeometry = new THREE.CircleGeometry(1, 40);
  const reflectionMaterials = [
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(12, 13, 13) }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(2, 3, 3) }),
  ];
  const keyReflection = new THREE.Mesh(reflectionGeometry, reflectionMaterials[0]);
  keyReflection.position.set(-3, 4, 6);
  keyReflection.scale.setScalar(1.7);
  keyReflection.lookAt(0, 0, 0);
  const fillReflection = new THREE.Mesh(reflectionGeometry, reflectionMaterials[1]);
  fillReflection.position.set(4, -4, 4);
  fillReflection.scale.setScalar(0.9);
  fillReflection.lookAt(0, 0, 0);
  reflectionScene.add(keyReflection, fillReflection);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(reflectionScene, 0.08, 0.1, 100, { size: 256 });
  scene.environment = environment.texture;
  reflectionGeometry.dispose();
  reflectionMaterials.forEach(material => material.dispose());
  pmrem.dispose();
  // The real sea behind the spheres supplies their refracted view, not a bubble sprite.
  const background = new THREE.TextureLoader().load(
    `${import.meta.env.BASE_URL}images/maps/desktop-shimmering-sea-clean.webp`,
    texture => {
      if (!disposed) scene.background = texture;
    }
  );
  background.colorSpace = THREE.SRGBColorSpace;
  let halfWidth = 6;
  let elapsed = 0;
  let previousTime = 0;
  let frames = 0;
  const pointer = new THREE.Vector2();
  scene.add(new THREE.HemisphereLight(0xe2fbff, 0x19557d, 2.5));
  const sun = new THREE.DirectionalLight(0xffefc4, 3);
  sun.position.set(-3, 8, 8);
  scene.add(sun);

  // Water ribbons and caustics use GPU shading without covering the existing art.
  const uniforms = { time: { value: 0 } };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 96, 12),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; uniform float time;
      void main(){vUv=uv; vec3 p=position;
        p.y += sin(p.x*46.0+time*1.5)*0.045 + sin(p.x*19.0-time)*0.025;
        p.z += sin(p.x*28.0+time)*0.025;
        p.y += (sin(time*0.55-uv.x*8.5)*0.22+sin(time*0.31-uv.x*14.0)*0.08)*0.08;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragmentShader: `varying vec2 vUv; uniform float time;
      void main(){float wave=sin(vUv.x*90.0+sin(vUv.y*18.0+time)+time*1.8);
        float edge=sin(vUv.y*3.14159);
        float sparkle=smoothstep(0.55,1.0,wave)*edge;
        float sunOffset=(vUv.x-0.55)*8.0;
        vec3 c=mix(vec3(0.35,0.88,1.0),vec3(1.0,0.85,0.47),exp(-sunOffset*sunOffset));
        gl_FragColor=vec4(c,sparkle*0.4);}`,
    })
  );
  water.position.set(0, 2.04, -0.4);
  water.scale.set(12, 0.55, 1);
  scene.add(water);
  const caustics = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec2 vUv;uniform float time;
      void main(){if(vUv.y>0.72)discard;
        float a=sin((vUv.x+vUv.y*0.6)*58.0+time*0.4);
        float b=sin((vUv.y-vUv.x*0.25)*47.0-time*0.3);
        float light=max(0.0,1.0-abs(a+b));
        light=light*light*light; light=light*light;
        float fade=1.0-smoothstep(0.35,0.72,vUv.y);
        gl_FragColor=vec4(0.55,0.96,1.0,light*fade*0.1);}`,
    })
  );
  caustics.scale.set(12, 8, 1);
  caustics.position.z = -1;
  scene.add(caustics);

  const bubbleGeometry = new THREE.SphereGeometry(1, 14, 10);
  const bubbleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vNormal;
      void main(){vNormal=normalize(normalMatrix*normal);
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vNormal;
      void main(){vec3 n=normalize(vNormal);
        float rim=1.0-abs(n.z);rim= rim*rim;
        float shine=max(0.0,dot(n,normalize(vec3(-0.45,0.7,0.55))));
        shine=shine*shine*shine;shine=shine*shine;
        vec3 color=mix(vec3(0.45,0.88,1.0),vec3(1.0),shine);
        gl_FragColor=vec4(color,0.025+rim*0.72+shine*0.5);}`,
  });
  const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 12);
  const storyBubbles = createStoryBubbles(oceanStops.length);
  const pathBubbles = new THREE.InstancedMesh(
    storyBubbles.geometry,
    storyBubbles.material,
    (oceanStops.length - 1) * 4
  );
  canvas.dataset.pathBubbles = String(pathBubbles.count);
  const dummy = new THREE.Object3D();
  scene.add(bubbles, storyBubbles, pathBubbles);

  const bodyGeometry = new THREE.SphereGeometry(1, 20, 12);
  const tailGeometry = new THREE.ConeGeometry(1, 1, 3);
  const eyeGeometry = new THREE.SphereGeometry(1, 8, 6);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x102d47 });
  const waterColor = new THREE.Color(0x14577a);
  const fish = Array.from({ length: oceanFishCount }, (_, index) => {
    const { scale, haze } = oceanFishAt(index, 0, halfWidth);
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color([0xffb64e, 0x57d9ee, 0xff8e71][index % 3])
        .lerp(waterColor, haze)
        .multiplyScalar(1 - haze * 0.5),
      specular: new THREE.Color(0x111111).multiplyScalar(1 - haze),
      shininess: 65,
    });
    const body = new THREE.Mesh(bodyGeometry, material);
    body.scale.set(0.23, 0.105, 0.075);
    group.add(body);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.scale.set(0.13, 0.24, 0.08);
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -0.26;
    group.add(tail);
    const fin = new THREE.Mesh(tailGeometry, material);
    fin.scale.set(0.07, 0.12, 0.045);
    fin.position.set(-0.03, 0.11, 0);
    group.add(fin);
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.scale.setScalar(0.018);
    eye.position.set(0.14, 0.025, 0.072);
    group.add(eye);
    group.scale.setScalar((0.26 + (index % 4) * 0.04) * 0.5 * scale);
    scene.add(group);
    return { group, tail, phase: index * 1.73 };
  });

  const kelp = Array.from({ length: 8 }, (_, index) => {
    const geometry = new THREE.PlaneGeometry(0.11, 1.1 + (index % 3) * 0.3, 2, 14);
    geometry.translate(0, 0.6, 0);
    const original = Float32Array.from(geometry.attributes.position.array);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: index % 2 ? 0x4eaf75 : 0x26988b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        shininess: 28,
      })
    );
    mesh.rotation.y = index * 0.35;
    scene.add(mesh);
    return { mesh, original };
  });

  function draw() {
    uniforms.time.value = elapsed;
    water.scale.x = caustics.scale.x = halfWidth * 2;
    for (let index = 0; index < 12; index++) {
      const progress = (elapsed * (0.025 + (index % 4) * 0.004) + index * 0.153) % 1;
      dummy.position.set(
        (((index * 0.381) % 1) * 2 - 1) * halfWidth + Math.sin(elapsed + index) * 0.08,
        -3.7 + progress * 5.55,
        (index % 5) * 0.22
      );
      dummy.scale.setScalar(0.018 + (index % 4) * 0.012);
      dummy.updateMatrix();
      bubbles.setMatrixAt(index, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
    const anchors = oceanStops.map((_, index) => oceanStopAt(index, elapsed));
    const pixel = 8 / viewHeight;
    function putBubble(
      mesh: THREE.InstancedMesh,
      index: number,
      x: number,
      y: number,
      radius: number
    ) {
      dummy.position.set((x / 50 - 1) * halfWidth, 4 - y * 0.08, 1.6);
      const breath = Math.sin(elapsed * 0.55 - x * 0.085) * 0.012;
      dummy.scale.set(radius * pixel * (1 + breath), radius * pixel * (1 - breath), radius * pixel);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    anchors.forEach(([x, y], index) => {
      putBubble(storyBubbles, index, x, y, 22);
      const element = stopElements[index];
      if (element) {
        element.style.left = `${x}%`;
        element.style.top = `${y}%`;
      }
      if (index === 0) return;
      const [previousX, previousY] = oceanStops[index - 1]!;
      const [baseX, baseY] = oceanStops[index]!;
      for (let step = 1; step <= 4; step++) {
        const fraction = step / 5;
        const [bubbleX, bubbleY] = oceanPointAt(
          previousX + (baseX - previousX) * fraction,
          previousY + (baseY - previousY) * fraction,
          elapsed
        );
        putBubble(pathBubbles, (index - 1) * 4 + step - 1, bubbleX, bubbleY, step % 2 ? 4 : 6);
      }
    });
    storyBubbles.instanceMatrix.needsUpdate = true;
    pathBubbles.instanceMatrix.needsUpdate = true;
    fish.forEach(({ group, tail, phase }, index) => {
      const { x, y, z, scale, direction } = oceanFishAt(index, elapsed, halfWidth);
      group.position.set(x + pointer.x * 0.025 * scale, y, z + (index % 6) * 0.015);
      group.rotation.set(
        Math.sin(elapsed + phase) * 0.1,
        Math.sin(elapsed * 1.5 + phase) * 0.28,
        Math.sin(elapsed * 1.1 + phase) * 0.04
      );
      group.scale.x = Math.abs(group.scale.x) * direction;
      tail.rotation.y = Math.sin(elapsed * 3.4 + phase) * 0.55;
    });
    kelp.forEach(({ mesh, original }, index) => {
      mesh.position.set(
        (index < 4 ? -1 : 1) * halfWidth * (0.94 - (index % 4) * 0.022),
        -3.85,
        0.3
      );
      const position = mesh.geometry.attributes.position;
      for (let vertex = 0; vertex < position.count; vertex++) {
        const y = original[vertex * 3 + 1]!;
        position.setX(
          vertex,
          original[vertex * 3]! + Math.sin(elapsed * 1.1 + y * 2.4 + index) * Math.max(0, y) * 0.14
        );
      }
      position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });
    renderer.render(scene, camera);
    canvas.dataset.frames = String(++frames);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || disposed) return;
    viewHeight = height;
    halfWidth = (4 * width) / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.updateProjectionMatrix();
    // Never enlarge a sub-native buffer; use up to 2× density with a 4K pixel budget.
    renderer.setPixelRatio(
      Math.max(
        1,
        Math.min(window.devicePixelRatio || 1, 2, Math.sqrt((3840 * 2160) / (width * height)))
      )
    );
    renderer.setSize(width, height, false);
    draw();
  }
  function animate(time: number) {
    if (time - previousTime < 1000 / 24) return;
    if (previousTime) elapsed += Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;
    draw();
  }
  function visibility() {
    previousTime = 0;
    renderer.setAnimationLoop(document.hidden ? null : animate);
  }
  function move(event: PointerEvent) {
    const bounds = host.getBoundingClientRect();
    pointer.set(
      (event.clientX - bounds.left) / bounds.width - 0.5,
      (event.clientY - bounds.top) / bounds.height - 0.5
    );
  }
  function contextLost(event: Event) {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    onContextLost();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  canvas.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', visibility);
  map?.addEventListener('pointermove', move);
  resize();
  visibility();
  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    observer.disconnect();
    canvas.removeEventListener('webglcontextlost', contextLost);
    document.removeEventListener('visibilitychange', visibility);
    map?.removeEventListener('pointermove', move);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          materials.add(material);
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    bubbles.dispose();
    pathBubbles.dispose();
    storyBubbles.dispose();
    background.dispose();
    environment.dispose();
    stopElements.forEach((element, index) => {
      if (element) {
        element.style.left = `${oceanStops[index]![0]}%`;
        element.style.top = `${oceanStops[index]![1]}%`;
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
