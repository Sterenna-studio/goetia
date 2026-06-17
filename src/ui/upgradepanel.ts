// ============================================================
// GOETIA — Upgrade panel (thème néromancien)
// ============================================================

import type { UpgradeSystem } from '../core/upgrades';
import { CSS } from './theme';

const PANEL_ID = 'goetia-upgrades';
let _visible = false;

export function isUpgradePanelVisible(): boolean { return _visible; }

export function toggleUpgradePanel(): void {
  _visible = !_visible;
  const p = document.getElementById(PANEL_ID);
  if (p) p.style.display = _visible ? 'flex' : 'none';
  if (_visible) _refresh();
}

let _upgrades: UpgradeSystem;
let _getScore: () => number;
let _buy: (id: string) => void;

export function initUpgradePanel(
  upgrades: UpgradeSystem,
  getScore: () => number,
  buy: (id: string) => void,
): void {
  _upgrades = upgrades; _getScore = getScore; _buy = buy;
  document.getElementById(PANEL_ID)?.remove();
  document.getElementById('goetia-upgrades-style')?.remove();
  _visible = false;

  const style = document.createElement('style');
  style.id = 'goetia-upgrades-style';
  style.textContent = `
    #goetia-upgrades {
      display: none;
      position: fixed; inset: 0; z-index: 250;
      background: rgba(0,0,0,0.92);
      flex-direction: column; align-items: center; justify-content: flex-start;
      padding-top: 60px; gap: 10px;
      font-family: 'Courier New', monospace;
      overflow-y: auto;
    }
    #goetia-upgrades h2 {
      color: ${CSS.ACCENT2};
      font-size: 20px; letter-spacing: 0.3em;
      text-shadow: 0 0 14px ${CSS.ACCENT2}55;
      margin-bottom: 4px;
    }
    #goetia-upgrades .up-score {
      color: ${CSS.ACCENT}; font-size: 13px; margin-bottom: 16px;
    }
    .up-card {
      width: 340px; padding: 12px 18px;
      background: rgba(0,0,0,0.8);
      border: 1px solid ${CSS.BORDER};
      border-left: 3px solid ${CSS.ACCENT2};
      display: flex; flex-direction: column; gap: 4px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .up-card:hover { border-color: ${CSS.ACCENT2}; box-shadow: 0 0 10px ${CSS.ACCENT2}33; }
    .up-card.bought { border-left-color: ${CSS.TEXT_DIM}; opacity: 0.5; }
    .up-name  { color: ${CSS.TEXT_BRIGHT}; font-size: 14px; font-weight: bold; }
    .up-desc  { color: ${CSS.TEXT_DIM}; font-size: 11px; }
    .up-row   { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    .up-cost  { color: ${CSS.ACCENT}; font-size: 12px; }
    .up-btn {
      background: none; border: 1px solid ${CSS.ACCENT};
      color: ${CSS.ACCENT}; font-family: monospace; font-size: 11px;
      padding: 4px 14px; cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    .up-btn:hover  { background: rgba(51,255,102,0.12); box-shadow: 0 0 8px ${CSS.ACCENT}44; }
    .up-btn:disabled { border-color: ${CSS.BORDER}; color: ${CSS.TEXT_DIM}; cursor: default; }
    .up-btn:disabled:hover { background: none; box-shadow: none; }
    #up-close {
      background: none; border: 1px solid ${CSS.BORDER};
      color: ${CSS.TEXT_DIM}; font-family: monospace; font-size: 12px;
      padding: 8px 28px; cursor: pointer; margin-top: 10px;
      transition: border-color 0.15s, color 0.15s;
    }
    #up-close:hover { border-color: ${CSS.WARNING}; color: ${CSS.WARNING}; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `<h2>⧗ RITUELS D'AMÉLIORATION ⧗</h2><div class="up-score"></div><div id="up-list"></div><button id="up-close">[U] Fermer</button>`;
  document.body.appendChild(panel);
  document.getElementById('up-close')?.addEventListener('click', () => { _visible = true; toggleUpgradePanel(); });
}

function _refresh(): void {
  const score  = _getScore();
  const bought = _upgrades.getPurchased();
  const all    = _upgrades.getAll();

  const scoreEl = document.querySelector('#goetia-upgrades .up-score');
  if (scoreEl) scoreEl.textContent = `${score} pts disponibles`;

  const list = document.getElementById('up-list');
  if (!list) return;
  list.innerHTML = '';

  for (const up of all) {
    const isBought = bought.includes(up.id);
    const canBuy   = !isBought && score >= up.cost;
    const card     = document.createElement('div');
    card.className = `up-card${isBought ? ' bought' : ''}`;
    card.innerHTML = `
      <div class="up-name">${up.name}</div>
      <div class="up-desc">${up.description}</div>
      <div class="up-row">
        <span class="up-cost">${isBought ? '✓ acquis' : `${up.cost} pts`}</span>
        ${!isBought ? `<button class="up-btn" ${canBuy ? '' : 'disabled'}>Rituel</button>` : ''}
      </div>`;
    if (!isBought) {
      card.querySelector('.up-btn')?.addEventListener('click', () => { _buy(up.id); _refresh(); });
    }
    list.appendChild(card);
  }
}
