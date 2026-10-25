// InteractionManager.js - Raycasting, hover outlines, HUD prompts, and 3D floating text
class InteractionManager {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.5; // Max interaction distance in meters
    this.centerCoord = new THREE.Vector2(0, 0);

    this.interactables = [];
    this.floatingWords = [];
    this.currentHover = null;
    this.onInteractCallback = null;

    this.crosshairEl = document.getElementById('crosshair');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
    });
  }

  registerInteractable(mesh, id, label, data = {}) {
    mesh.userData = { id, label, ...data, isInteractable: true };
    this.interactables.push(mesh);
  }

  registerFloatingWord(worldPos, text, triggerDistance = 3.0) {
    const el = document.createElement('div');
    el.className = 'floating-word-container';
    el.innerHTML = text;
    document.getElementById('ui-layer').appendChild(el);

    this.floatingWords.push({
      position: worldPos,
      text: text,
      triggerDistance: triggerDistance,
      element: el,
      visible: false
    });
  }

  update() {
    this.raycaster.setFromCamera(this.centerCoord, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);

    if (intersects.length > 0) {
      // Find parent with userData if hit child mesh
      let hitObj = intersects[0].object;
      while (hitObj && !hitObj.userData.isInteractable && hitObj.parent) {
        hitObj = hitObj.parent;
      }

      if (hitObj && hitObj.userData.isInteractable) {
        this.setHover(hitObj);
      } else {
        this.clearHover();
      }
    } else {
      this.clearHover();
    }

    this.updateFloatingWords();
  }

  setHover(obj) {
    if (this.currentHover === obj) return;
    this.currentHover = obj;

    if (this.crosshairEl) this.crosshairEl.classList.add('hovering');
    if (this.promptEl) {
      this.promptEl.style.display = 'flex';
      this.promptTextEl.innerText = obj.userData.label || 'Inspect';
    }
  }

  clearHover() {
    if (!this.currentHover) return;
    this.currentHover = null;

    if (this.crosshairEl) this.crosshairEl.classList.remove('hovering');
    if (this.promptEl) this.promptEl.style.display = 'none';
  }

  clear() {
    this.clearHover();
    this.interactables = [];
    for (const fw of this.floatingWords) {
      if (fw.element && fw.element.parentNode) {
        fw.element.parentNode.removeChild(fw.element);
      }
    }
    this.floatingWords = [];
  }

  triggerInteraction() {
    if (this.currentHover && this.onInteractCallback) {
      this.onInteractCallback(this.currentHover.userData);
    }
  }

  updateFloatingWords() {
    const tempVec = new THREE.Vector3();
    const camPos = this.camera.position;
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;

    for (const fw of this.floatingWords) {
      const dist = camPos.distanceTo(fw.position);
      tempVec.copy(fw.position);
      tempVec.project(this.camera);

      // Check if in front of camera
      const isFacing = tempVec.z < 1.0;

      if (isFacing && dist <= fw.triggerDistance) {
        const x = (tempVec.x * halfWidth) + halfWidth;
        const y = -(tempVec.y * halfHeight) + halfHeight;

        fw.element.style.left = `${x}px`;
        fw.element.style.top = `${y}px`;
        if (!fw.visible) {
          fw.element.classList.add('visible');
          fw.visible = true;
        }
      } else {
        if (fw.visible) {
          fw.element.classList.remove('visible');
          fw.visible = false;
        }
      }
    }
  }
}
