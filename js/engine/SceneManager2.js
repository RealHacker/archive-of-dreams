// SceneManager2.js - High-fidelity Cold War Arctic Research Bunker "Beacon-7" (Svalbard, 1974)
// Upgraded with Tripo 3D PBR Models + Blender 5.2 Custom Architectural & Prop Assets
class SceneManager2 {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080e18);
    this.scene.fog = new THREE.FogExp2(0x080e18, 0.035);

    // Player starts inside the bunker near the blast airlock door (East), looking West towards the radio console, transmitter rack, and porthole
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 90);
    this.camera.position.set(2.0, 1.65, 0.2);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = Math.PI * 0.55; // Looking West-Northwest toward radio desk & transmitter
    this.camera.rotation.x = -0.08;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();
    this.loadingManager = installAssetTracker(this);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.gltfLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader(this.loadingManager) : null;

    this.fluorescentLights = [];
    this.beaconLight = null;
    this.crtLight = null;
    this.frostParticles = null;
    this.tapeReelL = null;
    this.tapeReelR = null;
    this.airlockWheel = null;
    this.radioGroup = null;

    this.loadTextures();
    this.setupLighting();
    this.buildArchitecturalBunker();
    this.buildStationProps();
    this.setupFrostParticles();
    this.loadHeroPropRadio();

    window.addEventListener('resize', () => this.onWindowResize());
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

  loadTextures() {
    this.tex = {};
    const load = (name, url, rx = 1, ry = 1) => {
      const t = this.textureLoader.load(url);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      this.tex[name] = t;
      return t;
    };

    load('concrete', 'assets/textures/bunker_concrete.png', 3, 2);
    load('floor', 'assets/textures/bunker_floor_metal.png', 6, 6);
    load('crt', 'assets/textures/oscilloscope_crt.png', 1, 1);
    load('patch', 'assets/textures/patch_board_metal.png', 1, 1);
    load('blizzard', 'assets/images/scene2_keyframe.png', 1, 1);
    load('maya', 'assets/images/char_maya_profile.png', 1, 1);
  }

  setupLighting() {
    // 1. Ambient & Hemisphere fill (cold arctic blue + warm equipment bounce)
    const ambient = new THREE.AmbientLight(0x24344d, 0.65);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xa5f3fc, 0x1e293b, 0.35);
    this.scene.add(hemi);

    // 2. Twin Industrial Overhead Fluorescent Tubes
    for (let fz of [-1.4, 1.4]) {
      const tubeLight = new THREE.PointLight(0xa5f3fc, 2.1, 9, 1.25);
      tubeLight.position.set(0, 2.75, fz);
      tubeLight.castShadow = true;
      tubeLight.shadow.bias = -0.002;
      this.scene.add(tubeLight);
      this.fluorescentLights.push({ light: tubeLight, base: 2.1, offset: fz });
    }

    // 3. Green Phosphor CRT Glow from Oscilloscope Station
    this.crtLight = new THREE.PointLight(0x22c55e, 1.8, 4.0, 1.6);
    this.crtLight.position.set(-0.6, 1.25, -1.6);
    this.scene.add(this.crtLight);

    // 4. Warm Amber Vacuum Tube Glow over Shortwave Radio & Teletype
    const tubeGlow = new THREE.PointLight(0xf59e0b, 1.8, 4.5, 1.4);
    tubeGlow.position.set(0.5, 1.35, -1.6);
    this.scene.add(tubeGlow);

    const teletypeLamp = new THREE.PointLight(0xfbbf24, 1.5, 4.5, 1.5);
    teletypeLamp.position.set(-1.5, 1.5, 1.5);
    this.scene.add(teletypeLamp);

    // 5. Exterior Flashing Red Radio Mast Beacon (outside porthole)
    this.beaconLight = new THREE.PointLight(0xef4444, 2.5, 10, 1.2);
    this.beaconLight.position.set(-4.5, 1.8, 0.0);
    this.scene.add(this.beaconLight);
  }

  buildArchitecturalBunker() {
    const matConcrete = new THREE.MeshStandardMaterial({
      map: this.tex.concrete,
      roughness: 0.82,
      metalness: 0.06
    });

    const matMetalFloor = new THREE.MeshStandardMaterial({
      map: this.tex.floor,
      roughness: 0.45,
      metalness: 0.65
    });

    const matSteel = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.42,
      metalness: 0.78
    });

    const matDarkMetal = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.65
    });

    const matHazardYellow = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.4,
      metalness: 0.25
    });

    // 1. Bunker Floor (6m x 6m: X from -3 to +3, Z from -3 to +3)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), matMetalFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Concrete Ceiling with Exposed Steel Rib Beams & Cable Conduits
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), matConcrete);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.0, 0);
    this.scene.add(ceiling);

    for (let bz of [-2.0, 0.0, 2.0]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 0.22), matDarkMetal);
      rib.position.set(0, 2.91, bz);
      this.scene.add(rib);
    }

    for (let cx of [-1.5, 0.0, 1.5]) {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 12), matSteel);
      conduit.rotation.x = Math.PI / 2;
      conduit.position.set(cx, 2.86, 0);
      this.scene.add(conduit);
    }

    // 3. Brutalist Concrete Walls with Structural Pilasters
    const addWall = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matConcrete);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    };

    addWall(6, 3, 0.2, 0, 1.5, -3.0);
    addWall(6, 3, 0.2, 0, 1.5, 3.0);

    // East Wall (WITH HEAVY STEEL BLAST AIRLOCK DOOR at X = 2.98, Z = 0)
    addWall(0.2, 3, 2.2, 3.0, 1.5, -1.9);
    addWall(0.2, 3, 2.2, 3.0, 1.5, 1.9);
    addWall(0.2, 0.8, 1.6, 3.0, 2.6, 0.0);

    // West Wall (WITH REINFORCED PORTHOLE at X = -2.98, Z = 0)
    addWall(0.2, 3, 2.2, -3.0, 1.5, -1.9);
    addWall(0.2, 3, 2.2, -3.0, 1.5, 1.9);
    addWall(0.2, 1.0, 1.6, -3.0, 2.5, 0.0);
    addWall(0.2, 0.8, 1.6, -3.0, 0.4, 0.0);

    // Corner Steel Reinforcing Pilasters
    for (let px of [-2.88, 2.88]) {
      for (let pz of [-2.88, 2.88]) {
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.22), matDarkMetal);
        pilaster.position.set(px, 1.5, pz);
        this.scene.add(pilaster);
      }
    }

    // 4. HEAVY STEEL BLAST AIRLOCK DOOR (East Wall: X = 2.98, Z = 0)
    const blastDoorGroup = new THREE.Group();
    blastDoorGroup.position.set(2.98, 0, 0);

    const bFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), matHazardYellow);
    bFrameL.position.set(0, 1.1, -0.75);
    const bFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), matHazardYellow);
    bFrameR.position.set(0, 1.1, 0.75);
    const bFrameT = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.62), matHazardYellow);
    bFrameT.position.set(0, 2.2, 0);
    blastDoorGroup.add(bFrameL, bFrameR, bFrameT);

    const bLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.15, 1.4), matSteel);
    bLeaf.position.set(0, 1.08, 0);
    bLeaf.castShadow = true;
    blastDoorGroup.add(bLeaf);

    this.airlockWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24), matDarkMetal);
    this.airlockWheel.rotation.y = Math.PI / 2;
    this.airlockWheel.position.set(-0.06, 1.1, 0);

    for (let a = 0; a < Math.PI; a += Math.PI / 2) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 8), matDarkMetal);
      spoke.rotation.x = a;
      spoke.position.set(-0.06, 1.1, 0);
      blastDoorGroup.add(spoke);
    }
    blastDoorGroup.add(this.airlockWheel);

    const tempGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    tempGauge.rotation.z = Math.PI / 2;
    tempGauge.position.set(-0.05, 1.55, 0.45);
    blastDoorGroup.add(tempGauge);

    this.scene.add(blastDoorGroup);

    // 5. REINFORCED ARCTIC PORTHOLE & BLIZZARD BACKDROP (West Wall)
    const portholeGroup = new THREE.Group();
    portholeGroup.position.set(-2.95, 1.6, 0);

    const pCollar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 32), matSteel);
    pCollar.rotation.y = Math.PI / 2;
    portholeGroup.add(pCollar);

    const pGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.35, roughness: 0.25, transmission: 0.7 })
    );
    pGlass.rotation.y = Math.PI / 2;
    portholeGroup.add(pGlass);

    const blizzardBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 4.5),
      new THREE.MeshBasicMaterial({ map: this.tex.blizzard, side: THREE.DoubleSide })
    );
    blizzardBackdrop.rotation.y = Math.PI / 2;
    blizzardBackdrop.position.set(-5.0, 1.6, 0);
    this.scene.add(blizzardBackdrop);
    this.scene.add(portholeGroup);
  }

  buildStationProps() {
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.78 });
    const matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.55 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });

    // -------------------------------------------------------------
    // 1. MAIN STEEL MONITORING WORKBENCH (North Wall: X = 0, Z = -2.15)
    // -------------------------------------------------------------
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, -2.15);

    const dTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 1.25), matSteel);
    dTop.position.set(0, 0.8, 0);
    dTop.receiveShadow = true;
    dTop.castShadow = true;

    for (let dx of [-1.5, 0, 1.5]) {
      for (let dz of [-0.52, 0.52]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), matDarkMetal);
        leg.position.set(dx, 0.4, dz);
        deskGroup.add(leg);
      }
    }
    deskGroup.add(dTop);
    this.scene.add(deskGroup);

    // -------------------------------------------------------------
    // 2. CRT OSCILLOSCOPE & 4x4 PATCH-BOARD STATION (Left side of workbench)
    //    Loaded from Tripo 3D PBR Model: prop_s2_oscilloscope_station.glb
    // -------------------------------------------------------------
    this.loadModelAsset(
      'assets/models/prop_s2_oscilloscope_station.glb?v=20261024_6',
      1.22,
      new THREE.Vector3(-0.62, 0.83, -2.05),
      0,
      null
    );

    // -------------------------------------------------------------
    // 3. TELETYPE MODEL 33 & CIPHER DESK (South-West: X = -1.8, Z = 1.8)
    //    Loaded from Tripo 3D PBR Model: prop_s2_teletype_desk.glb
    // -------------------------------------------------------------
    this.loadModelAsset(
      'assets/models/prop_s2_teletype_desk.glb?v=20261024_6',
      1.32,
      new THREE.Vector3(-1.8, 0, 1.8),
      Math.PI * 0.72,
      null
    );

    // -------------------------------------------------------------
    // 4. EMERGENCY HIGH-POWER TRANSMITTER RACK (North-West: X = -2.35, Z = -1.0)
    //    Loaded from Tripo 3D PBR Model: prop_s2_emergency_transmitter.glb
    // -------------------------------------------------------------
    const txLight = new THREE.PointLight(0xf59e0b, 1.65, 3.8, 1.4);
    txLight.position.set(-1.85, 1.65, -0.95);
    this.scene.add(txLight);

    this.loadModelAsset(
      'assets/models/prop_s2_emergency_transmitter.glb?v=20261024_6',
      2.15,
      new THREE.Vector3(-2.35, 0, -1.0),
      Math.PI * 0.42,
      null
    );

    // -------------------------------------------------------------
    // 5. MAYA'S PERSONAL LIVING CORNER (South-East: X = 1.6, Z = 2.0)
    // -------------------------------------------------------------
    const livingGroup = new THREE.Group();
    livingGroup.position.set(1.6, 0, 2.0);

    const pTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.8), matDarkMetal);
    pTable.position.set(0, 0.375, 0);

    const hotplate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    hotplate.position.set(-0.35, 0.78, 0);
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.18, 16), matChrome);
    kettle.position.set(-0.35, 0.9, 0);

    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    mug.position.set(0.1, 0.79, 0.1);

    const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.30, 0.03), matDarkMetal);
    photoFrame.position.set(0.35, 0.92, -0.1);
    photoFrame.rotation.y = -0.35;
    const photoImg = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: this.tex.maya }));
    photoImg.position.set(0.35, 0.92, -0.08);
    photoImg.rotation.y = -0.35;

    livingGroup.add(pTable, hotplate, kettle, mug, photoFrame, photoImg);
    this.scene.add(livingGroup);
  }

  loadHeroPropRadio() {
    this.loadModelAsset(
      'assets/models/hero_prop_shortwave_radio.glb?v=20261024_6',
      1.05,
      new THREE.Vector3(0.68, 0.83, -2.05),
      -0.12,
      null,
      (wrapper) => {
        this.radioGroup = wrapper;
        console.log("Hero Prop Shortwave Radio 3D model loaded successfully into Svalbard Bunker.");
      }
    );
  }

  setupFrostParticles() {
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 5.6;
      positions[i + 1] = Math.random() * 2.8;
      positions[i + 2] = (Math.random() - 0.5) * 5.6;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.022,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.frostParticles = new THREE.Points(geometry, material);
    this.scene.add(this.frostParticles);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    const elapsed = this.clock.getElapsedTime();

    for (const fl of this.fluorescentLights) {
      const hum = Math.sin(elapsed * 50) * 0.05 + Math.sin(elapsed * 7 + fl.offset) * 0.08;
      fl.light.intensity = fl.base + hum;
    }

    if (this.beaconLight) {
      const pulse = Math.pow(Math.sin(elapsed * 2.5), 8);
      this.beaconLight.intensity = pulse * 3.5;
    }

    if (this.crtLight) {
      this.crtLight.intensity = 1.6 + Math.sin(elapsed * 8) * 0.2;
    }

    if (this.frostParticles) {
      const positions = this.frostParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.0008;
        if (positions[i] < 0) positions[i] = 2.8;
      }
      this.frostParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
