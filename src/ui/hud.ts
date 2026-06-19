// ============================================================
// GOETIA — HUD v3
// Ajoute : bandeau d'annonce de vague (vert / rouge boss)
// ============================================================

import type { WorldState } from '../core/types';
import { CSS } from './theme';
import { currentAnnouncement } from '../core/systems/WaveSystem';

const HUD_ID       = 'goetia-hud';
const STYLE_ID     = 'goetia-hud-style';
const ANNOUNCE_ID  = 'goetia-wave-announce';

// ── Init ─────────────────────────────────────────────────
export function initHUD(): void {
  document.getElementById(HUD_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${HUD_ID} {
      position: fixed; top: 0; left: 0; right: 0;
      height: 36px;
      background: rgba(0,5,0,0.92);
      border-bottom: 1px solid #0d2211;
      display: flex; align-items: center; gap: 20px; padding: 0 16px;
      font-family: 'Courier New', monospace; font-size: 12px;
      color: #2a5535; pointer-events: none; z-index: 100;
    }
    .hud-sep { color: #0d2211; }
    .hud-val { color: ${CSS.ACCENT}; }
    .hud-warn { color: #cc3300; }
    #hud-pits { display:flex; gap:6px; align-items:center; }
    .hud-pit  { width:10px; height:10px; border:1px solid #1a4422; background:#050a05; }
    .hud-pit.active { background:${CSS.ACCENT}; box-shadow:0 0 4px ${CSS.ACCENT}44; }

    /* Bandeau annonce vague */
    #${ANNOUNCE_ID} {
      position: fixed;
      top: 44px; left: 50%;
      transform: translateX(-50%);
      font-family: 'Courier New', monospace;
      font-size: 20px; font-weight: bold; letter-spacing: 0.2em;
      padding: 6px 40px;
      border: 1px solid;
      pointer-events: none;
      z-index: 200;
      transition: opacity 0.3s;
      white-space: nowrap;
    }
    #${ANNOUNCE_ID}.boss {
      color: #ff3300; border-color: #ff3300;
      background: rgba(20,0,0,0.92);
      text-shadow: 0 0 20px #ff330088;
    }
    #${ANNOUNCE_ID}.normal {
      color: ${CSS.ACCENT}; border-color: ${CSS.ACCENT};
      background: rgba(0,5,0,0.92);
      text-shadow: 0 0 14px ${CSS.ACCENT}66;
    }

    /* Phase repos — petit indicateur barre */
    #hud-rest-bar {
      position: fixed; top: 36px; left: 0; right: 0;
      height: 2px; background: #0d2211; pointer-events:none; z-index:101;
    }
    #hud-rest-fill {
      height: 2px; background: ${CSS.ACCENT};
      transition: width 0.1s linear;
    }
  `;
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.innerHTML = `
    <span id="hud-wave">Vague <span class="hud-val" id="hud-wave-n">0</span></span>
    <span class="hud-sep">│</span>
    <span>Score <span class="hud-val" id="hud-score">0</span></span>
    <span class="hud-sep">│</span>
    <span>Âmes <span class="hud-val" id="hud-souls">0</span></span>
    <span class="hud-sep">│</span>
    <span>Corps <span class="hud-val" id="hud-corpses">0</span></span>
    <span class="hud-sep">│</span>
    <span>Ennemis <span class="hud-val" id="hud-enemies">0</span></span>
    <span class="hud-sep">│</span>
    <span id="hud-pits"></span>
    <span style="flex:1"></span>
    <span id="hud-phase" style="color:#1a3322; font-size:10px; letter-spacing:0.1em;"></span>
  `;
  document.body.appendChild(hud);

  // Barre de repos
  const restBar = document.createElement('div'); restBar.id = 'hud-rest-bar';
  const restFill = document.createElement('div'); restFill.id = 'hud-rest-fill';
  restFill.style.width = '0%';
  restBar.appendChild(restFill);
  document.body.appendChild(restBar);

  // Bandeau annonce (créé vide, affiché au besoin)
  const ann = document.createElement('div');
  ann.id = ANNOUNCE_ID;
  ann.style.opacity = '0';
  document.body.appendChild(ann);
}

// ── Boutons HUD ───────────────────────────────────────────
export function initHUDButtons(
  onCodex: () => void,
  onUpgrade: () => void,
  onPause: () => void,
): void {
  let bar = document.getElementById('hud-buttons');
  if (bar) bar.remove();

  const style2 = document.createElement('style');
  style2.id = 'goetia-hud-btns-style';
  style2.textContent = `
    #hud-buttons {
      position:fixed; bottom:0; left:0; right:0; height:38px;
      background:rgba(0,5,0,0.92); border-top:1px solid #0d2211;
      display:flex; align-items:center; gap:4px; padding:0 12px;
      z-index:100;
    }
    .hud-btn {
      font-family:'Courier New',monospace; font-size:11px;
      color:#1a5533; background:rgba(0,0,0,0.7);
      border:1px solid #0d2211; padding:4px 14px;
      cursor:pointer; letter-spacing:0.08em;
      transition:color 0.15s, border-color 0.15s;
    }
    .hud-btn:hover { color:${CSS.ACCENT}; border-color:${CSS.ACCENT}44; }
    #hud-btn-pause { margin-left:auto; }
    #hud-selected-demon {
      margin-left:12px; font-family:'Courier New',monospace;
      font-size:11px; color:#2a4433; letter-spacing:0.1em;
    }
  `;
  document.head.appendChild(style2);

  bar = document.createElement('div'); bar.id = 'hud-buttons';
  bar.innerHTML = `
    <button class="hud-btn" id="hud-btn-codex">[C] Codex</button>
    <button class="hud-btn" id="hud-btn-upgrades">[U] Rituels</button>
    <span id="hud-selected-demon"></span>
    <button class="hud-btn" id="hud-btn-pause">[P] Pause</button>
  `;
  document.body.appendChild(bar);

  document.getElementById('hud-btn-codex')!.addEventListener('click',    onCodex);
  document.getElementById('hud-btn-upgrades')!.addEventListener('click', onUpgrade);
  document.getElementById('hud-btn-pause')!.addEventListener('click',    onPause);
}

// ── Update ───────────────────────────────────────────────
export function updateHUD(
  world: WorldState,
  wave: number,
  score: number,
  gameOver: boolean,
): void {
  const q = (id: string) => document.getElementById(id);
  q('hud-wave-n') && (q('hud-wave-n')!.textContent = String(wave));
  q('hud-score')  && (q('hud-score')!.textContent  = String(score));
  q('hud-souls')  && (q('hud-souls')!.textContent  = String(world.souls.size));
  q('hud-corpses')&& (q('hud-corpses')!.textContent = String(world.corpses.size));
  q('hud-enemies')&& (q('hud-enemies')!.textContent =
    String([...world.enemies.values()].filter(e => e.state !== 'dead').length));

  // Fosses
  const pitsEl = q('hud-pits');
  if (pitsEl) {
    const pits = [...world.pits.values()];
    pitsEl.innerHTML = pits.map(p =>
      `<div class="hud-pit${p.state !== 'empty' ? ' active' : ''}"></div>`
    ).join('');
  }

  // Bandeau annonce
  const ann = q(ANNOUNCE_ID) as HTMLDivElement | null;
  if (ann) {
    if (currentAnnouncement && currentAnnouncement.ticksLeft > 0) {
      ann.textContent  = currentAnnouncement.label;
      ann.className    = currentAnnouncement.isBoss ? 'boss' : 'normal';
      ann.style.opacity = '1';
    } else {
      ann.style.opacity = '0';
    }
  }

  if (gameOver && q('hud-phase')) {
    q('hud-phase')!.textContent = '■ GAME OVER';
    q('hud-phase')!.style.color = '#cc0000';
  }
}

// ── Helpers ───────────────────────────────────────────────
export function updateActiveDemon(demon: { id: string; label: string; color: string }): void {
  const el = document.getElementById('hud-selected-demon');
  if (el) {
    el.textContent   = `▶ ${demon.label}`;
    el.style.color   = demon.color;
  }
}

export function updatePauseButton(paused: boolean): void {
  const btn = document.getElementById('hud-btn-pause');
  if (btn) btn.textContent = paused ? '[P] Reprendre' : '[P] Pause';
}
