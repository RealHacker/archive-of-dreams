# ✦ The Archive of Dreams

**The Archive of Dreams** is a first-person 3D narrative puzzle game built with **Three.js (WebGL)**, **WebAudio**, and **HTML5/CSS3**. Across four nested dream layers spanning six centuries—from a gaslit Victorian study in 1892 London to a deep-space colony ark in 2188—the player inhabits four lives bound by a single unbroken chain of memory, sacrifice, and reconciliation.

---

## 1. Narrative & Nested Dream Architecture

Inspired by the recursive structure of *Cloud Atlas* and the tactile puzzle craftsmanship of *The Room*, *What Remains of Edith Finch*, and *Outer Wilds*, the game unfolds as a **symmetrical nested descent and ascent**:

```text
Prologue
  └──► Story I: The Watchmaker's Orrery (London, 1892) — Part I
         └──► Story II: The Whispering Wire (Svalbard, 1974) — Part I
                └──► Story III: The Heretic's Palette (Venice, 1577) — Part I
                       └──► Story IV: The Last Cradle (Deep Space, 2188) — Keystone Resolution
                ◄──┘ Story III: Venice (1577) — Part II Resolution
         ◄──┘ Story II: Svalbard (1974) — Part II Resolution
  ◄──┘ Story I: London (1892) — Part II Resolution
  └──► Epilogue: The Dreamer's Awakening (Present Day)
```

### The Four Stories & Cross-Era Keys

| Story | Era & Setting | Protagonist | Core Puzzles | Cross-Era Keystone / Clue |
| :--- | :--- | :--- | :--- | :--- |
| **Story I: The Watchmaker's Orrery** | **London, 1892** (Victorian Horologist's Study & Observatory) | **Jonathan Finch**, Master Watchmaker | **1.1** Escapement Gear Train (`3:1` & `6:1` ratios)<br>**1.2** 5-Letter Memory Cylinder (`CLARA`)<br>**1.3** The Celestial Orrery (`Nov 13, 28° Scorpio`) | Requires the missing **1577 Great Comet coordinates** (`Nov 13, 28° Scorpio`), recovered in **Story II**. Leaves behind the **Brass Cogwheel**. |
| **Story II: The Whispering Wire** | **Svalbard, 1974** (Cold War Arctic Listening Bunker *Beacon-7*) | **Dr. Maya Lind**, Glaciologist & Signal Analyst | **2.1** Patch-Board Relay Matrix (`135 Ω`)<br>**2.2** Number Station Caesar Shift (`-2` Twin Bond → `BEAR ISLAND`)<br>**2.3** Emergency Polyphonic Transmitter (`D - F - A - C`) | Requires the 4-note harmonic chord **The Hymn of the Drowned Bell** (`D - F - A - C`), carved in **Story III**. Broadcasts the **1577 Comet coordinates** up to **Story I**. Leaves behind the **Black Sea Pebble**. |
| **Story III: The Heretic's Palette** | **Venice, 1577** (Flooded Romanesque Crypt of *San Lazzaro*) | **Fra Matteo**, Deaf-Mute Fresco Painter | **3.1** Alchemical Pigment Balance (`7 Drams`: `P + III = IX + I`)<br>**3.2** Four Elements Relief Mosaic (`4×4` Grid)<br>**3.3** Cosmic Vault Dial (`Φ = 1.618` → `I • VI • XVIII`) | Requires the **Divine Cosmic Ratio (`Φ = 1.618`)**, preserved in **Story IV**. Seals Brother Bernardo's comet charts and carves `D - F - A - C` for **Story II**. Leaves behind the **Lapis Lazuli Stone**. |
| **Story IV: The Last Cradle** | **Deep Space, 2188** (Colony Ark *SS Peregrine*) | **Steward Julian 04**, Bio-Synthetic Caretaker | **4.1** Cryo-Bay Life Support Conduit Routing (`3.6 MW`)<br>**4.2** Exoplanet Atmospheric Spectrometer (`O₂ + H₂O + CH₄`)<br>**4.3** The Heritage Core Astrolabe (`Φ = 1.618`) | Unlocks the **Golden Ratio (`Φ = 1.618`)** at the center of the dream spiral, cascading solutions back through Stories **III → II → I**. Leaves behind the **Vial of Star-Dust**. |
| **Epilogue: The Dreamer's Awakening** | **Present Day** (Sunlit Morning Bedroom Desk) | **The Dreamer** | Inspect the **4 Tangible Keepsakes** on the sunlit desk and send the 4-year unsent reconciliation message on the **Smartphone**. | Plays the 4-note harmonic theme (`D • F • A • C`) and completes the Archive. |

