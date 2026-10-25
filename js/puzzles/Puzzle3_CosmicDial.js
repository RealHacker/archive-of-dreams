// Puzzle3_CosmicDial.js - The Cosmic Vault Dial (Venice, 1577 - Part II)
// Objective: Align the 3 concentric bronze dials to the Divine Cosmic Ratio Phi = 1.618
// - Outer Ring:  I (1.0)
// - Middle Ring: VI (0.6)
// - Inner Ring:  XVIII (0.018)
// Sum = 1.618. Triggers stone counterweight to seal the vault and carves D-F-A-C.

class Puzzle3_CosmicDial {
  constructor(audioManager, onSolved) {
    this.audioManager = audioManager;
    this.onSolved = onSolved;

    this.container = document.getElementById('puzzle-cosmic-dial');
    this.solved = false;

    // Rings state
    // Outer: 0, 1, 2, 3
    this.outerValues = [
      { val: 0.0, label: '0' },
      { val: 1.0, label: 'I (1.0)' },
      { val: 2.0, label: 'II (2.0)' },
      { val: 3.0, label: 'III (3.0)' }
    ];
    this.outerIdx = 0;

    // Middle: 0.1 to 0.9
    this.middleValues = [
      { val: 0.2, label: 'II (0.2)' },
      { val: 0.4, label: 'IV (0.4)' },
      { val: 0.6, label: 'VI (0.6)' },
      { val: 0.8, label: 'VIII (0.8)' }
    ];
    this.middleIdx = 0;

    // Inner: thousandths
    this.innerValues = [
      { val: 0.005, label: 'V (0.005)' },
      { val: 0.012, label: 'XII (0.012)' },
      { val: 0.018, label: 'XVIII (0.018)' },
      { val: 0.024, label: 'XXIV (0.024)' }
    ];
    this.innerIdx = 0;

    this.setupUI();
  }

  setupUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dial-modal-content">
        <div class="puzzle-header">
          <div class="puzzle-title-tag">SAN LAZZARO CRYPT • THE SECRET VAULT SEAL</div>
          <h2>THE COSMIC VAULT DIAL</h2>
          <p class="puzzle-desc">
            Align the concentric bronze celestial rings to the Divine Ratio (Φ) to trigger the counterweight.
            <br>
            <span class="cipher-hint">
              "The ratio of the stars: 1.618 • Outer Units (I) + Tenths (VI) + Thousandths (XVIII)"
            </span>
          </p>
        </div>

        <div class="dial-stage">
          <!-- Concentric Bronze Rings Graphic -->
          <div class="dial-apparatus">
            <!-- Outer Ring -->
            <div class="dial-ring outer" id="ring-outer">
              <div class="ring-label-band">OUTER RING • WHOLE UNITS</div>
              <div class="ring-indicator" id="ring-outer-indicator">I</div>
            </div>

            <!-- Middle Ring -->
            <div class="dial-ring middle" id="ring-middle">
              <div class="ring-label-band">MIDDLE RING • TENTHS</div>
              <div class="ring-indicator" id="ring-middle-indicator">VI</div>
            </div>

            <!-- Inner Ring -->
            <div class="dial-ring inner" id="ring-inner">
              <div class="ring-label-band">INNER RING • THOUSANDTHS</div>
              <div class="ring-indicator" id="ring-inner-indicator">XVIII</div>
            </div>

            <!-- Center Jewel / Pointer -->
            <div class="dial-center-jewel">
              <div class="jewel-core"></div>
            </div>
          </div>
        </div>

        <!-- Ring Controls -->
        <div class="dial-controls-grid">
          <!-- Outer Ring Control -->
          <div class="dial-card">
            <div class="dial-card-title">OUTER RING (WHOLE UNITS)</div>
            <div class="dial-readout" id="readout-outer">0.0</div>
            <div class="dial-buttons">
              <button class="alchemy-btn" id="btn-outer-prev">◀ Rotate Left</button>
              <button class="alchemy-btn" id="btn-outer-next">Rotate Right ▶</button>
            </div>
          </div>

          <!-- Middle Ring Control -->
          <div class="dial-card">
            <div class="dial-card-title">MIDDLE RING (TENTHS)</div>
            <div class="dial-readout" id="readout-middle">0.2</div>
            <div class="dial-buttons">
              <button class="alchemy-btn" id="btn-middle-prev">◀ Rotate Left</button>
              <button class="alchemy-btn" id="btn-middle-next">Rotate Right ▶</button>
            </div>
          </div>

          <!-- Inner Ring Control -->
          <div class="dial-card">
            <div class="dial-card-title">INNER RING (THOUSANDTHS)</div>
            <div class="dial-readout" id="readout-inner">0.005</div>
            <div class="dial-buttons">
              <button class="alchemy-btn" id="btn-inner-prev">◀ Rotate Left</button>
              <button class="alchemy-btn" id="btn-inner-next">Rotate Right ▶</button>
            </div>
          </div>
        </div>

