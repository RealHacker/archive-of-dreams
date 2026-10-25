// Puzzle4_LifeSupport.js - Puzzle 4.1: Life Support Conduits (Power Flow Allocation)
// Divert 100 MW primary plasma flow from Observation Bridge (Bank Alpha) to Cryo-Nursery (Bank Omega - 500 Pods).

class Puzzle4_LifeSupport {
  constructor(audioManager, onSolvedCallback) {
    this.audioManager = audioManager;
    this.onSolved = onSolvedCallback;
    this.isOpen = false;
    this.isSolved = false;

    // 3 critical conduit nodes matching screenplay Section 6.3:
    // Node 0: Elbow 1 at [Row 1, Col 2] -> target state 1 ("REDIRECT SOUTH")
    // Node 1: T-Junction at [Row 3, Col 2] -> target state 2 ("ISOLATE BANK ALPHA / GATE RED")
    // Node 2: Row 4 Laminar Manifold -> target state 1 ("ALIGN HORIZONTAL TO BANK OMEGA")
    this.nodes = [
      {
        id: 'elbow_r1c2',
        label: 'Conduit [Row 1, Col 2]: Primary Plasma Elbow',
        state: 0,
        states: [
          { name: '0° — Routed East to Bridge Loop', symbol: '━┓ (East Leak)', valid: false },
          { name: '90° — Redirected South to Main Trunk', symbol: '┏━ (Downward Flow)', valid: true },
          { name: '180° — Venting to Radiator', symbol: '┗━ (Blocked)', valid: false }
        ]
      },
      {
        id: 'tjunc_r3c2',
        label: 'Conduit [Row 3, Col 2]: Bank Alpha Safety T-Junction',
        state: 0,
        states: [
          { name: 'Open Split — 15 MW to Cabin / 85 MW to Nursery', symbol: '┣━ (Split Flow)', valid: false },
          { name: 'Cabin Priority — 100 MW to Crew Quarters', symbol: '┗━ (Cabin Only)', valid: false },
          { name: 'Isolate Bank Alpha (Gate RED) — 100% Bypass to Row 4', symbol: '┃ [GATE LOCKED]', valid: true }
        ]
      },
      {
        id: 'manifold_r4',
        label: 'Conduit [Row 4, Col 2–5]: Nursery Heat-Sink Manifold',
        state: 0,
        states: [
          { name: 'Misaligned — Turbulent Cross-Flow (42 MW)', symbol: '╱ ╲ ╱ ╲', valid: false },
          { name: 'Aligned — 4 Straight Conduits into Bank Omega (100 MW)', symbol: '━━━━━━━► OMEGA', valid: true }
        ]
      }
    ];

    this.initUI();
  }

  initUI() {
    this.container = document.getElementById('puzzle-life-support');
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="puzzle-modal-content" style="max-width:740px; background:linear-gradient(180deg,#090d16 0%,#0f172a 100%); border:2px solid #0284c7; border-radius:10px; padding:1.6rem; color:#e2e8f0; box-shadow:0 0 40px rgba(2,132,199,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(56,189,248,0.3); padding-bottom:0.8rem; margin-bottom:1rem;">
          <div>
            <div style="font-size:0.75rem; color:#38bdf8; letter-spacing:0.12rem; font-family:'Cinzel',serif;">SS PEREGRINE // AUXILIARY POWER DISTRIBUTION</div>
            <h2 style="margin:0.2rem 0 0 0; font-family:'Cinzel',serif; font-size:1.3rem; color:#f8fafc;">Puzzle 4.1: Life Support Plasma Conduits</h2>
          </div>
          <button id="btn-close-lifesupport" class="btn-brass" style="background:#1e293b; border-color:#475569; padding:0.35rem 0.8rem;">✕ Close</button>
        </div>

        <p style="font-size:0.9rem; color:#94a3b8; line-height:1.5; margin-bottom:1rem;">
          Primary reactor output is failing (<strong>100 MW Source</strong>). Bank Omega (<strong>500 Cryo-Nursery Pods</strong>) requires continuous laminar flow to survive the remaining 50 years to Kepler-186f. Click each conduit junction to rotate it and isolate <strong>Bank Alpha (Bridge Cabin)</strong>.
        </p>

        <!-- Live Power Telemetry Bar -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.8rem; margin-bottom:1.2rem; font-family:'Courier New',monospace; font-size:0.85rem;">
          <div style="background:#020617; border:1px solid #334155; padding:0.6rem; border-radius:6px; text-align:center;">
            <div style="color:#64748b; font-size:0.72rem;">SOURCE OUTPUT</div>
            <div style="color:#38bdf8; font-weight:700; font-size:1.05rem;">100.0 MW</div>
          </div>
          <div style="background:#020617; border:1px solid #334155; padding:0.6rem; border-radius:6px; text-align:center;">
            <div style="color:#64748b; font-size:0.72rem;">BANK ALPHA (CABIN)</div>
            <div id="ls-alpha-readout" style="color:#f59e0b; font-weight:700; font-size:1.05rem;">15.0 MW (ACTIVE)</div>
          </div>
          <div style="background:#020617; border:1px solid #334155; padding:0.6rem; border-radius:6px; text-align:center;">
            <div style="color:#64748b; font-size:0.72rem;">BANK OMEGA (500 PODS)</div>
            <div id="ls-omega-readout" style="color:#ef4444; font-weight:700; font-size:1.05rem;">42.0 MW (CRITICAL)</div>
          </div>
        </div>

        <!-- Interactive Conduit Nodes -->
        <div id="ls-nodes-list" style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.2rem;"></div>

        <div id="ls-status-msg" style="text-align:center; font-family:'Courier New',monospace; font-size:0.9rem; color:#fbbf24; min-height:1.4rem; margin-bottom:1rem;">
          Rotate all three conduit sections into closed-loop bypass, then pull the manual interlock bar.
        </div>

        <div style="display:flex; justify-content:center; gap:1rem;">
          <button id="btn-pull-interlock" class="btn-brass" style="background:#0284c7; border-color:#38bdf8; padding:0.75rem 2rem; font-size:0.95rem;">
            ⚡ Pull Manual Interlock Bar
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-lifesupport');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const interlockBtn = this.container.querySelector('#btn-pull-interlock');
    if (interlockBtn) interlockBtn.onclick = () => this.verifyInterlock();

    this.renderNodes();
  }

