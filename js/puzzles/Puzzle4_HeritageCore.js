// Puzzle4_HeritageCore.js - Puzzle 4.3: The Heritage Core Decryption (The Keystone Revelation)
// Input the Golden Ratio / Celestial Harmonic Constant: Phi = 1.618
// Unlocks the deep astronomical archive of humanity and triggers the reverse dream cascade!

class Puzzle4_HeritageCore {
  constructor(audioManager, onSolvedCallback) {
    this.audioManager = audioManager;
    this.onSolved = onSolvedCallback;
    this.isOpen = false;
    this.isSolved = false;

    // [ 1 ] . [ 0 ] [ 0 ] [ 0 ] -> Target: [ 1 ] . [ 6 ] [ 1 ] [ 8 ]
    this.digits = [1, 0, 0, 0];
    this.target = [1, 6, 1, 8];

    this.initUI();
  }

  initUI() {
    this.container = document.getElementById('puzzle-heritage-core');
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="puzzle-modal-content" style="max-width:720px; background:linear-gradient(180deg,#090d16 0%,#171324 100%); border:2px solid #fbbf24; border-radius:10px; padding:1.7rem; color:#e2e8f0; box-shadow:0 0 45px rgba(251,191,36,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(251,191,36,0.3); padding-bottom:0.8rem; margin-bottom:1rem;">
          <div>
            <div style="font-size:0.75rem; color:#fbbf24; letter-spacing:0.12rem; font-family:'Cinzel',serif;">EARTH HERITAGE ARCHIVE // KEYSTONE SYNTHESIS</div>
            <h2 style="margin:0.2rem 0 0 0; font-family:'Cinzel',serif; font-size:1.35rem; color:#fef08a;">Puzzle 4.3: The Heritage Core Decryption</h2>
          </div>
          <button id="btn-close-heritage" class="btn-brass" style="background:#1e293b; border-color:#475569; padding:0.35rem 0.8rem;">✕ Close</button>
        </div>

        <p style="font-size:0.92rem; color:#cbd5e1; line-height:1.55; margin-bottom:1.1rem; text-align:center;">
          <em>"To unlock the permanent memory bank of humanity, enter the universal proportion of harmony that governs the spiral of galaxies, the orbits of comets, and the works of human art:"</em><br>
          <strong style="color:#fbbf24; font-family:'Cinzel',serif; font-size:1.05rem;">The Golden Ratio / Kepler-Harmonic Constant (&Phi; = 1.618)</strong>
        </p>

        <!-- 4 Digit Dial Inputs: [ 1 ] . [ 6 ] [ 1 ] [ 8 ] -->
        <div id="hc-digits-row" style="display:flex; justify-content:center; align-items:center; gap:0.8rem; margin:1.4rem 0;"></div>

        <div id="hc-status-msg" style="text-align:center; font-family:'Cinzel',serif; font-size:0.9rem; color:#94a3b8; min-height:1.5rem; margin-bottom:1.2rem;">
          Adjust the four numeric registers to form &Phi; = 1.618
        </div>

        <div style="display:flex; justify-content:center; gap:1rem;">
          <button id="btn-unlock-heritage" class="btn-brass" style="background:#b45309; border-color:#fbbf24; padding:0.8rem 2.4rem; font-size:1rem;">
            ✦ Unlock Earth Heritage Core
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-heritage');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const unlockBtn = this.container.querySelector('#btn-unlock-heritage');
    if (unlockBtn) unlockBtn.onclick = () => this.verifyCode();

    this.renderDigits();
  }

  renderDigits() {
    const row = this.container.querySelector('#hc-digits-row');
    if (!row) return;

    row.innerHTML = '';
    this.digits.forEach((val, idx) => {
      if (idx === 1) {
        const dot = document.createElement('div');
        dot.style.cssText = 'font-size:2.4rem; font-weight:700; color:#fbbf24; padding:0 0.2rem; font-family:"Cinzel",serif;';
        dot.textContent = '.';
        row.appendChild(dot);
      }

      const col = document.createElement('div');
      col.style.cssText = `
        display:flex; flex-direction:column; align-items:center;
        background:#0f172a; border:2px solid #d97706; border-radius:8px; padding:0.5rem 0.85rem; width:76px;
        box-shadow:inset 0 0 15px rgba(245,158,11,0.2);
      `;

      const upBtn = document.createElement('button');
      upBtn.className = 'hc-up-btn';
      upBtn.dataset.idx = idx;
      upBtn.textContent = '▲';
      upBtn.style.cssText = 'background:none; border:none; color:#fbbf24; font-size:1.1rem; cursor:pointer; padding:0.2rem;';
      upBtn.onclick = () => this.stepDigit(idx, 1);

      const numDisplay = document.createElement('div');
      numDisplay.className = 'hc-digit-val';
      numDisplay.dataset.idx = idx;
      numDisplay.textContent = val;
      numDisplay.style.cssText = 'font-family:"Courier New",monospace; font-size:2.1rem; font-weight:700; color:#fef08a; margin:0.25rem 0;';

      const dnBtn = document.createElement('button');
      dnBtn.className = 'hc-dn-btn';
      dnBtn.dataset.idx = idx;
      dnBtn.textContent = '▼';
      dnBtn.style.cssText = 'background:none; border:none; color:#fbbf24; font-size:1.1rem; cursor:pointer; padding:0.2rem;';
      dnBtn.onclick = () => this.stepDigit(idx, -1);

      col.appendChild(upBtn);
      col.appendChild(numDisplay);
      col.appendChild(dnBtn);
      row.appendChild(col);
    });
  }

  stepDigit(idx, delta) {
    if (this.isSolved) return;
    this.digits[idx] = (this.digits[idx] + delta + 10) % 10;
    if (this.audioManager && this.audioManager.playGearClick) {
      this.audioManager.playGearClick();
    }
    this.renderDigits();
  }

  verifyCode() {
    if (this.isSolved) return;
    const isCorrect = this.digits.every((d, i) => d === this.target[i]);
    const statusEl = this.container.querySelector('#hc-status-msg');

    if (isCorrect) {
      this.isSolved = true;
      if (statusEl) {
        statusEl.style.color = '#fbbf24';
        statusEl.innerHTML = '✦ KEYSTONE ARCHIVE UNLOCKED: &Phi; = 1.618 // HARMONIC CONSONANCE: D - F - A - C ✦';
      }
      if (this.audioManager && this.audioManager.playPuzzleSolved) {
        this.audioManager.playPuzzleSolved();
      }
      setTimeout(() => {
        this.close();
        if (this.onSolved) this.onSolved();
      }, 1100);
    } else {
      if (statusEl) {
        statusEl.style.color = '#f87171';
        statusEl.textContent = `Current value ${this.digits[0]}.${this.digits[1]}${this.digits[2]}${this.digits[3]} does not match the Golden Ratio (1.618).`;
      }
    }
  }

  open() {
    if (!this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderDigits();
  }

  close() {
    if (!this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
    if (window.playerController) {
      window.playerController.lock();
    }
  }
}

window.Puzzle4_HeritageCore = Puzzle4_HeritageCore;
