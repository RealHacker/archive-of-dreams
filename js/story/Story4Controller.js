// Story4Controller.js - State Machine for Story 4: The Last Cradle (Deep Space, Year 2188)
// Manages Cutscene 4A, Observation Deck & Cryo-Nursery exploration, Puzzles 4.1, 4.2, 4.3,
// Cutscene 4B (Julian's Peace), the Keystone Revelation (Phi = 1.618), and Epilogue trigger.

class Story4Controller {
  constructor(sceneManager, playerController, interactionManager, audioManager) {
    this.sceneManager = sceneManager;
    this.playerController = playerController;
    this.interactionManager = interactionManager;
    this.audioManager = audioManager;

    this.state = 'INIT'; // 'CUTSCENE_4A', 'EXPLORING', 'RESOLVED'
    this.isLifeSupportSolved = false;
    this.isSpectrometerSolved = false;
    this.isHeritageSolved = false;
    this.activeVoice = null;

    // Instantiate Story 4 Puzzles
    this.puzzleLifeSupport = new Puzzle4_LifeSupport(audioManager, () => this.onLifeSupportSolved());
    this.puzzleSpectrometer = new Puzzle4_Spectrometer(audioManager, () => this.onSpectrometerSolved());
    this.puzzleHeritage = new Puzzle4_HeritageCore(audioManager, () => this.onHeritageSolved());
  }

