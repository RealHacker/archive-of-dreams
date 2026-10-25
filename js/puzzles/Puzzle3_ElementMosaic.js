// Puzzle3_ElementMosaic.js - Mosaic of the Four Elements (Venice, 1577)
// Objective: Fit Water (4x1 I-bar), Air (L-canopy), Fire (2x2 block), and Earth (J-foundation) into the 4x4 stone recess.
// Sacred Laws:
// 1. Earth forms the foundation: its 3-stone base rests upon the lowest row (Row 3).
// 2. Air rises to the heavens: its canopy spans the highest row into the Top-Right corner.
// 3. Fire and Water must never touch along any orthogonal edge, lest they quench one another.

class Puzzle3_ElementMosaic {
  constructor(audioManager, onSolved) {
    this.audioManager = audioManager;
    this.onSolved = onSolved;

    this.container = document.getElementById('puzzle-element-mosaic');
    this.solved = false;

    // Grid: 4x4 array of tile id or null
    this.grid = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ];

    // Connected 4-square tetromino tiles that tile the 4x4 recess with zero Fire/Water contact:
    // Solution layout:
    // [ W ][ A ][ A ][ A ]
    // [ W ][ A ][ F ][ F ]
    // [ W ][ E ][ F ][ F ]
    // [ W ][ E ][ E ][ E ]
    this.tiles = {
      'water': {
        id: 'water',
        name: 'WATER (4×1 Cascade)',
        color: '#0284c7',
        border: '#0369a1',
        placed: false,
        coords: [[0,0], [1,0], [2,0], [3,0]]
      },
      'air': {
        id: 'air',
        name: 'AIR (Sky L-Canopy)',
        color: '#38bdf8',
        border: '#0284c7',
        placed: false,
        coords: [[0,0], [0,1], [0,2], [1,0]]
      },
      'fire': {
        id: 'fire',
        name: 'FIRE (2×2 Hearth)',
        color: '#ef4444',
        border: '#b91c1c',
        placed: false,
        coords: [[0,0], [0,1], [1,0], [1,1]]
      },
      'earth': {
        id: 'earth',
        name: 'EARTH (Foundation J-Stone)',
        color: '#84cc16',
        border: '#4d7c0f',
        placed: false,
        coords: [[0,0], [1,0], [1,1], [1,2]]
      }
    };

