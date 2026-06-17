// ============================================================
// GOETIA — HUD HTML overlay
// ============================================================

import type { WorldState } from '../core/types';

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
      <span id="hud-restart">[R] Restart &nbsp; [Clic] Bifrons</span>
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
      <span style="color:#9966cc">▲</span> Bifrons &nbsp;
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
      display: flex; gap: 24px;
      background: rgba(0,0,0,0.6);
      padding: 6px 18px; border-radius: 6px;
      font-size: 13px; letter-spacing: 0.04em;
      white-space: nowrap;
    }
    #hud-restart { color: #ffaa44; }
    #hud-wave { color: #88ccff; }
    #hud-score { color: #ffdd44; }
    #hud-resources {
      position: absolute; bottom: 18px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 20px;
      background: rgba(0,0,0,0.6);
      padding: 10px 24px; border-radius: 8px;
    }
    .res-block { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:52px; }
    .res-icon { width:14px; height:14px; border-radius:3px; }
    .res-block span { font-size:22px; font-weight:bold; line-height:1; }
    .res-block label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.06em; }
    #hud-pits {
      position: absolute; top: 50px; right: 14px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .pit-row {
      background: rgba(0,0,0,0.6); padding: 5px 10px;
      border-radius: 5px; font-size: 12px; min-width: 160px;
    }
    .pit-bar-bg { background:#333; height:4px; border-radius:2px; margin-top:4px; }
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

export function updateHUD(world: WorldState, wave = 0, score = 0, gameOver = false): void {
  if (gameOver) return;
  el('hud-tick').textContent = `Tick: ${world.tick}`;
  el('hud-wave').textContent = `Vague: ${wave > 0 ? wave : '—'}`;
  el('hud-score').textContent = `Score: ${score}`;
  el('hud-corpses').textContent = String(world.corpses.size);
  el('hud-souls').textContent = String(world.souls.size);
  el('hud-haulers').textContent = String(world.haulers.size);
  el('hud-units').textContent = String(world.units.size);
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
          <span style="font-size:10px;color:#ffaa00">${progress}% — Leraje</span>
        ` : ''}
      </div>`;
  }
}