        <!-- Total Readout & Trigger -->
        <div class="dial-footer">
          <div class="total-phi-box">
            <span class="phi-label">TOTAL RATIO ALIGNMENT:</span>
            <strong class="phi-value" id="phi-total-value">0.205</strong>
            <span class="phi-target">(TARGET: Φ = 1.618)</span>
          </div>

          <div class="scale-actions">
            <button class="scale-lock-btn" id="btn-seal-vault" disabled>DROP COUNTERWEIGHT & SEAL VAULT</button>
            <button class="puzzle-close-btn" id="btn-dial-close">Step Back</button>
          </div>
        </div>
      </div>
    `;

    // Bind outer
    document.getElementById('btn-outer-prev').addEventListener('click', () => this.stepRing('outer', -1));
    document.getElementById('btn-outer-next').addEventListener('click', () => this.stepRing('outer', 1));

    // Bind middle
    document.getElementById('btn-middle-prev').addEventListener('click', () => this.stepRing('middle', -1));
    document.getElementById('btn-middle-next').addEventListener('click', () => this.stepRing('middle', 1));

    // Bind inner
    document.getElementById('btn-inner-prev').addEventListener('click', () => this.stepRing('inner', -1));
    document.getElementById('btn-inner-next').addEventListener('click', () => this.stepRing('inner', 1));

    // Actions
    document.getElementById('btn-seal-vault').addEventListener('click', () => this.commitVault());
    document.getElementById('btn-dial-close').addEventListener('click', () => this.close());

    this.render();
  }

  stepRing(ringName, dir) {
    if (this.solved) return;

    if (ringName === 'outer') {
      const len = this.outerValues.length;
      this.outerIdx = (this.outerIdx + dir + len) % len;
    } else if (ringName === 'middle') {
      const len = this.middleValues.length;
      this.middleIdx = (this.middleIdx + dir + len) % len;
    } else if (ringName === 'inner') {
      const len = this.innerValues.length;
      this.innerIdx = (this.innerIdx + dir + len) % len;
    }

    if (this.audioManager) this.audioManager.playKeyClick();
    this.render();
  }

  render() {
    const oObj = this.outerValues[this.outerIdx];
    const mObj = this.middleValues[this.middleIdx];
    const iObj = this.innerValues[this.innerIdx];

    // Readouts
    const rOuter = document.getElementById('readout-outer');
    const rMiddle = document.getElementById('readout-middle');
    const rInner = document.getElementById('readout-inner');
    if (rOuter) rOuter.innerText = oObj.label;
    if (rMiddle) rMiddle.innerText = mObj.label;
    if (rInner) rInner.innerText = iObj.label;

    // Visual ring rotation
    const elO = document.getElementById('ring-outer');
    const elM = document.getElementById('ring-middle');
    const elI = document.getElementById('ring-inner');

    if (elO) elO.style.transform = `rotate(${this.outerIdx * 90}deg)`;
    if (elM) elM.style.transform = `rotate(${this.middleIdx * 90}deg)`;
    if (elI) elI.style.transform = `rotate(${this.innerIdx * 90}deg)`;

    // Indicators text
    const indO = document.getElementById('ring-outer-indicator');
    const indM = document.getElementById('ring-middle-indicator');
    const indI = document.getElementById('ring-inner-indicator');
    if (indO) indO.innerText = oObj.label.split(' ')[0];
    if (indM) indM.innerText = mObj.label.split(' ')[0];
    if (indI) indI.innerText = iObj.label.split(' ')[0];

    // Total Phi
    const total = parseFloat((oObj.val + mObj.val + iObj.val).toFixed(3));
    const totalEl = document.getElementById('phi-total-value');
    if (totalEl) totalEl.innerText = total.toFixed(3);

    const sealBtn = document.getElementById('btn-seal-vault');
    const isPhi = (total === 1.618);

    if (this.solved) {
      if (sealBtn) sealBtn.disabled = true;
    } else if (isPhi) {
      if (totalEl) totalEl.style.color = '#38bdf8';
      if (sealBtn) {
        sealBtn.disabled = false;
        sealBtn.classList.add('pin-ready');
      }
    } else {
      if (totalEl) totalEl.style.color = '#f59e0b';
      if (sealBtn) {
        sealBtn.disabled = true;
        sealBtn.classList.remove('pin-ready');
      }
    }
  }

  commitVault() {
    const total = parseFloat((this.outerValues[this.outerIdx].val + this.middleValues[this.middleIdx].val + this.innerValues[this.innerIdx].val).toFixed(3));
    if (total !== 1.618) return;

    this.solved = true;
    if (this.audioManager) {
      this.audioManager.playRelayClick();
      // Resonant harmonic chord: D - F - A - C !
      this.audioManager.playChord([293.66, 349.23, 440.00, 523.25]);
    }

    const sealBtn = document.getElementById('btn-seal-vault');
    if (sealBtn) {
      sealBtn.innerText = '✓ COUNTERWEIGHT RELEASED • VAULT SEALED';
      sealBtn.disabled = true;
    }

    setTimeout(() => {
      if (this.onSolved) this.onSolved();
    }, 1400);
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
