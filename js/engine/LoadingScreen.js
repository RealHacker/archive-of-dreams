// LoadingScreen.js - asset loading screen shown before each story intro.
//
// The four scenes are all instantiated at page load, so a story's models and
// textures can still be streaming when the player picks it.  Starting the
// dream montage at that moment means the first seconds of the cutscene play
// over a half-built scene, and the scene pops in afterwards.
//
// This screen closes that gap: it appears before the intro, waits for the
// chosen scene's assets (via the scene's THREE.LoadingManager) and for the
// intro media to buffer, then hands over to the story controller.
//
// The progress bar blends three sources:
//   68%  scene assets   (models + textures of the selected story)
//   22%  intro video    (the dream montage)
//   10%  narration      (the audio that drives the montage timing)
//
// It never blocks the game: every wait has a timeout, and the screen always
// gives way after the assets are ready.

class LoadingScreen {
  constructor() {
    this.root = null;
    this.fill = null;
    this.statusEl = null;
    this.titleEl = null;
    this.subEl = null;

    this.shownAt = 0;
    this.minVisibleMs = 700;     // avoid a one-frame flash when everything is cached
    this.maxWaitMs = 90000;      // hard stop: never trap the player
    this.pollMs = 120;
    this.stableReadyMs = 300;    // the scene must stay "ready" this long

    this._assetsFrac = 0;
    this._assetsReady = false;
    this._assetsReadySince = 0;
    this._videoFrac = 0;
    this._audioFrac = 0;
    this._videoEl = null;
    this._audioEl = null;
    this._videoDone = false;
    this._audioDone = false;
  }

  _bind() {
    if (this.root) return;
    this.root = document.getElementById('loading-screen');
    this.fill = document.getElementById('loading-screen-fill');
    this.statusEl = document.getElementById('loading-screen-status');
    this.titleEl = document.getElementById('loading-screen-title');
    this.subEl = document.getElementById('loading-screen-sub');
  }

  show(meta) {
    this._bind();
    if (!this.root) return;
    meta = meta || {};

    this.shownAt = performance.now();
    this._assetsFrac = 0;
    this._assetsReady = false;
    this._assetsReadySince = 0;
    this._videoFrac = 0;
    this._audioFrac = 0;
    this._videoDone = false;
    this._audioDone = false;

    if (this.titleEl) this.titleEl.textContent = meta.title || 'PREPARING THE DREAM';
    if (this.subEl) this.subEl.textContent = meta.sub || '';
    this.setProgress(0, 'Gathering assets…');
    this.root.style.display = 'flex';
    // let the browser paint the overlay before the first frame of the scene
    requestAnimationFrame(() => {
      if (this.root) this.root.classList.add('visible');
    });
  }

  hide() {
    this._bind();
    if (!this.root) return;
    this.root.classList.remove('visible');
    this.root.style.display = 'none';
    // Release the decoder of media that finished, but keep the HTTP cache warm
    // for the real cutscene element.  A media element that gave up waiting
    // (timeout) is left alone so it can finish downloading in the background
    // instead of being aborted mid-flight.
    if (this._videoEl) {
      if (this._videoDone) {
        try {
          this._videoEl.pause();
          this._videoEl.removeAttribute('src');
          this._videoEl.load();
        } catch (e) { /* ignore */ }
        this._videoEl = null;
      }
    }
    if (this._audioEl) {
      if (this._audioDone) {
        try {
          this._audioEl.pause();
          this._audioEl.removeAttribute('src');
        } catch (e) { /* ignore */ }
        this._audioEl = null;
      }
    }
  }

  setProgress(frac, label) {
    if (this.fill) {
      const pct = Math.max(0, Math.min(1, frac || 0)) * 100;
      this.fill.style.width = pct.toFixed(1) + '%';
    }
    if (label && this.statusEl) this.statusEl.textContent = label;
  }

  // ------------------------------------------------------------------ waiting
  waitFor(sceneMgr, controller) {
    const deadline = performance.now() + this.maxWaitMs;
    const media = (controller && typeof controller.getIntroMedia === 'function')
      ? controller.getIntroMedia()
      : null;

    const videoReady = (media && media.video)
      ? this._preloadVideo(media.video)
      : Promise.resolve();
    const audioReady = (media && media.audio)
      ? this._preloadAudio(media.audio)
      : Promise.resolve();
    const assetsReady = this._waitAssets(sceneMgr, deadline);

    return Promise.all([assetsReady, videoReady, audioReady])
      .then(() => {
        this.setProgress(1, 'Opening the dream…');
        return this._minVisible();
      });
  }

