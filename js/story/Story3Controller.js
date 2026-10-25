// Story3Controller.js - State Machine for Story 3: The Heretic's Palette (Venice, 1577)
// Manages Cutscene 3A, ambient crypt atmosphere, Puzzles 3.1, 3.2, 3.3,
// the midpoint dream fracture, and Part II nested resolution.

class Story3Controller {
  constructor(sceneManager, playerController, interactionManager, audioManager) {
    this.sceneManager = sceneManager;
    this.playerController = playerController;
    this.interactionManager = interactionManager;
    this.audioManager = audioManager;

    this.state = 'INIT'; // 'CUTSCENE_3A', 'EXPLORING', 'PUZZLE_3_1', 'DESK_UNLOCKED', 'PUZZLE_3_2', 'CLIFFHANGER', 'PUZZLE_3_3', 'RESOLVED'
    this.hasBernardoScrolls = false;
    this.hasOpenedNiche = false;
    this.isPart2Unlocked = false;

    // Instantiate Puzzles
    this.puzzleScale = new Puzzle3_PigmentScale(audioManager, () => this.onScaleSolved());
    this.puzzleMosaic = new Puzzle3_ElementMosaic(audioManager, () => this.onMosaicSolved());
    this.puzzleDial = new Puzzle3_CosmicDial(audioManager, () => this.onDialSolved());
  }

