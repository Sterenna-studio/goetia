// ============================================================
// GOETIA — Panel upgrades
// ============================================================

import { ALL_UPGRADES, UpgradeSystem } from '../core/upgrades';

let onBuy: ((id: string) => void) | null = null;
let getScore: (() => number) | null = null;
let upgradeSystem: UpgradeSystem | null = null;
let visible = false;

export function initUpgradePanel(
  system: UpgradeSystem,
  scoreFn: () => number,
  buyCallback: (id: string) => void
): void {
  upgradeSystem = system;
  getScore = scoreFn;
  onBuy = buyCallback;
  if (document.getElementById('goetia-upgrades')) return;

  const panel = document.createElement('div');
  panel.id = 'goetia-upgrades';
  panel.style.display = 'none';
  document.body.appendChild(panel);

  const style = document.createElement('style');
  style.id = 'goetia-upgrades-style';
  style.textContent = `
    #goetia-upgrades {
      position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
      background: rgba(8,8,16,0.97); border-left: 1px solid #222;
      z-index: 180; display: flex; flex-direction: column;
      font-family: monospace; color: #e0e0e0; overflow-y: auto;
    }
    #up-header {
      padding: 16px 20px; border-bottom: 1px solid #1a1a1a;
      display: flex; justify-content: space-between; align-items: center;
    }
    #up-title { color: #cc4444; font-size: 16px; font-weight: bold; letter-spacing: 0.1em; }
    #up-score-display { color: #ffdd44; font-size: 14px; }
    #up-close {
      background: none; border: 1px solid #444; color: #888;
      cursor: pointer; padding: 3px 8px; border-radius: 4px; font-family: monospace;
    }
    #up-close:hover { color: #fff; border-color: #cc4444; }
    #up-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .up-item {
      background: #0d0d1a; border: 1px solid #2a2a3a;
      border-radius: 8px; padding: 12px 14px; cursor: pointer; transition: border-color 0.15s;
    }
    .up-item:hover:not(.up-locked):not(.up-bought) { border-color: #cc4444; }
    .up-item.up-bought { opacity: 0.45; cursor: default; border-color: #2a4a2a; }
    .up-item.up-locked { opacity: 0.3; cursor: default; }
    .up-item.up-affordable { border-color: #554422; }
    .up-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .up-icon { font-size: 16px; margin-right: 8px; }
    .up-label { font-size: 13px; font-weight: bold; flex: 1; }
    .up-cost { font-size: 12px; color: #ffdd44; white-space: nowrap; }
    .up-cost.up-cant { color: #664444; }
    .up-desc { font-size: 11px; color: #666; line-height: 1.5; }
    .up-bought .up-label::after { content: ' ✔'; color: #44cc88; }
    .up-locked .up-desc::before { content: '🔒 '; }
    #up-hint { padding: 12px 20px; font-size: 11px; color: #444; text-align: center; }
  `;
  if (!document.getElementById('goetia-upgrades-style')) document.head.appendChild(style);
}

export function renderUpgradePanel(): void {
  const panel = document.getElementById('goetia-upgrades');
  if (!panel || !upgradeSystem || !getScore) return;
  const score = getScore();
  panel.innerHTML = `
    <div id="up-header">
      <span id="up-title">UPGRADES</span>
      <span id="up-score-display">Score : ${score}</span>
      <button id="up-close">✕</button>
    </div>
    <div id="up-list"></div>
    <div id="up-hint">[U] pour fermer — Score = monnaie d'invocation</div>
  `;
  document.getElementById('up-close')!.addEventListener('click', hideUpgradePanel);
  const list = document.getElementById('up-list')!;
  for (const upg of ALL_UPGRADES) {
    const bought = upgradeSystem.isPurchased(upg.id);
    const unlocked = upgradeSystem.isUnlocked(upg.id);
    const affordable = !bought && unlocked && score >= upg.cost;
    const cls = bought ? 'up-bought' : !unlocked ? 'up-locked' : affordable ? 'up-affordable' : '';
    const item = document.createElement('div');
    item.className = `up-item ${cls}`;
    item.innerHTML = `
      <div class="up-top">
        <span class="up-icon">${upg.icon}</span>
        <span class="up-label">${upg.label}</span>
        <span class="up-cost ${!affordable && !bought ? 'up-cant' : ''}">${bought ? '' : `${upg.cost} pts`}</span>
      </div>
      <div class="up-desc">${upg.desc}</div>
    `;
    if (!bought && unlocked) {
      item.addEventListener('click', () => { onBuy?.(upg.id); renderUpgradePanel(); });
    }
    list.appendChild(item);
  }
}

export function toggleUpgradePanel(): void { visible ? hideUpgradePanel() : showUpgradePanel(); }
export function showUpgradePanel(): void {
  visible = true;
  const p = document.getElementById('goetia-upgrades');
  if (p) { p.style.display = 'flex'; renderUpgradePanel(); }
}
export function hideUpgradePanel(): void {
  visible = false;
  const p = document.getElementById('goetia-upgrades');
  if (p) p.style.display = 'none';
}
export function isUpgradePanelVisible(): boolean { return visible; }
