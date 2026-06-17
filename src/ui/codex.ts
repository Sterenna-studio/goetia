// ============================================================
// GOETIA — Codex overlay
// Accessible via [C] ou bouton HUD. Navigation par démon.
// ============================================================

import bifrons from '../data/units/bifrons.json';
import leraje from '../data/units/leraje.json';
import murmur from '../data/units/murmur.json';
import gamigin from '../data/units/gamigin.json';
import bathin from '../data/units/bathin.json';
import seir from '../data/units/seir.json';
import codexData from '../data/lore/codex.json';

const DEMONS = [bifrons, murmur, leraje, bathin, seir, gamigin] as const;

type DemonEntry = typeof DEMONS[number];

let currentIndex = 0;
let visible = false;

export function initCodex(): void {
  if (document.getElementById('goetia-codex')) return;

  const overlay = document.createElement('div');
  overlay.id = 'goetia-codex';
  overlay.style.display = 'none';
  overlay.innerHTML = `
    <div id="codex-inner">
      <div id="codex-header">
        <span id="codex-title">CODEX GOETIA</span>
        <button id="codex-close">✕</button>
      </div>
      <div id="codex-tabs"></div>
      <div id="codex-body">
        <div id="codex-sigil"></div>
        <div id="codex-info">
          <div id="codex-name"></div>
          <div id="codex-rank"></div>
          <div id="codex-lore"></div>
          <div id="codex-stats"></div>
        </div>
      </div>
      <div id="codex-footer">
        <em id="codex-world-lore"></em>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Styles
  const style = document.createElement('style');
  style.id = 'goetia-codex-style';
  style.textContent = `
    #goetia-codex {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      color: #e0e0e0;
    }
    #codex-inner {
      background: #0d0d1a;
      border: 1px solid #333;
      border-radius: 10px;
      width: 720px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #codex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #222;
    }
    #codex-title {
      font-size: 18px;
      color: #cc4444;
      letter-spacing: 0.15em;
      font-weight: bold;
    }
    #codex-close {
      background: none;
      border: 1px solid #444;
      color: #888;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
    }
    #codex-close:hover { color: #fff; border-color: #cc4444; }
    #codex-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #222;
      overflow-x: auto;
    }
    .codex-tab {
      padding: 10px 18px;
      font-size: 13px;
      cursor: pointer;
      color: #666;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      background: none;
      border-top: none;
      border-left: none;
      border-right: none;
      font-family: monospace;
      transition: color 0.15s;
    }
    .codex-tab:hover { color: #ccc; }
    .codex-tab.active { color: #e0e0e0; border-bottom-color: var(--demon-color, #cc4444); }
    #codex-body {
      display: flex;
      gap: 24px;
      padding: 24px;
      flex: 1;
    }
    #codex-sigil {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      flex-shrink: 0;
      border: 2px solid var(--demon-color, #444);
    }
    #codex-info { flex: 1; }
    #codex-name {
      font-size: 28px;
      font-weight: bold;
      color: var(--demon-color, #fff);
      margin-bottom: 4px;
    }
    #codex-rank {
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
      letter-spacing: 0.08em;
    }
    #codex-lore {
      font-size: 14px;
      color: #aaa;
      line-height: 1.7;
      margin-bottom: 20px;
      font-style: italic;
      border-left: 2px solid var(--demon-color, #444);
      padding-left: 12px;
    }
    #codex-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .stat-pill {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      color: #ccc;
    }
    .stat-pill span { color: var(--demon-color, #fff); font-weight: bold; }
    #codex-footer {
      padding: 14px 24px;
      border-top: 1px solid #1a1a1a;
      font-size: 12px;
      color: #444;
      text-align: center;
    }
  `;
  if (!document.getElementById('goetia-codex-style')) {
    document.head.appendChild(style);
  }

  // Tabs
  const tabs = document.getElementById('codex-tabs')!;
  DEMONS.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.className = 'codex-tab';
    btn.textContent = d.label;
    btn.style.setProperty('--demon-color', d.color);
    btn.addEventListener('click', () => showDemon(i));
    tabs.appendChild(btn);
  });

  document.getElementById('codex-close')!.addEventListener('click', hideCodex);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hideCodex(); });

  showDemon(0);
}

function showDemon(index: number): void {
  currentIndex = index;
  const d = DEMONS[index] as DemonEntry & { stats: Record<string, number | string> };

  document.getElementById('goetia-codex')!.style.setProperty('--demon-color', d.color);

  // Tabs actifs
  document.querySelectorAll('.codex-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
    (t as HTMLElement).style.setProperty('--demon-color', DEMONS[i].color);
  });

  // Sigil (initiale stylisée)
  const sigilEl = document.getElementById('codex-sigil')!;
  sigilEl.textContent = d.label[0];
  sigilEl.style.background = `${d.color}22`;

  document.getElementById('codex-name')!.textContent = d.label;
  document.getElementById('codex-rank')!.textContent =
    `${d.rank} — ${(d as any).legions} légions — Rôle : ${ (d as any).role }`;
  document.getElementById('codex-lore')!.textContent = d.lore;

  // Stats pills
  const statsEl = document.getElementById('codex-stats')!;
  statsEl.innerHTML = '';
  const stats = (d as any).stats as Record<string, number>;
  const statLabels: Record<string, string> = {
    speed: 'Vitesse', hp: 'PV', damage: 'Dégâts', range: 'Portée',
    carryCapacity: 'Capacité', extractionRadius: 'Rayon', aggro: 'Aggro',
    teleportRange: 'Téléport', extractionSpeedTicks: 'Rapidité', bonusOnTainted: 'Bonus corrompu',
  };
  for (const [key, val] of Object.entries(stats)) {
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = `${statLabels[key] ?? key} : <span>${val}</span>`;
    statsEl.appendChild(pill);
  }

  document.getElementById('codex-footer')!.textContent = codexData.world;
}

export function toggleCodex(): void {
  visible ? hideCodex() : showCodex();
}

export function showCodex(): void {
  visible = true;
  const el = document.getElementById('goetia-codex');
  if (el) el.style.display = 'flex';
}

export function hideCodex(): void {
  visible = false;
  const el = document.getElementById('goetia-codex');
  if (el) el.style.display = 'none';
}

export function isCodexVisible(): boolean { return visible; }
