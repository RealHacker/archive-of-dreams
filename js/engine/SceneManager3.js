// SceneManager3.js - High-fidelity 3D Environment for Story 3: The Heretic's Palette (Venice, 1577)
// Upgraded with Tripo 3D PBR Models + Blender 5.2 Custom Romanesque Crypt Architecture & Props

class SceneManager3 {
  constructor(canvas, interactionManager, audioManager) {
    this.canvas = canvas;
    this.interactionManager = interactionManager;
    this.audioManager = audioManager;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.loadingManager = installAssetTracker(this);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.gltfLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader(this.loadingManager) : null;

    this.player = {
      height: 1.65,
      speed: 2.8,
      velocity: new THREE.Vector3(),
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      isLocked: false
    };

    this.pitch = 0;
    this.yaw = 0;

    this.candleLights = [];
    this.waterMesh = null;
    this.dustParticles = null;
    this.frescoMesh = null;
    this.secretNicheGroup = null;
    this.deskMesh = null;
    this.parchMesh = null;
    this.mosaicPanel = null;
    this.doorMesh = null;

    this.init();
  }

  loadModelAsset(url, targetMaxDim, position, rotationY, fallbackGroup = null, onLoaded = null) {
    if (!this.gltfLoader) return;
    this.gltfLoader.load(
      url,
      (gltf) => {
        if (fallbackGroup && fallbackGroup.parent) {
          fallbackGroup.parent.remove(fallbackGroup);
        }
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.25;
              child.material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = targetMaxDim / maxDim;
        model.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());

        const wrapper = new THREE.Group();
        model.position.set(-center.x, -scaledBox.min.y, -center.z);
        wrapper.add(model);
        wrapper.position.copy(position);
        wrapper.rotation.y = rotationY;
        this.scene.add(wrapper);

        if (onLoaded) onLoaded(wrapper, model);
      },
      undefined,
      (err) => console.warn(`Fallback kept for ${url}:`, err)
    );
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0e14);
    this.scene.fog = new THREE.FogExp2(0x0b0e14, 0.055);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, this.player.height, 2.2);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.setupLighting();
    this.buildCryptArchitecture();
    this.buildFloodedCanalFloor();
    this.buildFrescoWall();
    this.buildApothecaryDesk();
    this.buildSecretNiche();
    this.buildCellarStairsAndDoor();
    this.buildDustParticles();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // Low cool Venetian lagoon ambient + warm candlelight bounce
    const ambient = new THREE.AmbientLight(0x222d40, 0.65);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xfde047, 0x0f172a, 0.35);
    this.scene.add(hemi);

    // Moonlight shaft through high iron-barred canal street grate
    const moonLight = new THREE.DirectionalLight(0x7dd3fc, 0.95);
    moonLight.position.set(4, 5, 2);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Candle 1: On Apothecary Desk (illuminating manuscript, pigments & brass scale)
    const candleDesk = new THREE.PointLight(0xf59e0b, 2.8, 9.0, 1.5);
    candleDesk.position.set(0.45, 1.55, -2.5);
    candleDesk.castShadow = true;
    this.scene.add(candleDesk);
    this.candleLights.push({ light: candleDesk, baseIntensity: 2.8, basePos: candleDesk.position.clone() });

    // Candle 2: Wall sconce illuminating Angel & Great Comet Fresco
    const candleFresco = new THREE.PointLight(0xfbbf24, 2.4, 8.5, 1.5);
    candleFresco.position.set(-1.2, 2.3, -5.4);
    this.scene.add(candleFresco);
    this.candleLights.push({ light: candleFresco, baseIntensity: 2.4, basePos: candleFresco.position.clone() });

    // Candle 3: Wall sconce illuminating Mosaic & Cosmic Vault Alcove
    const candleNiche = new THREE.PointLight(0xf59e0b, 2.1, 7.5, 1.5);
    candleNiche.position.set(2.2, 2.1, -5.4);
    this.scene.add(candleNiche);
    this.candleLights.push({ light: candleNiche, baseIntensity: 2.1, basePos: candleNiche.position.clone() });

    // Candle 4: Wall sconce near cellar stairs/door
    const candleStairs = new THREE.PointLight(0xd97706, 1.8, 6.5, 1.6);
    candleStairs.position.set(2.0, 2.2, 3.8);
    this.scene.add(candleStairs);
    this.candleLights.push({ light: candleStairs, baseIntensity: 1.8, basePos: candleStairs.position.clone() });
  }

  buildCryptArchitecture() {
    const texLoader = this.textureLoader;
    const stoneTex = texLoader.load('assets/textures/crypt_stone_wall.png');
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(4, 2);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.08
    });

    const roomW = 8;
    const roomH = 4.2;
    const roomD = 14;

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), stoneMat);
    leftWall.position.set(-roomW / 2, roomH / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), stoneMat);
    rightWall.position.set(roomW / 2, roomH / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), stoneMat);
    backWall.position.set(0, roomH / 2, -roomD / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), stoneMat);
    frontWall.position.set(0, roomH / 2, roomD / 2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);

    // Vaulted Stone Ceiling with Transverse Stone Arch Ribs
    const ceilingGeom = new THREE.PlaneGeometry(roomW, roomD);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9
    });
    const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, roomH, 0);
    this.scene.add(ceiling);

    for (let rz of [-4.5, -0.8, 2.8]) {
      const archRib = new THREE.Mesh(
        new THREE.TorusGeometry(roomW / 2 - 0.08, 0.16, 10, 32, Math.PI),
        stoneMat
      );
      archRib.position.set(0, roomH - 0.8, rz);
      this.scene.add(archRib);
    }

    // -------------------------------------------------------------
    // 6 ROMANESQUE VAULTED STONE PILLARS (Blender 5.2 Model: blender_s3_vaulted_pillar.glb)
    // -------------------------------------------------------------
    const colPositions = [
      new THREE.Vector3(-2.85, 0, -4.5),
      new THREE.Vector3(-2.85, 0, -0.8),
      new THREE.Vector3(-2.85, 0, 2.8),
      new THREE.Vector3(2.85, 0, -4.5),
      new THREE.Vector3(2.85, 0, -0.8),
      new THREE.Vector3(2.85, 0, 2.8)
    ];

    if (this.gltfLoader) {
      this.gltfLoader.load(
        'assets/models/blender_s3_vaulted_pillar.glb?v=20261024_6',
        (gltf) => {
          const basePillar = gltf.scene;
          basePillar.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.material = new THREE.MeshStandardMaterial({
                map: stoneTex,
                roughness: 0.8,
                metalness: 0.08
              });
            }
          });

          const box = new THREE.Box3().setFromObject(basePillar);
          const size = box.getSize(new THREE.Vector3());
          const scale = 3.9 / (size.y || 1);
          basePillar.scale.setScalar(scale);

          const scaledBox = new THREE.Box3().setFromObject(basePillar);
          const center = scaledBox.getCenter(new THREE.Vector3());

          for (const pos of colPositions) {
            const inst = basePillar.clone(true);
            inst.position.set(pos.x - center.x, -scaledBox.min.y, pos.z - center.z);
            this.scene.add(inst);
          }
        }
      );
    }
  }

  buildFloodedCanalFloor() {
    const texLoader = this.textureLoader;
    const flagstoneTex = texLoader.load('assets/textures/crypt_wet_flagstones.png');
    flagstoneTex.wrapS = THREE.RepeatWrapping;
    flagstoneTex.wrapT = THREE.RepeatWrapping;
    flagstoneTex.repeat.set(4, 7);

    const floorMat = new THREE.MeshStandardMaterial({
      map: flagstoneTex,
      roughness: 0.55,
      metalness: 0.22
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 14), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const waterGeom = new THREE.PlaneGeometry(8, 14, 32, 32);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1824,
      roughness: 0.08,
      metalness: 0.18,
      transmission: 0.65,
      ior: 1.333,
      transparent: true,
      opacity: 0.86,
      reflectivity: 0.88
    });

    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0.08;
    this.scene.add(this.waterMesh);
  }

  buildFrescoWall() {
    const texLoader = this.textureLoader;
    const frescoTex = texLoader.load('assets/textures/fresco_angel_comet.png?v=20261024_2');
    const stoneTex = texLoader.load('assets/textures/crypt_stone_wall.png');

    const frescoMat = new THREE.MeshStandardMaterial({
      map: frescoTex,
      roughness: 0.72,
      metalness: 0.05
    });

    const frescoW = 3.5;
    const frescoH = 2.75;
    this.frescoMesh = new THREE.Mesh(new THREE.PlaneGeometry(frescoW, frescoH), frescoMat);
    this.frescoMesh.position.set(-0.9, 1.85, -6.90);
    this.frescoMesh.receiveShadow = true;
    this.scene.add(this.frescoMesh);

    // Carved Stone Arch & Pilaster Frame around the Fresco
    const frameMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0x645c53, roughness: 0.8 });
    const pilL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.9, 0.18), frameMat);
    pilL.position.set(-2.72, 1.85, -6.92);
    const pilR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.9, 0.18), frameMat);
    pilR.position.set(0.92, 1.85, -6.92);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.24, 0.22), frameMat);
    lintel.position.set(-0.9, 3.32, -6.92);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.18, 0.22), frameMat);
    sill.position.set(-0.9, 0.42, -6.92);
    this.scene.add(pilL, pilR, lintel, sill);
  }

  buildApothecaryDesk() {
    // -------------------------------------------------------------
    // 1. RENAISSANCE CARVED WALNUT APOTHECARY & PAINTER'S WORKTABLE
    //    Loaded from Tripo 3D PBR Model: prop_s3_apothecary_table.glb
    // -------------------------------------------------------------
    const deskFallback = new THREE.Group();
    deskFallback.position.set(0, 0, -3.2);
    this.scene.add(deskFallback);

    this.loadModelAsset(
      'assets/models/prop_s3_apothecary_table.glb?v=20261024_6',
      2.25,
      new THREE.Vector3(-0.15, 0, -3.2),
      0,
      deskFallback
    );

    // -------------------------------------------------------------
    // 2. HERO PROP: THE ALCHEMICAL SCALE (Right side of Apothecary Worktable)
    //    Loaded from Tripo 3D PBR Model: hero_prop_alchemical_scale.glb
    // -------------------------------------------------------------
    const PedestalMat = new THREE.MeshStandardMaterial({ color: 0x291a12, roughness: 0.55, metalness: 0.1 });
    const scaleSideStand = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.88, 16), PedestalMat);
    scaleSideStand.position.set(1.25, 0.44, -3.0);
    scaleSideStand.castShadow = true;
    scaleSideStand.receiveShadow = true;
    this.scene.add(scaleSideStand);

    this.loadModelAsset(
      'assets/models/hero_prop_alchemical_scale.glb?v=20261024_6',
      0.78,
      new THREE.Vector3(1.25, 0.88, -3.0),
      -0.25,
      null
    );

    // Invisible Interaction Colliders for Story3Controller:
    // a) Scale & Pigments hitbox (this.deskMesh)
    this.deskMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.5, 1.3),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.deskMesh.position.set(0.65, 1.0, -3.1);
    this.scene.add(this.deskMesh);

    // b) Brother Bernardo's Astrological Notes hitbox (this.parchMesh) + Parchment sheet
    const texLoader = this.textureLoader;
    const parchTex = texLoader.load('assets/textures/alchemical_parchment.png');
    const parchMat = new THREE.MeshStandardMaterial({ map: parchTex, roughness: 0.78 });
    const visibleParch = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.40), parchMat);
    visibleParch.rotation.x = -Math.PI / 2;
    visibleParch.rotation.z = -0.15;
    visibleParch.position.set(-0.75, 0.94, -2.95);
    this.scene.add(visibleParch);

    this.parchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.3, 1.1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.parchMesh.position.set(-0.8, 1.0, -3.1);
    this.scene.add(this.parchMesh);
  }

  buildSecretNiche() {
    this.secretNicheGroup = new THREE.Group();
    this.secretNicheGroup.position.set(2.3, 1.65, -6.85);

    // Load Blender 5.2 Cosmic Vault Reliquary Alcove (blender_s3_cosmic_vault_alcove.glb)
    this.loadModelAsset(
      'assets/models/blender_s3_cosmic_vault_alcove.glb?v=20261024_6',
      1.65,
      new THREE.Vector3(2.3, 0.82, -6.78),
      0,
      null
    );

    // Recess surface with 4x4 mosaic elements texture (this.mosaicPanel for Story3Controller)
    const texLoader = this.textureLoader;
    const mosaicTex = texLoader.load('assets/textures/mosaic_elements.png');
    const mosaicMat = new THREE.MeshStandardMaterial({
      map: mosaicTex,
      roughness: 0.55,
      emissive: 0x3b2810,
      emissiveIntensity: 0.25
    });
    const mosaicPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), mosaicMat);
    mosaicPanel.position.z = 0.08;
    this.secretNicheGroup.add(mosaicPanel);
    this.mosaicPanel = mosaicPanel;

    this.scene.add(this.secretNicheGroup);
  }

  buildCellarStairsAndDoor() {
    const texLoader = this.textureLoader;
    const stoneTex = texLoader.load('assets/textures/crypt_stone_wall.png');
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });

    const stepsGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 0.45), stoneMat);
      step.position.set(0, 0.125 + i * 0.25, 4.2 + i * 0.45);
      step.receiveShadow = true;
      stepsGroup.add(step);
    }
    this.scene.add(stepsGroup);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.75 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 });

    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 2.5, 6.8);

    const doorPlanks = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.12), woodMat);
    doorGroup.add(doorPlanks);
    this.doorMesh = doorPlanks;

    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 0.14), ironMat);
    bar.position.set(0, 0, -0.1);
    doorGroup.add(bar);

    this.scene.add(doorGroup);
  }

  buildDustParticles() {
    const particleCount = 220;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 7.5;
      positions[i + 1] = Math.random() * 3.8;
      positions[i + 2] = (Math.random() - 0.5) * 13;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.032,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.scene.add(this.dustParticles);
  }

  updateCandleFlicker(time) {
    for (let i = 0; i < this.candleLights.length; i++) {
      const c = this.candleLights[i];
      const f1 = Math.sin(time * 8.0 + i * 2.5);
      const f2 = Math.cos(time * 19.3 + i * 1.7);
      const deltaI = (f1 * 0.12 + f2 * 0.06) * c.baseIntensity;
      c.light.intensity = Math.max(1.0, c.baseIntensity + deltaI);
    }
  }

  updateWaterAndDust(time, delta) {
    if (this.waterMesh) {
      this.waterMesh.position.y = 0.08 + Math.sin(time * 1.8) * 0.008;
    }

    if (this.dustParticles) {
      const posAttr = this.dustParticles.geometry.attributes.position;
      for (let i = 1; i < posAttr.array.length; i += 3) {
        posAttr.array[i] -= delta * 0.04;
        if (posAttr.array[i] < 0.1) {
          posAttr.array[i] = 3.6;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  update() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    this.updateCandleFlicker(time);
    this.updateWaterAndDust(time, delta);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    if (this.interactionManager) {
      this.interactionManager.clear();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
