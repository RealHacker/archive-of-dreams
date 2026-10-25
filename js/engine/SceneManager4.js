// SceneManager4.js - High-fidelity 3D Environment for Story 4: The Last Cradle (Deep Space, Year 2188)
// Upgraded with Tripo 3D PBR Models (instanced Cryo-Pods, Heritage Core Pedestal, Pilot Chair)
// + Blender 5.2 Custom Sci-Fi Bulkhead & Spectrometer Assets

class SceneManager4 {
  constructor(canvas, interactionManager, audioManager) {
    this.canvas = canvas;
    this.interactionManager = interactionManager;
    this.audioManager = audioManager;

    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.loadingManager = installAssetTracker(this);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.gltfLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader(this.loadingManager) : null;

    this.holoRingsGroup = null;
    this.starFieldPoints = null;
    this.warningLights = [];
    this.podGlowLights = [];
    this.podStatusMeshes = [];
    this.isNurseryStabilized = false;

    // Interactable target meshes for Story4Controller
    this.conduitPanelMesh = null;
    this.spectrometerMesh = null;
    this.holoConsoleMesh = null;
    this.heroPodMesh = null;
    this.chronometerMesh = null;

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
              child.material.envMapIntensity = 1.3;
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
    this.scene.background = new THREE.Color(0x05070e);
    this.scene.fog = new THREE.FogExp2(0x070a14, 0.038);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 150);
    this.camera.position.set(0, 1.65, 3.2);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;

