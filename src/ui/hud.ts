// ============================================================
// GOETIA — HUD HTML overlay
// ============================================================

import type { WorldState } from '../core/types';
import type { DemonOption } from './radial';

const HUD_ID = 'goetia-hud';
function el(id: string): HTMLElement { return document.getElementById(id)!; }

export function initHUD(): void {
  const existing = document.getElementById(HUD_ID);
  if (existing) existing.remove();

  const hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.innerHTML = `
    <div id="hud-top">
      <span id="hud-tick">Tick: 0</span>
      <span id="hud-wave">Vague: —</span>
      <span id="hud-score">Score: 0</span>
      <button id="hud-codex-btn">[C] Codex</button>
      <button id="hud-upgrades-btn">[U] Upgrades</button>
      <button id="hud-pause-btn" title="Pause [ESC / P]">❙❙</button>
      <span id="hud-restart">[R] Restart</span>
    </div>
    <div id="hud-pause-indicator">⏸ PAUSE</div>
    <div id="hud-active-demon">
      <span id="hud-demon-label">Bifrons</span>
      <span id="hud-demon-hint">[G] Invoquer &nbsp; [D] Changer</span>
    </div>
    <div id="hud-resources">
      <div class="res-block">
        <div class="res-icon" style="background:#886644"></div>
        <span id="hud-corpses">0</span><label>Cadavres</label>
      </div>
      <div class="res-block">
        <div class="res-icon" style="background:#88ccff"></div>
        <span id="hud-souls">0</span><label>Âmes</label>
      </div>
      <div class="res-block">
        <div class="res-icon" style="background:#9966cc"></div>
        <span id="hud-haulers">0</span><label>Porteurs</label>
      </div>
      <div class="res-block">
        <div class="res-icon" style="background:#44cc88"></div>
        <span id="hud-units">0</span><label>Unités</label>
      </div>
      <div class="res-block">
        <div class="res-icon" style="background:#cc4444"></div>
        <span id="hud-enemies">0</span><label>Ennemis</label>
      </div>
    </div>
    <div id="hud-pits"></div>
    <div id="hud-legend">
      <span style="color:#886644">●</span> Cadavre &nbsp;
      <span style="color:#88ccff">●</span> Âme &nbsp;
      <span style="color:#9966cc">▲</span> Porteur &nbsp;
      <span style="color:#44cc88">■</span> Leraje &nbsp;
      <span style="color:#cc4444">●</span> Ennemi &nbsp;
      <span style="color:#ffaa00">□</span> Fosse
    </div>
  `;
  document.body.appendChild(hud);

  const style = document.createElement('style');
  style.id = 'goetia-hud-style';
  style.textContent = `
    #goetia-hud {
      position: fixed; top:0; left:0; width:100%; height:100%;
      pointer-events: none;
      font-family: 'Courier New', monospace;
      color: #e0e0e0; z-index: 100;
    }
    #hud-top {
      position: absolute; top: 10px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 18px; align-items: center;
      background: rgba(0,0,0,0.6);
      padding: 6px 18px; border-radius: 6px;
      font-size: 13px; letter-spacing: 0.04em;
      white-space: nowrap; pointer-events: all;
    }
    #hud-restart { color: #ffaa44; }
    #hud-wave    { color: #88ccff; }
    #hud-score   { color: #ffdd44; font-weight: bold; }
    #hud-codex-btn, #hud-upgrades-btn {
      background: none; border: 1px solid #554;
      color: #aa9966; cursor: pointer;
      padding: 2px 10px; border-radius: 4px;
      font-family: monospace; font-size: 12px;
    }
    #hud-codex-btn:hover, #hud-upgrades-btn:hover { border-color: #cc4444; color: #ffdd44; }
    #hud-upgrades-btn { color: #88aacc; border-color: #334455; }
    /* Bouton pause */
    #hud-pause-btn {
      background: none; border: 1px solid #334;
      color: #668; cursor: pointer;
      padding: 2px 10px; border-radius: 4px;
      font-family: monospace; font-size: 13px;
      line-height: 1; transition: border-color 0.15s, color 0.15s;
    }
    #hud-pause-btn:hover { border-color: #ffaa44; color: #ffaa44; }
    #hud-pause-btn.active {
      border-color: #ffaa44; color: #ffaa44;
      background: rgba(255,170,68,0.08);
      box-shadow: 0 0 6px rgba(255,170,68,0.3);
    }
    /* Banderole PAUSE au centre */
    #hud-pause-indicator {
      display: none;
      position: absolute; top: 50px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75);
      border: 1px solid #ffaa44;
      border-radius: 6px;
      padding: 6px 28px;
      font-size: 16px; color: #ffaa44;
      letter-spacing: 0.3em; font-weight: bold;
      pointer-events: none;
      animation: pausePulse 1.8s ease-in-out infinite;
    }
    @keyframes pausePulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    #hud-active-demon {
      position: absolute; top: 52px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 14px; align-items: center;
      background: rgba(0,0,0,0.5);
      padding: 4px 16px; border-radius: 5px;
      font-size: 12px;
      border: 1px solid var(--active-color, #9966cc);
    }
    #hud-demon-label { color: var(--active-color, #9966cc); font-weight: bold; font-size: 14px; }
    #hud-demon-hint  { color: #555; font-size: 11px; }
    #hud-resources {
      position: absolute; bottom: 18px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 20px;
      background: rgba(0,0,0,0.6);
      padding: 10px 24px; border-radius: 8px;
    }
    .res-block { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:52px; }
    .res-icon  { width:14px; height:14px; border-radius:3px; }
    .res-block span  { font-size:22px; font-weight:bold; line-height:1; }
    .res-block label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.06em; }
    #hud-pits { position: absolute; top: 50px; right: 14px; display: flex; flex-direction: column; gap: 6px; }
    .pit-row { background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 5px; font-size: 12px; min-width: 160px; }
    .pit-bar-bg   { background:#333; height:4px; border-radius:2px; margin-top:4px; }
    .pit-bar-fill { background:#ffaa00; height:4px; border-radius:2px; }
    #hud-legend {
      position: absolute; bottom: 90px; left: 50%;
      transform: translateX(-50%);
      font-size: 12px; color: #555; white-space: nowrap;
    }
  `;
  const oldStyle = document.getElementById('goetia-hud-style');
  if (oldStyle) oldStyle.remove();
  document.head.appendChild(style);
}

