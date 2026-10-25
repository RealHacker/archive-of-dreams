// Story1Controller.js - Story state machine, narrative beats, quest triggers, and dialogues
class Story1Controller {
  constructor(sceneManager, playerController, interactionManager, audioManager) {
    this.scene = sceneManager;
    this.player = playerController;
    this.interaction = interactionManager;
    this.audio = audioManager;

    // Story State
    this.state = 'EXPLORING_STUDY'; 
    this.hasDeskUnlocked = false;
    this.hasKey = false;
    this.hasDoorsUnlocked = false;
    this.hasPart2Unlocked = false;
    this.hasSentLetter = false;

    // Inventory items
    this.inventory = [];

    // Puzzles
    this.puzzleEscapement = null;
    this.puzzleLockbox = null;
    this.puzzleOrrery = null;

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
    this.puzzleEscapement = new Puzzle1_Escapement(this.audio, () => this.onEscapementSolved());
    this.puzzleLockbox = new Puzzle1_Lockbox(this.audio, () => this.onLockboxSolved());
    this.puzzleOrrery = new Puzzle1_Orrery(
      this.audio,
      () => this.onOrreryCliffhanger(),
      () => this.onOrrerySolved()
    );
  }

  initInteractables() {
    // 1. Roll-top Desk in North-West corner (x: -1.8, y: 0.8, z: 3.6)
    const deskBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 0.9),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    deskBox.position.set(-1.8, 0.8, 3.6);
    this.scene.scene.add(deskBox);
    this.interactableItems.push({ mesh: deskBox, id: 'desk', label: 'Inspect Roll-top Desk' });

    // 2. Hallway Exit Door with brass mail chute on East wall (x: 3.0, y: 1.1, z: 2.5)
    const exitDoorBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.2, 1.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    exitDoorBox.position.set(3.0, 1.1, 2.5);
    this.scene.scene.add(exitDoorBox);
    this.interactableItems.push({ mesh: exitDoorBox, id: 'door_exit', label: 'Inspect Hallway Exit Door & Mail Chute' });

