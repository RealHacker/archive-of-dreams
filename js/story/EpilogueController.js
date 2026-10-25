// EpilogueController.js - Section 10: Epilogue — The Dreamer's Awakening
// Interactive visual scene built around the sunlit bedroom desk image (epilogue_sunlit_desk.png)
// featuring the 4 tangible keepsakes and the smartphone on the table.

class EpilogueController {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.isMessageSent = false;
  }

  open() {
    if (document.exitPointerLock) document.exitPointerLock();
    if (window.toggleJournalMenu) window.toggleJournalMenu(false);

    let modal = document.getElementById('epilogue-awakening-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'epilogue-awakening-modal';
      modal.className = 'puzzle-fullscreen-modal';
      document.body.appendChild(modal);
    }

    this.isMessageSent = false;
    modal.style.display = 'flex';
    modal.style.background = 'radial-gradient(circle at 50% 25%, rgba(45, 26, 12, 0.92) 0%, rgba(15, 10, 6, 0.97) 100%)';
    modal.style.padding = '1rem';

    modal.innerHTML = `
      <div style="max-width:1080px; width:96%; background:rgba(24, 16, 10, 0.94); border:1.5px solid rgba(245, 158, 11, 0.55); border-radius:18px; padding:1.25rem 1.5rem; color:#fef3c7; box-shadow:0 28px 80px rgba(0,0,0,0.85); display:flex; flex-direction:column; gap:0.9rem;">
        
        <!-- Header Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(245,158,11,0.25); padding-bottom:0.65rem;">
          <div>
            <div style="font-size:0.74rem; color:#fbbf24; letter-spacing:0.16rem; font-family:'Cinzel',serif; font-weight:700;">
              ☀ EPILOGUE // PRESENT DAY — 07:14 AM SUNLIT BEDROOM DESK
            </div>
            <h2 style="margin:0.15rem 0 0 0; font-family:'Cinzel',serif; font-size:1.45rem; color:#fffbeb; letter-spacing:0.04rem;">
              The Dreamer's Awakening
            </h2>
          </div>
          <button id="btn-close-epilogue" style="background:rgba(120,53,15,0.65); color:#fef3c7; border:1px solid rgba(245,158,11,0.6); border-radius:8px; padding:0.45rem 1rem; font-family:'Cinzel',serif; font-size:0.82rem; cursor:pointer; transition:all 0.2s;">
            Return to Archive
          </button>
        </div>

        <!-- Interactive Scene Image Stage (16:9) -->
        <div id="epilogue-scene-stage" style="position:relative; width:100%; aspect-ratio:16/9; max-height:60vh; border-radius:14px; overflow:hidden; border:1px solid rgba(251,191,36,0.45); box-shadow:0 14px 40px rgba(0,0,0,0.65); background:#1c130c; margin:0 auto;">
          <img src="assets/images/epilogue_sunlit_desk.png?v=20261024_2" alt="Sunlit Desk with Four Keepsakes and Smartphone" style="width:100%; height:100%; object-fit:cover; display:block; filter: saturate(1.05) contrast(1.02);" />

          <!-- Subtle Sunbeam Vignette Overlay -->
          <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(254,243,199,0.08) 0%, rgba(0,0,0,0.0) 55%, rgba(12,8,5,0.72) 100%); pointer-events:none;"></div>

          <!-- Hotspot 1: Brass Cogwheel (Left on Table) -->
          <button class="keepsake-hotspot" data-keepsake="cog" title="Inspect Victorian Brass Cogwheel (1892)"
            style="position:absolute; left:19%; top:52%; transform:translate(-50%,-50%); width:18%; height:28%; background:radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0) 70%); border:1.5px solid rgba(251,191,36,0.65); border-radius:50%; cursor:pointer; transition:all 0.25s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.35rem;">
            <span style="background:rgba(24,15,8,0.86); color:#fde68a; border:1px solid #f59e0b; border-radius:999px; padding:0.18rem 0.65rem; font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
              I. Brass Cogwheel (1892)
            </span>
          </button>

          <!-- Hotspot 2: Arctic Black Sea Pebble (Center-Left on Table) -->
          <button class="keepsake-hotspot" data-keepsake="pebble" title="Inspect Arctic Sea Pebble (1974)"
            style="position:absolute; left:44%; top:39%; transform:translate(-50%,-50%); width:15%; height:22%; background:radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0) 70%); border:1.5px solid rgba(125,211,252,0.65); border-radius:50%; cursor:pointer; transition:all 0.25s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.25rem;">
            <span style="background:rgba(12,25,38,0.88); color:#bae6fd; border:1px solid #38bdf8; border-radius:999px; padding:0.18rem 0.65rem; font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
              II. Black Sea Pebble (1974)
            </span>
          </button>

          <!-- Hotspot 3: Lapis Lazuli Stone (Center-Right on Table) -->
          <button class="keepsake-hotspot" data-keepsake="lapis" title="Inspect Lapis Lazuli Stone (1577)"
            style="position:absolute; left:67%; top:43%; transform:translate(-50%,-50%); width:15%; height:24%; background:radial-gradient(circle, rgba(129,140,248,0.22) 0%, rgba(129,140,248,0) 70%); border:1.5px solid rgba(165,180,252,0.65); border-radius:50%; cursor:pointer; transition:all 0.25s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.25rem;">
            <span style="background:rgba(20,18,48,0.88); color:#e0e7ff; border:1px solid #818cf8; border-radius:999px; padding:0.18rem 0.65rem; font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
              III. Lapis Lazuli (1577)
            </span>
          </button>

          <!-- Hotspot 4: Vial of Star-Dust (Right on Table) -->
          <button class="keepsake-hotspot" data-keepsake="stardust" title="Inspect Vial of Star-Dust (2188)"
            style="position:absolute; left:85.5%; top:41%; transform:translate(-50%,-50%); width:14%; height:36%; background:radial-gradient(circle, rgba(192,132,252,0.22) 0%, rgba(192,132,252,0) 70%); border:1.5px solid rgba(216,180,254,0.65); border-radius:24px; cursor:pointer; transition:all 0.25s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.25rem;">
            <span style="background:rgba(36,14,54,0.88); color:#f3e8ff; border:1px solid #c084fc; border-radius:999px; padding:0.18rem 0.65rem; font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
              IV. Star-Dust Vial (2188)
            </span>
          </button>

          <!-- Hotspot 5: Smartphone on the Table (Foreground Center) -->
          <div id="phone-table-hotspot" style="position:absolute; left:48.5%; top:73%; transform:translate(-50%,-50%); width:23%; height:38%; border-radius:22px; border:2px solid rgba(56,189,248,0.75); box-shadow:0 0 28px rgba(14,165,233,0.45); display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:0.5rem; cursor:pointer; background:radial-gradient(circle at 50% 80%, rgba(14,165,233,0.18), transparent 70%); transition:all 0.3s;">
            <button id="btn-send-reconciliation" style="background:linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%); color:#ffffff; border:1px solid #bae6fd; border-radius:999px; padding:0.42rem 1.35rem; font-family:'Cinzel',serif; font-size:0.82rem; font-weight:700; letter-spacing:0.08rem; cursor:pointer; box-shadow:0 0 18px rgba(14,165,233,0.85); transition:all 0.25s;">
              [ SEND MESSAGE ]
            </button>
          </div>

          <!-- Finale Credits Overlay Banner (Appears at Top of Scene After Sending) -->
          <div id="epilogue-credits-box" style="display:none; position:absolute; top:0.85rem; left:50%; transform:translateX(-50%); width:88%; max-width:760px; background:rgba(15, 23, 42, 0.88); backdrop-filter:blur(10px); border:1.5px solid #fbbf24; border-radius:14px; padding:0.95rem 1.4rem; text-align:center; box-shadow:0 16px 40px rgba(0,0,0,0.75);">
            <div style="font-family:'Cinzel',serif; font-size:1.15rem; color:#fde68a; font-weight:700; letter-spacing:0.12rem; margin-bottom:0.25rem;">
              ✦ THE ARCHIVE OF DREAMS — RECONCILIATION COMPLETE ✦
            </div>
            <p style="font-size:0.9rem; color:#f8fafc; margin:0 0 0.35rem 0; line-height:1.45;">
              <em>"A life is not measured by the number of breaths you take, but by the fire you keep burning for those who come after."</em>
            </p>
            <div style="font-size:0.76rem; color:#38bdf8; font-family:'Cinzel',serif; letter-spacing:0.1rem;">
              HARMONIC CHORD: D &bull; F &bull; A &bull; C &mdash; THANK YOU FOR PLAYING
            </div>
          </div>
        </div>

        <!-- Bottom Inspection & Smartphone Status Bar -->
        <div style="display:grid; grid-template-columns: 1.35fr 1fr; gap:1rem; align-items:center; background:rgba(15, 11, 7, 0.88); border:1px solid rgba(245,158,11,0.32); border-radius:12px; padding:0.85rem 1.15rem;">
          <div>
            <div style="font-family:'Cinzel',serif; font-size:0.72rem; color:#f59e0b; letter-spacing:0.1rem; margin-bottom:0.25rem;">
              TANGIBLE KEEPSAKE MEMORY
            </div>
            <div id="keepsake-inspect-text" style="font-size:0.9rem; color:#fef3c7; line-height:1.45; min-height:2.5rem;">
              Warm morning sunlight falls across the four keepsakes carried back from your dreams. Click any keepsake on the table to recall the soul who entrusted it to you.
            </div>
          </div>

          <div style="background:rgba(15, 23, 42, 0.92); border:1px solid #334155; border-radius:10px; padding:0.7rem 0.95rem; display:flex; flex-direction:column; gap:0.35rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:#94a3b8;">
              <span>SMARTPHONE ON DESK</span>
              <span id="phone-status-badge" style="color:#fbbf24; font-weight:700;">DRAFT UNSENT (4 YEARS)</span>
            </div>
            <div id="phone-message-bubble" style="font-size:0.86rem; color:#e2e8f0; font-style:italic; border-left:2px solid #38bdf8; padding-left:0.6rem;">
              "I know it's been years. But I'm sorry. I want to talk."
            </div>
          </div>
        </div>

      </div>
    `;

    const closeBtn = modal.querySelector('#btn-close-epilogue');
    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }

    const descriptions = {
      cog: '⚙️ I. Brass Cogwheel (London, 1892): Still warm from the study hearth. Jonathan Finch unsealed the Celestial Orrery and posted the deed saving his daughter Clara\'s school before dawn.',
      pebble: '🪨 II. Black Sea Pebble (Svalbard, 1974): Gathered from the rocky Arctic shore where Dr. Maya Lind\'s harmonic override guided her twin brother Erik\'s trawler safely through the blizzard.',
      lapis: '💎 III. Lapis Lazuli Stone (Venice, 1577): Deep ultramarine pigment flecked with gold pyrite—used by Fra Matteo to seal Brother Bernardo\'s Great Comet charts and inscribe the four notes (D - F - A - C).',
      stardust: '✨ IV. Vial of Star-Dust (SS Peregrine, 2188): Shimmers with living violet-gold nebula light—Steward Julian\'s eternal vigil carrying ten thousand sleeping children to New Canaan.'
    };

    modal.querySelectorAll('.keepsake-hotspot').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const key = btn.dataset.keepsake;
        const inspectEl = modal.querySelector('#keepsake-inspect-text');
        if (inspectEl && descriptions[key]) {
          inspectEl.textContent = descriptions[key];
        }
        modal.querySelectorAll('.keepsake-hotspot').forEach(b => {
          b.style.boxShadow = 'none';
          b.style.transform = 'translate(-50%,-50%) scale(1.0)';
        });
        btn.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.85)';
        btn.style.transform = 'translate(-50%,-50%) scale(1.06)';
        if (this.audioManager && this.audioManager.playGearClick) {
          this.audioManager.playGearClick();
        }
      };
    });

    const sendBtn = modal.querySelector('#btn-send-reconciliation');
    const phoneHotspot = modal.querySelector('#phone-table-hotspot');
    if (sendBtn) {
      sendBtn.onclick = (e) => {
        e.stopPropagation();
        this.sendReconciliationMessage(modal);
      };
    }
    if (phoneHotspot) {
      phoneHotspot.onclick = () => this.sendReconciliationMessage(modal);
    }
  }

  sendReconciliationMessage(modal) {
    if (this.isMessageSent) return;
    this.isMessageSent = true;

    const badge = modal.querySelector('#phone-status-badge');
    const bubble = modal.querySelector('#phone-message-bubble');
    const sendBtn = modal.querySelector('#btn-send-reconciliation');
    const phoneHotspot = modal.querySelector('#phone-table-hotspot');
    const credits = modal.querySelector('#epilogue-credits-box');

    if (badge) {
      badge.style.color = '#34d399';
      badge.textContent = '✔ DELIVERED • JUST NOW';
    }
    if (bubble) {
      bubble.style.borderLeftColor = '#10b981';
      bubble.style.color = '#a7f3d0';
    }
    if (sendBtn) {
      sendBtn.textContent = '✔ MESSAGE SENT';
      sendBtn.style.background = 'linear-gradient(135deg,#059669 0%,#10b981 100%)';
      sendBtn.style.borderColor = '#6ee7b7';
      sendBtn.style.boxShadow = '0 0 22px rgba(16,185,129,0.9)';
      sendBtn.style.cursor = 'default';
    }
    if (phoneHotspot) {
      phoneHotspot.style.borderColor = '#10b981';
      phoneHotspot.style.boxShadow = '0 0 35px rgba(16,185,129,0.65)';
    }
    if (credits) {
      credits.style.display = 'block';
    }

    // Play the four-chord harmonic motif (D - F - A - C) on gentle WebAudio piano synth
    this.playHarmonicPianoChord();
  }

  playHarmonicPianoChord() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      // D4 (293.66 Hz), F4 (349.23 Hz), A4 (440.00 Hz), C5 (523.25 Hz), D5 (587.33 Hz)
      const notes = [293.66, 349.23, 440.00, 523.25, 587.33];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.42);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.42);
        gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + i * 0.42 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + i * 0.42 + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.42);
        osc.stop(ctx.currentTime + i * 0.42 + 2.9);
      });
    } catch (e) {
      console.warn('Piano synth error:', e);
    }
  }

  close() {
    const modal = document.getElementById('epilogue-awakening-modal');
    if (modal) modal.style.display = 'none';
  }
}

window.EpilogueController = EpilogueController;
