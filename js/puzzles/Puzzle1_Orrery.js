// Puzzle1_Orrery.js - Concentric Astrolabe Dial Puzzle for the Celestial Orrery
class Puzzle1_Orrery {
  constructor(audioManager, onCliffhanger, onSolved) {
    this.audio = audioManager;
    this.onCliffhanger = onCliffhanger;
    this.onSolved = onSolved;

    this.months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    this.zodiacs = ["ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"];

    this.selectedMonthIdx = 0; // Starts January
    this.selectedDay = 1;      // Starts 1
    this.selectedZodiacIdx = 0; // Starts Aries
    this.selectedDegree = 0;    // Starts 0 deg

    this.isPart2Unlocked = false; // By default in Part 1 (missing comet coordinates)
    this.isSolved = false;

    this.initUI();
  }

  initUI() {
    const monthSelect = document.getElementById('orrery-month');
    const dayInput = document.getElementById('orrery-day');
    const zodiacSelect = document.getElementById('orrery-zodiac');
    const degreeInput = document.getElementById('orrery-degree');
    const crankBtn = document.getElementById('btn-crank-orrery');

    if (!monthSelect) return;

    monthSelect.innerHTML = '';
    this.months.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = m;
      monthSelect.appendChild(opt);
    });

    zodiacSelect.innerHTML = '';
    this.zodiacs.forEach((z, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = z;
      zodiacSelect.appendChild(opt);
    });

    monthSelect.onchange = (e) => {
      this.selectedMonthIdx = parseInt(e.target.value);
      this.audio.playGearClick(400);
      this.updateVisualRings();
    };

    dayInput.oninput = (e) => {
      this.selectedDay = Math.max(1, Math.min(31, parseInt(e.target.value) || 1));
      this.audio.playGearClick(450);
      this.updateVisualRings();
    };

    zodiacSelect.onchange = (e) => {
      this.selectedZodiacIdx = parseInt(e.target.value);
      this.audio.playGearClick(500);
      this.updateVisualRings();
    };

    degreeInput.oninput = (e) => {
      this.selectedDegree = Math.max(0, Math.min(29, parseInt(e.target.value) || 0));
      this.audio.playGearClick(550);
      this.updateVisualRings();
    };

    if (crankBtn) {
      crankBtn.onclick = () => this.turnCrank();
    }
  }

  updateVisualRings() {
    const ring1 = document.getElementById('visual-ring-month');
    const ring2 = document.getElementById('visual-ring-day');
    const ring3 = document.getElementById('visual-ring-zodiac');

    if (ring1) ring1.style.transform = `rotate(${this.selectedMonthIdx * 30}deg)`;
    if (ring2) ring2.style.transform = `rotate(${this.selectedDay * 11.6}deg)`;
    if (ring3) ring3.style.transform = `rotate(${(this.selectedZodiacIdx * 30) + this.selectedDegree}deg)`;
  }

  turnCrank() {
    this.audio.playCrank();

    // In Part 1: Player does not possess the coordinate because the book page is torn out!
    if (!this.isPart2Unlocked) {
      setTimeout(() => {
        if (this.onCliffhanger) this.onCliffhanger();
      }, 800);
      return;
    }

    // In Part 2: Player has the coordinates: November 13, Scorpio 28°
    // November is index 10, Scorpio is index 7
    const isCorrect = (
      this.selectedMonthIdx === 10 &&
      this.selectedDay === 13 &&
      this.selectedZodiacIdx === 7 &&
      this.selectedDegree === 28
    );

    if (isCorrect) {
      this.isSolved = true;
      this.audio.playLockBolt();

      const banner = document.getElementById('notification-banner');
      if (banner) {
        banner.innerText = "The Celestial Orrery has Awakened! Letter Revealed.";
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 4000);
      }

      setTimeout(() => {
        if (this.onSolved) this.onSolved();
      }, 1500);

    } else {
      this.audio.playGearClick(180);
      const banner = document.getElementById('notification-banner');
      if (banner) {
        banner.innerText = "Gears slip out of alignment. Check coordinates (Nov 13, Scorpio 28°).";
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 2500);
      }
    }
  }
}
