// Story2Controller.js - Dr. Maya Lind narrative controller, Cold War Svalbard 1974
class Story2Controller {
  constructor(sceneManager, playerController, interactionManager, audioManager) {
    this.scene = sceneManager;
    this.player = playerController;
    this.interaction = interactionManager;
    this.audio = audioManager;

    // Narrative State
    this.state = 'EXPLORING_BUNKER';
    this.hasPower = false;
    this.hasDecrypted = false;
    this.hasPart2Unlocked = false;
    this.hasRescued = false;

    // Puzzles
    this.puzzlePatchboard = null;
    this.puzzleNumberStation = null;
    this.puzzleTransmitter = null;

    this.activePuzzle = null;
    this.subtitlesEl = document.getElementById('subtitle-bar');
    this.speakerEl = document.getElementById('subtitle-speaker');
    this.subtextEl = document.getElementById('subtitle-text');

    this.interactableItems = [];
    this.initPuzzles();
    this.initInteractables();
    this.setupModals();
  }

  initPuzzles() {
    this.puzzlePatchboard = new Puzzle2_Patchboard(this.audio, () => this.onPatchboardSolved());
    this.puzzleNumberStation = new Puzzle2_NumberStation(this.audio, () => this.onNumberStationSolved());
    this.puzzleTransmitter = new Puzzle2_Transmitter(this.audio, () => this.onTransmitterSolved());
  }

  initInteractables() {
    // 1. Frequency Patch-Board on Monitoring Desk (x: -0.25, y: 1.05, z: -1.8)
    const patchBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    patchBox.position.set(-0.25, 1.05, -1.8);
    this.scene.scene.add(patchBox);
    this.interactableItems.push({ mesh: patchBox, id: 'patchboard', label: 'Inspect Frequency Patch-Board Relay' });

    // 2. Teletype & Cipher Desk (x: -1.8, y: 0.95, z: 1.8)
    const teletypeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    teletypeBox.position.set(-1.8, 0.95, 1.8);
    this.scene.scene.add(teletypeBox);
    this.interactableItems.push({ mesh: teletypeBox, id: 'teletype', label: 'Inspect Teletype & Decryption Terminal' });

    // 3. Emergency High-Power Transmitter Rack (x: -2.4, y: 1.2, z: -1.0)
    const txBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2.0, 0.9),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    txBox.position.set(-2.4, 1.2, -1.0);
    this.scene.scene.add(txBox);
    this.interactableItems.push({ mesh: txBox, id: 'transmitter', label: 'Inspect Emergency High-Power Transmitter' });

    // 4. Heavy Steel Blast Airlock Door (x: 2.98, y: 1.1, z: 0.0)
    const blastBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.2, 1.4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    blastBox.position.set(2.98, 1.1, 0.0);
    this.scene.scene.add(blastBox);
    this.interactableItems.push({ mesh: blastBox, id: 'blast_door', label: 'Examine Blast Airlock Door' });

    // 5. Arctic Porthole overlooking blizzard (x: -2.95, y: 1.6, z: 0.0)
    const portholeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    portholeBox.position.set(-2.95, 1.6, 0.0);
    this.scene.scene.add(portholeBox);
    this.interactableItems.push({ mesh: portholeBox, id: 'porthole', label: 'Look out into Svalbard Blizzard' });

