// Puzzle1_Lockbox.js - 5-Letter Cylinder Lock for the Lockbox of Memories
class Puzzle1_Lockbox {
  constructor(audioManager, onSolved) {
    this.audio = audioManager;
    this.onSolved = onSolved;

    this.dials = [
      { letters: ['B', 'C', 'D', 'F', 'G'], index: 0 },
      { letters: ['K', 'L', 'M', 'N', 'P'], index: 0 },
      { letters: ['A', 'E', 'I', 'O', 'U'], index: 1 }, // starts at E
      { letters: ['P', 'Q', 'R', 'S', 'T'], index: 0 },
      { letters: ['A', 'E', 'Y', 'Z', 'O'], index: 2 }  // starts at Y
    ];

    this.target = ['C', 'L', 'A', 'R', 'A'];
    this.isSolved = false;

    this.initUI();
  }

  initUI() {
    const container = document.getElementById('lockbox-dials');
    if (!container) return;
    container.innerHTML = '';

    this.dials.forEach((dial, colIdx) => {
      const col = document.createElement('div');
      col.className = 'dial-column';

      const upBtn = document.createElement('button');
      upBtn.className = 'dial-arrow';
      upBtn.innerHTML = '▲';
      upBtn.onclick = () => this.rotateDial(colIdx, -1);

      const wheel = document.createElement('div');
      wheel.className = 'dial-wheel';
      wheel.id = `dial-wheel-${colIdx}`;
      wheel.innerText = dial.letters[dial.index];

      const downBtn = document.createElement('button');
      downBtn.className = 'dial-arrow';
      downBtn.innerHTML = '▼';
      downBtn.onclick = () => this.rotateDial(colIdx, 1);

      col.appendChild(upBtn);
      col.appendChild(wheel);
      col.appendChild(downBtn);
      container.appendChild(col);
    });

    const unlockBtn = document.getElementById('btn-unlock-cylinder');
    if (unlockBtn) {
      unlockBtn.onclick = () => this.checkCombination();
    }
  }

  rotateDial(colIdx, dir) {
    if (this.isSolved) return;
    const dial = this.dials[colIdx];
    dial.index = (dial.index + dir + dial.letters.length) % dial.letters.length;

    const wheel = document.getElementById(`dial-wheel-${colIdx}`);
    if (wheel) {
      wheel.style.transform = `scale(0.9) translateY(${dir * 8}px)`;
      setTimeout(() => {
        wheel.innerText = dial.letters[dial.index];
        wheel.style.transform = 'scale(1) translateY(0)';
      }, 100);
    }

    this.audio.playGearClick(500 + colIdx * 50);
  }

  checkCombination() {
    if (this.isSolved) return;

    const currentWord = this.dials.map(d => d.letters[d.index]).join('');
    console.log("Current lock combination:", currentWord);

    if (currentWord === 'CLARA') {
      this.isSolved = true;
      this.audio.playLockBolt();

      // Golden highlight on dials
      for (let i = 0; i < 5; i++) {
        const wheel = document.getElementById(`dial-wheel-${i}`);
        if (wheel) {
          wheel.style.borderColor = '#22c55e';
          wheel.style.color = '#4ade80';
          wheel.style.textShadow = '0 0 15px rgba(74, 222, 128, 0.8)';
        }
      }

      const banner = document.getElementById('notification-banner');
      if (banner) {
        banner.innerText = "Lockbox Opened: Obtained Inner Observatory Key!";
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 3500);
      }

      setTimeout(() => {
        if (this.onSolved) this.onSolved();
      }, 1500);

    } else {
      // Wrong combination: buzz rattle
      this.audio.playGearClick(200);
      for (let i = 0; i < 5; i++) {
        const wheel = document.getElementById(`dial-wheel-${i}`);
        if (wheel) {
          wheel.style.borderColor = '#ef4444';
          setTimeout(() => wheel.style.borderColor = '#b45309', 400);
        }
      }
    }
  }
}
