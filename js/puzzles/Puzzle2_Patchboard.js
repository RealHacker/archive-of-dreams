// Puzzle2_Patchboard.js - 4x4 Audio Relay Frequency & Impedance Matrix
class Puzzle2_Patchboard {
  constructor(audioManager, onSolvedCallback) {
    this.audio = audioManager;
    this.onSolved = onSolvedCallback;
    this.isSolved = false;

    // Available patch cables
    this.cables = {
      yellow: { id: 'yellow', name: 'Yellow (Baseline)', color: '#eab308', plug: null }, // Target: A1 (Row 0, Col 0)
      red:    { id: 'red',    name: 'Red (500kHz)',      color: '#ef4444', plug: null }, // Target: C2 (Row 2, Col 1)
      blue:   { id: 'blue',   name: 'Blue (High-Z)',     color: '#3b82f6', plug: null }  // Target: B4 (Row 1, Col 3)
    };

    this.selectedCable = 'yellow';

    // Matrix definition
    this.rows = [
      { id: 0, label: 'Row A (100 kHz)' },
      { id: 1, label: 'Row B (250 kHz)' },
      { id: 2, label: 'Row C (500 kHz)' },
      { id: 3, label: 'Row D (1000 kHz)' }
    ];

    this.cols = [
      { id: 0, ohms: 10,  label: '10 Ω' },
      { id: 1, ohms: 25,  label: '25 Ω' },
      { id: 2, ohms: 50,  label: '50 Ω' },
      { id: 3, ohms: 100, label: '100 Ω' }
    ];

    this.initDOM();
  }

  initDOM() {
    this.container = document.getElementById('patchboard-grid');
    this.statusText = document.getElementById('patchboard-status');
    this.resistanceMeter = document.getElementById('patchboard-resistance');
    this.masterSwitch = document.getElementById('btn-master-receiver-power');

    if (this.masterSwitch) {
      this.masterSwitch.onclick = () => this.tryEngagePower();
    }

    const resetBtn = document.getElementById('btn-reset-patchboard');
    if (resetBtn) {
      resetBtn.onclick = () => this.resetCables();
    }

    // Cable selector buttons
    ['yellow', 'red', 'blue'].forEach(cId => {
      const btn = document.getElementById(`btn-cable-${cId}`);
      if (btn) {
        btn.onclick = () => {
          this.selectedCable = cId;
          this.updateCableSelectorUI();
        };
      }
    });

    this.renderGrid();
  }