    // 6. Maya's Living Corner (x: 1.6, y: 0.9, z: 2.0)
    const livingBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.9, 0.9),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    livingBox.position.set(1.6, 0.9, 2.0);
    this.scene.scene.add(livingBox);
    this.interactableItems.push({ mesh: livingBox, id: 'living', label: 'Examine Photo of Erik & Logbook' });
  }

  activate() {
    console.log("Activating Story 2: Svalbard (1974)...");
    if (this.interaction) {
      this.interaction.clear();
      this.interaction.onInteractCallback = (data) => this.handleInteraction(data);
      for (const item of this.interactableItems) {
        this.interaction.registerInteractable(item.mesh, item.id, item.label, item.data || {});
      }
      this.setupFloatingWords();
    }
    this.bindModalButtons();
  }

  deactivate() {
    if (this.activePuzzle) {
      this.closeCurrentPuzzle();
    }
    const docModal = document.getElementById('document-modal');
    if (docModal) docModal.style.display = 'none';
    const puzzleModal = document.getElementById('puzzle-modal');
    if (puzzleModal) puzzleModal.style.display = 'none';
    this.hideSubtitle();
  }

  setupFloatingWords() {
    // Over the patchboard
    this.interaction.registerFloatingWord(
      new THREE.Vector3(-0.25, 1.6, -1.8),
      "Sub-zero power surge tripped the relays.<br>Must route 135 Ω across baseline frequencies.",
      3.0
    );

    // Over the teletype
    this.interaction.registerFloatingWord(
      new THREE.Vector3(-1.8, 1.6, 1.8),
      "Shortwave receiver muted.<br>Power must be restored to decrypt incoming frequencies.",
      3.0
    );

    // Near the blast door
    this.interaction.registerFloatingWord(
      new THREE.Vector3(2.6, 1.7, 0.0),
      "Airlock sealed against -38°C blizzard.<br>I am 800 miles from the nearest living soul.",
      2.8
    );

    // Near the porthole
    this.interaction.registerFloatingWord(
      new THREE.Vector3(-2.6, 1.8, 0.0),
      "The antenna mast is swaying in the gale.<br>If the guy-wires snap, we go completely blind.",
      2.8
    );
  }

  setupModals() {
    // Handled dynamically on activate()
  }

  bindModalButtons() {
    const closeBtn = document.getElementById('puzzle-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeCurrentPuzzle();
    }

    const docClose = document.getElementById('document-close');
    if (docClose) {
      docClose.onclick = () => {
        document.getElementById('document-modal').style.display = 'none';
        this.player.enabled = true;
        this.player.lock();
      };
    }

    const skipBtn = document.getElementById('skip-cutscene');
    if (skipBtn) {
      skipBtn.onclick = () => this.endCutscene();
    }
  }

  // Single source of truth for the intro media.  The loading screen preloads
  // exactly these URLs before the montage is allowed to start.
  getIntroMedia() {
    return {
      video: 'assets/videos/cutscene_2a_svalbard_blizzard.mp4?v=20261024_1',
      audio: 'assets/audio/audio_story2_maya_opening.mp3?v=20261024_1'
    };
  }

  startStory() {
    const cutsceneModal = document.getElementById('cutscene-modal');
    const cutsceneVideo = document.getElementById('cutscene-video');
    const media = this.getIntroMedia();

    if (cutsceneModal && cutsceneVideo) {
      cutsceneModal.style.display = 'flex';
      cutsceneVideo.src = media.video;
      cutsceneVideo.currentTime = 0;

      const voiceAudio = this.audio.playVoice(media.audio);
      this.audio.playMontageIntro(2, cutsceneVideo, voiceAudio, () => this.endCutscene());

      cutsceneVideo.play().catch(e => {
        console.warn("Video playback blocked:", e);
      });
      cutsceneVideo.onerror = () => this.endCutscene();
    } else {
      this.endCutscene();
    }
  }

  endCutscene() {
    const cutsceneModal = document.getElementById('cutscene-modal');
    const cutsceneVideo = document.getElementById('cutscene-video');
    if (cutsceneVideo) {
      cutsceneVideo.onended = null;
      cutsceneVideo.pause();
      cutsceneVideo.playbackRate = 1.0;
    }
    this.audio.stopVoice();
    this.audio.stopMontageIntro();
    if (cutsceneModal) cutsceneModal.style.display = 'none';

    this.player.enabled = true;
    this.player.lock();
    this.hideSubtitle();
    this.audio.init();
    this.audio.startBlizzardWind();

    this.showBanner("Story 2: The Whispering Wire — Re-route patch-board relays to restore shortwave receiver power.");
  }

  handleInteraction(data) {
    switch (data.id) {
      case 'patchboard':
        if (!this.hasPower) {
          this.openPuzzle('patchboard');
        } else {
          this.showDocument(
            "Frequency Relay Matrix",
            "The patch-board relays are energized (135 Ω). Vacuum tubes glow warm amber across the monitoring rack."
          );
        }
        break;

      case 'teletype':
        if (!this.hasPower) {
          this.showSubtitle("Dr. Maya Lind", "The teletype has no power. I must fix the patch-board relays first.");
        } else if (!this.hasDecrypted) {
          this.openPuzzle('numberstation');
        } else {
          this.showDocument(
            "Teletype Distress Printout",
            "<em>'FISHING TRAWLER NORDIC STAR TRAPPED OFF BEAR ISLAND. RADAR BLIND. SEND RESCUE HOMING OVERRIDE FREQUENCY NOW.'</em>"
          );
        }
        break;

      case 'transmitter':
        if (this.hasPart2Unlocked) {
          this.openPuzzle('transmitter');
        } else if (!this.hasDecrypted) {
          this.showSubtitle("Dr. Maya Lind", "Emergency transmitter is on standby. I don't have the distress channel coordinates yet, or I can tune the harmonic oscillators directly.");
          this.openPuzzle('transmitter');
        } else {
          this.triggerCliffhanger();
        }
        break;

      case 'blast_door':
        this.audio.playRelayClick(true);
        this.showDocument(
          "Airlock Blast Door",
          "Thick steel pressure door with central wheel lock. The external thermometer reads -38°C.<br><br><em>'Outside, a 90-knot gale is tearing over the glacier. Opening this door without an arctic survival suit would be fatal in minutes.'</em>"
        );
        break;

      case 'porthole':
        this.showDocument(
          "Reinforced Porthole",
          "Frost creeps like fern leaves across the heavy glass. Outside, white gale-force blizzard blinds the horizon, while the solitary red beacon atop the radio mast flashes faithfully into the dark polar night."
        );
        break;

      case 'living':
        this.audio.playRelayClick(false);
        this.showDocument(
          "Framed Photo & Logbook",
          "A framed photograph shows young Maya and her twin brother Erik laughing on a sailboat in Stockholm archipelago.<br><br>Erik's handwritten note in the field log reads:<br><em>'Our twin bond is two. Whenever you decode my numbers stations, subtract our bond to find the words I could not speak.'</em>"
        );
        break;
    }
  }

  openPuzzle(type) {
    this.activePuzzle = type;
    this.player.enabled = false;
    this.player.unlock();

    const modal = document.getElementById('puzzle-modal');
    const title = document.getElementById('puzzle-title-text');

    // Hide all puzzle sections
    document.querySelectorAll('.puzzle-body > div').forEach(el => el.style.display = 'none');

    modal.style.display = 'flex';

    if (type === 'patchboard') {
      title.innerText = "Puzzle 2.1: The Patch-Board Frequency Grid";
      const sec = document.getElementById('puzzle-section-patchboard');
      if (sec) sec.style.display = 'flex';
      if (this.puzzlePatchboard) this.puzzlePatchboard.renderGrid();
    } else if (type === 'numberstation') {
      title.innerText = "Puzzle 2.2: Number Station Decrypt";
      const sec = document.getElementById('puzzle-section-numberstation');
      if (sec) sec.style.display = 'flex';
      if (this.puzzleNumberStation) {
        this.puzzleNumberStation.renderInputs();
        this.puzzleNumberStation.playBroadcast();
      }
    } else if (type === 'transmitter') {
      title.innerText = "Puzzle 2.3: Emergency Polyphonic Transmitter";
      const sec = document.getElementById('puzzle-section-transmitter');
      if (sec) sec.style.display = 'flex';
      if (this.puzzleTransmitter) this.puzzleTransmitter.renderSliders();
    }
  }

  closeCurrentPuzzle() {
    const modal = document.getElementById('puzzle-modal');
    if (modal) modal.style.display = 'none';
    document.querySelectorAll('.puzzle-body > div').forEach(el => {
      el.style.display = 'none';
    });
    this.activePuzzle = null;
    this.player.enabled = true;
    this.player.lock();
  }

  onPatchboardSolved() {
    this.hasPower = true;
    this.closeCurrentPuzzle();
    this.showBanner("Power restored! Carrier frequency locked. Inspect the Teletype.");
    this.showSubtitle("Dr. Maya Lind", "Power is back! The vacuum tubes are glowing... wait, there's a voice under the carrier wave!");

    // Automatically trigger broadcast audio
    setTimeout(() => {
      if (this.audio) {
        this.audio.playRadioStatic(1.5);
        setTimeout(() => {
          this.audio.playVoice('assets/audio/audio_story2_erik_distress.mp3');
        }, 800);
      }
    }, 1200);
  }

  onNumberStationSolved() {
    this.hasDecrypted = true;
    this.closeCurrentPuzzle();
    this.showBanner("Distress Signal Decrypted: Nordic Star trapped off Bear Island!");
    this.showSubtitle("Dr. Maya Lind", "Erik?! He survived... all these years! I have to send the emergency override carrier!");
  }

  triggerCliffhanger() {
    this.player.enabled = false;
    this.player.unlock();

    this.showSubtitle(
      "Dr. Maya Lind",
      "The hymn of the drowned bell... Erik, where did they bury the music?!"
    );
    this.audio.playVoice('assets/audio/audio_story2_maya_cliffhanger.mp3');

    const banner = document.getElementById('notification-banner');
    if (banner) {
      banner.innerHTML = "<strong>DREAM FRACTURE:</strong> Story 2 (Part 1) Complete.<br>The harmonic hymn lies buried across time in <em>Story 3 (Venice, 1577)</em>.";
      banner.classList.add('show');
    }

    const toggle = document.getElementById('part2-story2-toggle-container');
    if (toggle) toggle.style.display = 'block';

    this.showDocument(
      "DREAM FRACTURE // THE HYMN OF THE DROWNED BELL",
      `<p><em>"The hymn of the drowned bell... Erik, where did they bury the music?!"</em></p>
       <p>To punch through the Soviet jamming, the Emergency Polyphonic Transmitter requires the 4-note harmonic chord of <strong>The Hymn of the Drowned Bell (1577)</strong>.</p>
       <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.2rem;">
         <button class="btn-brass" style="background:#854d0e; border-color:#eab308; width:100%;" onclick="document.getElementById('document-modal').style.display='none'; if(window.loadStory) window.loadStory(3, true);">
           ✦ Enter Story 3: Venice (1577) — Discover the Hymn
         </button>
         <button class="btn-brass" style="background:#0f766e; border-color:#14b8a6; width:100%;" onclick="document.getElementById('document-modal').style.display='none'; if(window.storyController2) { window.storyController2.unlockPart2Chords(); window.storyController2.openPuzzle('transmitter'); }">
           Tune Emergency Transmitter Now (D - F - A - C)
         </button>
       </div>`
    );
  }

  unlockPart2() {
    this.unlockPart2Chords();
  }

  unlockPart2Chords() {
    this.hasPart2Unlocked = true;
    this.hasPower = true;
    this.hasDecrypted = true;
    this.showBanner("Choral harmonic chord discovered: D - F - A - C! Inspect the Emergency Transmitter.");
    this.showSubtitle("Fra Matteo's Echo", "Four notes inscribed in drying lime: D - F - A - C.");
  }

  onTransmitterSolved() {
    this.hasRescued = true;
    this.closeCurrentPuzzle();
    this.player.enabled = false;
    this.player.unlock();

    if (window.storyController1 && window.storyController1.unlockPart2Coordinates) {
      window.storyController1.unlockPart2Coordinates();
    }

    this.showSubtitle("Dr. Maya Lind", "The signal punched through! The radar override is broadcasting!");
    this.audio.playVoice('assets/audio/audio_story2_erik_resolution.mp3');

    setTimeout(() => {
      this.showDocument(
        "Radio Transmission: Nordic Star Safe",
        `<em>"Maya! The override worked! The navigational lights on the headland just came on... we see the harbor! We're home, Maya... we're safe!<br><br>
        Before they arrested me, I kept grandmother's old diary safe. The one from her great-grandfather at Greenwich Observatory. He had the missing Venetian comet page from 1577!<br><br>
        I'm reading it to you now so it never gets lost again:<br>
        <strong style='color:#d97706; font-size:1.1rem;'>NOVEMBER 13th, 28 DEGREES SCORPIO!</strong><br><br>
        Write it down, Maya!"</em><br><br>
        <span style='color:#15803d; font-weight:700;'>Story 2 Climax Achieved! Coordinates recorded to Memories &amp; Keepsakes.</span>
        <div style="margin-top:1.1rem;">
          <button class="btn-brass" style="width:100%; padding:0.7rem;" onclick="document.getElementById('document-modal').style.display='none'; if(window.loadStory) { window.loadStory(1, false); if(window.storyController1) window.storyController1.unlockPart2Coordinates(); }">
            ✦ Ascend to Story 1: London (1892) — Align the Celestial Orrery
          </button>
        </div>`
      );

      // Add comet coordinates to player journal
      const inv = document.getElementById('inventory-list');
      if (inv) {
        const item = document.createElement('div');
        item.className = 'inv-item';
        item.innerHTML = '<span class="inv-icon">◆</span> <span style="color:#f59e0b;">Venetian Comet Coordinates (Nov 13, 28° Scorpio)</span>';
        inv.appendChild(item);
      }
      this.showBanner("Comet Coordinates Acquired! Return to Story 1 to unlock the Celestial Orrery.");
    }, 1800);
  }

  showSubtitle(speaker, text, duration = 7000) {
    if (this.subtitlesEl) {
      this.speakerEl.innerText = speaker;
      this.subtextEl.innerText = `"${text}"`;
      this.subtitlesEl.style.display = 'block';
      this.subtitlesEl.classList.add('visible');
      clearTimeout(this.subtitleTimer);
      this.subtitleTimer = setTimeout(() => this.hideSubtitle(), duration);
    }
  }

  hideSubtitle() {
    if (this.subtitlesEl) {
      this.subtitlesEl.classList.remove('visible');
      this.subtitlesEl.style.display = 'none';
    }
  }

  showBanner(text) {
    const banner = document.getElementById('notification-banner');
    if (banner) {
      banner.innerHTML = text;
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 6000);
    }
  }

  showDocument(title, content) {
    this.player.enabled = false;
    this.player.unlock();
    const modal = document.getElementById('document-modal');
    document.getElementById('document-title').innerText = title;
    document.getElementById('document-content').innerHTML = content;
    modal.style.display = 'flex';
  }
}