---

## 2. Controls & In-Game Features

- **Movement**: `W`, `A`, `S`, `D` or `Arrow Keys` to walk through each 3D room.
- **Camera**: Move the `Mouse` (Pointer Lock) to look around in 360°.
- **Interact**: Press `E` or `Left-Click` when the central reticle turns **Amber** over an interactive prop, door, manuscript, or puzzle station.
- **Dream Archive Menu**: Press `M` or click **`[M] Dream Archive / Stories`** in the top-right HUD to:
  - Jump directly to any of the **4 Stories** (`Story 1` – `Story 4`) or the **Epilogue**.
  - View the **Nested Dream Architecture** progress tracker.
  - Trigger **Part II Resolution** simulation toggles for testing cross-era clues at any time.
- **4-Chapter Dream-Montage Cutscenes**: Each story opens with a synchronized `< 60s` (`~52.4s`) 4-chapter narrated Dream-Montage video featuring clickable chapter progress bars (`Slide 1 / 4` – `Slide 4 / 4`), environmental shaders, double-exposure memory ghosts, and timed subtitles.

---

## 3. Repository Structure

```text
dreams/
├── game/                          # The complete, self-contained game — deploy this folder as the site root
│   ├── index.html                 # Single-page 3D game shell, HUD, puzzle modals & story loader
│   ├── css/
│   │   └── game.css               # UI styling, puzzle interfaces, cutscene & epilogue modals
│   ├── js/
│       ├── engine/
│       │   ├── AudioManager.js    # Voiceover playback, WebAudio procedural SFX & montage sync
│       │   ├── InteractionManager.js # Raycasting, proximity floating thoughts & reticle prompts
│       │   ├── PlayerController.js   # First-person WASD movement, collision bounds & pointer lock
│       │   ├── SceneManager.js    # Story 1 (London, 1892) 3D scene & GLB asset loader
│       │   ├── SceneManager2.js   # Story 2 (Svalbard, 1974) 3D scene & GLB asset loader
│       │   ├── SceneManager3.js   # Story 3 (Venice, 1577) 3D scene & GLB asset loader
│       │   └── SceneManager4.js   # Story 4 (Deep Space, 2188) 3D scene & GLB asset loader
│       ├── puzzles/
│       │   ├── Puzzle1_Escapement.js
│       │   ├── Puzzle1_Lockbox.js
│       │   ├── Puzzle1_Orrery.js
│       │   ├── Puzzle2_Patchboard.js
│       │   ├── Puzzle2_NumberStation.js
│       │   ├── Puzzle2_Transmitter.js
│       │   ├── Puzzle3_PigmentScale.js
│       │   ├── Puzzle3_ElementMosaic.js
│       │   ├── Puzzle3_CosmicDial.js
│       │   ├── Puzzle4_LifeSupport.js
│       │   ├── Puzzle4_Spectrometer.js
│       │   └── Puzzle4_HeritageCore.js
│       └── story/
│           ├── IntroMontageData.js # Exact chapter timestamps & subtitles for all 4 intro montages
│           ├── Story1Controller.js # Story 1 narrative state machine & interactions
│           ├── Story2Controller.js # Story 2 narrative state machine & interactions
│           ├── Story3Controller.js # Story 3 narrative state machine & interactions
│           ├── Story4Controller.js # Story 4 narrative state machine & interactions
│           └── EpilogueController.js # Present-day sunlit desk scene with 4 keepsakes & smartphone
│   └── assets/                    # Production game assets (referenced as "assets/..." from the game)
│       ├── audio/                 # Character voiceovers & 4 master opening narration MP3s
│       ├── images/                # Character portraits, 16 intro montage slides & epilogue artwork
│       ├── models/                # PBR 3D .glb props & architectural assets
│       ├── textures/              # Surface textures, Renaissance fresco & parchment maps
│       └── videos/                # 4 rendered 24fps H.264 MP4 Dream-Montage cutscenes
└── tools/                         # Offline Python asset generation & build scripts
```

---

## 4. Running Locally (Development)

Because the game loads `.glb` 3D models, `.png` textures, `.mp3` voiceovers, and `.mp4` cutscene videos via `fetch` / `THREE.GLTFLoader` using relative paths (`assets/...`, resolved against the document at `game/index.html`), you must serve the **repository root directory** (`dreams/`) over HTTP rather than opening `game/index.html` via `file://`.

### Option A: Node.js `npx serve` or `http-server` (Recommended — supports HTTP 206 Range seeking for video/audio)
From the repository root (`dreams/`):
```bash
npx http-server . -p 8000 --cors -c-1
```
Then open:
```text
http://localhost:8000/game/index.html
```