  activate() {
    console.log("Activating Story 4: The Last Cradle (Deep Space, 2188)...");
    if (!this.interactionManager) return;

    this.interactionManager.clear();
    this.interactionManager.onInteractCallback = (data) => {
      if (!data || !data.id) return;
      this.handleInteraction(data.id, data);
    };

    if (this.sceneManager) {
      if (this.sceneManager.conduitPanelMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.conduitPanelMesh,
          'open_lifesupport_puzzle',
          'Reroute Life Support Plasma Conduits (Puzzle 4.1)',
          { type: 'conduit_panel' }
        );
      }
      if (this.sceneManager.spectrometerMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.spectrometerMesh,
          'open_spectrometer_puzzle',
          'Operate Stellar Spectrometry Analyzer (Puzzle 4.2)',
          { type: 'spectrometer' }
        );
      }
      if (this.sceneManager.holoConsoleMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.holoConsoleMesh,
          'open_heritage_puzzle',
          'Access Earth Heritage Core Terminal (Puzzle 4.3)',
          { type: 'heritage_core' }
        );
      }
      if (this.sceneManager.heroPodMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.heroPodMesh,
          'inspect_cryo_pod',
          'Inspect Cryo-Nursery Capsule #001',
          { type: 'cryo_pod' }
        );
      }
      if (this.sceneManager.chronometerMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.chronometerMesh,
          'inspect_chronometer',
          "Examine Julian's Pilot Chair & Ancestral Pocket Watch",
          { type: 'chronometer' }
        );
      }
    }

    this.setupFloatingWords();
  }

  setupFloatingWords() {
    if (!this.interactionManager) return;

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(-2.6, 1.5, -1.4),
      "<em>Five hundred sleeping children... humanity's last seeds drifting toward a new sun.</em>",
      2.6
    );

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(0, 1.8, -1.2),
      "<em>CRITICAL WARNING: Auxiliary Cell 12%. Nursery survival: 48 hours unless rerouted.</em>",
      2.8
    );

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(1.2, 1.5, -3.2),
      "<em>Jonathan Finch's 1892 brass chronometer still ticks beside the starlight viewport.</em>",
      2.6
    );
  }

  deactivate() {
    if (this.puzzleLifeSupport) this.puzzleLifeSupport.close();
    if (this.puzzleSpectrometer) this.puzzleSpectrometer.close();
    if (this.puzzleHeritage) this.puzzleHeritage.close();
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice = null;
    }
    const kModal = document.getElementById('story4-keystone-modal');
    if (kModal) kModal.style.display = 'none';
    const docModal = document.getElementById('document-modal');
    if (docModal) docModal.style.display = 'none';
    this.hideSubtitle();
  }

  // Single source of truth for the intro media.  The loading screen preloads
  // exactly these URLs before the montage is allowed to start.
  getIntroMedia() {
    return {
      video: 'assets/videos/cutscene_4a_deep_space.mp4?v=20261024_1',
      audio: 'assets/audio/audio_story4_julian_opening.mp3?v=20261024_1'
    };
  }

  startStory() {
    console.log("Starting Story 4: The Last Cradle (Deep Space, 2188)...");
    this.state = 'CUTSCENE_4A';
    this.playCutscene4A();
  }

  playCutscene4A() {
    const cutsceneModal = document.getElementById('cutscene-modal');
    const videoEl = document.getElementById('cutscene-video');
    const skipBtn = document.getElementById('skip-cutscene');
    const media = this.getIntroMedia();

    if (cutsceneModal && videoEl) {
      cutsceneModal.style.display = 'flex';
      cutsceneModal.classList.add('active');
      videoEl.src = media.video;
      videoEl.currentTime = 0;

      if (this.activeVoice) this.activeVoice.pause();
      this.activeVoice = new Audio(media.audio);
      this.activeVoice.volume = 0.95;
      this.activeVoice.play().catch(e => console.warn('Audio 4A autoplay blocked:', e));

      if (this.audioManager && this.audioManager.playMontageIntro) {
        this.audioManager.playMontageIntro(4, videoEl, this.activeVoice, () => this.endCutscene());
      } else if (this.audioManager && this.audioManager.syncVideoToAudio) {
        this.audioManager.syncVideoToAudio(videoEl, this.activeVoice, 1.0, () => this.endCutscene());
      } else {
        videoEl.playbackRate = 1.0;
        videoEl.onended = () => this.endCutscene();
      }
      videoEl.onerror = () => this.endCutscene();
      videoEl.play().catch(e => console.warn('Cutscene 4A autoplay blocked:', e));

      if (skipBtn) {
        skipBtn.onclick = () => {
          this.endCutscene();
        };
      }
    } else {
      this.endCutscene();
    }
  }

  endCutscene() {
    const cutsceneModal = document.getElementById('cutscene-modal');
    const videoEl = document.getElementById('cutscene-video');
    if (cutsceneModal) {
      cutsceneModal.classList.remove('active');
      cutsceneModal.style.display = 'none';
    }
    if (videoEl) {
      videoEl.onended = null;
      videoEl.pause();
      videoEl.playbackRate = 1.0;
    }
    if (this.audioManager && this.audioManager.stopMontageIntro) {
      this.audioManager.stopMontageIntro();
    }
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice = null;
    }
    this.hideSubtitle();

    this.state = 'EXPLORING';
    this.showNotification(
      'SS PEREGRINE OBSERVATION DECK • YEAR 2188',
      'Auxiliary power is failing. Reroute plasma conduits on the West bulkhead (Puzzle 4.1), verify Kepler-186f habitability on the East spectrometer (Puzzle 4.2), and unlock the central Heritage Core (Puzzle 4.3).'
    );
  }

  handleInteraction(actionId) {
    if (actionId === 'open_lifesupport_puzzle') {
      if (this.isLifeSupportSolved) {
        this.showSubtitle("Julian: \"The plasma bypass is locked. All 100 MW are flowing smoothly into the Cryo-Nursery.\"", 4500);
        return;
      }
      this.puzzleLifeSupport.open();
    } else if (actionId === 'open_spectrometer_puzzle') {
      if (this.isSpectrometerSolved) {
        this.showSubtitle("Julian: \"Kepler-186f confirmed at 99.4% habitability. Liquid oceans and oxygen-rich skies wait for them.\"", 5000);
        return;
      }
      this.puzzleSpectrometer.open();
    } else if (actionId === 'open_heritage_puzzle') {
      if (!this.isLifeSupportSolved || !this.isSpectrometerSolved) {
        this.showDocument(
          'EARTH HERITAGE CORE // INTERLOCK ACTIVE',
          `<p><strong>SYSTEM NOTICE:</strong> Before recording the Steward's Final Log and unlocking the Deep Historical Archive, complete mandatory survival protocols:</p>
           <ul style="line-height:1.7;">
             <li>${this.isLifeSupportSolved ? '✔' : '☐'} <strong>Protocol 1 (West Wall):</strong> Reroute 100 MW Life Support Plasma Conduits to Bank Omega (Cryo-Nursery).</li>
             <li>${this.isSpectrometerSolved ? '✔' : '☐'} <strong>Protocol 2 (East Console):</strong> Confirm atmospheric biosignatures of destination world <em>Kepler-186f</em> (O₃ = 600nm, H₂O = 720nm, O₂ = 760nm).</li>
           </ul>
           <p style="color:#fbbf24; margin-top:0.8rem;"><em> Philosophical Decryption Key Hint: The universal Golden Ratio of cosmic and artistic proportion (&Phi; = 1.618).</em></p>`
        );
        return;
      }
      this.puzzleHeritage.open();
    } else if (actionId === 'inspect_cryo_pod') {
      const statusText = this.isLifeSupportSolved
        ? '<span style="color:#10b981; font-weight:700;">STABLE — 100 YEARS REMAINING (100.0 MW LAMINAR FLOW)</span>'
        : '<span style="color:#ef4444; font-weight:700;">CRITICAL — 48 HOURS REMAINING (POWER STARVATION)</span>';
      this.showDocument(
        'CRYO-NURSERY CAPSULE #001 // EMBRYONIC & CHILD STASIS BAY',
        `<p>Through the frosted cyan inspection visor sleeps a seven-year-old child, clutching a small woven cloth patch embroidered with an olive branch.</p>
         <p><strong>BIOMETRIC TELEMETRY:</strong> ${statusText}</p>
         <p><strong>STEWARD NOTE (JULIAN):</strong> <em>"Five hundred children asleep beneath the violet nebula. If I divert cabin life support from Bank Alpha, the Observation Bridge oxygen will deplete in six hours—but the Nursery will have power for a century."</em></p>`
      );
    } else if (actionId === 'inspect_chronometer') {
      this.showDocument(
        'ANCESTRAL HEIRLOOM // LONDON 1892 — SVALBARD 1974 — VENICE 1577',
        `<p>Resting beside a steaming metal mug on Julian's side table is an antique tarnished brass pocket watch engraved on the inner case:</p>
         <blockquote style="border-left:3px solid #fbbf24; padding-left:0.9rem; color:#fef08a;">
           "J. Finch &amp; C. Finch, London, 1892 — Preserved by E. &amp; M. Lind, 1974"
         </blockquote>
         <p>Inside the lid is etched a Renaissance geometric diagram from San Lazzaro, Venice (1577), showing the <strong>Golden Ratio (&Phi; = 1.618)</strong> dividing the orbit of the Great Comet and the four harmonic intervals of celestial consonance.</p>`
      );
    }
  }

  onLifeSupportSolved() {
    this.isLifeSupportSolved = true;
    if (this.sceneManager) {
      this.sceneManager.setNurseryStabilized();
    }
    this.addInventoryItem('Cryo-Nursery Bypass Key (100 Yrs)');
    this.playVoiceover(
      'assets/audio/audio_story4_julian_nursery.mp3',
      "Julian: \"Sleep well, little ones. You will see the dawn we only dreamed of.\""
    );
    this.showNotification(
      'NURSERY POWER STABLE: 100 YEARS REMAINING',
      'Observation Deck life support will deplete in 6 hours. Next, verify Kepler-186f habitability at the East Spectrometer.'
    );
  }

  onSpectrometerSolved() {
    this.isSpectrometerSolved = true;
    this.addInventoryItem('Kepler-186f Biosignature (99.4%)');
    this.playVoiceover(
      'assets/audio/audio_story4_julian_spectrometer.mp3',
      "Julian: \"It wasn't for nothing. They will have green grass under their feet.\""
    );
    this.showNotification(
      'HABITABILITY CONFIRMED: 99.4%',
      'Nitrogen-oxygen atmosphere and surface water verified on Kepler-186f. Access the central Earth Heritage Core Terminal!'
    );
  }

  onHeritageSolved() {
    this.isHeritageSolved = true;
    this.state = 'RESOLVED';
    this.addInventoryItem('Keystone Constant (Φ = 1.618)');
    this.playCutscene4B();
  }

  playCutscene4B() {
    this.playVoiceover(
      'assets/audio/audio_story4_julian_final.mp3',
      "Julian: \"We do not walk into the dark for ourselves. We plant trees whose shade we will never see. My name is Julian. And I leave you the stars.\""
    );
    this.showKeystoneResolutionModal();
  }

  showKeystoneResolutionModal() {
    if (document.exitPointerLock) document.exitPointerLock();
    let modal = document.getElementById('story4-keystone-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'story4-keystone-modal';
      modal.className = 'puzzle-fullscreen-modal';
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="max-width:720px; background:linear-gradient(180deg,#090d16 0%,#1e1b4b 100%); border:2px solid #fbbf24; border-radius:12px; padding:1.6rem 2rem; color:#f8fafc; text-align:center; box-shadow:0 0 60px rgba(251,191,36,0.4);">
        <div style="font-size:0.8rem; color:#fbbf24; letter-spacing:0.15rem; font-family:'Cinzel',serif; margin-bottom:0.4rem;">
          ✦ THE KEYSTONE REVELATION // DEEP ARCHIVE UNLOCKED ✦
        </div>
        <h2 style="font-family:'Cinzel',serif; font-size:1.5rem; color:#fef08a; margin:0 0 0.8rem 0;">
          Story 4 Complete: The Last Cradle (2188)
        </h2>

        <div style="margin-bottom:0.9rem; border-radius:8px; overflow:hidden; border:1px solid rgba(251,191,36,0.4); max-height:210px;">
          <img src="assets/images/char_julian_profile.png" alt="Steward Julian" style="width:100%; height:210px; object-fit:cover; display:block;" />
        </div>

        <p style="font-size:0.9rem; color:#cbd5e1; line-height:1.55; margin-bottom:1rem;">
          <em>"We do not walk into the dark for ourselves. We plant trees whose shade we will never see. My name is Julian. And I leave you the stars."</em>
        </p>

        <div style="background:rgba(15,23,42,0.85); border:1px solid #d97706; border-radius:8px; padding:0.85rem 1rem; margin-bottom:1.2rem; text-align:left; font-size:0.86rem; line-height:1.55;">
          <div style="color:#fbbf24; font-family:'Cinzel',serif; font-weight:700;">1. FOR FRA MATTEO (VENICE, 1577):</div>
          <div style="color:#e2e8f0; margin-bottom:0.45rem;">The Divine Cosmic Ratio of the Vault Counterweight: <strong>&Phi; = 1.618</strong> (Rings: <strong>I &bull; VI &bull; XVIII</strong>).</div>
          <div style="color:#38bdf8; font-family:'Cinzel',serif; font-weight:700;">2. FOR DR. MAYA LIND (SVALBARD, 1974):</div>
          <div style="color:#e2e8f0; margin-bottom:0.45rem;">The Four Notes of Celestial Consonance (<em>Hymn of the Drowned Bell</em>): <strong>D - F - A - C</strong>.</div>
          <div style="color:#34d399; font-family:'Cinzel',serif; font-weight:700;">3. FOR JONATHAN FINCH (LONDON, 1892):</div>
          <div style="color:#e2e8f0;">The Great Comet Meridian Coordinates: <strong>November 13, 28&deg; Scorpio</strong>.</div>
        </div>

        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:0.75rem;">
          <button id="btn-cascade-to-story3" class="btn-brass" style="background:#854d0e; border-color:#fbbf24; padding:0.7rem 1.3rem; font-size:0.88rem;">
            ✦ Ascend to Story 3 (Venice 1577 — Seal Vault with Φ = 1.618)
          </button>
          <button id="btn-open-epilogue-from-s4" class="btn-brass" style="background:#0f766e; border-color:#2dd4bf; padding:0.7rem 1.3rem; font-size:0.88rem;">
            ☀ Enter Epilogue: The Dreamer's Awakening
          </button>
          <button id="btn-close-s4-modal" class="btn-brass" style="background:#1e293b; border-color:#475569; padding:0.7rem 1.1rem; font-size:0.85rem;">
            Stay on Observation Deck
          </button>
        </div>
      </div>
    `;

    const btnS3 = modal.querySelector('#btn-cascade-to-story3');
    if (btnS3) {
      btnS3.onclick = () => {
        modal.style.display = 'none';
        if (window.loadStory) {
          window.loadStory(3, false);
          if (window.storyController3) {
            window.storyController3.unlockPart2();
          }
        }
      };
    }

    const btnEp = modal.querySelector('#btn-open-epilogue-from-s4');
    if (btnEp) {
      btnEp.onclick = () => {
        modal.style.display = 'none';
        if (window.openEpilogueModal) window.openEpilogueModal();
      };
    }

    const btnClose = modal.querySelector('#btn-close-s4-modal');
    if (btnClose) {
      btnClose.onclick = () => {
        modal.style.display = 'none';
      };
    }
  }

  showDocument(title, htmlContent) {
    const docModal = document.getElementById('document-modal');
    const titleEl = document.getElementById('document-title');
    const contentEl = document.getElementById('document-content');
    const closeBtn = document.getElementById('document-close');

    if (docModal && titleEl && contentEl) {
      if (document.exitPointerLock) document.exitPointerLock();
      titleEl.textContent = title;
      contentEl.innerHTML = htmlContent;
      docModal.style.display = 'flex';
      if (closeBtn) {
        closeBtn.onclick = () => {
          docModal.style.display = 'none';
          if (this.playerController) {
            this.playerController.enabled = true;
            this.playerController.lock();
          }
        };
      }
    }
  }

  addInventoryItem(label) {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    const existing = Array.from(list.querySelectorAll('.inv-item')).some(el => el.textContent.includes(label));
    if (existing) return;
    const item = document.createElement('div');
    item.className = 'inv-item';
    item.innerHTML = `<span class="inv-icon">◆</span> <span>${label}</span>`;
    list.appendChild(item);
  }

  playVoiceover(src, subtitleText, duration = 9000) {
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice = null;
    }
    this.showSubtitle(subtitleText, duration);
    const audio = new Audio(src);
    audio.volume = 0.9;
    this.activeVoice = audio;
    audio.play().catch(e => console.warn('Voiceover autoplay blocked:', e));
    return audio;
  }

  showSubtitle(text, duration = 6000) {
    const bar = document.getElementById('subtitle-bar');
    const speakerEl = document.getElementById('subtitle-speaker');
    const textEl = document.getElementById('subtitle-text');
    if (!bar || !textEl) return;

    if (speakerEl) speakerEl.textContent = 'Steward Julian (2188)';
    textEl.textContent = text;
    bar.style.display = 'block';
    bar.classList.add('visible');

    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    this.subtitleTimer = setTimeout(() => this.hideSubtitle(), duration);
  }

  hideSubtitle() {
    const bar = document.getElementById('subtitle-bar');
    if (bar) {
      bar.classList.remove('visible');
      bar.style.display = 'none';
    }
  }

  showNotification(title, message) {
    const banner = document.getElementById('notification-banner');
    if (!banner) return;
    banner.innerHTML = `<strong>${title}</strong><br><span style="font-size:0.85rem; font-weight:normal;">${message}</span>`;
    banner.style.display = 'block';
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      banner.style.display = 'none';
    }, 6500);
  }

  update(dt) {}
}

window.Story4Controller = Story4Controller;
