// AudioManager.js - Handles procedural ambient audio and dialogue playback
class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.ambientGain = null;
    this.clockInterval = null;
    this.isTicking = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);
    this.initialized = true;

    this.startAmbientClock();
    this.startRainAmbience();
  }

  // Procedural clock tick (tick... tock... tick... tock...)
  startAmbientClock() {
    if (this.isTicking) return;
    this.isTicking = true;
    let tock = false;

    this.clockInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      this.playTick(tock);
      tock = !tock;
    }, 1000);
  }

  playTick(isTock = false) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTock ? 440 : 580, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isTock ? 800 : 1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Soft filtered pink-noise rain against window
  startRainAmbience() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.04;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.ambientGain);
    rainSource.start();
  }

  // Tactical SFX: Gear click / ratchet sound
  playGearClick(freq = 600) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  // Metallic heavy lock click / bolt withdraw
  playLockBolt() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Metallic clunk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.19);
  }

  // Winding spring crank sound
  playCrank() {
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.playGearClick(400 + i * 80), i * 35);
    }
  }

  // Story 2: Cold War Blizzard howling wind
  startBlizzardWind() {
    if (!this.ctx || this.blizzardSource) return;
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    this.blizzardSource = this.ctx.createBufferSource();
    this.blizzardSource.buffer = buffer;
    this.blizzardSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.blizzardSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);
    this.blizzardSource.start();

    // Gentle wind gusts modulation
    let gustPhase = 0;
    this.windInterval = setInterval(() => {
      if (!this.ctx || !this.windFilter) return;
      gustPhase += 0.2;
      const freq = 300 + Math.sin(gustPhase) * 160 + Math.sin(gustPhase * 2.3) * 80;
      this.windFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.3);
    }, 400);
  }

  stopBlizzardWind() {
    if (this.windInterval) clearInterval(this.windInterval);
    if (this.blizzardSource) {
      try { this.blizzardSource.stop(); } catch(e){}
      this.blizzardSource = null;
    }
  }

  // Relay snap / heavy switch toggle
  playRelayClick(isDisconnect = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isDisconnect ? 320 : 880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Mechanical teletype key clatter
  playTeletypeClick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 300, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Radio static burst
  playRadioStatic(duration = 1.0) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  // Harmonic chord resonance (D - F - A - C)
  playHarmonicChord(pitches = [293.7, 349.2, 440.0, 523.3], duration = 3.5) {
    if (!this.ctx) return;
    pitches.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    });
  }

  // Alias used by Story 3 & Story 4 puzzles
  playKeyClick() {
    this.playGearClick(720);
  }

  playChord(pitches = [261.63, 329.63, 392.00, 523.25], duration = 2.5) {
    this.playHarmonicChord(pitches, duration);
  }

  playPuzzleSolved() {
    this.playHarmonicChord([293.66, 349.23, 440.00, 523.25], 2.2);
  }

  // Play dialogue audio file
  playVoice(src, onEnded = null) {
    if (this.currentVoice) {
      this.currentVoice.pause();
      this.currentVoice = null;
    }
    const audio = new Audio(src);
    audio.volume = 0.95;
    this.currentVoice = audio;
    if (onEnded) audio.onended = onEnded;
    audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
    return audio;
  }

  stopVoice() {
    this.stopMontageIntro();
    if (this.currentVoice) {
      this.currentVoice.pause();
      this.currentVoice = null;
    }
  }

  stopMontageIntro() {
    if (this.montageTimer) {
      clearInterval(this.montageTimer);
      this.montageTimer = null;
    }
    const hud = document.getElementById('cutscene-montage-hud');
    if (hud) hud.style.display = 'none';
    const videoEl = document.getElementById('cutscene-video');
    if (videoEl) videoEl.style.opacity = '1';
  }

  // Synchronized 4-Chapter Dream-Montage Intro Player (<= 60s narration + timed slides + chapter HUD)
  playMontageIntro(storyId, videoEl, audioEl, onComplete = null) {
    this.stopMontageIntro();
    const mData = window.INTRO_MONTAGE_DATA && window.INTRO_MONTAGE_DATA[String(storyId)];
    const hud = document.getElementById('cutscene-montage-hud');
    const titleEl = document.getElementById('montage-chapter-title');
    const timeEl = document.getElementById('montage-time-badge');
    const subBar = document.getElementById('subtitle-bar');
    const speakerEl = document.getElementById('subtitle-speaker');
    const subtextEl = document.getElementById('subtitle-text');

    if (hud) hud.style.display = mData ? 'flex' : 'none';
    if (videoEl) {
      videoEl.muted = true;
    }

    const fmtTime = (sec) => {
      const s = Math.max(0, Math.floor(sec || 0));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r < 10 ? '0' : ''}${r}`;
    };

    const updateMontageHUD = (t) => {
      if (!mData || !mData.chapters || !mData.chapters.length) return;
      let activeIdx = 0;
      for (let i = 0; i < mData.chapters.length; i++) {
        if (t >= mData.chapters[i].start) {
          activeIdx = i;
        }
      }
      const ch = mData.chapters[activeIdx];
      const backdropEl = document.getElementById('montage-slide-backdrop');
      if (backdropEl && ch.image && backdropEl.getAttribute('src') !== ch.image) {
        backdropEl.setAttribute('src', ch.image);
      }
      if (videoEl && ch.image && videoEl.poster !== ch.image) {
        videoEl.poster = ch.image;
      }
      if (videoEl) {
        const vReady = videoEl.readyState >= 2 && videoEl.currentTime > 0.65 && Math.abs(videoEl.currentTime - t) < 1.8;
        videoEl.style.opacity = vReady ? '1' : '0';
      }
      if (titleEl) titleEl.textContent = ch.chapter_title;
      if (timeEl) {
        timeEl.textContent = `Slide ${activeIdx + 1} / ${mData.chapters.length} • ${fmtTime(t)} / ${fmtTime(mData.total_duration)}`;
      }
      if (subBar && speakerEl && subtextEl) {
        speakerEl.textContent = ch.speaker;
        subtextEl.textContent = `"${ch.text}"`;
        subBar.style.display = 'block';
        subBar.classList.add('visible');
      }
      for (let i = 0; i < 4; i++) {
        const fill = document.getElementById(`montage-fill-${i}`);
        if (!fill) continue;
        if (i < activeIdx) {
          fill.style.width = '100%';
        } else if (i > activeIdx) {
          fill.style.width = '0%';
        } else {
          const pct = Math.min(100, Math.max(0, ((t - ch.start) / Math.max(0.1, ch.duration)) * 100));
          fill.style.width = `${pct.toFixed(1)}%`;
        }
      }
    };

    // Allow clicking on chapter segments to seek directly to that chapter
    this.manualSeekTime = null;
    if (mData && mData.chapters) {
      const segs = document.querySelectorAll('.montage-seg');
      segs.forEach((seg) => {
        const idx = parseInt(seg.getAttribute('data-idx') || '0', 10);
        seg.onclick = (e) => {
          e.stopPropagation();
          const targetCh = mData.chapters[idx];
          if (!targetCh) return;
          const seekTarget = targetCh.start + 0.5;
          this.manualSeekTime = seekTarget;
          if (audioEl) {
            try { audioEl.currentTime = seekTarget; } catch (_) {}
          }
          if (videoEl) {
            try { videoEl.currentTime = seekTarget; } catch (_) {}
          }
          updateMontageHUD(seekTarget);
        };
      });
      updateMontageHUD(0);
    }

    this.montageTimer = setInterval(() => {
      const hasAudioClock = audioEl && !audioEl.paused && Number.isFinite(audioEl.currentTime) && audioEl.currentTime > 0;
      const hasVideoClock = videoEl && Number.isFinite(videoEl.currentTime) && videoEl.currentTime > 0;
      let mediaT = hasAudioClock ? audioEl.currentTime : (hasVideoClock ? videoEl.currentTime : 0);
      let t = mediaT;
      if (this.manualSeekTime !== null) {
        if (Math.abs(mediaT - this.manualSeekTime) < 1.5) {
          this.manualSeekTime = null;
        } else {
          this.manualSeekTime = Math.min(mData.total_duration || 52.4, this.manualSeekTime + 0.08);
          t = this.manualSeekTime;
        }
      }
      if (hasAudioClock && videoEl && !videoEl.paused && Math.abs(videoEl.currentTime - audioEl.currentTime) > 0.4 && this.manualSeekTime === null) {
        try { videoEl.currentTime = audioEl.currentTime; } catch (_) {}
      }
      updateMontageHUD(t);
    }, 80);

    this.syncVideoToAudio(videoEl, audioEl, 1.0, () => {
      this.stopMontageIntro();
      if (onComplete) onComplete();
    });
  }

  // Dynamically slow down cutscene video playback speed to match voiceover audio duration
  syncVideoToAudio(videoEl, audioEl, fallbackRate = 0.52, onComplete = null) {
    if (!videoEl) {
      if (onComplete) onComplete();
      return;
    }

    let videoDone = false;
    let audioDone = !audioEl;
    let finished = false;

    const checkBothDone = () => {
      if (!finished && videoDone && audioDone) {
        finished = true;
        if (onComplete) onComplete();
      }
    };

    const applySyncedRate = () => {
      if (
        videoEl &&
        audioEl &&
        Number.isFinite(videoEl.duration) &&
        videoEl.duration > 0 &&
        Number.isFinite(audioEl.duration) &&
        audioEl.duration > 0
      ) {
        const ratio = videoEl.duration / audioEl.duration;
        videoEl.playbackRate = Math.min(1.0, Math.max(0.28, ratio));
      } else if (videoEl) {
        videoEl.playbackRate = fallbackRate;
      }
    };

    videoEl.playbackRate = fallbackRate;
    videoEl.onloadedmetadata = applySyncedRate;
    if (audioEl) {
      audioEl.onloadedmetadata = applySyncedRate;
      audioEl.onended = () => {
        audioDone = true;
        checkBothDone();
      };
      audioEl.onerror = () => {
        audioDone = true;
        checkBothDone();
      };
    }

    applySyncedRate();

    videoEl.onended = () => {
      videoDone = true;
      checkBothDone();
    };
  }
}