    // 3. Double Oak Doors to Inner Observatory (x: 0, y: 1.1, z: 0)
    const obsDoorBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.2, 0.3),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    obsDoorBox.position.set(0, 1.1, 0);
    this.scene.scene.add(obsDoorBox);
    this.interactableItems.push({ mesh: obsDoorBox, id: 'door_obs', label: 'Inspect Inner Observatory Doors' });

    // 4. Jonathan's Armchair by Hearth (x: 0.8, y: 0.5, z: 3.6)
    const chairBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    chairBox.position.set(0.8, 0.5, 3.6);
    this.scene.scene.add(chairBox);
    this.interactableItems.push({ mesh: chairBox, id: 'chair', label: 'Examine Armchair & Hearth' });

    // 5. Bay Window overlooking London (x: -3.0, y: 1.5, z: 2.5)
    const windowBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.0, 2.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    windowBox.position.set(-3.0, 1.5, 2.5);
    this.scene.scene.add(windowBox);
    this.interactableItems.push({ mesh: windowBox, id: 'window', label: 'Look out into London Fog' });

    // 6. Side Table with Clara's Music Box & Letters (x: -1.8, y: 0.9, z: 2.2)
    const tableBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    tableBox.position.set(-1.8, 0.9, 2.2);
    this.scene.scene.add(tableBox);
    this.interactableItems.push({ mesh: tableBox, id: 'clues', label: 'Examine Clara\'s Music Box & Letters' });

    // 7. Inside Observatory: The Celestial Orrery (x: 0, y: 1.2, z: -2.0)
    const orreryBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 1.5, 16),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    orreryBox.position.set(0, 1.2, -2.0);
    this.scene.scene.add(orreryBox);
    this.interactableItems.push({ mesh: orreryBox, id: 'orrery', label: 'Inspect Celestial Orrery' });

    // 8. Inside Observatory: Reference Folio "De Stella Nova" (x: 0.9, y: 0.9, z: -1.8)
    const folioBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    folioBox.position.set(0.9, 0.9, -1.8);
    this.scene.scene.add(folioBox);
    this.interactableItems.push({ mesh: folioBox, id: 'folio', label: 'Read Astronomical Folio' });
  }

  activate() {
    console.log("Activating Story 1: London (1892)...");
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
    // Near Roll-top Desk
    this.interaction.registerFloatingWord(
      new THREE.Vector3(-1.8, 1.6, 3.6),
      "Where did I place the key?<br>My mind... it slips like oil through brass gears.",
      3.0
    );

    // Near Exit Door
    this.interaction.registerFloatingWord(
      new THREE.Vector3(2.8, 1.7, 2.5),
      "The world outside waits...<br>I cannot leave until the deed is posted.",
      2.8
    );

    // Near Locked Observatory Doors
    this.interaction.registerFloatingWord(
      new THREE.Vector3(0, 1.8, 0.4),
      "Behind these doors sleeps the Orrery.<br>Locked until Clara's future is sealed.",
      3.2
    );

    // Inside Observatory (near Orrery)
    this.interaction.registerFloatingWord(
      new THREE.Vector3(0, 1.9, -1.6),
      "The Orrery of Forgiveness.<br>A father's heart sealed in bronze.",
      3.0
    );
  }

  setupModals() {
    this.bindModalButtons();
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

  startStory() {
    const cutsceneModal = document.getElementById('cutscene-modal');
    const cutsceneVideo = document.getElementById('cutscene-video');

    if (cutsceneModal && cutsceneVideo) {
      cutsceneModal.style.display = 'flex';
      cutsceneVideo.src = 'assets/videos/cutscene_1a_london_mist.mp4?v=20261024_1';
      cutsceneVideo.currentTime = 0;

      const voiceAudio = this.audio.playVoice('assets/audio/audio_story1_jonathan_opening.mp3?v=20261024_1');
      this.audio.playMontageIntro(1, cutsceneVideo, voiceAudio, () => this.endCutscene());

      cutsceneVideo.play().catch(e => {
        console.warn("Video playback blocked or failed:", e);
      });
      cutsceneVideo.onerror = () => {
        console.warn("Video load error, proceeding to game.");
        this.endCutscene();
      };
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

    this.showBanner("Story 1: The Watchmaker's Orrery — Solve the desk lock to retrieve the Observatory Key.");
  }

  handleInteraction(data) {
    switch (data.id) {
      case 'desk':
        if (!this.hasDeskUnlocked) {
          this.openPuzzle('escapement');
        } else if (!this.hasKey) {
          this.openPuzzle('lockbox');
        } else {
          this.showDocument(
            "Roll-Top Desk",
            "The desk is open. Inside lies Jonathan's prescription for progressive memory loss, Clara's childhood drawing, and the opened cylindrical lockbox."
          );
        }
        break;

      case 'door_exit':
        this.audio.playGearClick(350);
        if (!this.puzzleOrrery.isSolved) {
          this.showDocument(
            "Hallway Exit Door",
            "Heavy oak entrance door leading into the hallway. A brass mail chute is mounted at waist height.<br><br><em>'I cannot leave this house... not until I have made peace with Clara. The deed to her school must be posted first.'</em>"
          );
        } else if (!this.hasSentLetter) {
          this.hasSentLetter = true;
          this.audio.playLockBolt();
          this.showDocument(
            "Brass Mail Chute",
            "You slip the deed of gift and letter into the brass mail chute. It slides with a satisfying metallic rattle into the post collector below.<br><br>Outside in the street, a courier boy's whistle echoes through the morning fog.<br><br><span style='color:#22c55e;'>The letter is on its way to Clara. Your burden is lifted.</span>"
          );
          this.showBanner("Deed posted! Clara's school is saved.");
        } else {
          this.showDocument(
            "Hallway Exit Door",
            "The letter is already posted. Peace fills the room."
          );
        }
        break;

      case 'door_obs':
        this.audio.playGearClick(280);
        if (!this.hasKey) {
          this.showSubtitle("Jonathan Finch", "The double doors to my observatory are locked. I must retrieve the heavy iron key from the roll-top desk.");
        } else if (!this.hasDoorsUnlocked) {
          this.hasDoorsUnlocked = true;
          this.audio.playLockBolt();
          this.scene.openObservatoryDoors();
          this.player.unlockObservatoryBounds();
          this.showBanner("Observatory Unlocked! The Celestial Orrery awaits inside.");
          this.showSubtitle("Jonathan Finch", "The inner sanctum... my masterpiece. The stars must answer now.");
        } else {
          this.showSubtitle("Jonathan Finch", "The observatory is open. The Celestial Orrery rests ahead.");
        }
        break;

      case 'chair':
        this.showDocument(
          "Jonathan's Armchair & Hearth",
          "A worn emerald green velvet armchair resting by the crackling fireplace. An unfinished letter to his solicitor sits on the side table beside an unlit pipe."
        );
        break;

      case 'clues':
        this.audio.playGearClick(520);
        this.showDocument(
          "Clara's Music Box & Pawn Ticket",
          "A handwritten note inside the music box lid reads: <em>'Her name was always the key. Not what I called her in anger, but what she asked to be called: <strong>CLARA</strong>.'</em><br><br>Pawn ticket attached: <em>'Saint Jude's School for Girls, Headmistress Clara Finch.'</em>"
        );
        break;

      case 'folio':
        this.audio.playGearClick(400);
        this.showDocument(
          "De Stella Nova (Astronomical Folio)",
          "<em>'...the Great Comet of 1577 illuminated the Venetian heavens...'</em><br><br><span style='color:#ef4444;'>[The vital page detailing the exact month, day, and Scorpio coordinates has been ripped out and lost centuries ago!]</span>"
        );
        break;

      case 'window':
        this.showDocument(
          "Gaslit London Window",
          "Pea-soup fog hangs thick over the cobblestone street below. Gas lamps glow like distant amber stars in the gloom. Rain trickles down the cold leaded glass."
        );
        break;

      case 'orrery':
        if (!this.hasDoorsUnlocked) {
          this.showSubtitle("Jonathan Finch", "I must unlock the observatory doors first.");
        } else if (!this.hasPart2Unlocked) {
          this.onOrreryCliffhanger();
        } else {
          this.openPuzzle('orrery');
        }
        break;
    }
  }

  openPuzzle(type) {
    this.activePuzzle = type;
    this.player.enabled = false;
    this.player.unlock();

    const modal = document.getElementById('puzzle-modal');
    const escapementSec = document.getElementById('puzzle-section-escapement');
    const lockboxSec = document.getElementById('puzzle-section-lockbox');
    const orrerySec = document.getElementById('puzzle-section-orrery');
    const title = document.getElementById('puzzle-title-text');

    // Hide all puzzle sections (including Story 2's patchboard/numberstation/transmitter)
    document.querySelectorAll('.puzzle-body > div').forEach(el => {
      el.style.display = 'none';
    });

    modal.style.display = 'flex';

    if (type === 'escapement') {
      title.innerText = "Puzzle 1.1: The Escapement Gear Train (Roll-Top Desk Lock)";
      escapementSec.style.display = 'flex';
    } else if (type === 'lockbox') {
      title.innerText = "Puzzle 1.2: The Lockbox of Memories (5-Letter Cylinder)";
      lockboxSec.style.display = 'flex';
    } else if (type === 'orrery') {
      title.innerText = "Puzzle 1.3: The Celestial Orrery Alignment";
      orrerySec.style.display = 'flex';
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

  onEscapementSolved() {
    this.hasDeskUnlocked = true;
    this.closeCurrentPuzzle();
    this.addInventory("Prescription for Memory Loss");
    this.addInventory("Clara's Childhood Drawing");
    this.showBanner("Desk opened! Inspect the Cylindrical Lockbox inside.");

    this.showSubtitle("Jonathan Finch", "The gears held... now, where is the lockbox key? Clara... what was your word?");
  }

  onLockboxSolved() {
    this.hasKey = true;
    this.closeCurrentPuzzle();
    this.addInventory("Heavy Iron Observatory Key");
    this.showBanner("Obtained Key to the Observatory Double Doors!");

    this.showSubtitle("Jonathan Finch", "The key! Now I can unseal the inner observatory double doors.");
  }

  onOrreryCliffhanger() {
    this.closeCurrentPuzzle();
    this.player.enabled = false;
    this.player.unlock();

    this.showSubtitle("Jonathan Finch", "I cannot remember the date! The comet... who has the missing page? Clara... I've lost the stars!");
    this.audio.playVoice('assets/audio/audio_story1_jonathan_cliffhanger.mp3');

    const banner = document.getElementById('notification-banner');
    banner.innerHTML = "<strong>DREAM FRACTURE:</strong> Story 1 (Part 1) Complete.<br>The missing comet coordinates lie across time in <em>Story 2 (Svalbard, 1974)</em>.";
    banner.classList.add('show');

    document.getElementById('part2-toggle-container').style.display = 'block';

    this.showDocument(
      "DREAM FRACTURE // THE MISSING COMET FOLIO",
      `<p><em>"I cannot remember the date! The comet... who has the missing page? Clara... I've lost the stars!"</em></p>
       <p>The page from <em>De Stella Nova</em> recording the exact 1577 Great Comet coordinates was torn out centuries ago—and is preserved in Dr. Maya Lind's family diary in <strong>Svalbard (1974)</strong>.</p>
       <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.2rem;">
         <button class="btn-brass" style="background:#0f766e; border-color:#14b8a6; width:100%;" onclick="document.getElementById('document-modal').style.display='none'; if(window.loadStory) window.loadStory(2, true);">
           ✦ Enter Story 2: Svalbard (1974) — Find the Comet Page
         </button>
         <button class="btn-brass" style="background:#1e293b; border-color:#475569; width:100%;" onclick="document.getElementById('document-modal').style.display='none'; if(window.storyController1) window.storyController1.openPuzzle('orrery');">
           Inspect Celestial Orrery Dials
         </button>
         <button class="btn-brass" style="width:100%;" onclick="document.getElementById('document-modal').style.display='none'; if(window.storyController1) { window.storyController1.unlockPart2Coordinates(); window.storyController1.openPuzzle('orrery'); }">
           Apply Comet Coordinates Now (Nov 13, 28° Scorpio)
         </button>
       </div>`
    );
  }

  unlockPart2Coordinates() {
    this.hasPart2Unlocked = true;
    this.hasDeskUnlocked = true;
    this.hasKey = true;
    if (!this.hasDoorsUnlocked) {
      this.hasDoorsUnlocked = true;
      this.scene.openObservatoryDoors();
      this.player.unlockObservatoryBounds();
    }
    this.puzzleOrrery.isPart2Unlocked = true;
    this.addInventory("Venetian Comet Coordinates (Nov 13, 28° Scorpio)");

    this.showBanner("Ancestral coordinates acquired! Align the Orrery to Nov 13, Scorpio 28°.");
    this.showSubtitle("Erik's Voice (Radio Echo)", "November 13th, 28 Degrees Scorpio! Write it down, Maya!");
  }

  onOrrerySolved() {
    this.closeCurrentPuzzle();
    this.player.enabled = false;
    this.player.unlock();

    this.showSubtitle("Jonathan Finch", "November 13... Scorpio... Clara, wait for me.");
    this.audio.playVoice('assets/audio/audio_story1_jonathan_climax.mp3');

    setTimeout(() => {
      this.showDocument(
        "Deed of Gift & Final Letter of Forgiveness",
        `<em>"My beloved Clara,<br><br>
        I spent my entire life trying to measure eternity in gears and springs, not knowing that eternity was in the moments I refused to share with you.<br><br>
        Enclosed is the signed deed granting my entire estate to Saint Jude's School. Forgive your father who loved the stars, but forgot the daughter who outshone them all.<br><br>
        Your loving father,<br>Jonathan Finch"</em><br><br>
        <span style='color:#f59e0b;'>Take this letter to the Hallway Exit Door and post it through the mail chute!</span><br><br>
        <button class="btn-brass" style="background:#0f766e; border-color:#2dd4bf; width:100%; padding:0.6rem; margin-top:0.4rem;" onclick="document.getElementById('document-modal').style.display='none'; if(window.openEpilogueModal) window.openEpilogueModal();">
          ☀ Awaken to Epilogue (Present Day)
        </button>`
      );
      this.showBanner("Story 1 Climax Achieved: Post the letter through the Hallway Exit Door mail chute!");
    }, 2500);
  }

  showSubtitle(speaker, text, duration = 7000) {
    if (this.subtitlesEl) {
      this.speakerEl.innerText = speaker;
      this.subtextEl.innerText = `"${text}"`;
      this.subtitlesEl.style.display = 'block';
      if (this.subtitleTimeout) clearTimeout(this.subtitleTimeout);
      this.subtitleTimeout = setTimeout(() => this.hideSubtitle(), duration);
    }
  }

  hideSubtitle() {
    if (this.subtitlesEl) this.subtitlesEl.style.display = 'none';
  }

  showBanner(msg) {
    const b = document.getElementById('notification-banner');
    b.innerHTML = msg;
    b.classList.add('show');
    setTimeout(() => b.classList.remove('show'), 4500);
  }

  showDocument(title, body) {
    this.player.enabled = false;
    this.player.unlock();
    document.getElementById('document-title').innerText = title;
    document.getElementById('document-content').innerHTML = body;
    document.getElementById('document-modal').style.display = 'flex';
  }

  addInventory(item) {
    this.inventory.push(item);
    const container = document.getElementById('inventory-list');
    if (container) {
      const div = document.createElement('div');
      div.className = 'inv-item';
      div.innerHTML = `<span class="inv-icon">◆</span> <span>${item}</span>`;
      container.appendChild(div);
    }
  }
}
