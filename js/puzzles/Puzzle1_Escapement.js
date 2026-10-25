// Puzzle1_Escapement.js - 2D Gear Train Escapement Puzzle for the Roll-Top Desk
class Puzzle1_Escapement {
  constructor(audioManager, onSolved) {
    this.audio = audioManager;
    this.onSolved = onSolved;

    this.container = document.getElementById('puzzle-modal');
    this.canvas = document.getElementById('gear-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = 720;
    this.height = 420;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Fixed gears
    this.driveGear = { x: 120, y: 220, teeth: 20, radius: 32, angle: 0, speed: 1.0, isDrive: true };
    this.latchGear = { x: 600, y: 220, teeth: 40, radius: 64, angle: 0, speed: 0, isLatch: true };

    // Pegs on the backplate
    this.pegs = [
      { id: 1, x: 216, y: 220, gear: null }, // Distance from Drive = 96 (32 + 64) -> Fits Gear 2 (40T)
      { id: 2, x: 424, y: 220, gear: null }, // Distance from Peg1 = 208? Wait, let's set exact distances!
      { id: 3, x: 320, y: 120, gear: null }  // Upper alternative peg
    ];

    // Perfect distances for meshing:
    // Drive (radius 32) + Gear 2 (radius 64) = 96. Peg 1 is at 120 + 96 = 216.
    // Gear 2 (radius 64) + Gear 3 (radius 48) = 112. Peg 2 is at 216 + 112 = 328.
    // Wait, Peg 2 to Latch: Gear 3 (radius 48) + Latch (radius 64) = 112.
    // Latch is at 328 + 112 = 440! Let's center the whole train:
    this.driveGear.x = 160;
    this.pegs[0].x = 256; // 160 + 96
    this.pegs[1].x = 368; // 256 + 112
    this.latchGear.x = 480; // 368 + 112
    this.pegs[2] = { id: 3, x: 312, y: 130, gear: null }; // Dummy top peg

    // Tray of available loose gears
    this.looseGears = [
      { id: 'g1', teeth: 20, radius: 32, color: '#eab308', name: '20T Small Brass', trayX: 180, trayY: 360, x: 180, y: 360, peg: null, angle: 0 },
      { id: 'g2', teeth: 40, radius: 64, color: '#d97706', name: '40T Large Bronze', trayX: 360, trayY: 360, x: 360, y: 360, peg: null, angle: 0 },
      { id: 'g3', teeth: 30, radius: 48, color: '#ca8a04', name: '30T Medium Steel', trayX: 540, trayY: 360, x: 540, y: 360, peg: null, angle: 0 }
    ];

    this.selectedGear = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isRunning = false;
    this.isSolved = false;
    this.latchOffset = 0; // Lock bolt retraction (0 to 45px)

    this.bindEvents();
    this.renderLoop();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    const leverBtn = document.getElementById('btn-test-lever');
    if (leverBtn) {
      leverBtn.onclick = () => this.toggleMechanism();
    }
    const resetBtn = document.getElementById('btn-reset-gears');
    if (resetBtn) {
      resetBtn.onclick = () => this.resetGears();
    }
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.width / rect.width),
      y: (e.clientY - rect.top) * (this.height / rect.height)
    };
  }

  onMouseDown(e) {
    if (this.isSolved) return;
    const pos = this.getCanvasPos(e);

    // Check click on loose gears (search in reverse order for top-most)
    for (let i = this.looseGears.length - 1; i >= 0; i--) {
      const g = this.looseGears[i];
      const dist = Math.hypot(pos.x - g.x, pos.y - g.y);
      if (dist <= g.radius) {
        this.selectedGear = g;
        this.dragOffset.x = pos.x - g.x;
        this.dragOffset.y = pos.y - g.y;

        // If detached from peg, clear peg
        if (g.peg) {
          g.peg.gear = null;
          g.peg = null;
          this.audio.playGearClick(480);
        }
        break;
      }
    }
  }

  onMouseMove(e) {
    if (!this.selectedGear) return;
    const pos = this.getCanvasPos(e);
    this.selectedGear.x = pos.x - this.dragOffset.x;
    this.selectedGear.y = pos.y - this.dragOffset.y;
  }

  onMouseUp() {
    if (!this.selectedGear) return;
    const g = this.selectedGear;
    this.selectedGear = null;

    // Check snapping to nearby empty peg (within 35px)
    let snapped = false;
    for (const peg of this.pegs) {
      if (!peg.gear) {
        const dist = Math.hypot(g.x - peg.x, g.y - peg.y);
        if (dist < 40) {
          g.x = peg.x;
          g.y = peg.y;
          g.peg = peg;
          peg.gear = g;
          snapped = true;
          this.audio.playGearClick(650);
          break;
        }
      }
    }

    // If not snapped on a peg, return to tray slot
    if (!snapped) {
      g.x = g.trayX;
      g.y = g.trayY;
      g.peg = null;
      this.audio.playGearClick(320);
    }
  }

  resetGears() {
    this.isRunning = false;
    for (const g of this.looseGears) {
      g.x = g.trayX;
      g.y = g.trayY;
      g.peg = null;
    }
    for (const p of this.pegs) {
      p.gear = null;
    }
    this.latchGear.speed = 0;
    this.latchOffset = 0;
    this.audio.playGearClick(400);
  }

  toggleMechanism() {
    if (this.isSolved) return;
    this.isRunning = !this.isRunning;
    this.audio.playCrank();

    // Check solution configuration
    // Required: Peg 1 has Gear 2 (40T), Peg 2 has Gear 3 (30T)
    const peg1 = this.pegs[0];
    const peg2 = this.pegs[1];

    if (peg1.gear && peg1.gear.id === 'g2' && peg2.gear && peg2.gear.id === 'g3') {
      // Correct! Drive (CW) -> Peg1 (CCW) -> Peg2 (CW) -> Latch (CCW at 30 RPM)
      this.latchGear.speed = -0.5; // CCW
      setTimeout(() => this.triggerSuccess(), 1200);
    } else {
      // Incomplete or jammed train
      this.latchGear.speed = 0;
    }
  }

  triggerSuccess() {
    if (this.isSolved) return;
    this.isSolved = true;
    this.isRunning = true;
    this.audio.playLockBolt();

    const banner = document.getElementById('notification-banner');
    if (banner) {
      banner.innerText = "Mechanism Unlocked: Desk Roll-Top Opened!";
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 3500);
    }

    setTimeout(() => {
      if (this.onSolved) this.onSolved();
    }, 1800);
  }

  // Draw procedural gear with teeth and center brass hub
  drawGear(ctx, x, y, radius, teeth, angle, color, isDriver = false, isLatch = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Gear body
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;

    // Draw cog teeth
    const toothDepth = 9;
    const numPoints = teeth * 2;
    const step = (Math.PI * 2) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const r = i % 2 === 0 ? radius + toothDepth : radius - 2;
      const a = i * step;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner rim
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spokes (4 spokes)
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.rotate(Math.PI / 2);
      ctx.rect(-3, -radius * 0.65, 6, radius * 0.65);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = isDriver ? '#22c55e' : (isLatch ? '#ef4444' : '#f59e0b');
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.renderLoop());
  }

  update() {
    if (this.isRunning) {
      // Rotate drive gear CW
      this.driveGear.angle += 0.05;

      const p1 = this.pegs[0];
      const p2 = this.pegs[1];

      // If Peg 1 is connected to Drive
      if (p1.gear) {
        const ratio1 = this.driveGear.teeth / p1.gear.teeth;
        p1.gear.angle -= 0.05 * ratio1; // CCW

        // If Peg 2 is connected to Peg 1
        if (p2.gear) {
          const ratio2 = p1.gear.teeth / p2.gear.teeth;
          p2.gear.angle += 0.05 * ratio1 * ratio2; // CW

          // Latch gear CCW
          const ratio3 = p2.gear.teeth / this.latchGear.teeth;
          this.latchGear.angle -= 0.05 * ratio1 * ratio2 * ratio3;

          // Retract bolt
          if (this.latchOffset < 40) {
            this.latchOffset += 0.6;
          }
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw tray divider
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 300);
    ctx.lineTo(this.width - 30, 300);
    ctx.stroke();

    ctx.font = '12px Cinzel, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("PARTS TRAY (DRAG GEARS TO PEGS)", 40, 318);

    // Draw lock bolt on the right of Latch Gear
    ctx.save();
    ctx.translate(this.latchGear.x + 60 - this.latchOffset, this.latchGear.y - 12);
    ctx.fillStyle = this.isSolved ? '#22c55e' : '#b45309';
    ctx.fillRect(0, 0, 70, 24);
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(0, 0, 70, 24);
    ctx.fillStyle = '#000';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText("BOLT", 18, 16);
    ctx.restore();

    // Draw empty pegs
    for (const peg of this.pegs) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = peg.gear ? '#451a03' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`PEG ${peg.id}`, peg.x - 14, peg.y - 14);
    }

    // Draw Drive Gear (Fixed)
    this.drawGear(ctx, this.driveGear.x, this.driveGear.y, this.driveGear.radius, this.driveGear.teeth, this.driveGear.angle, '#f59e0b', true, false);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText("DRIVE (CW 60 RPM)", this.driveGear.x - 45, this.driveGear.y + 60);

    // Draw Latch Gear (Target)
    this.drawGear(ctx, this.latchGear.x, this.latchGear.y, this.latchGear.radius, this.latchGear.teeth, this.latchGear.angle, '#b45309', false, true);
    ctx.fillStyle = this.isSolved ? '#4ade80' : '#f87171';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText("LATCH (REQ: CCW 30 RPM)", this.latchGear.x - 65, this.latchGear.y + 90);

    // Draw loose gears
    for (const g of this.looseGears) {
      if (g !== this.selectedGear) {
        this.drawGear(ctx, g.x, g.y, g.radius, g.teeth, g.angle, g.color);
      }
    }
    // Draw dragged gear on top
    if (this.selectedGear) {
      const g = this.selectedGear;
      this.drawGear(ctx, g.x, g.y, g.radius, g.teeth, g.angle, g.color);
    }
  }
}