export function initHUDButtons(
  onCodex: () => void,
  onUpgrades: () => void,
  onPause?: () => void,
): void {
  document.getElementById('hud-codex-btn')  ?.addEventListener('click', onCodex);
  document.getElementById('hud-upgrades-btn')?.addEventListener('click', onUpgrades);
  if (onPause) {
    document.getElementById('hud-pause-btn')?.addEventListener('click', onPause);
  }
}

/** Appelé depuis GameScene à chaque frame pour synchroniser l'aspect du bouton. */
export function updatePauseButton(paused: boolean): void {
  const btn = document.getElementById('hud-pause-btn');
  const ind = document.getElementById('hud-pause-indicator');
  if (!btn || !ind) return;
  if (paused) {
    btn.classList.add('active');
    btn.textContent = '▶';
    btn.title = 'Reprendre [ESC / P]';
    ind.style.display = 'block';
  } else {
    btn.classList.remove('active');
    btn.textContent = '❙❙';
    btn.title = 'Pause [ESC / P]';
    ind.style.display = 'none';
  }
}

export function updateActiveDemon(demon: DemonOption): void {
  const label = document.getElementById('hud-demon-label');
  const bar   = document.getElementById('hud-active-demon');
  if (label) label.textContent = demon.label;
  if (bar)   bar.style.setProperty('--active-color', demon.color);
}

export function updateHUD(world: WorldState, wave = 0, score = 0, gameOver = false): void {
  if (gameOver) return;
  el('hud-tick').textContent  = `Tick: ${world.tick}`;
  el('hud-wave').textContent  = `Vague: ${wave > 0 ? wave : '—'}`;
  el('hud-score').textContent = `Score: ${score}`;
  el('hud-corpses').textContent = String(world.corpses.size);
  el('hud-souls').textContent   = String(world.souls.size);
  el('hud-haulers').textContent = String(world.haulers.size);
  el('hud-units').textContent   = String(world.units.size);
  el('hud-enemies').textContent = String(world.enemies.size);

  const pitsEl = el('hud-pits');
  pitsEl.innerHTML = '';
  let i = 1;
  for (const pit of world.pits.values()) {
    const stateLabel: Record<string, string> = {
      empty: '⬜ Vide', loading: '🟡 Chargement',
      processing: '🟠 Rituel…', ready: '🟢 Prête',
    };
    const progress = pit.state === 'processing'
      ? Math.round((1 - pit.progressTick / 30) * 100) : 0;
    pitsEl.innerHTML += `
      <div class="pit-row">
        <strong>Fosse ${i++}</strong> — ${stateLabel[pit.state] ?? pit.state}
        ${pit.state === 'processing' ? `
          <div class="pit-bar-bg"><div class="pit-bar-fill" style="width:${progress}%"></div></div>
          <span style="font-size:10px;color:#ffaa00">${progress}% — Leraje</span>` : ''}
      </div>`;
  }
}