### Option B: Python Built-in HTTP Server
From the repository root (`dreams/`):
```bash
python -m http.server 8000
```
Then open:
```text
http://localhost:8000/game/index.html
```

### Direct Scene / Story Preview URL Parameters
For rapid testing or debugging, `game/index.html` supports URL query parameters:
- Jump directly into a story without the intro cutscene:
  - `http://localhost:8000/game/index.html?story=1`
  - `http://localhost:8000/game/index.html?story=2`
  - `http://localhost:8000/game/index.html?story=3`
  - `http://localhost:8000/game/index.html?story=4`
- Open the Epilogue directly:
  - `http://localhost:8000/game/index.html?epilogue=1`
- Position camera at custom coordinates `(x, y, z)` and orientation `(yaw, pitch)`:
  - `http://localhost:8000/game/index.html?story=1&openDoors=1&x=0&y=1.65&z=0.5&yaw=0&pitch=-0.05`

---

## 5. Production Deployment Guide

**The Archive of Dreams** is a **100% static client-side web application** at runtime—it requires **no backend database or server-side runtime** to play. Only the `game/` folder needs to be deployed: it carries its own `assets/` and is a complete, self-contained site root.

> **Important Directory Layout Requirement**:
> `game/` is the deployment root. `game/index.html` loads `js/...`, `css/...` and `assets/...` with paths relative to itself, so deploying the `game/` folder as the site root puts the game at `/` with every path resolving inside the deployment. Do **not** serve the game from a sub-folder *without* a trailing slash (`/game`): that URL has no trailing slash, so the browser resolves `js/engine/...` against `/` instead of `/game/` and every script and stylesheet 404s. If the game has to live in a sub-folder, redirect `/game` → `/game/`.

### 5.1 Deploy to GitHub Pages / Netlify / Vercel / Cloudflare Pages

1. **Deploy the `game/` folder as the site root** (recommended):
   - **Vercel**: Project Settings → **Root Directory** = `game`, **Build Command** empty (no build step required).
   - **Netlify / Cloudflare Pages**: **Publish directory** = `game`.
   - **GitHub Pages**: publish from the `game/` folder.
2. **Slim distribution — only the assets the code actually loads**:
   ```bash
   python tools/make_distribution.py --target dist
   ```
   This writes `dist/` containing `index.html`, `js/`, `css/` and only the assets the code references (~134 MB instead of ~183 MB), plus `_distribution_manifest.json` listing what was included, what was skipped and any broken reference. Deploy `dist/` instead of `game/`.
3. **Keeping the repository root as the site root**: create a lightweight `index.html` in `dreams/` that redirects into the game:
   ```html
   <!DOCTYPE html>
   <html>
     <head>
       <meta http-equiv="refresh" content="0; url=game/" />
       <script>window.location.replace("game/" + window.location.search);</script>
     </head>
     <body></body>
   </html>
   ```
   Redirect to `game/` — **with** the trailing slash, see the note above.

### 5.2 Deploy with Nginx (Production Web Server)

Serving with Nginx provides full `HTTP 206 Partial Content` byte-range streaming for the `.mp4` cutscenes and automatic Gzip/Brotli compression for the `.glb` 3D models:

```nginx
server {
    listen 80;
    server_name dreams.example.com;

    root /var/www/dreams/game;
    index index.html;

    # Ensure proper MIME types for 3D GLB models and media
    types {
        text/html                             html htm;
        text/css                              css;
        application/javascript                js;
        model/gltf-binary                     glb;
        image/png                             png;
        image/jpeg                            jpg jpeg;
        audio/mpeg                            mp3;
        video/mp4                             mp4;
    }

    # Enable Gzip compression for 3D GLB models, JS, and CSS
    gzip on;
    gzip_types text/plain text/css application/javascript model/gltf-binary application/octet-stream;
    gzip_min_length 1024;

    # Cache static 3D models, textures, audio, and video assets
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header Accept-Ranges bytes;
    }
}
```

### 5.3 Deploy with Docker

Create a `Dockerfile` in the project root (`dreams/Dockerfile`):

```dockerfile
FROM nginx:alpine

# The game folder is the complete site root (it carries its own assets/)
COPY game /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run the container:
```bash
docker build -t archive-of-dreams .
docker run -d -p 8080:80 --name archive-of-dreams archive-of-dreams
```
Then visit `http://localhost:8080` in any modern desktop browser (Chrome, Edge, Firefox, or Safari) with WebGL enabled.
