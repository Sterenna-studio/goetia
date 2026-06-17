// ============================================================
// GOETIA — Upgrade Panel v3
// Arbre visuel par tier, corrige label/desc, indicateur de
// dépendances, score en temps réel.
// ============================================================

import type { UpgradeSystem, UpgradeDef } from '../core/upgrades';
import { CSS } from './theme';

const PANEL_ID = 'goetia-upgrades';
let _visible   = false;

export function isUpgradePanelVisible(): boolean { return _visible; }

export function toggleUpgradePanel(): void {
  _visible = !_visible;
  const p = document.getElementById(PANEL_ID);
  if (p) p.style.display = _visible ? 'block' : 'none';
  if (_visible) _refresh();
}

let _upgrades: UpgradeSystem;
let _getScore: () => number;
let _buy:      (id: string) => void;

export function initUpgradePanel(
  upgrades: UpgradeSystem,
  getScore: () => number,
  buy:      (id: string) => void,
): void {
  _upgrades = upgrades; _getScore = getScore; _buy = buy;
  document.getElementById(PANEL_ID)?.remove();
  document.getElementById('goetia-upgrades-style')?.remove();
  _visible = false;

  const style = document.createElement('style');
  style.id = 'goetia-upgrades-style';
  style.textContent = `
    #${PANEL_ID} {
      display: none;
      position: fixed; inset: 0; z-index: 250;
      background: rgba(0,2,0,0.96);
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      padding: 44px 0 60px;
    }
    #up-header {
      text-align: center; padding: 0 0 24px;
    }
    #up-header h2 {
      color: ${CSS.ACCENT2}; font-size: 18px;
      letter-spacing: 0.3em;
      text-shadow: 0 0 14px ${CSS.ACCENT2}55;
      margin: 0 0 6px;
    }
    #up-header .up-score {
      color: ${CSS.ACCENT}; font-size: 14px;
    }

    /* Colonnes par tier */
    #up-tiers {
      display: flex; gap: 0; justify-content: center;
      min-height: 560px;
    }
    .up-tier-col {
      display: flex; flex-direction: column;
      align-items: center; gap: 14px;
      min-width: 220px; padding: 0 18px;
      border-right: 1px solid #0d2211;
    }
    .up-tier-col:last-child { border-right: none; }
    .up-tier-label {
      font-size: 10px; letter-spacing: 0.18em;
      color: #1a3322; margin-bottom: 4px;
      padding-top: 4px;
    }

    /* Cartes */
    .up-card {
      width: 196px; padding: 10px 14px;
      background: rgba(0,0,0,0.82);
      border: 1px solid ${CSS.BORDER};
      border-left: 3px solid ${CSS.ACCENT2};
      display: flex; flex-direction: column; gap: 4px;
      transition: border-color 0.12s, box-shadow 0.12s;
      position: relative;
    }
    .up-card:hover:not(.locked):not(.bought) {
      border-color: ${CSS.ACCENT2};
      box-shadow: 0 0 12px ${CSS.ACCENT2}44;
    }
    .up-card.bought {
      border-left-color: #1a4422; opacity: 0.52;
    }
    .up-card.locked {
      border-left-color: #0d1a0d; opacity: 0.38;
    }
    .up-card.affordable {
      border-left-color: ${CSS.ACCENT};
      box-shadow: 0 0 6px ${CSS.ACCENT}22;
    }
    .up-icon  { font-size: 16px; line-height: 1; color: ${CSS.ACCENT2}; }
    .up-name  { color: ${CSS.TEXT_BRIGHT}; font-size: 12px; font-weight: bold; line-height: 1.3; }
    .up-desc  { color: ${CSS.TEXT_DIM}; font-size: 10px; line-height: 1.4; }
    .up-req   { color: #1a3322; font-size: 9px; font-style: italic; }
    .up-row   {
      display: flex; justify-content: space-between;
      align-items: center; margin-top: 4px;
    }
    .up-cost  { color: ${CSS.ACCENT}; font-size: 11px; }
    .up-cost.cant { color: #2a2a1a; }
    .up-btn {
      background: none; border: 1px solid ${CSS.ACCENT};
      color: ${CSS.ACCENT}; font-family: monospace; font-size: 10px;
      padding: 3px 12px; cursor: pointer;
      transition: background 0.12s, box-shadow 0.12s;
    }
    .up-btn:hover  { background: rgba(51,255,102,0.12); box-shadow: 0 0 6px ${CSS.ACCENT}44; }
    .up-btn:disabled {
      border-color: #0d1a0d; color: #1a2a1a; cursor: default;
    }
    .up-bought-badge {
      position: absolute; top: 6px; right: 8px;
      color: ${CSS.ACCENT}; font-size: 11px;
    }

    #up-close {
      display: block; margin: 28px auto 0;
      background: none; border: 1px solid ${CSS.BORDER};
      color: ${CSS.TEXT_DIM}; font-family: monospace; font-size: 12px;
      padding: 8px 36px; cursor: pointer;
      transition: border-color 0.12s, color 0.12s;
    }
    #up-close:hover { border-color: ${CSS.WARNING}; color: ${CSS.WARNING}; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div id="up-header">
      <h2>\u29d7 RITUELS D'AM\u00c9LIORATION \u29d7</h2>
      <div class="up-score"></div>
    </div>
    <div id="up-tiers"></div>
    <button id="up-close">[U] Fermer</button>
  `;
  document.body.appendChild(panel);
  document.getElementById('up-close')?.addEventListener('click', () => { _visible = true; toggleUpgradePanel(); });
}

