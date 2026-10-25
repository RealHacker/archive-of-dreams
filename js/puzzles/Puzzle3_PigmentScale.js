// Puzzle3_PigmentScale.js - The Alchemical Pigment Scale (Venice, 1577)
// Objective: Weigh exactly 7 Drams of raw lapis lazuli pigment in crucible
// Solution: Left Pan = Pigment (7) + Weight B (3) = 10 Drams
//           Right Pan = Weight C (9) + Weight A (1) = 10 Drams
//           Scale balances at zero, release pin unlocks Bernardo's desk drawer.

class Puzzle3_PigmentScale {
  constructor(audioManager, onSolved) {
    this.audioManager = audioManager;
    this.onSolved = onSolved;

    this.container = document.getElementById('puzzle-pigment-scale');
    this.solved = false;

    // Weights: A (1), B (3), C (9)
    // Locations: 'tray', 'left', 'right'
    this.weights = {
      '1': { val: 1, label: 'I (1 Dram)', loc: 'tray' },
      '3': { val: 3, label: 'III (3 Drams)', loc: 'tray' },
      '9': { val: 9, label: 'IX (9 Drams)', loc: 'tray' }
    };

    this.pigmentDrams = 0; // In crucible on left pan
    this.maxPigment = 15;

    this.setupUI();
  }

  setupUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="scale-modal-content">
        <div class="puzzle-header">
          <div class="puzzle-title-tag">VENICE, 1577 • BROTHER BERNARDO'S APOTHECARY</div>
          <h2>THE ALCHEMICAL PIGMENT SCALE</h2>
          <p class="puzzle-desc">
            Balance the sacred medium in the crucible to release the locked desk drawer.
            <br>
            <span class="cipher-hint">Latin Inscription: "P + III = IX + I &nbsp;⟹&nbsp; P = VII Drachmae"</span>
          </p>
        </div>

        <div class="scale-stage">
          <!-- Scale Fulcrum & Beam -->
          <div class="scale-apparatus">
            <div class="scale-pillar"></div>
            <div class="scale-fulcrum"></div>
            <div class="scale-beam" id="scale-beam">
              <div class="scale-needle" id="scale-needle"></div>
              
              <!-- Left Pan (Crucible) -->
              <div class="pan-assembly left" id="pan-assembly-left">
                <div class="pan-strings"></div>
                <div class="scale-pan" id="scale-pan-left">
                  <div class="pan-title">CRUCIBLE (LEFT)</div>
                  <div class="pan-contents" id="pan-left-contents">
                    <div class="crucible-graphic">
                      <div class="crucible-powder" id="crucible-powder" style="height: 0%;"></div>
                      <span id="crucible-label">Empty</span>
                    </div>
                    <div class="pan-weights-slot" id="left-pan-weights"></div>
                  </div>
                  <div class="pan-weight-display" id="left-total-disp">0 dr</div>
                </div>
              </div>

              <!-- Right Pan -->
              <div class="pan-assembly right" id="pan-assembly-right">
                <div class="pan-strings"></div>
                <div class="scale-pan" id="scale-pan-right">
                  <div class="pan-title">COUNTERWEIGHTS (RIGHT)</div>
                  <div class="pan-contents" id="pan-right-contents">
                    <div class="pan-weights-slot" id="right-pan-weights"></div>
                  </div>
                  <div class="pan-weight-display" id="right-total-disp">0 dr</div>
                </div>
              </div>
            </div>

            <div class="scale-gauge">
              <span class="gauge-mark left">-10</span>
              <span class="gauge-mark center">0 (BALANCED)</span>
              <span class="gauge-mark right">+10</span>
            </div>
          </div>
        </div>

        <!-- Controls Area -->
        <div class="scale-controls-grid">
          <!-- Pigment Controls -->
          <div class="control-card pigment-card">
            <div class="card-title">ULTRAMARINE PIGMENT SCOOP</div>
            <div class="pigment-actions">
              <button class="alchemy-btn" id="btn-scoop-add">+1 Dram Lapis</button>
              <button class="alchemy-btn" id="btn-scoop-sub">-1 Dram</button>
              <button class="alchemy-btn-secondary" id="btn-scoop-clear">Clear Crucible</button>
            </div>
            <div class="pigment-readout">Crucible Weight: <strong id="pigment-count">0</strong> Drams</div>
          </div>