    this.selectedTileId = 'water';
    this.setupUI();
  }

  setupUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mosaic-modal-content">
        <div class="puzzle-header">
          <div class="puzzle-title-tag">SAN LAZZARO CRYPT • SECRET NICHE LOCK</div>
          <h2>MOSAIC OF THE FOUR ELEMENTS</h2>
          <p class="puzzle-desc">
            Place the four carved sacred element stones into the 4×4 wall recess to release the vault.
            <br>
            <span class="cipher-hint">
              "Earth forms the foundation (Bottom Row) • Air spans the Top-Right heavens • Fire and Water must never touch along any edge"
            </span>
          </p>
        </div>

        <div class="mosaic-stage">
          <!-- 4x4 Grid Board -->
          <div class="mosaic-board-container">
            <div class="board-frame">
              <div class="mosaic-grid" id="mosaic-grid-board">
                <!-- 16 cells generated in JS -->
              </div>
            </div>
            <div class="board-legend">4 × 4 STONE RELIEF RECESS</div>
          </div>

          <!-- Tile Selection & Transformation Tray -->
          <div class="mosaic-tray-panel">
            <div class="tray-title">SACRED ELEMENT RELIEFS</div>
            
            <div class="tile-selector-list" id="tile-selector-list">
              <!-- Rendered via JS -->
            </div>

            <div class="tile-manipulation-tools">
              <button class="mosaic-tool-btn" id="btn-rotate-tile">⟳ Rotate 90°</button>
              <button class="mosaic-tool-btn" id="btn-reset-board">Reset Recess</button>
              <button class="mosaic-tool-btn-secondary" id="btn-auto-solve-mosaic">Align Elements</button>
            </div>

            <div class="mosaic-preview-box">
              <div class="preview-label">ACTIVE TILE: <strong id="active-tile-name">AIR</strong></div>
              <div class="active-tile-shape-display" id="active-tile-shape"></div>
            </div>
          </div>
        </div>

        <!-- Footer / Status -->
        <div class="mosaic-footer">
          <div class="mosaic-status-bar" id="mosaic-status">
            Select a tile and click an empty cell on the 4x4 grid to place it.
          </div>
          <div class="mosaic-actions">
            <button class="scale-lock-btn" id="btn-commit-mosaic" disabled>OPEN SECRET NICHE</button>
            <button class="puzzle-close-btn" id="btn-mosaic-close">Step Back</button>
          </div>
        </div>
      </div>
    `;

    // Bind Tools
    document.getElementById('btn-rotate-tile').addEventListener('click', () => this.rotateSelected());
    document.getElementById('btn-reset-board').addEventListener('click', () => this.resetBoard());
    document.getElementById('btn-auto-solve-mosaic').addEventListener('click', () => this.applyCanonicalSolution());
    document.getElementById('btn-commit-mosaic').addEventListener('click', () => this.commitSolution());
    document.getElementById('btn-mosaic-close').addEventListener('click', () => this.close());

    this.renderBoard();
    this.renderTray();
    this.renderActivePreview();
  }

  rotateSelected() {
    if (this.solved) return;
    const t = this.tiles[this.selectedTileId];
    if (!t) return;
    // Rotate 90 deg clockwise: (r, c) -> (c, -r), then normalize min r and min c to 0
    const newCoords = t.coords.map(([r, c]) => [c, -r]);
    const minR = Math.min(...newCoords.map(p => p[0]));
    const minC = Math.min(...newCoords.map(p => p[1]));
    t.coords = newCoords.map(([r, c]) => [r - minR, c - minC]);

    if (this.audioManager) this.audioManager.playKeyClick();
    this.renderActivePreview();
    this.renderTray();
  }

  resetBoard() {
    if (this.solved) return;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        this.grid[r][c] = null;
      }
    }
    for (const id in this.tiles) {
      this.tiles[id].placed = false;
    }
    if (this.audioManager) this.audioManager.playRelayClick();
    this.renderBoard();
    this.renderTray();
    this.validate();
  }

  selectTile(id) {
    this.selectedTileId = id;
    if (this.audioManager) this.audioManager.playKeyClick();
    this.renderTray();
    this.renderActivePreview();
  }

  removeTileFromBoard(id) {
    if (this.solved) return;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === id) {
          this.grid[r][c] = null;
        }
      }
    }
    this.tiles[id].placed = false;
    if (this.audioManager) this.audioManager.playKeyClick();
    this.renderBoard();
    this.renderTray();
    this.validate();
  }

  canPlaceTile(tile, startR, startC) {
    for (const [dr, dc] of tile.coords) {
      const r = startR + dr;
      const c = startC + dc;
      if (r < 0 || r >= 4 || c < 0 || c >= 4) return false;
      if (this.grid[r][c] !== null && this.grid[r][c] !== tile.id) return false;
    }
    return true;
  }

  placeTile(id, clickR, clickC) {
    if (this.solved) return;
    const tile = this.tiles[id];
    if (!tile) return;

    // Find valid anchor (startR, startC):
    // 1. Try direct top-left placement at (clickR, clickC)
    let anchorR = null;
    let anchorC = null;
    if (this.canPlaceTile(tile, clickR, clickC)) {
      anchorR = clickR;
      anchorC = clickC;
    } else {
      // 2. Try snapping so one of the tile's squares lands on (clickR, clickC)
      for (const [dr, dc] of tile.coords) {
        const candidateR = clickR - dr;
        const candidateC = clickC - dc;
        if (this.canPlaceTile(tile, candidateR, candidateC)) {
          anchorR = candidateR;
          anchorC = candidateC;
          break;
        }
      }
    }

    if (anchorR === null || anchorC === null) {
      if (this.audioManager && this.audioManager.playKeyClick) this.audioManager.playKeyClick();
      const statusEl = document.getElementById('mosaic-status');
      if (statusEl) statusEl.innerHTML = `<span class="status-warn">Cannot fit ${tile.name} there. Rotate or click an open region.</span>`;
      return;
    }

    // Remove existing placement if already placed
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === id) {
          this.grid[r][c] = null;
        }
      }
    }

    // Place tile at resolved anchor
    for (const [dr, dc] of tile.coords) {
      this.grid[anchorR + dr][anchorC + dc] = id;
    }
    tile.placed = true;

    // Auto-select next unplaced tile for smooth UX
    for (const nextId of Object.keys(this.tiles)) {
      if (!this.tiles[nextId].placed) {
        this.selectedTileId = nextId;
        break;
      }
    }

    if (this.audioManager && this.audioManager.playRelayClick) this.audioManager.playRelayClick();
    this.renderBoard();
    this.renderTray();
    this.renderActivePreview();
    this.validate();
  }

  renderBoard() {
    const boardEl = document.getElementById('mosaic-grid-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'mosaic-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        const tileId = this.grid[r][c];
        if (tileId) {
          cell.classList.add(`cell-${tileId}`);
          cell.innerHTML = `<span>${tileId.toUpperCase()[0]}</span>`;
          cell.title = `${this.tiles[tileId].name} (Click to remove)`;
          cell.addEventListener('click', () => {
            this.removeTileFromBoard(tileId);
          });
        } else {
          cell.classList.add('empty');
          cell.addEventListener('click', () => {
            if (this.selectedTileId) {
              this.placeTile(this.selectedTileId, r, c);
            }
          });
        }

        boardEl.appendChild(cell);
      }
    }
  }

  renderTray() {
    const listEl = document.getElementById('tile-selector-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    for (const id in this.tiles) {
      const t = this.tiles[id];
      const item = document.createElement('div');
      item.className = `tile-item ${id} ${this.selectedTileId === id ? 'active' : ''} ${t.placed ? 'placed' : ''}`;
      item.innerHTML = `
        <div class="tile-color-tag" style="background: ${t.color}"></div>
        <div class="tile-info">
          <div class="t-name">${t.name}</div>
          <div class="t-status">${t.placed ? '✓ Placed in Wall' : 'In Reserve'}</div>
        </div>
        ${t.placed ? `<button class="t-remove-btn" title="Remove from grid">✕</button>` : ''}
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('t-remove-btn')) {
          this.removeTileFromBoard(id);
        } else {
          this.selectTile(id);
        }
      });

      listEl.appendChild(item);
    }
  }

  renderActivePreview() {
    const nameEl = document.getElementById('active-tile-name');
    const shapeEl = document.getElementById('active-tile-shape');
    const t = this.tiles[this.selectedTileId];
    if (!t || !shapeEl) return;

    if (nameEl) nameEl.innerText = t.name;
    shapeEl.innerHTML = '';

    const maxR = Math.max(...t.coords.map(p => p[0]));
    const maxC = Math.max(...t.coords.map(p => p[1]));

    const gridDiv = document.createElement('div');
    gridDiv.className = 'preview-shape-grid';
    gridDiv.style.gridTemplateRows = `repeat(${maxR + 1}, 24px)`;
    gridDiv.style.gridTemplateColumns = `repeat(${maxC + 1}, 24px)`;

    const coordSet = new Set(t.coords.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r <= maxR; r++) {
      for (let c = 0; c <= maxC; c++) {
        const sq = document.createElement('div');
        if (coordSet.has(`${r},${c}`)) {
          sq.className = `preview-sq fill-${t.id}`;
          sq.style.backgroundColor = t.color;
        } else {
          sq.className = 'preview-sq empty';
        }
        gridDiv.appendChild(sq);
      }
    }

    shapeEl.appendChild(gridDiv);
  }

  validate() {
    const statusEl = document.getElementById('mosaic-status');
    const commitBtn = document.getElementById('btn-commit-mosaic');

    // 1. Check all 16 cells filled
    let allFilled = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === null) {
          allFilled = false;
          break;
        }
      }
    }

    if (!allFilled) {
      if (statusEl) statusEl.innerText = 'Recess is partially empty. Position all four elements.';
      if (commitBtn) commitBtn.disabled = true;
      return false;
    }

    // 2. Air must occupy the Top-Right heavens (including Top-Right corner (0,3) and top row)
    if (this.grid[0][3] !== 'air' || this.grid[0][2] !== 'air') {
      if (statusEl) statusEl.innerHTML = `<span class="status-warn">Violation: Air must span the highest row into the Top-Right corner!</span>`;
      if (commitBtn) commitBtn.disabled = true;
      return false;
    }

    // 3. Earth must form the foundation along the lowest row (Row 3)
    let earthBottomCount = 0;
    for (let c = 0; c < 4; c++) {
      if (this.grid[3][c] === 'earth') earthBottomCount++;
    }
    if (earthBottomCount < 2) {
      if (statusEl) statusEl.innerHTML = `<span class="status-warn">Violation: Earth must rest its foundation base along the lowest row!</span>`;
      if (commitBtn) commitBtn.disabled = true;
      return false;
    }

    // 4. Fire and Water must not touch along any orthogonal edge
    let fireWaterCollision = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        if (val === 'fire') {
          const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
              if (this.grid[nr][nc] === 'water') {
                fireWaterCollision = true;
                break;
              }
            }
          }
        }
      }
    }

    if (fireWaterCollision) {
      if (statusEl) statusEl.innerHTML = `<span class="status-warn">Violation: Fire and Water touch along an edge, quenching one another!</span>`;
      if (commitBtn) commitBtn.disabled = true;
      return false;
    }

    // Passed all ancient laws!
    if (statusEl) statusEl.innerHTML = `<span class="status-ready">★ SACRED HARMONY ACHIEVED! Earth and Air separate Fire and Water completely.</span>`;
    if (commitBtn) {
      commitBtn.disabled = false;
      commitBtn.classList.add('pin-ready');
    }
    return true;
  }

  applyCanonicalSolution() {
    if (this.solved) return;
    // Mathematically valid connected tetromino solution:
    // W A A A
    // W A F F
    // W E F F
    // W E E E
    this.grid = [
      ['water', 'air',   'air',   'air'],
      ['water', 'air',   'fire',  'fire'],
      ['water', 'earth', 'fire',  'fire'],
      ['water', 'earth', 'earth', 'earth']
    ];

    for (const id in this.tiles) {
      this.tiles[id].placed = true;
    }

    if (this.audioManager) {
      this.audioManager.playRelayClick();
    }

    this.renderBoard();
    this.renderTray();
    this.validate();
  }

  commitSolution() {
    if (!this.validate()) return;
    this.solved = true;

    if (this.audioManager) {
      this.audioManager.playRelayClick();
      this.audioManager.playChord([220.00, 277.18, 329.63, 440.00]); // A-major chord
    }

    const statusEl = document.getElementById('mosaic-status');
    if (statusEl) statusEl.innerHTML = `<span class="status-success">✓ THE STONES RECESS WITH A HEAVY GRIND. SECRET NICHE REVEALED!</span>`;

    const commitBtn = document.getElementById('btn-commit-mosaic');
    if (commitBtn) commitBtn.disabled = true;

    setTimeout(() => {
      if (this.onSolved) this.onSolved();
    }, 1200);
  }

  open() {
    if (document.exitPointerLock) document.exitPointerLock();
    if (this.container) {
      this.container.style.display = 'flex';
      this.renderBoard();
      this.renderTray();
      this.renderActivePreview();
      this.validate();
    }
  }

  close() {
    if (this.container) {
      this.container.style.display = 'none';
    }
    if (window.playerController) {
      window.playerController.lock();
    }
  }
}
