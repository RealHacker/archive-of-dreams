// SceneManager.js - High-fidelity Victorian Study Workshop & Observatory (London, 1892)
// Upgraded with Tripo 3D PBR Models + Blender 5.2 Custom Architectural & Prop Assets
class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.032);

    // Player camera starts near the Hallway Exit Door (East), facing West across the study workshop
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 90);
    this.camera.position.set(2.0, 1.65, 2.5);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = Math.PI * 0.5; // Looking West towards the desk, hearth, and window
    this.camera.rotation.x = -0.10;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.32;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();
    this.loadingManager = installAssetTracker(this);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.gltfLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader(this.loadingManager) : null;

    this.gasLights = [];
    this.dustParticles = null;
    this.clockPendulum = null;
    this.fireLight = null;
    this.doorMeshL = null;
    this.doorMeshR = null;
    this.lockBolt = null;
    this.orreryGroup = null;

    this.loadTextures();
    this.setupLighting();
    this.buildArchitecturalRoom();
    this.buildDetailedFurniture();
    this.setupDustParticles();
    this.loadHeroPropOrrery();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  // Helper to load a GLB asset, normalize its scale & floor placement, and replace any fallback group
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
              child.material.envMapIntensity = 1.2;
              child.material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = targetMaxDim / maxDim;
        model.scale.setScalar(scale);

        // Recompute bounds after scale
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

    load('floor', 'assets/textures/parquet_floor.png', 5, 6);
    load('wallpaper', 'assets/textures/damask_wallpaper.png', 4, 2);
    load('wainscot', 'assets/textures/wainscot_mahogany.png', 6, 1);
    load('rug', 'assets/images/persian_rug_detailed.png', 1, 1);
    load('books', 'assets/textures/bookshelf_books.png', 2, 1);
    load('clock', 'assets/textures/clock_face.png', 1, 1);
    load('embers', 'assets/textures/fire_embers.png?v=20261024_6', 1, 1);
    load('celestial', 'assets/textures/celestial_chart.png', 1, 1);
    load('starry', 'assets/textures/starry_sky.png', 1, 1);
    load('london', 'assets/images/london_fog_window.png', 1, 1);
    load('clara', 'assets/images/char_clara_portrait.png', 1, 1);
  }

  setupLighting() {
    // 1. Soft Ambient fill (cool Victorian slate shadow tone + warm fill)
    const ambient = new THREE.AmbientLight(0x283248, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xfef08a, 0x1e293b, 0.35);
    this.scene.add(hemi);

    // 2. Main Brass Chandelier in Study (Warm Amber)
    const chandelier = new THREE.PointLight(0xf59e0b, 2.5, 10, 1.25);
    chandelier.position.set(0, 2.35, 2.5);
    chandelier.castShadow = true;
    chandelier.shadow.bias = -0.002;
    chandelier.shadow.mapSize.width = 1024;
    chandelier.shadow.mapSize.height = 1024;
    this.scene.add(chandelier);
    this.gasLights.push({ light: chandelier, base: 2.5, offset: 0 });

    // 3. Desk Banker's Lamp (Warm tungsten glowing over roll-top desk)
    const deskLamp = new THREE.PointLight(0xfde047, 1.8, 5.5, 1.4);
    deskLamp.position.set(-1.55, 1.45, 3.4);
    deskLamp.castShadow = true;
    deskLamp.shadow.bias = -0.002;
    this.scene.add(deskLamp);
    this.gasLights.push({ light: deskLamp, base: 1.8, offset: 1.7 });

    // 4. Fireplace Hearth Fire (Intense Flickering Orange-Red)
    this.fireLight = new THREE.PointLight(0xea580c, 3.4, 7.5, 1.3);
    this.fireLight.position.set(0, 0.5, 4.35);
    this.fireLight.castShadow = true;
    this.scene.add(this.fireLight);
    this.gasLights.push({ light: this.fireLight, base: 3.4, offset: 3.4, isFire: true });

    // 5. Bay Window Cool London Fog Moonlight (Cool Teal-Cyan)
    const windowLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    windowLight.position.set(-6, 3, 2.5);
    this.scene.add(windowLight);

    // 6. Inner Observatory Skylight & Golden Orrery Spotlight
    const obsLight = new THREE.PointLight(0x818cf8, 2.4, 9, 1.2);
    obsLight.position.set(0, 2.6, -2.0);
    this.scene.add(obsLight);
    this.gasLights.push({ light: obsLight, base: 2.4, offset: 5.1 });

    const orreryRimLight = new THREE.PointLight(0xfbbf24, 2.2, 5.5, 1.4);
    orreryRimLight.position.set(0, 1.65, -1.5);
    this.scene.add(orreryRimLight);
  }

  buildArchitecturalRoom() {
    const matWoodFloor = new THREE.MeshStandardMaterial({
      map: this.tex.floor,
      roughness: 0.38,
      metalness: 0.06
    });

    const matStoneFloor = new THREE.MeshStandardMaterial({
      color: 0x1b222d,
      roughness: 0.78,
      metalness: 0.08
    });

    const matWallpaper = new THREE.MeshStandardMaterial({
      map: this.tex.wallpaper,
      roughness: 0.78
    });

    const matWainscot = new THREE.MeshStandardMaterial({
      map: this.tex.wainscot,
      roughness: 0.45,
      metalness: 0.06
    });

    const matMahogany = new THREE.MeshStandardMaterial({
      color: 0x26150c,
      roughness: 0.42,
      metalness: 0.08
    });

    const matDarkWood = new THREE.MeshStandardMaterial({
      color: 0x160b06,
      roughness: 0.48,
      metalness: 0.05
    });

    const matBrass = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.92
    });

    const matIron = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.65,
      metalness: 0.85
    });

    // 1. Study Floor (6m wide x 5m deep: X from -3 to +3, Z from 0 to 5)
    const floorStudy = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), matWoodFloor);
    floorStudy.rotation.x = -Math.PI / 2;
    floorStudy.position.set(0, 0, 2.5);
    floorStudy.receiveShadow = true;
    this.scene.add(floorStudy);

    // 2. Observatory Floor (5m wide x 4m deep: X from -2.5 to +2.5, Z from 0 to -4)
    const floorObs = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), matStoneFloor);
    floorObs.rotation.x = -Math.PI / 2;
    floorObs.position.set(0, 0, -2.0);
    floorObs.receiveShadow = true;
    this.scene.add(floorObs);

    // 3. Antique Persian Carpet in center of study
    const rugMat = new THREE.MeshStandardMaterial({
      map: this.tex.rug,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.7), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.05, 0.012, 2.55);
    rug.receiveShadow = true;
    this.scene.add(rug);

    // 4. Coffered Ceiling with Heavy Mahogany Beams & Moulded Cornices
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 9),
      new THREE.MeshStandardMaterial({ color: 0x0f1118, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.0, 0.5);
    this.scene.add(ceiling);

    for (let bz = -3.5; bz <= 4.5; bz += 1.6) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(6, 0.22, 0.22), matDarkWood);
      beam.position.set(0, 2.89, bz);
      this.scene.add(beam);
    }
    for (let bx of [-2.85, 0, 2.85]) {
      const longBeam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 9), matDarkWood);
      longBeam.position.set(bx, 2.91, 0.5);
      this.scene.add(longBeam);
    }

    // 5. Walls Construction Helper with Chair Rail Moulding
    const addWallSegment = (w, h, d, x, y, z, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    };

    // South Wall
    addWallSegment(6, 1.1, 0.2, 0, 0.55, 5.0, matWainscot);
    addWallSegment(6, 0.08, 0.24, 0, 1.1, 5.0, matMahogany);
    addWallSegment(6, 1.9, 0.2, 0, 2.05, 5.0, matWallpaper);

    // West Wall (Bay Window)
    addWallSegment(0.2, 3.0, 1.4, -3.0, 1.5, 4.3, matWallpaper);
    addWallSegment(0.2, 3.0, 1.4, -3.0, 1.5, 0.7, matWallpaper);
    addWallSegment(0.2, 0.8, 2.2, -3.0, 2.6, 2.5, matDarkWood);
    addWallSegment(0.2, 0.7, 2.2, -3.0, 0.35, 2.5, matDarkWood);

    // East Wall (WITH HALLWAY EXIT DOOR at Z = 2.5)
    addWallSegment(0.2, 1.1, 1.8, 3.0, 0.55, 4.1, matWainscot);
    addWallSegment(0.2, 1.9, 1.8, 3.0, 2.05, 4.1, matWallpaper);
    addWallSegment(0.2, 1.1, 1.8, 3.0, 0.55, 0.9, matWainscot);
    addWallSegment(0.2, 1.9, 1.8, 3.0, 2.05, 0.9, matWallpaper);
    addWallSegment(0.2, 0.8, 1.4, 3.0, 2.6, 2.5, matDarkWood);

    // 6. THE PROMINENT HALLWAY EXIT DOOR (East Wall: X = 2.98, Z = 2.5)
    const doorExitGroup = new THREE.Group();
    doorExitGroup.position.set(2.98, 0, 2.5);

    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.25, 0.09), matDarkWood);
    frameL.position.set(0, 1.125, -0.6);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.25, 0.09), matDarkWood);
    frameR.position.set(0, 1.125, 0.6);
    const frameT = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 1.32), matDarkWood);
    frameT.position.set(0, 2.25, 0);
    doorExitGroup.add(frameL, frameR, frameT);

    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 1.15), matMahogany);
    doorLeaf.position.set(0, 1.1, 0);
    doorLeaf.castShadow = true;
    doorExitGroup.add(doorLeaf);

    for (let py of [0.45, 1.1, 1.75]) {
      for (let pz of [-0.26, 0.26]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.38), matDarkWood);
        panel.position.set(-0.005, py, pz);
        doorExitGroup.add(panel);
      }
    }

    const mailPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.38), matBrass);
    mailPlate.position.set(-0.02, 1.05, 0);
    const mailSlot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.28), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    mailSlot.position.set(-0.02, 1.05, 0);
    doorExitGroup.add(mailPlate, mailSlot);

    const escutcheon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), matBrass);
    escutcheon.position.set(-0.02, 1.0, -0.42);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.14), matBrass);
    lever.position.set(-0.04, 1.05, -0.42);
    doorExitGroup.add(escutcheon, lever);

    const transomFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 1.15), matDarkWood);
    transomFrame.position.set(0, 2.45, 0);
    const transomGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.3),
      new THREE.MeshPhysicalMaterial({ color: 0xfef08a, transparent: true, opacity: 0.35, roughness: 0.2 })
    );
    transomGlass.rotation.y = Math.PI / 2;
    transomGlass.position.set(-0.02, 2.45, 0);
    doorExitGroup.add(transomFrame, transomGlass);

    this.scene.add(doorExitGroup);
    this.buildCoatRack(2.65, 0, 1.5);

    // 7. BAY WINDOW WITH 1890S LONDON FOG BACKDROP & VELVET DRAPES
    const winGroup = new THREE.Group();
    winGroup.position.set(-2.95, 0, 2.5);

    const winGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.8),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.1, transmission: 0.8 })
    );
    winGlass.rotation.y = Math.PI / 2;
    winGlass.position.set(0, 1.6, 0);
    winGroup.add(winGlass);

    for (let my of [1.0, 1.6, 2.2]) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 2.0), matDarkWood);
      hBar.position.set(0, my, 0);
      winGroup.add(hBar);
    }
    for (let mz of [-0.6, 0, 0.6]) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.8, 0.03), matDarkWood);
      vBar.position.set(0, 1.6, mz);
      winGroup.add(vBar);
    }

    const matDrapes = new THREE.MeshStandardMaterial({ color: 0x092617, roughness: 0.85 });
    const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 12), matBrass);
    curtainRod.position.set(0.08, 2.55, 0);
    curtainRod.rotation.x = Math.PI / 2;
    const drapeL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.0, 12, 1, false, 0, Math.PI), matDrapes);
    drapeL.position.set(0.08, 1.5, -0.95);
    drapeL.rotation.y = Math.PI / 2;
    const drapeR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.0, 12, 1, false, 0, Math.PI), matDrapes);
    drapeR.position.set(0.08, 1.5, 0.95);
    drapeR.rotation.y = Math.PI / 2;

    const tieL = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 16), matBrass);
    tieL.position.set(0.08, 1.3, -0.95);
    const tieR = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 16), matBrass);
    tieR.position.set(0.08, 1.3, 0.95);
    winGroup.add(curtainRod, drapeL, drapeR, tieL, tieR);

    const fogBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 4.2),
      new THREE.MeshBasicMaterial({ map: this.tex.london, side: THREE.DoubleSide })
    );
    fogBackdrop.rotation.y = Math.PI / 2;
    fogBackdrop.position.set(-5.2, 1.8, 2.5);
    this.scene.add(fogBackdrop);
    this.scene.add(winGroup);

    // -------------------------------------------------------------
    // 8. PARTITION WALL & GLAZED DOUBLE DOORS TO OBSERVATORY (Z = 0)
    //    Glazed upper panes allow the Celestial Orrery to gleam through!
    // -------------------------------------------------------------
    addWallSegment(2.0, 1.1, 0.2, -2.0, 0.55, 0, matWainscot);
    addWallSegment(2.0, 1.9, 0.2, -2.0, 2.05, 0, matWallpaper);
    addWallSegment(2.0, 1.1, 0.2, 2.0, 0.55, 0, matWainscot);
    addWallSegment(2.0, 1.9, 0.2, 2.0, 2.05, 0, matWallpaper);
    addWallSegment(2.0, 0.8, 0.2, 0, 2.6, 0, matDarkWood);

    const buildGlazedDoorLeaf = (isLeft) => {
      const group = new THREE.Group();
      group.position.set(isLeft ? -0.48 : 0.48, 1.1, 0);

      // Lower solid mahogany kick panel
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.08), matMahogany);
      lower.position.set(0, -0.625, 0);
      lower.castShadow = true;
      group.add(lower);

      const lowerMould = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.65, 0.095), matDarkWood);
      lowerMould.position.set(0, -0.625, 0);
      group.add(lowerMould);

      // Upper vertical stiles and top rail framing the glass window
      const stileL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.08), matMahogany);
      stileL.position.set(-0.405, 0.475, 0);
      const stileR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.08), matMahogany);
      stileR.position.set(0.405, 0.475, 0);
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.08), matMahogany);
      topRail.position.set(0, 1.02, 0);
      group.add(stileL, stileR, topRail);

      // Beveled Observatory Glass Pane
      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 1.08),
        new THREE.MeshPhysicalMaterial({
          color: 0xdbeafe,
          transparent: true,
          opacity: 0.24,
          roughness: 0.1,
          metalness: 0.1
        })
      );
      glassPane.position.set(0, 0.42, 0);
      group.add(glassPane);

      // Brass Astragal Mullion Bars across glass
      const vMullion = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.08, 8), matBrass);
      vMullion.position.set(0, 0.42, 0);
      const hMullion = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.68, 8), matBrass);
      hMullion.rotation.z = Math.PI / 2;
      hMullion.position.set(0, 0.42, 0);
      group.add(vMullion, hMullion);

      // Brass handle
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), matBrass);
      handle.position.set(isLeft ? 0.38 : -0.38, -0.08, 0.05);
      handle.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      group.add(handle);

      return group;
    };

    this.doorMeshL = buildGlazedDoorLeaf(true);
    this.doorMeshR = buildGlazedDoorLeaf(false);

    // Heavy Brass deadbolt in center of double doors
    this.lockBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16), matBrass);
    this.lockBolt.rotation.x = Math.PI / 2;
    this.lockBolt.position.set(0, 1.02, 0.05);
    this.scene.add(this.lockBolt);
    this.scene.add(this.doorMeshL, this.doorMeshR);

    // 9. INNER OBSERVATORY WALLS & CELESTIAL SKYLIGHT (Z: 0 to -4)
    addWallSegment(5.0, 3.0, 0.2, 0, 1.5, -4.0, matStoneFloor);
    addWallSegment(0.2, 3.0, 4.0, -2.5, 1.5, -2.0, matStoneFloor);
    addWallSegment(0.2, 3.0, 4.0, 2.5, 1.5, -2.0, matStoneFloor);

    const chartGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const chartMat = new THREE.MeshStandardMaterial({ map: this.tex.celestial, roughness: 0.8 });
    const chartEast = new THREE.Mesh(chartGeo, chartMat);
    chartEast.rotation.y = -Math.PI / 2;
    chartEast.position.set(2.39, 1.7, -2.0);
    const chartNorth = new THREE.Mesh(chartGeo, chartMat);
    chartNorth.position.set(0, 1.7, -3.89);
    this.scene.add(chartEast, chartNorth);

    const skylight = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({ map: this.tex.starry, side: THREE.DoubleSide })
    );
    skylight.rotation.x = Math.PI / 2;
    skylight.position.set(0, 2.98, -2.0);
    this.scene.add(skylight);

    const skylightRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 12, 32), matBrass);
    skylightRing.rotation.x = Math.PI / 2;
    skylightRing.position.set(0, 2.96, -2.0);
    this.scene.add(skylightRing);

    // 10. Sculpted Octagonal Observatory Pedestal for the Orrery
    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 0.98, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 })
    );
    pedBase.position.set(0, 0.08, -2.0);
    const pedShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.78, 0.64, 16),
      new THREE.MeshStandardMaterial({ color: 0x242d3d, roughness: 0.55, metalness: 0.25 })
    );
    pedShaft.position.set(0, 0.44, -2.0);
    const pedCrown = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 12, 32), matBrass);
    pedCrown.rotation.x = Math.PI / 2;
    pedCrown.position.set(0, 0.78, -2.0);
    this.scene.add(pedBase, pedShaft, pedCrown);
  }

  buildDetailedFurniture() {
    const matDarkWalnut = new THREE.MeshStandardMaterial({ color: 0x140a05, roughness: 0.5, metalness: 0.04 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.95 });

    // -------------------------------------------------------------
    // 1. GRANDFATHER CLOCK (North-East corner: X = 2.35, Z = 0.65)
    //    Loaded from Tripo 3D PBR Model: prop_s1_grandfather_clock.glb
    // -------------------------------------------------------------
    const clockFallback = new THREE.Group();
    clockFallback.position.set(2.35, 0, 0.65);
    this.scene.add(clockFallback);

    this.loadModelAsset(
      'assets/models/prop_s1_grandfather_clock.glb?v=20261024_6',
      2.35,
      new THREE.Vector3(2.35, 0, 0.65),
      -Math.PI * 0.22,
      clockFallback
    );

    // -------------------------------------------------------------
    // 2. VICTORIAN ROLL-TOP DESK (West/South-West Study: X = -1.8, Z = 3.6)
    //    Loaded from Tripo 3D PBR Model: prop_s1_rolltop_desk.glb
    // -------------------------------------------------------------
    const deskFallback = new THREE.Group();
    deskFallback.position.set(-1.8, 0, 3.6);
    this.scene.add(deskFallback);

    this.loadModelAsset(
      'assets/models/prop_s1_rolltop_desk.glb?v=20261024_6',
      1.68,
      new THREE.Vector3(-1.8, 0, 3.6),
      Math.PI * 0.75,
      deskFallback
    );

    // -------------------------------------------------------------
    // 3. SIDE TABLE WITH CLARA'S MUSIC BOX & LETTERS (X = -1.8, Z = 2.2)
    //    Pedestal side table + Tripo 3D PBR Model: prop_s1_music_box.glb
    // -------------------------------------------------------------
    const musicTableGroup = new THREE.Group();
    musicTableGroup.position.set(-1.8, 0, 2.2);

    const mtMatWood = new THREE.MeshStandardMaterial({
      map: this.tex.wainscot,
      color: 0x3b1f14,
      roughness: 0.36,
      metalness: 0.08
    });
    const mtTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.40, 0.045, 24), mtMatWood);
    mtTop.position.set(0, 0.755, 0);
    mtTop.castShadow = true;
    mtTop.receiveShadow = true;

    const mtRim = new THREE.Mesh(new THREE.TorusGeometry(0.415, 0.012, 10, 32), matBrass);
    mtRim.rotation.x = Math.PI / 2;
    mtRim.position.set(0, 0.775, 0);

    const mtPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.68, 16), mtMatWood);
    mtPillar.position.set(0, 0.39, 0);
    mtPillar.castShadow = true;

    const mtBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.07, 16), mtMatWood);
    mtBase.position.set(0, 0.035, 0);
    mtBase.receiveShadow = true;

    musicTableGroup.add(mtTop, mtRim, mtPillar, mtBase);
    this.scene.add(musicTableGroup);

    const musicBoxLight = new THREE.PointLight(0xfbbf24, 1.35, 3.2, 1.4);
    musicBoxLight.position.set(-1.5, 1.38, 2.2);
    this.scene.add(musicBoxLight);

    this.loadModelAsset(
      'assets/models/prop_s1_music_box.glb?v=20261024_6',
      0.56,
      new THREE.Vector3(-1.8, 0.778, 2.2),
      Math.PI * 0.42,
      null
    );

    // -------------------------------------------------------------
    // 4. JONATHAN'S PLUSH TUFTED VELVET WINGBACK ARMCHAIR (X = 0.85, Z = 3.55)
    //    Loaded from Tripo 3D PBR Model: prop_s1_wingback_armchair.glb
    // -------------------------------------------------------------
    const chairFallback = new THREE.Group();
    chairFallback.position.set(0.85, 0, 3.55);
    this.scene.add(chairFallback);

    this.loadModelAsset(
      'assets/models/prop_s1_wingback_armchair.glb?v=20261024_6',
      1.18,
      new THREE.Vector3(0.85, 0, 3.55),
      -Math.PI * 0.78,
      chairFallback
    );

    // -------------------------------------------------------------
    // 5. CARVED MARBLE FIREPLACE & CLARA'S PORTRAIT (South Wall: X = 0, Z = 4.72)
    //    Loaded from Blender 5.2 Model: blender_s1_fireplace_mantel.glb
    // -------------------------------------------------------------
    this.loadModelAsset(
      'assets/models/blender_s1_fireplace_mantel.glb?v=20261024_6',
      2.35,
      new THREE.Vector3(0, 0, 4.72),
      Math.PI,
      null,
      (wrapper) => {
        wrapper.traverse((child) => {
          if (child.isMesh && child.material) {
            // Replace bright emissive spheres with textured glowing embers
            if (child.geometry && child.geometry.type === 'SphereGeometry') {
              child.visible = false;
            } else {
              child.material.map = this.tex.wainscot;
              child.material.color.setHex(0x2d1c12);
              child.material.roughness = 0.42;
              child.material.metalness = 0.15;
              child.material.needsUpdate = true;
            }
          }
        });
      }
    );

    // Glowing Textured Fire Embers & Charred Logs inside Fireplace Hearth
    const embersBed = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.38),
      new THREE.MeshStandardMaterial({
        map: this.tex.embers,
        emissive: 0xff4500,
        emissiveMap: this.tex.embers,
        emissiveIntensity: 2.2,
        roughness: 0.6
      })
    );
    embersBed.rotation.x = -Math.PI / 2.4;
    embersBed.position.set(0, 0.16, 4.62);
    this.scene.add(embersBed);

    // Clara's Portrait above mantelpiece (Facing North into the study)
    const portraitGroup = new THREE.Group();
    portraitGroup.position.set(0, 2.22, 4.78);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.05), matDarkWalnut);
    const slip = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.06, 0.055), matBrass);
    const portrait = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1.0),
      new THREE.MeshStandardMaterial({ map: this.tex.clara, roughness: 0.55 })
    );
    portrait.rotation.y = Math.PI;
    portrait.position.set(0, 0, -0.032);
    portraitGroup.add(frame, slip, portrait);
    this.scene.add(portraitGroup);

    // -------------------------------------------------------------
    // 6. FLOOR-TO-CEILING LIBRARY BOOKSHELVES (West Wall: X = -2.8)
    // -------------------------------------------------------------
    for (let bz of [0.8, 4.2]) {
      const bCase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.7, 1.3), matDarkWalnut);
      bCase.position.set(-2.78, 1.35, bz);
      for (let sy = 0.5; sy <= 2.2; sy += 0.55) {
        const books = new THREE.Mesh(
          new THREE.PlaneGeometry(1.15, 0.45),
          new THREE.MeshStandardMaterial({ map: this.tex.books, roughness: 0.7 })
        );
        books.rotation.y = Math.PI / 2;
        books.position.set(-2.56, sy, bz);
        this.scene.add(books);
      }
      this.scene.add(bCase);
    }

    // -------------------------------------------------------------
    // 7. BRASS GAS CHANDELIER HANGING FROM CEILING (Study Center)
    // -------------------------------------------------------------
    const chGroup = new THREE.Group();
    chGroup.position.set(0, 2.8, 2.5);

    const chStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), matBrass);
    chStem.position.set(0, -0.25, 0);
    const chHub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), matBrass);
    chHub.position.set(0, -0.5, 0);
    chGroup.add(chStem, chHub);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const arm = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 16, Math.PI / 2), matBrass);
      arm.rotation.z = -Math.PI / 4;
      arm.rotation.y = a;
      arm.position.set(Math.cos(a) * 0.15, -0.5, Math.sin(a) * 0.15);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.4, transparent: true, opacity: 0.88 })
      );
      globe.position.set(Math.cos(a) * 0.38, -0.52, Math.sin(a) * 0.38);
      chGroup.add(arm, globe);
    }
    this.scene.add(chGroup);

    // -------------------------------------------------------------
    // 8. TELESCOPE & ASTRONOMICAL LECTERN IN OBSERVATORY (Z = -2.0)
    // -------------------------------------------------------------
    const obsGroup = new THREE.Group();
    obsGroup.position.set(1.4, 0, -2.2);

    const tripod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), matDarkWalnut);
    tripod1.rotation.z = 0.25;
    const tripod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), matDarkWalnut);
    tripod2.rotation.z = -0.25;
    const tMount = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), matBrass);
    tMount.position.set(0, 1.25, 0);
    const tTube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.2, 16), matBrass);
    tTube.rotation.x = -Math.PI / 3.2;
    tTube.position.set(0, 1.35, 0.2);
    obsGroup.add(tripod1, tripod2, tMount, tTube);

    const lecternPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 12), matDarkWalnut);
    lecternPillar.position.set(-0.5, 0.5, 0.4);
    const lecternSlant = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.42), matDarkWalnut);
    lecternSlant.rotation.x = Math.PI / 5;
    lecternSlant.position.set(-0.5, 1.02, 0.4);
    const bookL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.8 }));
    bookL.rotation.x = -Math.PI / 3.2;
    bookL.position.set(-0.62, 1.05, 0.38);
    const bookR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.8 }));
    bookR.rotation.x = -Math.PI / 3.2;
    bookR.position.set(-0.38, 1.05, 0.38);
    obsGroup.add(lecternPillar, lecternSlant, bookL, bookR);

    this.scene.add(obsGroup);
  }

  buildCoatRack(x, y, z) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, y, z);
    const matBentwood = new THREE.MeshStandardMaterial({ color: 0x140a05, roughness: 0.5 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.85, 12), matBentwood);
    pole.position.set(0, 0.92, 0);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.32), matBentwood);
      leg.rotation.y = a;
      leg.position.set(0, 0.17, 0);
      rackGroup.add(leg);
    }

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI), matBrass);
      hook.rotation.y = a;
      hook.position.set(0, 1.7, 0);
      rackGroup.add(hook);
    }

    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    hat.position.set(0.08, 1.68, 0);

    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.95 }));
    coat.position.set(0.05, 1.15, 0);

    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.9, 8), matBentwood);
    cane.position.set(-0.12, 0.45, 0.1);
    cane.rotation.z = 0.08;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 }));
    knob.position.set(-0.15, 0.9, 0.1);

    rackGroup.add(pole, hat, coat, cane, knob);
    this.scene.add(rackGroup);
  }

  loadHeroPropOrrery() {
    this.loadModelAsset(
      'assets/models/the_celestial_orrery.glb?v=20261024_6',
      1.35,
      new THREE.Vector3(0, 0.78, -2.0),
      0,
      null,
      (wrapper) => {
        this.orreryGroup = wrapper;
        console.log("The Celestial Orrery 3D model loaded successfully into Observatory.");
      }
    );
  }

  setupDustParticles() {
    const particleCount = 380;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 5.6;
      positions[i + 1] = Math.random() * 2.8;
      positions[i + 2] = (Math.random() - 0.5) * 8.5;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.024,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  openObservatoryDoors() {
    if (this.doorMeshL && this.doorMeshR) {
      if (this.lockBolt) {
        this.scene.remove(this.lockBolt);
      }
      const startRotL = this.doorMeshL.rotation.y;
      const startRotR = this.doorMeshR.rotation.y;
      let t = 0;
      const anim = () => {
        t += 0.025;
        this.doorMeshL.rotation.y = THREE.MathUtils.lerp(startRotL, -Math.PI / 2.2, t);
        this.doorMeshR.rotation.y = THREE.MathUtils.lerp(startRotR, Math.PI / 2.2, t);
        if (t < 1.0) requestAnimationFrame(anim);
      };
      anim();
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    const elapsed = this.clock.getElapsedTime();

    for (const gl of this.gasLights) {
      if (gl.isFire) {
        const fireNoise = Math.sin(elapsed * 12) * 0.35 + Math.cos(elapsed * 23) * 0.25 + Math.sin(elapsed * 37) * 0.15;
        gl.light.intensity = gl.base + fireNoise;
      } else {
        const flicker = Math.sin(elapsed * 7 + gl.offset) * 0.12 + Math.cos(elapsed * 19) * 0.08;
        gl.light.intensity = gl.base + flicker;
      }
    }

    if (this.orreryGroup) {
      this.orreryGroup.rotation.y += 0.0018;
    }

    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.0012;
        if (positions[i] < 0) positions[i] = 2.8;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