    this.setupLighting();
    this.buildStarfieldAndNebulaCupola();
    this.buildObservationDeckArchitecture();
    this.buildCryoNurseryPods();
    this.buildLifeSupportConduitWall();
    this.buildSpectrometerStation();
    this.buildHeritageHologramConsole();
    this.buildPilotChairAndChronometer();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x2a2648, 0.75);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xc084fc, 0x0f172a, 0.45);
    this.scene.add(hemi);

    const nebulaDir = new THREE.DirectionalLight(0xa855f7, 1.05);
    nebulaDir.position.set(0, 8, -10);
    this.scene.add(nebulaDir);

    // Central Holographic Console Cyan Glow
    this.holoLight = new THREE.PointLight(0x38bdf8, 2.2, 8.5, 1.5);
    this.holoLight.position.set(0, 1.65, -1.2);
    this.scene.add(this.holoLight);

    // Warning Beacon near Life Support Conduit Wall (West)
    this.conduitAlertLight = new THREE.PointLight(0xef4444, 1.8, 6.5, 1.6);
    this.conduitAlertLight.position.set(-3.1, 2.1, 0.6);
    this.scene.add(this.conduitAlertLight);
    this.warningLights.push(this.conduitAlertLight);

    // Spectrometer Console Warm Amber & Cyan Light (East)
    const specLight = new THREE.PointLight(0xf59e0b, 1.8, 6.5, 1.5);
    specLight.position.set(3.0, 1.75, -1.2);
    this.scene.add(specLight);

    // Warm Amber Light over Julian's Pilot Chair & Ancestral Chronometer
    const chairLight = new THREE.PointLight(0xfbbf24, 1.8, 6.0, 1.5);
    chairLight.position.set(1.35, 2.1, -3.2);
    this.scene.add(chairLight);

    // Cryo-Nursery Bay Fill Lights (West & East)
    const westBayLight = new THREE.PointLight(0x0ea5e9, 1.6, 8.0, 1.5);
    westBayLight.position.set(-2.6, 2.2, -1.4);
    this.scene.add(westBayLight);

    const eastBayLight = new THREE.PointLight(0x0ea5e9, 1.6, 8.0, 1.5);
    eastBayLight.position.set(2.6, 2.2, 1.4);
    this.scene.add(eastBayLight);
  }

  buildStarfieldAndNebulaCupola() {
    const texLoader = this.textureLoader;
    const nebTex = texLoader.load('assets/textures/nebula_starfield.png');
    nebTex.wrapS = THREE.RepeatWrapping;
    nebTex.wrapT = THREE.ClampToEdgeWrapping;

    const skyGeo = new THREE.SphereGeometry(42, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: nebTex,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDome.rotation.y = Math.PI * 0.35;
    this.scene.add(skyDome);
    this.skyDome = skyDome;

    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 16 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 1.5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 4.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.14,
      transparent: true,
      opacity: 0.85
    });
    this.starFieldPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starFieldPoints);
  }

  buildObservationDeckArchitecture() {
    const texLoader = this.textureLoader;

    const floorTex = texLoader.load('assets/textures/starship_floor_deck.png');
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 8);

    const hullTex = texLoader.load('assets/textures/starship_hull_panel.png');
    hullTex.wrapS = THREE.RepeatWrapping;
    hullTex.wrapT = THREE.RepeatWrapping;
    hullTex.repeat.set(4, 1);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.32,
      metalness: 0.68
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 12.0), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    const stripMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
    const stripL = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 11.2), stripMat);
    stripL.rotation.x = -Math.PI / 2;
    stripL.position.set(-1.9, 0.005, 0);
    const stripR = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 11.2), stripMat);
    stripR.rotation.x = -Math.PI / 2;
    stripR.position.set(1.9, 0.005, 0);
    this.scene.add(stripL, stripR);

    const wallMat = new THREE.MeshStandardMaterial({
      map: hullTex,
      roughness: 0.42,
      metalness: 0.55
    });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 12.0), wallMat);
    leftWall.position.set(-4.2, 1.1, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 12.0), wallMat);
    rightWall.position.set(4.2, 1.1, 0);
    this.scene.add(rightWall);

    const aftWall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.8, 0.3), wallMat);
    aftWall.position.set(0, 1.9, 5.8);
    this.scene.add(aftWall);

    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.28,
      metalness: 0.88
    });

    for (let z = -5.0; z <= 5.0; z += 2.5) {
      const archGeo = new THREE.TorusGeometry(4.2, 0.09, 10, 32, Math.PI);
      const archMesh = new THREE.Mesh(archGeo, ribMat);
      archMesh.position.set(0, 2.1, z);
      this.scene.add(archMesh);
    }

    for (let angle of [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75]) {
      const rx = Math.cos(angle) * 4.2;
      const ry = 2.1 + Math.sin(angle) * 4.2;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 11.5, 8), ribMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(rx, ry, -0.2);
      this.scene.add(beam);
    }

    const fwdArch = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.14, 12, 36, Math.PI), ribMat);
    fwdArch.position.set(0, 2.1, -5.6);
    this.scene.add(fwdArch);

    const fwdSill = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.7, 0.4), wallMat);
    fwdSill.position.set(0, 0.35, -5.6);
    this.scene.add(fwdSill);
  }

  buildCryoNurseryPods() {
    // -------------------------------------------------------------
    // 8 CRYO-NURSERY CAPSULE BAYS (Left & Right Walls)
    // Instanced from Tripo 3D Hero Model: hero_prop_cryo_pod.glb
    // -------------------------------------------------------------
    const podZPositions = [-3.6, -1.6, 1.5, 3.6];
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.8 });

    // Invisible interaction collider for Hero Cryo-Pod #001 at (-3.1, 0.85, -1.6)
    this.heroPodMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 2.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.heroPodMesh.position.set(-3.1, 0.85, -1.6);
    this.scene.add(this.heroPodMesh);

    const bayConfigs = [];
    for (let side of [-1, 1]) {
      for (let i = 0; i < podZPositions.length; i++) {
        // Leave space at (+3.55, -1.2) for the East Spectrometer Console
        if (side === 1 && i === 1) continue;
        const pz = podZPositions[i];
        const px = side * 3.1;

        // Docking Plinth & Status LED Strip on Floor
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 1.55), plinthMat);
        plinth.position.set(px, 0.06, pz);
        this.scene.add(plinth);

        const statusMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const statusBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.35), statusMat);
        statusBar.position.set(px - side * 0.68, 0.125, pz);
        this.podStatusMeshes.push(statusBar);
        this.scene.add(statusBar);

        bayConfigs.push({
          pos: new THREE.Vector3(px, 0.12, pz),
          rotY: side === -1 ? -Math.PI * 0.13 : -Math.PI * 0.87
        });
      }
    }

    if (this.gltfLoader) {
      this.gltfLoader.load(
        'assets/models/hero_prop_cryo_pod.glb?v=20261024_6',
        (gltf) => {
          const basePod = gltf.scene;
          basePod.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const box = new THREE.Box3().setFromObject(basePod);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 1.65 / maxDim;
          basePod.scale.setScalar(scale);

          const scaledBox = new THREE.Box3().setFromObject(basePod);
          const center = scaledBox.getCenter(new THREE.Vector3());

          for (const cfg of bayConfigs) {
            const wrapper = new THREE.Group();
            const clone = basePod.clone(true);
            clone.position.set(-center.x, -scaledBox.min.y, -center.z);
            wrapper.add(clone);
            wrapper.position.copy(cfg.pos);
            wrapper.rotation.y = cfg.rotY;
            this.scene.add(wrapper);
          }
          console.log('Instanced 7 Tripo 3D Cryo-Nursery Pods across Observation Deck.');
        }
      );
    }
  }

  buildLifeSupportConduitWall() {
    // -------------------------------------------------------------
    // PUZZLE 4.1 STATION: WEST BULKHEAD PLASMA CONDUIT JUNCTION
    // Loaded from Blender 5.2 Model: blender_s4_conduit_bulkhead.glb
    // -------------------------------------------------------------
    const texLoader = this.textureLoader;
    const patchTex = texLoader.load('assets/textures/patch_board_metal.png');

    this.loadModelAsset(
      'assets/models/blender_s4_conduit_bulkhead.glb?v=20261024_6',
      1.65,
      new THREE.Vector3(-3.92, 0.72, 0.6),
      Math.PI * 0.5,
      null,
      (wrapper) => {
        wrapper.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = 0.55;
            child.material.metalness = 0.45;
            if (child.material.color && child.material.color.r < 0.25) {
              child.material.map = patchTex;
            }
            child.material.needsUpdate = true;
          }
        });
      }
    );

    // Status Indicator Bar above panel that turns Emerald when Puzzle 4.1 is solved
    this.conduitScreenMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.4,
      roughness: 0.3
    });
    const statusGlow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.25), this.conduitScreenMat);
    statusGlow.position.set(-3.75, 2.08, 0.6);
    this.scene.add(statusGlow);

    // Hitbox for Puzzle 4.1
    this.conduitPanelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.6, 1.7),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.conduitPanelMesh.position.set(-3.8, 1.35, 0.6);
    this.scene.add(this.conduitPanelMesh);
  }

  buildSpectrometerStation() {
    // -------------------------------------------------------------
    // PUZZLE 4.2 STATION: EAST BULKHEAD OPTICAL SPECTROMETER CONSOLE
    // Loaded from Blender 5.2 Model: blender_s4_spectrometer_console.glb
    // -------------------------------------------------------------
    const texLoader = this.textureLoader;
    const crtTex = texLoader.load('assets/textures/oscilloscope_crt.png');

    this.loadModelAsset(
      'assets/models/blender_s4_spectrometer_console.glb?v=20261024_7',
      1.68,
      new THREE.Vector3(3.52, 0, -1.2),
      -Math.PI * 0.5,
      null,
      (wrapper) => {
        wrapper.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = 0.5;
            child.material.metalness = 0.45;
            if (child.position.y > 1.0) {
              child.material.map = crtTex;
            }
            child.material.needsUpdate = true;
          }
        });
      }
    );

    // Hitbox for Puzzle 4.2
    this.spectrometerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.8, 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.spectrometerMesh.position.set(3.5, 1.0, -1.2);
    this.scene.add(this.spectrometerMesh);
  }

  buildHeritageHologramConsole() {
    // -------------------------------------------------------------
    // PUZZLE 4.3 KEYSTONE STATION: CENTRAL HERITAGE CORE TERMINAL
    // Loaded from Tripo 3D PBR Model: prop_s4_heritage_pedestal.glb
    // -------------------------------------------------------------
    this.loadModelAsset(
      'assets/models/prop_s4_heritage_pedestal.glb?v=20261024_6',
      1.55,
      new THREE.Vector3(0, 0, -1.2),
      0,
      null
    );

    const group = new THREE.Group();
    group.position.set(0, 0, -1.2);

    // Translucent cyan holographic projection field above the Tripo 3D Pedestal
    const holoCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.85, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide
      })
    );
    holoCyl.position.set(0, 1.35, 0);

    // Rotating Golden Ratio / Celestial Harmonic Rings inside the hologram
    this.holoRingsGroup = new THREE.Group();
    this.holoRingsGroup.position.set(0, 1.38, 0);

    const ringMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const ringMatGold = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 8, 32), ringMatGold);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.01, 8, 28), ringMatCyan);
    r2.rotation.x = Math.PI / 3;
    const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.01, 8, 24), ringMatGold);
    r3.rotation.y = Math.PI / 4;
    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), ringMatGold);

    this.holoRingsGroup.add(r1, r2, r3, coreSphere);
    group.add(holoCyl, this.holoRingsGroup);
    this.scene.add(group);

    // Hitbox for Puzzle 4.3
    this.holoConsoleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.9, 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.holoConsoleMesh.position.set(0, 1.1, -1.2);
    this.scene.add(this.holoConsoleMesh);
  }

  buildPilotChairAndChronometer() {
    // -------------------------------------------------------------
    // JULIAN'S SOLITARY PILOT ARMCHAIR & ANCESTRAL POCKET WATCH
    // Loaded from Tripo 3D PBR Model: prop_s4_pilot_chair.glb
    // -------------------------------------------------------------
    this.loadModelAsset(
      'assets/models/prop_s4_pilot_chair.glb?v=20261024_6',
      1.18,
      new THREE.Vector3(1.42, 0, -3.4),
      -0.35,
      null
    );

    // Brushed Titanium Side Pedestal holding Jonathan Finch's 1892 Brass Chronometer
    const sideGroup = new THREE.Group();
    sideGroup.position.set(0.58, 0, -3.45);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.85 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22, metalness: 0.92 });

    const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 20), metalMat);
    pedBase.position.y = 0.03;
    const pedStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.62, 16), metalMat);
    pedStem.position.y = 0.34;
    const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.04, 24), metalMat);
    pedTop.position.y = 0.66;

    const watchBody = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.028, 24), brassMat);
    watchBody.position.set(0, 0.695, 0);
    const watchRing = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 16), brassMat);
    watchRing.rotation.x = Math.PI / 2;
    watchRing.position.set(0, 0.695, -0.10);

    sideGroup.add(pedBase, pedStem, pedTop, watchBody, watchRing);
    this.scene.add(sideGroup);

    // Hitbox for inspecting Julian's Pilot Chair & Ancestral Chronometer
    this.chronometerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.5, 1.3),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    this.chronometerMesh.position.set(1.05, 0.9, -3.4);
    this.scene.add(this.chronometerMesh);
  }

  setNurseryStabilized() {
    this.isNurseryStabilized = true;
    if (this.conduitAlertLight) {
      this.conduitAlertLight.color.setHex(0x10b981);
      this.conduitAlertLight.intensity = 1.8;
    }
    if (this.conduitScreenMat) {
      this.conduitScreenMat.emissive.setHex(0x10b981);
    }
    for (const bar of this.podStatusMeshes) {
      if (bar.material) bar.material.color.setHex(0x10b981);
    }
  }

  update(dt) {
    const elapsed = this.clock.getElapsedTime();

    if (this.holoRingsGroup) {
      this.holoRingsGroup.rotation.y = elapsed * 0.45;
      this.holoRingsGroup.children[1].rotation.z = elapsed * 0.7;
      this.holoRingsGroup.children[2].rotation.x = -elapsed * 0.55;
    }

    if (this.starFieldPoints) {
      this.starFieldPoints.rotation.y = elapsed * 0.008;
    }

    if (!this.isNurseryStabilized && this.conduitAlertLight) {
      this.conduitAlertLight.intensity = 1.1 + Math.sin(elapsed * 4.5) * 0.7;
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.SceneManager4 = SceneManager4;
