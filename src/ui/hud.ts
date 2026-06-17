// ============================================================
// GOETIA — HUD HTML overlay (thème néromancien)
// ============================================================

import type { WorldState } from '../core/types';
import type { DemonOption } from './radial';
import { CSS } from './theme';

const HUD_ID = 'goetia-hud';
function el(id: string): HTMLElement { return document.getElementById(id)!; }

export function initHUD(): void {
  document.getElementById(HUD_ID)?.remove();

  const hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.innerHTML = `
    <div id="hud-top">
      <span id="hud-tick">T:0</span>
      <span id="hud-wave">Vague —</span>
      <span id="hud-score">0 pts</span>
      <button id="hud-codex-btn">[C] Codex</button>
      <button id="hud-upgrades-btn">[U] Rituels</button>
      <button id="hud-pause-btn" title="Pause [ESC]">&#x23F8;</button>
    </div>
    <div id="hud-pause-indicator">⧖ PAUSE ⧖</div>
    <div id="hud-active-demon">
      <span id="hud-demon-sigil">▲</span>
      <span id="hud-demon-label">Bifrons</span>
      <span id="hud-demon-hint">clic pour invoquer</span>
    </div>
    <div id="hud-resources">
      <div class="res-block"><div class="res-dot" style="background:${CSS.CORPSE}"></div><span id="hud-corpses">0</span><label>Cadavres</label></div>
      <div class="res-block"><div class="res-dot" style="background:${CSS.SOUL}"></div><span id="hud-souls">0</span><label>Âmes</label></div>
      <div class="res-block"><div class="res-dot" style="background:${CSS.HAULER}"></div><span id="hud-haulers">0</span><label>Porteurs</label></div>
      <div class="res-block"><div class="res-dot" style="background:${CSS.UNIT}"></div><span id="hud-units">0</span><label>Unités</label></div>
      <div class="res-block"><div class="res-dot" style="background:${CSS.ENEMY}"></div><span id="hud-enemies">0</span><label>Ennemis</label></div>
    </div>
    <div id="hud-pits"></div>
    <div id="hud-legend">
      <span style="color:${CSS.CORPSE}">&#x25cf;</span> Cadavre &nbsp;
      <span style="color:${CSS.SOUL}">&#x25cf;</span> Âme &nbsp;
      <span style="color:${CSS.BIFRONS}">&#x25b2;</span> Porteur &nbsp;
      <span style="color:${CSS.UNIT}">&#x25a0;</span> Leraje &nbsp;
      <span style="color:${CSS.ENEMY}">&#x25cf;</span> Ennemi &nbsp;
      <span style="color:${CSS.PIT}">&#x25a1;</span> Fosse
    </div>
  `;
  document.body.appendChild(hud);

  const style = document.createElement('style');
  style.id = 'goetia-hud-style';
  style.textContent = `
    * { box-sizing: border-box; }
    body { background: #050a05; }

    #goetia-hud {
      position: fixed; inset: 0;
      pointer-events: none;
      font-family: 'Courier New', monospace;
      color: ${CSS.TEXT};
      z-index: 100;
    }

    /* ― TOP BAR ― */
    #hud-top {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; gap: 0; align-items: stretch;
      background: rgba(0,0,0,0.9);
      border-bottom: 1px solid ${CSS.BORDER};
      font-size: 12px; letter-spacing: 0.05em;
      pointer-events: all;
    }
    #hud-top > * {
      padding: 7px 16px;
      border-right: 1px solid ${CSS.BORDER};
      display: flex; align-items: center;
    }
    #hud-tick    { color: ${CSS.TEXT_DIM}; }
    #hud-wave    { color: ${CSS.WAVE}; letter-spacing: 0.08em; }
    #hud-score   {
      color: ${CSS.SCORE}; font-weight: bold; font-size: 14px;
      text-shadow: 0 0 8px ${CSS.SCORE}88;
    }
    #hud-codex-btn, #hud-upgrades-btn, #hud-pause-btn {
      background: none; border: none; border-right: 1px solid ${CSS.BORDER};
      color: ${CSS.TEXT_DIM}; cursor: pointer;
      font-family: monospace; font-size: 12px;
      transition: color 0.15s, background 0.15s;
      padding: 7px 14px;
    }
    #hud-codex-btn:hover    { color: ${CSS.ACCENT}; background: rgba(51,255,102,0.05); }
    #hud-upgrades-btn:hover { color: ${CSS.ACCENT2}; background: rgba(153,51,255,0.05); }
    #hud-pause-btn:hover    { color: ${CSS.WARNING}; background: rgba(255,102,0,0.05); }
    #hud-pause-btn.active   {
      color: ${CSS.WARNING};
      background: rgba(255,102,0,0.1);
      box-shadow: inset 0 0 8px rgba(255,102,0,0.2);
    }
    #hud-pause-indicator {
      display: none;
      position: absolute; top: 42px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.92);
      border: 1px solid ${CSS.WARNING};
      border-radius: 2px;
      padding: 5px 24px;
      font-size: 13px; color: ${CSS.WARNING};
      letter-spacing: 0.4em; font-weight: bold;
      animation: pausePulse 2s ease-in-out infinite;
    }
    @keyframes pausePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* ― DÉMON ACTIF ― */
    #hud-active-demon {
      position: absolute; top: 42px; right: 14px;
      display: flex; gap: 8px; align-items: center;
      background: rgba(0,0,0,0.85);
      border: 1px solid var(--active-color, ${CSS.BIFRONS});
      border-right: 3px solid var(--active-color, ${CSS.BIFRONS});
      padding: 5px 14px; font-size: 12px;
      box-shadow: 4px 0 12px var(--active-color, ${CSS.BIFRONS})33;
    }
    #hud-demon-sigil { font-size: 18px; color: var(--active-color, ${CSS.BIFRONS}); line-height:1; }
    #hud-demon-label { color: var(--active-color, ${CSS.BIFRONS}); font-weight: bold; }
    #hud-demon-hint  { color: ${CSS.TEXT_DIM}; font-size: 10px; }

    /* ― RESSOURCES ― */
    #hud-resources {
      position: absolute; bottom: 0; left: 0; right: 0;
      display: flex; justify-content: center; gap: 0;
      background: rgba(0,0,0,0.9);
      border-top: 1px solid ${CSS.BORDER};
    }
    .res-block {
      display: flex; flex-direction: column; align-items: center;
      gap: 2px; padding: 8px 22px;
      border-right: 1px solid ${CSS.BORDER};
    }
    .res-dot   { width:8px; height:8px; border-radius:50%; margin-bottom:2px; }
    .res-block span  { font-size: 20px; font-weight: bold; line-height: 1; color: ${CSS.TEXT_BRIGHT}; }
    .res-block label { font-size: 9px; color: ${CSS.TEXT_DIM}; text-transform: uppercase; letter-spacing: 0.1em; }

    /* ― FOSSES ― */
    #hud-pits {
      position: absolute; top: 42px; left: 14px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .pit-row {
      background: rgba(0,0,0,0.88);
      border: 1px solid ${CSS.BORDER};
      border-left: 3px solid ${CSS.PIT};
      padding: 5px 10px; font-size: 11px; min-width: 180px;
      color: ${CSS.TEXT};
    }
    .pit-row strong { color: ${CSS.ACCENT}; }
    .pit-bar-bg   { background: #0d1a0d; height: 3px; margin-top: 4px; }
    .pit-bar-fill { background: ${CSS.ACCENT}; height: 3px;
                    box-shadow: 0 0 6px ${CSS.ACCENT}88; }
    .pit-bar-lbl  { font-size: 9px; color: ${CSS.ACCENT}; margin-top:2px;
                    text-shadow: 0 0 4px ${CSS.ACCENT}66; }

    /* ― LÉGENDE ― */
    #hud-legend {
      position: absolute; bottom: 56px; left: 50%;
      transform: translateX(-50%);
      font-size: 11px; color: ${CSS.TEXT_DIM}; white-space: nowrap;
      background: rgba(0,0,0,0.6);
      padding: 3px 12px; border-radius: 2px;
    }
  `;
  document.getElementById('goetia-hud-style')?.remove();
  document.head.appendChild(style);
}