  renderNodes() {
    const listEl = this.container.querySelector('#ls-nodes-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.nodes.forEach((node, idx) => {
      const st = node.states[node.state];
      const row = document.createElement('div');
      row.style.cssText = `
        display:flex; justify-content:space-between; align-items:center;
        background:${st.valid ? 'rgba(16,185,129,0.12)' : 'rgba(30,41,59,0.75)'};
        border:1px solid ${st.valid ? '#10b981' : '#475569'};
        border-radius:8px; padding:0.8rem 1rem; cursor:pointer; transition:all 0.2s;
      `;
      row.innerHTML = `
        <div>
          <div style="font-family:'Cinzel',serif; font-size:0.85rem; color:#e2e8f0; font-weight:600;">${node.label}</div>
          <div style="font-family:'Courier New',monospace; font-size:0.82rem; color:${st.valid ? '#34d399' : '#94a3b8'}; margin-top:0.2rem;">
            ${st.name}
          </div>
        </div>
        <button class="btn-rotate-conduit" data-idx="${idx}" style="background:#0f172a; color:${st.valid ? '#34d399' : '#38bdf8'}; border:1px solid ${st.valid ? '#10b981' : '#0284c7'}; border-radius:6px; padding:0.45rem 0.9rem; font-family:'Courier New',monospace; font-weight:700; cursor:pointer;">
          ↻ ${st.symbol}
        </button>
      `;
      row.onclick = () => this.rotateNode(idx);
      listEl.appendChild(row);
    });

    // Update live telemetry numbers
    const validCount = this.nodes.filter(n => n.states[n.state].valid).length;
    const alphaEl = this.container.querySelector('#ls-alpha-readout');
    const omegaEl = this.container.querySelector('#ls-omega-readout');

    if (alphaEl && omegaEl) {
      const alphaIsolated = this.nodes[1].states[this.nodes[1].state].valid;
      alphaEl.textContent = alphaIsolated ? '0.0 MW (ISOLATED)' : '15.0 MW (DRAINING)';
      alphaEl.style.color = alphaIsolated ? '#ef4444' : '#f59e0b';

      const mw = validCount === 3 ? '100.0 MW (LAMINAR)' : (validCount === 2 ? '78.0 MW (UNSTABLE)' : '42.0 MW (CRITICAL)');
      omegaEl.textContent = mw;
      omegaEl.style.color = validCount === 3 ? '#10b981' : '#ef4444';
    }
  }

  rotateNode(idx) {
    if (this.isSolved) return;
    const node = this.nodes[idx];
    node.state = (node.state + 1) % node.states.length;
    if (this.audioManager && this.audioManager.playGearClick) {
      this.audioManager.playGearClick();
    }
    this.renderNodes();
  }

  verifyInterlock() {
    if (this.isSolved) return;
    const allValid = this.nodes.every(n => n.states[n.state].valid);
    const statusEl = this.container.querySelector('#ls-status-msg');

    if (allValid) {
      this.isSolved = true;
      if (statusEl) {
        statusEl.style.color = '#34d399';
        statusEl.innerHTML = '✔ INTERLOCK ENGAGED: NURSERY POWER STABLE (100 YEARS REMAINING) // CABIN OXYGEN: 6 HOURS';
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
        statusEl.textContent = '⚠ FLOW MISMATCH: Ensure Elbow [R1,C2] directs South, T-Junction [R3,C2] isolates Bank Alpha, and Row 4 Manifold is aligned!';
      }
    }
  }

  open() {
    if (!this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderNodes();
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

window.Puzzle4_LifeSupport = Puzzle4_LifeSupport;
