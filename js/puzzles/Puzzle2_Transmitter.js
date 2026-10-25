// Puzzle2_Transmitter.js - Emergency Polyphonic Shortwave Transmitter (D - F - A - C)
class Puzzle2_Transmitter {
  constructor(audioManager, onSolvedCallback) {
    this.audio = audioManager;
    this.onSolved = onSolvedCallback;
    this.isSolved = false;

    this.notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    this.noteFrequencies = {
      'C': 523.3,
      'D': 293.7,
      'E': 329.6,
      'F': 349.2,
      'G': 392.0,
      'A': 440.0,
      'B': 493.9
    };

    // Current slider note selection
    this.currentSliders = ['C', 'C', 'C', 'C'];
    this.targetChord = ['D', 'F', 'A', 'C'];

    this.initDOM();
  }

  initDOM() {
    this.container = document.getElementById('transmitter-sliders');
    this.statusText = document.getElementById('transmitter-status');
    this.btnTransmit = document.getElementById('btn-transmit-rescue');

    if (this.btnTransmit) {
      this.btnTransmit.onclick = () => this.tryTransmit();
    }

    this.renderSliders();
  }

  renderSliders() {
    if (!this.container) return;
    this.container.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const col = document.createElement('div');
      col.className = 'transmitter-osc-col';

      const label = document.createElement('div');
      label.className = 'osc-title';
      label.innerText = `OSC ${String.fromCharCode(65 + i)}`;

      const noteDisplay = document.createElement('div');
      noteDisplay.className = 'osc-note-display';
      noteDisplay.id = `osc-note-${i}`;
      noteDisplay.innerText = this.currentSliders[i];

      const select = document.createElement('select');
      select.className = 'osc-selector';
      this.notes.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.innerText = n;
        if (n === this.currentSliders[i]) opt.selected = true;
        select.appendChild(opt);
      });

      select.onchange = (e) => {
        this.currentSliders[i] = e.target.value;
        noteDisplay.innerText = e.target.value;
        if (this.audio) {
          const freq = this.noteFrequencies[e.target.value];
          this.audio.playHarmonicChord([freq], 0.6);
        }
      };

      col.appendChild(label);
      col.appendChild(noteDisplay);
      col.appendChild(select);
      this.container.appendChild(col);
    }
  }

  tryTransmit() {
    if (this.isSolved) return;

    const isMatch = (
      this.currentSliders[0] === this.targetChord[0] &&
      this.currentSliders[1] === this.targetChord[1] &&
      this.currentSliders[2] === this.targetChord[2] &&
      this.currentSliders[3] === this.targetChord[3]
    );

    if (isMatch) {
      this.isSolved = true;
      if (this.audio) {
        this.audio.playRelayClick();
        this.audio.playHarmonicChord([293.7, 349.2, 440.0, 523.3], 4.0);
      }

      if (this.statusText) {
        this.statusText.innerText = "HARMONIC CARRIER BROADCASTING: Resonance piercing Soviet jamming curtain!";
        this.statusText.style.color = "#22c55e";
      }

      setTimeout(() => {
        if (this.onSolved) this.onSolved();
      }, 1800);
    } else {
      if (this.audio) this.audio.playRelayClick(true);
      if (this.statusText) {
        this.statusText.innerText = "TRANSMITTER MISMATCH: Carrier wave drowned in atmospheric noise. Verify choral harmonic sequence.";
        this.statusText.style.color = "#ef4444";
      }
    }
  }
}