          <!-- Bronze Weights Tray -->
          <div class="control-card weights-card">
            <div class="card-title">BRONZE COUNTERWEIGHTS</div>
            <div class="weights-tray" id="weights-tray">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Action / Status -->
        <div class="scale-footer">
          <div class="scale-status" id="scale-status-text">The scale is resting. Adjust weights and pigments.</div>
          <div class="scale-actions">
            <button class="scale-lock-btn" id="btn-depress-pin" disabled>DEPRESS LOCKING PIN</button>
            <button class="puzzle-close-btn" id="btn-scale-close">Leave Desk</button>
          </div>
        </div>
      </div>
    `;

    // Bind Pigment buttons
    document.getElementById('btn-scoop-add').addEventListener('click', () => this.addPigment(1));
    document.getElementById('btn-scoop-sub').addEventListener('click', () => this.addPigment(-1));
    document.getElementById('btn-scoop-clear').addEventListener('click', () => this.clearPigment());

    // Bind Close & Pin
    document.getElementById('btn-scale-close').addEventListener('click', () => this.close());
    document.getElementById('btn-depress-pin').addEventListener('click', () => this.onDepressPin());

    this.render();
  }

  addPigment(delta) {
    if (this.solved) return;
    const next = this.pigmentDrams + delta;
    if (next >= 0 && next <= this.maxPigment) {
      this.pigmentDrams = next;
      if (this.audioManager && this.audioManager.playKeyClick) this.audioManager.playKeyClick();
      this.render();
    }
  }

  clearPigment() {
    if (this.solved) return;
    if (this.pigmentDrams > 0) {
      this.pigmentDrams = 0;
      if (this.audioManager && this.audioManager.playKeyClick) this.audioManager.playKeyClick();
      this.render();
    }
  }

  moveWeight(weightId, targetLoc) {
    if (this.solved) return;
    if (this.weights[weightId]) {
      this.weights[weightId].loc = targetLoc;
      if (this.audioManager) this.audioManager.playRelayClick();
      this.render();
    }
  }

  getTotals() {
    let leftW = this.pigmentDrams;
    let rightW = 0;

    for (const [id, w] of Object.entries(this.weights)) {
      if (w.loc === 'left') leftW += w.val;
      else if (w.loc === 'right') rightW += w.val;
    }

    return { leftW, rightW, diff: leftW - rightW };
  }

  render() {
    const { leftW, rightW, diff } = this.getTotals();

    // 1. Tilt Beam & Needle
    const beam = document.getElementById('scale-beam');
    const needle = document.getElementById('scale-needle');
    // Clamp tilt angle between -24 and +24 deg
    const angle = Math.max(-24, Math.min(24, diff * 3.5));
    if (beam) {
      beam.style.transform = `rotate(${angle}deg)`;
    }
    // Counter-rotate pans so they stay vertical
    const panLeft = document.getElementById('pan-assembly-left');
    const panRight = document.getElementById('pan-assembly-right');
    if (panLeft) panLeft.style.transform = `rotate(${-angle}deg)`;
    if (panRight) panRight.style.transform = `rotate(${-angle}deg)`;

    // 2. Crucible graphic
    const powderEl = document.getElementById('crucible-powder');
    const labelEl = document.getElementById('crucible-label');
    const countEl = document.getElementById('pigment-count');
    if (countEl) countEl.innerText = this.pigmentDrams;

    if (powderEl) {
      const pct = Math.min(100, (this.pigmentDrams / 10) * 100);
      powderEl.style.height = `${pct}%`;
    }
    if (labelEl) {
      labelEl.innerText = this.pigmentDrams > 0 ? `${this.pigmentDrams} Drams Lapis` : 'Empty';
    }

    // 3. Weight displays
    const leftDisp = document.getElementById('left-total-disp');
    const rightDisp = document.getElementById('right-total-disp');
    if (leftDisp) leftDisp.innerText = `${leftW} dr`;
    if (rightDisp) rightDisp.innerText = `${rightW} dr`;

    // 4. Render Weights in Tray, Left Pan, Right Pan
    const trayEl = document.getElementById('weights-tray');
    const leftPanWEl = document.getElementById('left-pan-weights');
    const rightPanWEl = document.getElementById('right-pan-weights');

    if (trayEl) trayEl.innerHTML = '';
    if (leftPanWEl) leftPanWEl.innerHTML = '';
    if (rightPanWEl) rightPanWEl.innerHTML = '';

    for (const [id, w] of Object.entries(this.weights)) {
      const chip = document.createElement('div');
      chip.className = `weight-chip weight-${id}`;
      chip.innerHTML = `
        <span class="weight-label">${w.label}</span>
        <div class="weight-buttons">
          ${w.loc !== 'left' ? `<button class="w-btn" title="Move to Left Pan">⮜ Left</button>` : ''}
          ${w.loc !== 'tray' ? `<button class="w-btn" title="Return to Tray">Tray</button>` : ''}
          ${w.loc !== 'right' ? `<button class="w-btn" title="Move to Right Pan">Right ⮞</button>` : ''}
        </div>
      `;

      // Attach button events
      const btns = chip.querySelectorAll('.w-btn');
      btns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const txt = b.innerText;
          if (txt.includes('Left')) this.moveWeight(id, 'left');
          else if (txt.includes('Right')) this.moveWeight(id, 'right');
          else this.moveWeight(id, 'tray');
        });
      });

      if (w.loc === 'tray' && trayEl) trayEl.appendChild(chip);
      else if (w.loc === 'left' && leftPanWEl) leftPanWEl.appendChild(chip);
      else if (w.loc === 'right' && rightPanWEl) rightPanWEl.appendChild(chip);
    }

    // 5. Status & Lock Pin
    const statusText = document.getElementById('scale-status-text');
    const pinBtn = document.getElementById('btn-depress-pin');

    const isBalanced = (diff === 0);
    const isTargetMet = (isBalanced && this.pigmentDrams === 7);

    if (this.solved) {
      if (statusText) statusText.innerHTML = `<span class="status-success">✓ DESK DRAWER UNLOCKED. OBSERVATIONS ACQUIRED.</span>`;
      if (pinBtn) pinBtn.disabled = true;
    } else if (isTargetMet) {
      if (statusText) statusText.innerHTML = `<span class="status-ready">★ PERFECT HARMONY: 7 Drams balanced (7 + 3 = 9 + 1 = 10 dr). Ready to depress locking pin!</span>`;
      if (pinBtn) {
        pinBtn.disabled = false;
        pinBtn.classList.add('pin-ready');
      }
    } else if (isBalanced && leftW > 0) {
      if (statusText) statusText.innerHTML = `<span class="status-warn">Scale is balanced at ${leftW} dr, but crucible holds ${this.pigmentDrams} dr (Target: 7 Drams).</span>`;
      if (pinBtn) {
        pinBtn.disabled = true;
        pinBtn.classList.remove('pin-ready');
      }
    } else {
      if (statusText) statusText.innerText = diff > 0 ? 'Left Pan is heavier.' : (diff < 0 ? 'Right Pan is heavier.' : 'Scale is empty.');
      if (pinBtn) {
        pinBtn.disabled = true;
        pinBtn.classList.remove('pin-ready');
      }
    }
  }

  onDepressPin() {
    const { diff } = this.getTotals();
    if (diff === 0 && this.pigmentDrams === 7) {
      this.solved = true;
      if (this.audioManager) {
        this.audioManager.playRelayClick();
        this.audioManager.playChord([261.63, 329.63, 392.00, 523.25]); // C-major chord
      }

      this.render();

      setTimeout(() => {
        if (this.onSolved) this.onSolved();
      }, 1200);
    }
  }

  open() {
    if (document.exitPointerLock) document.exitPointerLock();
    if (this.container) {
      this.container.style.display = 'flex';
      this.render();
    }
  }

  close() {
    if (this.container) {
      this.container.style.display = 'none';
    }
    if (window.playerController) {
      window.playerController.lock();
    }
  }
}
