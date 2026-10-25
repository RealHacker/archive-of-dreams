// Puzzle4_Spectrometer.js - Puzzle 4.2: Stellar Spectrometry Analyzer (Kepler-186f Habitability)
// Align 3 optical Fraunhofer absorption bands:
// Dial 1 (Ozone O3) = 600 nm
// Dial 2 (Water Vapor H2O) = 720 nm
// Dial 3 (Diatomic Oxygen O2) = 760 nm

class Puzzle4_Spectrometer {
  constructor(audioManager, onSolvedCallback) {
    this.audioManager = audioManager;
    this.onSolved = onSolvedCallback;
    this.isOpen = false;
    this.isSolved = false;

    this.bands = [
      { id: 'ozone', name: 'Band 1: Stratospheric Ozone (O₃)', current: 520, target: 600, min: 450, max: 700, step: 10, color: '#38bdf8' },
      { id: 'water', name: 'Band 2: Tropospheric Water Vapor (H₂O)', current: 640, target: 720, min: 550, max: 800, step: 10, color: '#a855f7' },
      { id: 'oxygen', name: 'Band 3: Diatomic Oxygen (O₂)', current: 680, target: 760, min: 600, max: 850, step: 10, color: '#10b981' }
    ];

    this.initUI();
  }

  initUI() {
    this.container = document.getElementById('puzzle-spectrometer');
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="puzzle-modal-content" style="max-width:740px; background:linear-gradient(180deg,#090d16 0%,#111827 100%); border:2px solid #a855f7; border-radius:10px; padding:1.6rem; color:#e2e8f0; box-shadow:0 0 40px rgba(168,85,247,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(168,85,247,0.3); padding-bottom:0.8rem; margin-bottom:1rem;">
          <div>
            <div style="font-size:0.75rem; color:#c084fc; letter-spacing:0.12rem; font-family:'Cinzel',serif;">KEPLER-186f // OPTICAL SPECTROMETRY ARRAY</div>
            <h2 style="margin:0.2rem 0 0 0; font-family:'Cinzel',serif; font-size:1.3rem; color:#f8fafc;">Puzzle 4.2: Stellar Spectrometry Analyzer</h2>
          </div>
          <button id="btn-close-spectrometer" class="btn-brass" style="background:#1e293b; border-color:#475569; padding:0.35rem 0.8rem;">✕ Close</button>
        </div>

        <p style="font-size:0.9rem; color:#94a3b8; line-height:1.5; margin-bottom:1rem;">
          Confirm that destination exoplanet <strong>Kepler-186f</strong> possesses a breathable biosphere before committing the ship's final power reserves.<br>
          <span style="color:#c084fc;">[Reference Absorption Lines: <strong>Ozone (O₃) = 600 nm</strong> &bull; <strong>Water Vapor (H₂O) = 720 nm</strong> &bull; <strong>Diatomic Oxygen (O₂) = 760 nm</strong>]</span>
        </p>

        <div id="spec-bands-wrapper" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.2rem;"></div>

        <div id="spec-status-msg" style="text-align:center; font-family:'Courier New',monospace; font-size:0.9rem; color:#e2e8f0; min-height:1.6rem; margin-bottom:1rem; padding:0.5rem; background:#020617; border:1px solid #334155; border-radius:6px;">
          AWAITING SPECTRAL LOCK ON KEPLER-186f ATMOSPHERIC LIMB...
        </div>

        <div style="display:flex; justify-content:center; gap:1rem;">
          <button id="btn-analyze-spectrum" class="btn-brass" style="background:#7e22ce; border-color:#c084fc; padding:0.75rem 2.2rem; font-size:0.95rem;">
            🔭 Confirm Biosignature Spectrum
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-spectrometer');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const analyzeBtn = this.container.querySelector('#btn-analyze-spectrum');
    if (analyzeBtn) analyzeBtn.onclick = () => this.verifySpectrum();

    this.renderBands();
  }

  renderBands() {
    const wrapper = this.container.querySelector('#spec-bands-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    this.bands.forEach((band, idx) => {
      const isMatch = band.current === band.target;
      const pct = ((band.current - band.min) / (band.max - band.min)) * 100;
      const targetPct = ((band.target - band.min) / (band.max - band.min)) * 100;

      const card = document.createElement('div');
      card.style.cssText = `
        background:#0f172a; border:1px solid ${isMatch ? '#10b981' : '#334155'};
        border-radius:8px; padding:0.85rem 1rem;
      `;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
          <span style="font-family:'Cinzel',serif; font-size:0.85rem; color:${band.color}; font-weight:600;">${band.name}</span>
          <span style="font-family:'Courier New',monospace; font-size:0.95rem; font-weight:700; color:${isMatch ? '#34d399' : '#f8fafc'};">
            ${band.current} nm ${isMatch ? '✔ LOCKED' : `(Target: ${band.target} nm)`}
          </span>
        </div>

        <!-- Visual Spectral Bar with Fraunhofer Dark Absorption Line -->
        <div style="position:relative; height:24px; border-radius:4px; background:linear-gradient(90deg, #3b82f6 0%, #10b981 35%, #eab308 65%, #ef4444 100%); margin-bottom:0.6rem; overflow:hidden; border:1px solid #475569;">
          <!-- Target Fraunhofer Absorption Line -->
          <div style="position:absolute; left:${targetPct}%; top:0; bottom:0; width:4px; background:#000; box-shadow:0 0 6px #fff; transform:translateX(-50%);" title="Fraunhofer Absorption Line (${band.target} nm)"></div>
          <!-- Player Reticle Cursor -->
          <div style="position:absolute; left:${pct}%; top:0; bottom:0; width:6px; border:2px solid ${isMatch ? '#10b981' : '#ffffff'}; background:rgba(255,255,255,0.3); transform:translateX(-50%); transition:left 0.1s;"></div>
        </div>

        <input type="range" class="spec-slider" data-idx="${idx}" min="${band.min}" max="${band.max}" step="${band.step}" value="${band.current}" style="width:100%; cursor:pointer; accent-color:${band.color};" />
      `;

      const slider = card.querySelector('.spec-slider');
      slider.oninput = (e) => {
        band.current = parseInt(e.target.value, 10);
        if (this.audioManager && this.audioManager.playGearClick) {
          this.audioManager.playGearClick();
        }
        this.renderBands();
      };

      wrapper.appendChild(card);
    });
  }

  verifySpectrum() {
    if (this.isSolved) return;
    const allMatched = this.bands.every(b => b.current === b.target);
    const statusEl = this.container.querySelector('#spec-status-msg');

    if (allMatched) {
      this.isSolved = true;
      if (statusEl) {
        statusEl.style.color = '#34d399';
        statusEl.style.borderColor = '#10b981';
        statusEl.innerHTML = 'ATMOSPHERE ANALYSIS COMPLETE: NITROGEN-OXYGEN RICH. SURFACE WATER DETECTED. CHANCE OF HABITABILITY: 99.4%.';
      }
      if (this.audioManager && this.audioManager.playPuzzleSolved) {
        this.audioManager.playPuzzleSolved();
      }
      setTimeout(() => {
        this.close();
        if (this.onSolved) this.onSolved();
      }, 1200);
    } else {
      if (statusEl) {
        statusEl.style.color = '#f87171';
        statusEl.textContent = '⚠ SPECTRAL MISMATCH: Align O₃ to 600 nm, H₂O to 720 nm, and O₂ to 760 nm.';
      }
    }
  }

  open() {
    if (!this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderBands();
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

window.Puzzle4_Spectrometer = Puzzle4_Spectrometer;
