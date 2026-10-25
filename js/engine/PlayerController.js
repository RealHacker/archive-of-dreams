// PlayerController.js - First-person movement and camera controls with collision bounds
class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isLocked = false;
    this.enabled = true;

    // Camera orientation
    this.pitch = -0.05; // Slightly downward towards desk
    this.yaw = Math.PI * 0.5; // Looking forward into study (facing West)

    // Velocity & speed
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 3.0; // meters per second
    this.eyeHeight = 1.65; // average eye height in meters

    // Dynamic Room Boundaries
    // Initial bounds: restricted to Study Workshop (Z between 0.35 and 4.6)
    this.bounds = {
      minX: -2.6,
      maxX: 2.6,
      minZ: 0.35,
      maxZ: 4.6
    };

    // Head bobbing effect
    this.bobTimer = 0;
    this.bobSpeed = 8.5;
    this.bobAmount = 0.035;

    // Fallback mouse tracking when pointer lock is recovering after modal close
    this.lastMouseX = null;
    this.lastMouseY = null;

    this.initListeners();
  }

  isUiBlocking() {
    const modalIds = [
      'start-overlay',
      'loading-screen',
      'cutscene-modal',
      'puzzle-modal',
      'document-modal',
      'puzzle-pigment-scale',
      'puzzle-element-mosaic',
      'puzzle-cosmic-dial',
      'puzzle-life-support',
      'puzzle-spectrometer',
      'puzzle-heritage-core',
      'story3-fracture-modal',
      'story3-resolution-modal',
      'story4-keystone-modal',
      'epilogue-awakening-modal'
    ];
    for (const id of modalIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const disp = el.style.display || window.getComputedStyle(el).display;
      if (disp && disp !== 'none') return true;
    }
    const journal = document.getElementById('journal-drawer');
    if (journal && journal.classList.contains('open')) return true;
    return false;
  }

  // Called when player unlocks the double doors to the Observatory
  unlockObservatoryBounds() {
    console.log("Observatory doors opened: expanding player bounds to the inner sanctum.");
    this.bounds.minZ = -3.6;
  }

  initListeners() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    document.addEventListener('mousedown', (e) => {
      if (this.isUiBlocking()) return;
      if (e.target && e.target.closest && e.target.closest('#top-hud-bar')) return;
      if (this.enabled && !this.isLocked && this.domElement && this.domElement.requestPointerLock) {
        try {
          this.domElement.requestPointerLock();
        } catch (err) {}
      }
    });

    this.domElement.addEventListener('click', () => {
      if (this.isUiBlocking()) return;
      if (this.enabled && !this.isLocked && this.domElement.requestPointerLock) {
        try {
          this.domElement.requestPointerLock();
        } catch (err) {}
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      const crosshair = document.getElementById('crosshair');
      if (crosshair) {
        crosshair.style.opacity = (!this.isUiBlocking()) ? '1' : '0.2';
      }
    });
  }

  lock() {
    this.enabled = true;
    this.lastMouseX = null;
    this.lastMouseY = null;
    if (!this.isUiBlocking() && this.domElement && this.domElement.requestPointerLock) {
      try {
        this.domElement.requestPointerLock();
      } catch (err) {}
    }
  }

  unlock() {
    this.lastMouseX = null;
    this.lastMouseY = null;
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (err) {}
    }
  }

  onKeyDown(e) {
    if (e.code === 'Escape') {
      // If a document or puzzle modal is open, close it cleanly first
      const docModal = document.getElementById('document-modal');
      if (docModal && (docModal.style.display === 'flex' || docModal.style.display === 'block')) {
        e.preventDefault();
        docModal.style.display = 'none';
        this.enabled = true;
        this.lastMouseX = null;
        this.lastMouseY = null;
        return;
      }
      const puzModal = document.getElementById('puzzle-modal');
      if (puzModal && (puzModal.style.display === 'flex' || puzModal.style.display === 'block')) {
        e.preventDefault();
        const closeBtn = document.getElementById('puzzle-close');
        if (closeBtn) closeBtn.click();
        return;
      }
    }

    if (e.code === 'Tab' || e.code === 'Escape') {
      e.preventDefault();
      if (window.toggleJournalMenu) {
        window.toggleJournalMenu();
      }
      return;
    }

    if (!this.enabled || this.isUiBlocking()) return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.enabled || this.isUiBlocking()) {
      this.lastMouseX = null;
      this.lastMouseY = null;
      return;
    }

    // Ignore mouse look if hovering the top HUD menu button while unlocked
    if (!this.isLocked && e.target && e.target.closest && e.target.closest('#top-hud-bar')) {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      return;
    }

    let dx = e.movementX || 0;
    let dy = e.movementY || 0;

    if (!this.isLocked) {
      if (this.lastMouseX !== null && this.lastMouseY !== null && dx === 0 && dy === 0) {
        dx = e.clientX - this.lastMouseX;
        dy = e.clientY - this.lastMouseY;
      }
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }

    const sensitivity = 0.0022;
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;

    // Clamp vertical look angle (-85 deg to +85 deg)
    const maxPitch = Math.PI / 2 - 0.08;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  update(delta) {
    if (!this.enabled || this.isUiBlocking()) {
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      return;
    }

    // Continuous edge-turn when pointer lock is temporarily disengaged so the camera never stops at screen edges
    if (!this.isLocked && this.lastMouseX !== null) {
      const edgeZone = 28;
      const edgeTurnSpeed = 1.85;
      if (this.lastMouseX <= edgeZone) {
        this.yaw += edgeTurnSpeed * delta;
      } else if (this.lastMouseX >= window.innerWidth - edgeZone) {
        this.yaw -= edgeTurnSpeed * delta;
      }
    }

    // Always keep camera orientation synced to yaw/pitch
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Movement friction
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * this.speed * 10.0 * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * this.speed * 10.0 * delta;
    }

    // Move in local camera direction (horizontal plane)
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const displacement = new THREE.Vector3()
      .addScaledVector(forward, -this.velocity.z * delta)
      .addScaledVector(right, -this.velocity.x * delta);

    this.camera.position.add(displacement);

    // Collision clamping against study walls
    this.camera.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.camera.position.z));

    // Head bobbing when walking
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    if (isMoving) {
      this.bobTimer += delta * this.bobSpeed;
      this.camera.position.y = this.eyeHeight + Math.sin(this.bobTimer) * this.bobAmount;
    } else {
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.eyeHeight, delta * 5);
    }
  }
}