export function initHUDButtons(
  onCodex: () => void,
  onUpgrades: () => void,
  onPause?: () => void,
): void {
  document.getElementById('hud-codex-btn')?.addEventListener('click', onCodex);
  document.getElementById('hud-upgrades-btn')?.addEventListener('click', onUpgrades);
  if (onPause) document.getElementById('hud-pause-btn')?.addEventListener('click', onPause);
}

export function updatePauseButton(paused: boolean): void {
  const btn = document.getElementById('hud-pause-btn');
  const ind = document.getElementById('hud-pause-indicator');
  if (!btn || !ind) return;
  btn.classList.toggle('active', paused);
  btn.textContent  = paused ? '▶' : '⏸';
  btn.title        = paused ? 'Reprendre [ESC]' : 'Pause [ESC]';
  ind.style.display = paused ? 'block' : 'none';
}

export function updateActiveDemon(demon: DemonOption): void {
  const label  = document.getElementById('hud-demon-label');
  const sigil  = document.getElementById('hud-demon-sigil');
  const bar    = document.getElementById('hud-active-demon');
  const sigils: Record<string,string> = {
    bifrons: '▲', bathin: '▲▲', seir: '▲', murmur: '◆', gamigin: '◆',
  };
  if (label) label.textContent = demon.label;
  if (sigil) sigil.textContent = sigils[demon.id] ?? '▲';
  if (bar)   bar.style.setProperty('--active-color', demon.color);
}

export function updateHUD(world: WorldState, wave = 0, score = 0, gameOver = false): void {
  if (gameOver) return;
  el('hud-tick').textContent  = `T:${world.tick}`;
  el('hud-wave').textContent  = `Vague ${wave > 0 ? wave : '—'}`;
  el('hud-score').textContent = `${score} pts`;
  el('hud-corpses').textContent = String(world.corpses.size);
  el('hud-souls').textContent   = String(world.souls.size);
  el('hud-haulers').textContent = String(world.haulers.size);
  el('hud-units').textContent   = String(world.units.size);
  el('hud-enemies').textContent = String(world.enemies.size);

  const pitsEl = el('hud-pits');
  pitsEl.innerHTML = '';
  let i = 1;
  for (const pit of world.pits.values()) {
    const labels: Record<string,string> = {
      empty: '□ vide', loading: '◔ chargement', processing: '◉ rituel…', ready: '◈ prête',
    };
    const pct = pit.state === 'processing' ? Math.round((1 - pit.progressTick / 30) * 100) : 0;
    pitsEl.innerHTML += `
      <div class="pit-row">
        <strong>Fosse ${i++}</strong> — ${labels[pit.state] ?? pit.state}
        ${pit.state === 'processing' ? `
          <div class="pit-bar-bg"><div class="pit-bar-fill" style="width:${pct}%"></div></div>
          <div class="pit-bar-lbl">${pct}% — Leraje</div>` : ''}
      </div>`;
  }
}
