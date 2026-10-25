// Puzzle2_NumberStation.js - Cold War Numbers Station Cipher & Teletype Decryption
class Puzzle2_NumberStation {
  constructor(audioManager, onSolvedCallback) {
    this.audio = audioManager;
    this.onSolved = onSolvedCallback;
    this.isSolved = false;

    this.cipherNumbers = [8, 12, 17, 20, 6];
    this.targetWord = "FJORD";
    this.currentInput = ["", "", "", "", ""];

    this.initDOM();
  }

  initDOM() {
    this.container = document.getElementById('numberstation-inputs');
    this.btnReplay = document.getElementById('btn-replay-broadcast');
    this.btnSubmit = document.getElementById('btn-submit-teletype');
    this.statusText = document.getElementById('numberstation-status');
    this.teletypeOutput = document.getElementById('teletype-output-paper');

    if (this.btnReplay) {
      this.btnReplay.onclick = () => this.playBroadcast();
    }

    if (this.btnSubmit) {
      this.btnSubmit.onclick = () => this.checkSolution();
    }

    this.renderInputs();
  }

  renderInputs() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.cipherNumbers.forEach((num, idx) => {
      const box = document.createElement('div');
      box.className = 'cipher-column';

      const numLabel = document.createElement('div');
      numLabel.className = 'cipher-num-label';
      numLabel.innerText = num < 10 ? `0${num}` : `${num}`;

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'cipher-input-box';
      input.dataset.index = idx;
      input.value = this.currentInput[idx];

      input.oninput = (e) => {
        const val = e.target.value.toUpperCase();
        input.value = val;
        this.currentInput[idx] = val;
        if (this.audio) this.audio.playTeletypeClick();

        // Auto-advance cursor
        if (val && idx < 4) {
          const next = this.container.querySelector(`input[data-index="${idx + 1}"]`);
          if (next) next.focus();
        }
      };

      input.onkeydown = (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          const prev = this.container.querySelector(`input[data-index="${idx - 1}"]`);
          if (prev) prev.focus();
        }
      };

      box.appendChild(numLabel);
      box.appendChild(input);
      this.container.appendChild(box);
    });
  }

  playBroadcast() {
    if (this.audio) {
      this.audio.playRadioStatic(1.2);
      setTimeout(() => {
        this.audio.playVoice('assets/audio/audio_story2_erik_distress.mp3');
      }, 600);
    }
  }

  checkSolution() {
    if (this.isSolved) return;

    const entered = this.currentInput.join('').toUpperCase();
    if (entered === this.targetWord) {
      this.isSolved = true;
      if (this.statusText) {
        this.statusText.innerText = "OVERRIDE ACCEPTED — Teletype teleprinting incoming distress packet...";
        this.statusText.style.color = "#22c55e";
      }

      // Simulate teletype mechanical typing
      const message = "FISHING TRAWLER 'NORDIC STAR' TRAPPED OFF BEAR ISLAND. RADAR BLIND. SEND RESCUE HOMING OVERRIDE FREQUENCY NOW.";
      if (this.teletypeOutput) {
        this.teletypeOutput.style.display = 'block';
        this.teletypeOutput.innerHTML = '';
        let charIdx = 0;
        const typeInterval = setInterval(() => {
          if (charIdx < message.length) {
            this.teletypeOutput.innerHTML += message[charIdx];
            if (this.audio && Math.random() < 0.6) this.audio.playTeletypeClick();
            charIdx++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => {
              if (this.onSolved) this.onSolved();
            }, 1200);
          }
        }, 35);
      } else {
        if (this.onSolved) this.onSolved();
      }
    } else {
      if (this.audio) this.audio.playRelayClick(true);
      if (this.statusText) {
        this.statusText.innerText = "INVALID OVERRIDE CODE. Clue: Subtract twin bond (2) from each frequency number.";
        this.statusText.style.color = "#ef4444";
      }
    }
  }
}