  _waitAssets(sceneMgr, deadline) {
    // A scene manager that does not report progress has nothing to wait for.
    const prog = (sceneMgr && sceneMgr.loadProgress) ? sceneMgr.loadProgress : null;
    if (!prog) {
      this._assetsFrac = 1;
      this._assetsReady = true;
      this._update();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const tick = () => {
        this._assetsReady = !!prog.ready;
        if (this._assetsReady) {
          if (!this._assetsReadySince) this._assetsReadySince = performance.now();
        } else {
          this._assetsReadySince = 0;
        }
        this._assetsFrac = prog.total
          ? Math.min(1, prog.loaded / prog.total)
          : (prog.ready ? 1 : 0);
        this._update();

        const stable = this._assetsReady &&
          (performance.now() - this._assetsReadySince) >= this.stableReadyMs;
        if (stable || performance.now() > deadline) {
          resolve();
          return;
        }
        setTimeout(tick, this.pollMs);
      };
      tick();
    });
  }

  // Buffers the montage video far enough that the cutscene cannot stall.
  _preloadVideo(url) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      this._videoEl = v;

      let timer = null;
      let done = false;

      const finish = (failed) => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        v.removeEventListener('progress', onProgress);
        v.removeEventListener('loadedmetadata', onProgress);
        v.removeEventListener('canplay', onProgress);
        if (!failed) {
          this._videoDone = true;
          this._videoFrac = 1;
          this._update();
        }
        resolve();
      };

      const onProgress = () => {
        let frac = 0;
        try {
          if (v.duration && v.buffered && v.buffered.length) {
            frac = Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration);
          }
        } catch (e) { /* buffered ranges can throw before metadata */ }
        this._videoFrac = frac;
        this._update();
        // Fully buffered - no need to wait for canplaythrough any longer.
        if (frac >= 0.999) finish();
      };

      v.addEventListener('canplaythrough', () => finish(false), { once: true });
      v.addEventListener('error', () => finish(true), { once: true });
      v.addEventListener('progress', onProgress);
      v.addEventListener('loadedmetadata', onProgress);
      v.addEventListener('canplay', onProgress);
      timer = setTimeout(() => finish(true), 45000);
      v.src = url;
      v.load();
    });
  }

  // The narration drives the montage clock, so it has to be fully buffered.
  _preloadAudio(url) {
    return new Promise((resolve) => {
      const a = new Audio();
      a.preload = 'auto';
      this._audioEl = a;

      let timer = null;
      let done = false;

      const finish = (failed) => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        a.removeEventListener('progress', onProgress);
        a.removeEventListener('loadedmetadata', onProgress);
        if (!failed) {
          this._audioDone = true;
          this._audioFrac = 1;
          this._update();
        }
        resolve();
      };

      const onProgress = () => {
        let frac = 0;
        try {
          if (a.duration && a.buffered && a.buffered.length) {
            frac = Math.min(1, a.buffered.end(a.buffered.length - 1) / a.duration);
          }
        } catch (e) { /* ignore */ }
        this._audioFrac = frac;
        this._update();
        if (frac >= 0.999) finish();
      };

      a.addEventListener('canplaythrough', () => finish(false), { once: true });
      a.addEventListener('error', () => finish(true), { once: true });
      a.addEventListener('progress', onProgress);
      a.addEventListener('loadedmetadata', onProgress);
      timer = setTimeout(() => finish(true), 30000);
      a.src = url;
      a.load();
    });
  }

  _update() {
    const overall = Math.min(1,
      0.68 * this._assetsFrac +
      0.22 * this._videoFrac +
      0.10 * this._audioFrac);

    let label = 'Loading models & textures…';
    if (this._assetsReady && this._videoFrac < 0.99) {
      label = 'Buffering the dream montage…';
    } else if (this._assetsReady && this._videoFrac >= 0.99 && this._audioFrac < 0.99) {
      label = 'Buffering narration…';
    } else if (this._assetsReady) {
      label = 'Opening the dream…';
    }
    this.setProgress(overall, label);
  }

  _minVisible() {
    const elapsed = performance.now() - this.shownAt;
    const wait = Math.max(0, this.minVisibleMs - elapsed);
    return new Promise((resolve) => setTimeout(resolve, wait));
  }
}

if (typeof window !== 'undefined') {
  window.LoadingScreen = LoadingScreen;
}