  renderGrid() {
    if (!this.container) return;
    this.container.innerHTML = '';

    // Render 4x4 jacks
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const jack = document.createElement('div');
        jack.className = 'patch-jack';
        jack.dataset.row = r;
        jack.dataset.col = c;

        // Check if any cable is plugged in here
        let plugged = null;
        for (const k in this.cables) {
          if (this.cables[k].plug && this.cables[k].plug.r === r && this.cables[k].plug.c === c) {
            plugged = this.cables[k];
            break;
          }
        }

        if (plugged) {
          jack.classList.add('plugged');
          jack.style.borderColor = plugged.color;
          jack.style.boxShadow = `0 0 10px ${plugged.color}`;
          const plugPin = document.createElement('div');
          plugPin.className = 'patch-plug-pin';
          plugPin.style.backgroundColor = plugged.color;
          jack.appendChild(plugPin);
        }

        jack.onclick = () => this.handleJackClick(r, c);
        this.container.appendChild(jack);
      }
    }

    this.updateStatus();
  }

  handleJackClick(r, c) {
    if (this.isSolved) return;

    // Check if clicked jack already has a cable plugged in
    for (const k in this.cables) {
      if (this.cables[k].plug && this.cables[k].plug.r === r && this.cables[k].plug.c === c) {
        // Unplug this cable
        this.cables[k].plug = null;
        if (this.audio) this.audio.playRelayClick(true);
        this.renderGrid();
        return;
      }
    }

    // Plug currently selected cable into this jack
    if (this.selectedCable && this.cables[this.selectedCable]) {
      this.cables[this.selectedCable].plug = { r, c };
      if (this.audio) this.audio.playRelayClick(false);

      // Auto-advance selection to next unplugged cable for tactile speed
      const unplugs = Object.keys(this.cables).filter(k => !this.cables[k].plug);
      if (unplugs.length > 0) {
        this.selectedCable = unplugs[0];
      }
      this.updateCableSelectorUI();
      this.renderGrid();
    }
  }

  updateCableSelectorUI() {
    ['yellow', 'red', 'blue'].forEach(cId => {
      const btn = document.getElementById(`btn-cable-${cId}`);
      if (btn) {
        if (this.selectedCable === cId) {
          btn.classList.add('active-cable');
        } else {
          btn.classList.remove('active-cable');
        }
      }
    });
  }

  updateStatus() {
    // Calculate total resistance
    let totalOhms = 0;
    let pluggedCount = 0;
    const usedRows = new Set();
    const usedCols = new Set();
    let hasCollision = false;

    for (const k in this.cables) {
      const plug = this.cables[k].plug;
      if (plug) {
        pluggedCount++;
        totalOhms += this.cols[plug.c].ohms;
        if (usedRows.has(plug.r) || usedCols.has(plug.c)) {
          hasCollision = true;
        }
        usedRows.add(plug.r);
        usedCols.add(plug.c);
      }
    }

    if (this.resistanceMeter) {
      this.resistanceMeter.innerText = `${totalOhms} Ω`;
      if (totalOhms === 135 && !hasCollision && pluggedCount === 3) {
        this.resistanceMeter.style.color = '#22c55e';
      } else {
        this.resistanceMeter.style.color = '#f59e0b';
      }
    }

    if (this.statusText) {
      if (hasCollision) {
        this.statusText.innerText = 'WARNING: Circuit Conflict (No two lines may share a Row or Column).';
        this.statusText.style.color = '#ef4444';
      } else if (pluggedCount < 3) {
        this.statusText.innerText = `${3 - pluggedCount} patch cable(s) unplugged. Target Total Resistance: 135 Ω.`;
        this.statusText.style.color = '#94a3b8';
      } else if (totalOhms === 135) {
        this.statusText.innerText = 'Resonance achieved (135 Ω). Ready to engage master receiver.';
        this.statusText.style.color = '#22c55e';
      } else {
        this.statusText.innerText = `Current total: ${totalOhms} Ω. Target: 135 Ω. Re-route impedance nodes.`;
        this.statusText.style.color = '#f59e0b';
      }
    }
  }

  tryEngagePower() {
    if (this.isSolved) return;

    const y = this.cables.yellow.plug;
    const r = this.cables.red.plug;
    const b = this.cables.blue.plug;

    // Correct rules:
    // Yellow: Row A (0), Col 1 (0) -> 10 Ohms
    // Red: Row C (2), Col 2 (1) -> 25 Ohms
    // Blue: Row B (1), Col 4 (3) -> 100 Ohms
    const isCorrect = (
      y && y.r === 0 && y.c === 0 &&
      r && r.r === 2 && r.c === 1 &&
      b && b.r === 1 && b.c === 3
    );

    if (isCorrect) {
      this.isSolved = true;
      if (this.audio) {
        this.audio.playRelayClick();
        setTimeout(() => this.audio.playRadioStatic(2.0), 300);
      }
      if (this.statusText) {
        this.statusText.innerText = 'MASTER RECEIVER ONLINE — Shortwave carrier signal locked!';
        this.statusText.style.color = '#22c55e';
      }
      setTimeout(() => {
        if (this.onSolved) this.onSolved();
      }, 1200);
    } else {
      if (this.audio) this.audio.playRelayClick(true);
      if (this.statusText) {
        this.statusText.innerText = 'CIRCUIT BREAKER TRIPPED! Verify technical rules & impedance nodes.';
        this.statusText.style.color = '#ef4444';
      }
    }
  }

  resetCables() {
    for (const k in this.cables) {
      this.cables[k].plug = null;
    }
    this.selectedCable = 'yellow';
    this.updateCableSelectorUI();
    this.renderGrid();
  }
}