function _refresh(): void {
  const score = _getScore();
  const el    = document.querySelector('#up-header .up-score');
  if (el) el.textContent = `${score}\u00a0pts disponibles`;

  const all    = _upgrades.getAll();
  const tiers  = [...new Set(all.map(u => u.tier))].sort();
  const tiersEl = document.getElementById('up-tiers');
  if (!tiersEl) return;
  tiersEl.innerHTML = '';

  for (const tier of tiers) {
    const col = document.createElement('div');
    col.className = 'up-tier-col';

    const tierLabel = document.createElement('div');
    tierLabel.className = 'up-tier-label';
    tierLabel.textContent = tier === 1 ? 'TIER I — Fondations'
      : tier === 2 ? 'TIER II — Rites'
      : `TIER ${tier} — Arcanes`;
    col.appendChild(tierLabel);

    for (const up of all.filter(u => u.tier === tier)) {
      col.appendChild(_buildCard(up, score));
    }
    tiersEl.appendChild(col);
  }
}

function _buildCard(up: UpgradeDef, score: number): HTMLDivElement {
  const bought     = _upgrades.isPurchased(up.id);
  const unlocked   = _upgrades.isUnlocked(up.id);
  const affordable = !bought && unlocked && score >= up.cost;

  const card = document.createElement('div');
  card.className = [
    'up-card',
    bought    ? 'bought' : '',
    !unlocked ? 'locked' : '',
    affordable ? 'affordable' : '',
  ].filter(Boolean).join(' ');

  const reqLabels = up.requires.map(r => {
    const dep = _upgrades.getAll().find(u => u.id === r);
    return dep ? dep.label : r;
  });

  card.innerHTML = `
    <div class="up-icon">${up.icon}</div>
    <div class="up-name">${up.label}</div>
    <div class="up-desc">${up.desc}</div>
    ${reqLabels.length ? `<div class="up-req">Requiert\u00a0: ${reqLabels.join(', ')}</div>` : ''}
    <div class="up-row">
      <span class="up-cost${bought || !unlocked ? ' cant' : ''}">
        ${bought ? '' : `${up.cost}\u00a0pts`}
      </span>
      ${!bought ? `<button class="up-btn" ${(unlocked && score >= up.cost) ? '' : 'disabled'}>Rituel</button>` : ''}
    </div>
    ${bought ? '<span class="up-bought-badge">\u2713</span>' : ''}
  `;

  if (!bought) {
    const btn = card.querySelector('.up-btn') as HTMLButtonElement | null;
    btn?.addEventListener('click', () => { _buy(up.id); _refresh(); });
  }
  return card;
}