  activate() {
    console.log("Activating Story 3: Venice (1577)...");
    if (!this.interactionManager) return;

    this.interactionManager.clear();
    this.interactionManager.onInteractCallback = (data) => {
      if (!data || !data.id) return;
      this.handleInteraction(data.id, data);
    };

    if (this.sceneManager) {
      if (this.sceneManager.deskMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.deskMesh,
          'open_scale_puzzle',
          'Weigh Pigments on Alchemical Scale',
          { type: 'desk' }
        );
      }
      if (this.sceneManager.parchMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.parchMesh,
          'inspect_manuscript',
          "Read Brother Bernardo's Astrological Notes",
          { type: 'parchment' }
        );
      }
      if (this.sceneManager.frescoMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.frescoMesh,
          'inspect_fresco',
          'Examine Angel & Great Comet Fresco',
          { type: 'fresco' }
        );
      }
      if (this.sceneManager.mosaicPanel) {
        this.interactionManager.registerInteractable(
          this.sceneManager.mosaicPanel,
          'open_mosaic_puzzle',
          'Examine Mosaic of the Four Elements',
          { type: 'secret_niche' }
        );
      }
      if (this.sceneManager.doorMesh) {
        this.interactionManager.registerInteractable(
          this.sceneManager.doorMesh,
          'inspect_cellar_door',
          'Check Barred Courtyard Door',
          { type: 'cellar_door' }
        );
      }
    }

    this.setupFloatingWords();
  }

  setupFloatingWords() {
    if (!this.interactionManager) return;

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(0, 1.35, -3.2),
      "<em>Bernardo's observations... the Great Comet defies all Ptolemaic spheres.</em>",
      2.5
    );

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(-0.8, 2.0, -6.6),
      "<em>Ultramarine from across the sea... mixed with tears for the dying city.</em>",
      2.8
    );

    this.interactionManager.registerFloatingWord(
      new THREE.Vector3(0, 2.2, 5.0),
      "<em>The iron bar will hold for ten minutes. No more.</em>",
      3.2
    );
  }

  deactivate() {
    if (this.puzzleScale) this.puzzleScale.close();
    if (this.puzzleMosaic) this.puzzleMosaic.close();
    if (this.puzzleDial) this.puzzleDial.close();
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice = null;
    }
    const f = document.getElementById('story3-fracture-modal');
    if (f) f.style.display = 'none';
    const r = document.getElementById('story3-resolution-modal');
    if (r) r.style.display = 'none';
    const b = document.getElementById('narrative-banner');
    if (b) b.classList.remove('visible');
    const subBar = document.getElementById('subtitle-bar');
    if (subBar) subBar.classList.remove('visible');
  }

  // Single source of truth for the intro media.  The loading screen preloads
  // exactly these URLs before the montage is allowed to start.
  getIntroMedia() {
    return {
      video: 'assets/videos/cutscene_3a_venice_canal.mp4?v=20261024_1',
      audio: 'assets/audio/audio_story3_matteo_opening.mp3?v=20261024_1'
    };
  }

  startStory() {
    console.log("Starting Story 3: The Heretic's Palette (Venice, 1577)...");
    this.state = 'CUTSCENE_3A';
    this.playCutscene3A();
  }

  playCutscene3A() {
    const modal = document.getElementById('cutscene-modal');
    const video = document.getElementById('cutscene-video');
    const media = this.getIntroMedia();

    if (!modal || !video) {
      this.onCutsceneComplete();
      return;
    }

    modal.style.display = 'flex';
    video.src = media.video;
    video.currentTime = 0;

    if (this.activeVoice) this.activeVoice.pause();
    this.activeVoice = new Audio(media.audio);
    this.activeVoice.volume = 0.95;
    this.activeVoice.play().catch(e => console.log("Audio autoplay prevented:", e));

    const skipBtn = document.getElementById('skip-cutscene');
    if (skipBtn) {
      skipBtn.onclick = () => this.endCutscene();
    }

    if (this.audioManager && this.audioManager.playMontageIntro) {
      this.audioManager.playMontageIntro(3, video, this.activeVoice, () => this.endCutscene());
    } else if (this.audioManager && this.audioManager.syncVideoToAudio) {
      this.audioManager.syncVideoToAudio(video, this.activeVoice, 1.0, () => this.endCutscene());
    } else {
      video.playbackRate = 1.0;
      video.onended = () => this.endCutscene();
    }
    video.onerror = () => this.endCutscene();

    video.play().catch(() => {});
  }

  endCutscene() {
    const modal = document.getElementById('cutscene-modal');
    const video = document.getElementById('cutscene-video');
    if (modal) modal.style.display = 'none';
    if (video) {
      video.onended = null;
      video.pause();
      video.playbackRate = 1.0;
    }
    if (this.audioManager && this.audioManager.stopMontageIntro) {
      this.audioManager.stopMontageIntro();
    }
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice = null;
    }
    const subBar = document.getElementById('subtitle-bar');
    if (subBar) {
      subBar.classList.remove('visible');
      subBar.style.display = 'none';
    }

    if (this.playerController) {
      this.playerController.enabled = true;
    }
    this.onCutsceneComplete();
  }

  onCutsceneComplete() {
    this.state = 'EXPLORING';
    console.log("Cutscene 3A ended. Player awakens in San Lazzaro crypt.");

    this.showNarrativeBanner(
      "SAN LAZZARO CRYPT • VENICE, 1577",
      "Inquisition soldiers are battering the courtyard gates upstairs. Prepare the sacred pigment medium on Brother Bernardo's desk to access his hidden celestial observations."
    );
  }

  handleInteraction(id, data) {
    console.log("Story 3 Interaction:", id, data);

    switch (id) {
      case 'open_scale_puzzle':
        if (!this.hasBernardoScrolls) {
          this.puzzleScale.open();
        } else {
          this.showNarrativeBanner(
            "BERNARDO'S APOTHECARY DESK",
            "The stone drawer has already been unlocked. You possess Brother Bernardo's celestial comet observations."
          );
        }
        break;

      case 'inspect_manuscript':
        this.showNarrativeBanner(
          "BROTHER BERNARDO'S ASTROLOGICAL NOTES",
          "\"De Motu Stellae Crinitae (1577): The comet does not orbit within the crystal sphere of Venus. It transcends our heavens. Balance VII Drams of lapis medium to open the scroll drawer.\""
        );
        break;

      case 'inspect_fresco':
        this.showNarrativeBanner(
          "HALF-FINISHED COMET FRESCO",
          "An angel gazes in sorrowful wonder at the fiery tail of the Great Comet of 1577. Fresh ultramarine blue lapis lazuli still gleams on the damp plaster."
        );
        break;

      case 'open_mosaic_puzzle':
        if (!this.hasBernardoScrolls) {
          this.showNarrativeBanner(
            "SECRET WALL NICHE",
            "A four-by-four stone relief carved with symbols of Earth, Air, Fire, and Water. You need Brother Bernardo's manuscripts before unsealing this niche."
          );
        } else if (!this.hasOpenedNiche) {
          this.puzzleMosaic.open();
        } else {
          // Open Dial puzzle
          this.puzzleDial.open();
        }
        break;

      case 'inspect_cellar_door':
        this.showNarrativeBanner(
          "BARRED COURTYARD DOOR",
          "Heavy iron crossbar groaning under heavy soldier boots and iron halberds upstairs. The bar will not hold for long!"
        );
        break;

      default:
        break;
    }
  }

  onScaleSolved() {
    this.hasBernardoScrolls = true;
    this.puzzleScale.close();
    this.state = 'DESK_UNLOCKED';

    this.showNarrativeBanner(
      "OBSERVATIONS RETRIEVED",
      "The stone drawer slides open with a heavy brass chime! You acquire Brother Bernardo's celestial comet charts and iron stylus. Now examine the Secret Wall Niche beside the fresco."
    );
  }

  onMosaicSolved() {
    this.hasOpenedNiche = true;
    this.puzzleMosaic.close();
    this.state = 'CLIFFHANGER';

    // Midpoint Cliffhanger sequence
    this.triggerCliffhangerSequence();
  }

  triggerCliffhangerSequence() {
    console.log("Triggering Story 3 Midpoint Cliffhanger...");

    // Muffled heavy thuds and soldier shouting
    if (this.audioManager) {
      this.audioManager.playRelayClick();
    }

    // Play Matteo Cliffhanger voiceover
    const cliffAudio = new Audio('assets/audio/audio_story3_matteo_cliffhanger.mp3');
    cliffAudio.volume = 1.0;
    cliffAudio.play().catch(e => console.log(e));

    // Display Dream Fracture Modal
    setTimeout(() => {
      if (document.exitPointerLock) document.exitPointerLock();
      this.showDreamFractureModal();
    }, 2500);
  }

  showDreamFractureModal() {
    let fractureEl = document.getElementById('story3-fracture-modal');
    if (!fractureEl) {
      fractureEl = document.createElement('div');
      fractureEl.id = 'story3-fracture-modal';
      fractureEl.className = 'dream-fracture-overlay';
      document.body.appendChild(fractureEl);
    }

    fractureEl.innerHTML = `
      <div class="fracture-card">
        <div class="fracture-tag">DREAM ARCHIVE • MIDPOINT BRAKE</div>
        <h2>THE CRYPT WALL GROANS UNDER AXE IMPACTS</h2>
        <p class="fracture-quote">
          <em>"The ratio eludes my geometry. Is truth doomed to burn in every age? Will no one ever remember what we saw here?"</em>
        </p>
        <p class="fracture-body">
          The secret wall niche is open, revealing the concentric bronze rings of the <strong>Cosmic Vault Dial</strong>.
          To trigger the counterweight that will safely seal Brother Bernardo's charts inside the wall before the Inquisition breaks in, 
          Matteo must align the dials to <strong>The Divine Cosmic Ratio (Φ = 1.618)</strong>.
          <br><br>
          In 1577, Bernardo's mathematics were unfinished. This universal constant is preserved only in the Heritage Core of humanity's future: 
          <strong>The SS Peregrine (Year 2188)</strong>.
        </p>
        <div class="fracture-actions">
          <button class="fracture-btn-primary" id="btn-fracture-story4">
            ✦ Enter Story 4: The Last Cradle (Deep Space, 2188)
          </button>
          <button class="fracture-btn-secondary" id="btn-fracture-solve-dial">
            Calibrate Cosmic Vault Dial (Φ = 1.618)
          </button>
          <button class="fracture-btn-subtle" id="btn-fracture-dismiss">
            Stay in Crypt
          </button>
        </div>
      </div>
    `;

    fractureEl.style.display = 'flex';

    document.getElementById('btn-fracture-story4').addEventListener('click', () => {
      fractureEl.style.display = 'none';
      if (window.loadStory) window.loadStory(4);
    });

    document.getElementById('btn-fracture-solve-dial').addEventListener('click', () => {
      fractureEl.style.display = 'none';
      this.puzzleDial.open();
    });

    document.getElementById('btn-fracture-dismiss').addEventListener('click', () => {
      fractureEl.style.display = 'none';
    });
  }

  unlockPart2() {
    this.isPart2Unlocked = true;
    this.hasBernardoScrolls = true;
    this.hasOpenedNiche = true;
    this.showNarrativeBanner(
      "KEYSTONE CONSTANT ACQUIRED (Φ = 1.618)",
      "Examine the Secret Wall Niche beside the fresco to calibrate the Cosmic Vault Dial (Rings I • VI • XVIII)."
    );
  }

  onDialSolved() {
    this.puzzleDial.close();
    this.state = 'RESOLVED';
    console.log("Story 3 Climax: Cosmic Vault Dial solved!");

    // Automatically unlock Story 2 Part 2 (D - F - A - C)
    if (window.storyController2 && window.storyController2.unlockPart2Chords) {
      window.storyController2.unlockPart2Chords();
    }

    // Play Matteo Resolution Voiceover
    const resAudio = new Audio('assets/audio/audio_story3_matteo_resolution.mp3');
    resAudio.volume = 1.0;
    resAudio.play().catch(e => console.log(e));

    // Show Climax Resolution Banner
    setTimeout(() => {
      if (document.exitPointerLock) document.exitPointerLock();
      this.showClimaxResolutionModal();
    }, 1500);
  }

  showClimaxResolutionModal() {
    let modal = document.getElementById('story3-resolution-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'story3-resolution-modal';
      modal.className = 'dream-fracture-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fracture-card resolution-card">
        <div class="fracture-tag" style="color: #38bdf8;">SAN LAZZARO CRYPT • PART II RESOLUTION</div>
        <h2>THE HYMN OF THE DROWNED BELL</h2>
        <p class="fracture-quote">
          <em>"There are no heresies here, brothers. Only music for the deaf."</em>
        </p>
        <div class="fracture-body">
          <p>
            With a thunderous clunk, the heavy stone counterweight drops. The vault rolls shut, 
            permanently sealing Brother Bernardo's celestial comet charts within the hollow stone.
          </p>
          <p>
            In his final frantic seconds, Matteo plasters wet lime over the seam, wipes his hands across the ultramarine blue, 
            and with his iron stylus carves four harmonic notes into the wet plaster:
          </p>
          <div class="resolution-chord-box">
            <span class="music-clef">𝄞</span>
            <span class="note-pill">D</span>
            <span class="note-pill">F</span>
            <span class="note-pill">A</span>
            <span class="note-pill">C</span>
            <span class="chord-title">Hymnus Campanae Submersae (1577)</span>
          </div>
          <p>
            The cellar doors burst open. Torches glare against the black water. 
            The four notes resonate across time, flashing forward into Maya Lind's Cold War listening post in Svalbard!
          </p>
        </div>
        <div class="fracture-actions">
          <button class="fracture-btn-primary" id="btn-return-to-story2">
            ✦ Return to Story 2: Svalbard (1974) — Tune Transmitter
          </button>
          <button class="fracture-btn-secondary" id="btn-stay-story3">
            Inspect Sealed Crypt
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('btn-return-to-story2').addEventListener('click', () => {
      modal.style.display = 'none';
      if (window.loadStory) {
        window.loadStory(2, false);
        if (window.storyController2 && window.storyController2.unlockPart2) {
          window.storyController2.unlockPart2();
        }
      }
    });

    document.getElementById('btn-stay-story3').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  showNarrativeBanner(title, text) {
    let banner = document.getElementById('narrative-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'narrative-banner';
      banner.className = 'narrative-banner';
      document.body.appendChild(banner);
    }

    banner.innerHTML = `
      <div class="banner-title">${title}</div>
      <div class="banner-text">${text}</div>
    `;

    banner.classList.add('visible');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 7000);
  }
}
