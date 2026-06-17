// ============================================================
// GOETIA — Mini-maps de zones (overlay HTML + Canvas 2D)
// Vue de côté : ennemis arrivent de droite, base à gauche.
// Mise à jour via updateZoneMaps() appelée à chaque frame.
// ============================================================

import type { WorldState } from '../core/types';
import { CSS } from './theme';

const PANEL_ID   = 'goetia-zonemaps';
const ZONE_W     = 220;
const ZONE_H     = 80;
const ZONE_COUNT = 3;

// Distribution verticale des ennemis en 3 couloirs
const LANE_BANDS = [
  { label: 'Nord',   yMin: 0,   yMax: 240 },
  { label: 'Centre', yMin: 240, yMax: 480 },
  { label: 'Sud',    yMin: 480, yMax: 720 },
];

let canvases: HTMLCanvasElement[] = [];
let ctxs: CanvasRenderingContext2D[] = [];

export function initZoneMaps(): void {
  document.getElementById(PANEL_ID)?.remove();
  canvases = []; ctxs = [];

  const wrap = document.createElement('div');
  wrap.id = PANEL_ID;
  wrap.style.cssText = `
    position: fixed;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
    z-index: 110;
  `;

  for (let i = 0; i < ZONE_COUNT; i++) {
    const zone = LANE_BANDS[i];

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(0,5,0,0.88);
      border: 1px solid #0d2211;
      border-right: 2px solid ${CSS.ACCENT};
      padding: 4px 6px 2px;
      width: ${ZONE_W + 12}px;
    `;

    const label = document.createElement('div');
    label.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 9px; letter-spacing: 0.2em;
      color: #1a5533; margin-bottom: 3px;
      text-transform: uppercase;
    `;
    label.textContent = `□ Zone ${zone.label}`;

    const cvs = document.createElement('canvas');
    cvs.width  = ZONE_W;
    cvs.height = ZONE_H;
    cvs.style.display = 'block';
    const cx = cvs.getContext('2d')!;
    canvases.push(cvs);
    ctxs.push(cx);

    card.appendChild(label);
    card.appendChild(cvs);
    wrap.appendChild(card);
  }

  document.body.appendChild(wrap);
}

export function destroyZoneMaps(): void {
  document.getElementById(PANEL_ID)?.remove();
  canvases = []; ctxs = [];
}

export function updateZoneMaps(world: WorldState): void {
  if (ctxs.length === 0) return;

  for (let i = 0; i < ZONE_COUNT; i++) {
    const ctx  = ctxs[i];
    const band = LANE_BANDS[i];
    const W    = ZONE_W;
    const H    = ZONE_H;

    ctx.clearRect(0, 0, W, H);

    // Fond
    ctx.fillStyle = '#050a05';
    ctx.fillRect(0, 0, W, H);

    // Grille
    ctx.strokeStyle = '#0d1a0d';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 22) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 3) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Ligne de sol
    ctx.strokeStyle = '#1a3320';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 16); ctx.lineTo(W, H - 16); ctx.stroke();

    // Base (mur gauche)
    ctx.strokeStyle = '#33ff6644';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(12, H - 4); ctx.stroke();
    // Créneaux
    for (let y = 10; y < H - 10; y += 12) {
      ctx.fillStyle = '#33ff6622';
      ctx.fillRect(6, y, 6, 6);
    }

    // Éléments de décor (arbres morts, rocs) — toujours aux mêmes pos
    const deco = [40, 80, 130, 175];
    deco.forEach(dx => {
      ctx.strokeStyle = '#1a3320';
      ctx.lineWidth = 0.8;
      // Tronc
      ctx.beginPath(); ctx.moveTo(dx, H-16); ctx.lineTo(dx, H-28); ctx.stroke();
      // Branches
      ctx.beginPath(); ctx.moveTo(dx-6, H-24); ctx.lineTo(dx, H-26); ctx.lineTo(dx+6, H-24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dx-4, H-28); ctx.lineTo(dx, H-30); ctx.lineTo(dx+4, H-28); ctx.stroke();
    });

    // Ennemis dans ce couloir
    const enemies = [...world.enemies.values()].filter(e =>
      e.state !== 'dead' && e.pos.y >= band.yMin && e.pos.y < band.yMax
    );

    enemies.forEach(e => {
      // Position x : mappe [0..1280] → [W..20]
      const ex = W - 16 - (e.pos.x / 1280) * (W - 32);
      // Position y : sol + léger offset selon pos.y dans le couloir
      const ey = H - 16 - 2;

      const col = e.type === 'knight' ? '#886622' : e.type === 'priest' ? '#dddddd' : '#cc0000';

      if (e.type === 'priest') {
        // Croix
        ctx.fillStyle = col;
        ctx.fillRect(ex - 2, ey - 10, 4, 12);
        ctx.fillRect(ex - 6, ey - 7,  12, 4);
      } else if (e.type === 'knight') {
        // Silhouette lourde
        ctx.fillStyle = col;
        ctx.fillRect(ex - 4, ey - 12, 8, 12);
        ctx.fillRect(ex - 5, ey - 14, 10, 4); // heaume
        // Bouclier
        ctx.strokeStyle = '#aa6600'; ctx.lineWidth = 1;
        ctx.strokeRect(ex - 7, ey - 10, 3, 8);
      } else {
        // Soldat : silhouette simple
        ctx.fillStyle = col;
        // Corps
        ctx.fillRect(ex - 3, ey - 10, 6, 10);
        // Tête
        ctx.beginPath(); ctx.arc(ex, ey - 12, 3, 0, Math.PI * 2); ctx.fill();
      }

      // Barre de vie
      const hp = e.hp / e.maxHp;
      ctx.fillStyle = '#1a0000'; ctx.fillRect(ex - 6, ey + 2, 12, 2);
      ctx.fillStyle = col;       ctx.fillRect(ex - 6, ey + 2, 12 * hp, 2);
    });

    // Nombre d'ennemis
    ctx.fillStyle = enemies.length > 0 ? '#cc0000' : '#1a5533';
    ctx.font = '8px monospace';
    ctx.fillText(
      enemies.length > 0 ? `● ${enemies.length} ennemi${enemies.length>1?'s':''}` : '— calme',
      16, 12,
    );
  }
}
