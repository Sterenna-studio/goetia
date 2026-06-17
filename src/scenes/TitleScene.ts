// ============================================================
// GOETIA — TitleScene (redesign néromancien complet)
// Rendu Phaser canvas + overlay HTML SVG
// ============================================================

import Phaser from 'phaser';
import { loadBest, loadHistory } from '../core/persistence';
import { CSS } from '../ui/theme';
import { installSkullCursor, removeSkullCursor } from '../ui/cursor';

export class TitleScene extends Phaser.Scene {
  private glowTimer = 0;
  private sigils: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'TitleScene' }); }

  create(): void {
    this.cameras.main.setBackgroundColor('#050a05');
    installSkullCursor();
    this._injectTitleHTML();

    // Sigils animes en fond (cercles runiques Phaser)
    const g = this.add.graphics();
    this._drawBgRunes(g);

    // Particule de fond : points verts qui flottent
    this._spawnAmbientDots();

    // ESC / SPACE pour commencer
    this.input.keyboard?.addKey('SPACE').once('down', () => this._start());
    this.input.keyboard?.addKey('ENTER').once('down', () => this._start());
  }

  update(time: number): void {
    // Pulse du titre via CSS custom property
    const el = document.getElementById('title-glow');
    if (el) {
      const v = 0.5 + 0.5 * Math.sin(time * 0.0018);
      el.style.textShadow = `0 0 ${12 + v * 24}px ${CSS.ACCENT}${Math.round(v * 200).toString(16).padStart(2,'0')}, 0 0 40px ${CSS.ACCENT}22`;
    }
  }

  private _start(): void {
    removeSkullCursor();
    document.getElementById('goetia-title-overlay')?.remove();
    this.scene.start('GameScene');
  }

  private _drawBgRunes(g: Phaser.GameObjects.Graphics): void {
    // Grille de fond
    g.lineStyle(1, 0x0d1a0d, 0.6);
    for (let x = 0; x <= 1280; x += 64) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720;  y += 64) g.lineBetween(0, y, 1280, y);

    // Grand cercle central
    g.lineStyle(1, 0x1a4422, 0.4);
    g.strokeCircle(640, 360, 280);
    g.strokeCircle(640, 360, 260);

    // Pentagone inscrit
    g.lineStyle(1, 0x0d2211, 0.7);
    const pts: [number,number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      pts.push([640 + Math.cos(a) * 270, 360 + Math.sin(a) * 270]);
    }
    for (let i = 0; i < 5; i++) {
      const [x1,y1] = pts[i];
      const [x2,y2] = pts[(i + 2) % 5];
      g.lineBetween(x1, y1, x2, y2);
    }

    // Petits sigils aux coins
    const corners: [number,number][] = [[80,80],[1200,80],[80,640],[1200,640]];
    corners.forEach(([cx,cy]) => {
      g.lineStyle(1, 0x1a3320, 0.5);
      g.strokeCircle(cx, cy, 32);
      g.strokeCircle(cx, cy, 20);
      g.lineBetween(cx-32, cy, cx+32, cy);
      g.lineBetween(cx, cy-32, cx, cy+32);
    });

    // Ligne de bord
    g.lineStyle(1, 0x1a4422, 0.5);
    g.strokeRect(16, 16, 1248, 688);
    g.lineStyle(1, 0x0d2211, 0.3);
    g.strokeRect(24, 24, 1232, 672);
  }

  private _spawnAmbientDots(): void {
    const dots: { x:number; y:number; vy:number; alpha:number; r:number }[] = [];
    for (let i = 0; i < 40; i++) {
      dots.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vy: -0.15 - Math.random() * 0.25,
        alpha: Math.random(),
        r: 1 + Math.random() * 1.5,
      });
    }
    const g = this.add.graphics();
    this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        g.clear();
        dots.forEach(d => {
          d.y += d.vy;
          d.alpha += 0.015 * (Math.random() > 0.5 ? 1 : -1);
          d.alpha = Math.max(0.05, Math.min(0.7, d.alpha));
          if (d.y < -4) { d.y = 724; d.x = Math.random() * 1280; }
          g.fillStyle(0x33ff66, d.alpha);
          g.fillCircle(d.x, d.y, d.r);
        });
      },
    });
  }

  private _injectTitleHTML(): void {
    document.getElementById('goetia-title-overlay')?.remove();
    const best    = loadBest();
    const history = loadHistory();

    const histRows = history.length === 0
      ? `<div class="th-hist-empty">Aucune partie enregistrée</div>`
      : history.map((r, i) => `
          <div class="th-hist-row${i===0?' th-hist-best':''}">
            <span>${r.date}</span>
            <span>${r.score} pts</span>
            <span>v.${r.wave}</span>
            <span>${r.upgrades} rites</span>
          </div>`).join('');

    // Grimoire SVG (livre ouvert)
    const grimoireSVG = `
<svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Couverture gauche -->
  <path d="M10 8 Q60 4 60 8 L60 82 Q10 86 10 82 Z" fill="#0a1a0a" stroke="#1a4422" stroke-width="1.2"/>
  <!-- Couverture droite -->
  <path d="M110 8 Q60 4 60 8 L60 82 Q110 86 110 82 Z" fill="#0a1a0a" stroke="#1a4422" stroke-width="1.2"/>
  <!-- Tranche -->
  <line x1="60" y1="6" x2="60" y2="84" stroke="#33ff66" stroke-width="1" opacity="0.5"/>
  <!-- Lignes de texte gauche -->
  <line x1="18" y1="22" x2="54" y2="20" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="18" y1="30" x2="54" y2="28" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="18" y1="38" x2="54" y2="36" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="18" y1="46" x2="42" y2="44" stroke="#1a4422" stroke-width="0.8"/>
  <!-- Sigil gauche -->
  <circle cx="36" cy="63" r="12" stroke="#33ff66" stroke-width="0.8" opacity="0.4"/>
  <line x1="36" y1="51" x2="36" y2="75" stroke="#33ff66" stroke-width="0.6" opacity="0.3"/>
  <line x1="24" y1="63" x2="48" y2="63" stroke="#33ff66" stroke-width="0.6" opacity="0.3"/>
  <!-- Lignes de texte droite -->
  <line x1="66" y1="22" x2="102" y2="20" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="66" y1="30" x2="102" y2="28" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="66" y1="38" x2="102" y2="36" stroke="#1a4422" stroke-width="0.8"/>
  <line x1="66" y1="46" x2="90"  y2="44" stroke="#1a4422" stroke-width="0.8"/>
  <!-- Sigil droit -->
  <circle cx="84" cy="63" r="12" stroke="#9933ff" stroke-width="0.8" opacity="0.4"/>
  <line x1="84" y1="51" x2="84" y2="75" stroke="#9933ff" stroke-width="0.6" opacity="0.3"/>
  <line x1="72" y1="63" x2="96" y2="63" stroke="#9933ff" stroke-width="0.6" opacity="0.3"/>
</svg>`;

    // Pentagone SVG décoratif
    const pentaSVG = `
<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${Array.from({length:5},(_,i)=>{
    const a1=(i/5)*Math.PI*2-Math.PI/2;
    const a2=((i+2)/5)*Math.PI*2-Math.PI/2;
    return `<line x1="${30+Math.cos(a1)*26}" y1="${30+Math.sin(a1)*26}" x2="${30+Math.cos(a2)*26}" y2="${30+Math.sin(a2)*26}" stroke="#33ff66" stroke-width="0.8" opacity="0.5"/>`;
  }).join('')}
  <circle cx="30" cy="30" r="26" stroke="#1a4422" stroke-width="0.8" opacity="0.6"/>
  <circle cx="30" cy="30" r="4"  fill="#33ff66" opacity="0.5"/>
</svg>`;

    const overlay = document.createElement('div');
    overlay.id = 'goetia-title-overlay';
    overlay.innerHTML = `
<style>
  #goetia-title-overlay {
    position: fixed; inset: 0; z-index: 50;
    pointer-events: none;
    font-family: 'Courier New', monospace;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0;
  }

  /* ― EN-TÊTE ― */
  .th-header {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    margin-bottom: 10px;
  }
  .th-grimoire { opacity: 0.7; }
  .th-eyebrow {
    font-size: 10px; letter-spacing: 0.5em; color: #1a5533;
    text-transform: uppercase;
  }
  #title-glow {
    font-size: 68px; font-weight: 900; letter-spacing: 0.18em;
    color: ${CSS.ACCENT};
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 18px ${CSS.ACCENT}88, 0 0 40px ${CSS.ACCENT}22;
    line-height: 1;
  }
  .th-subtitle {
    font-size: 13px; color: #2a5535; letter-spacing: 0.2em;
    font-style: italic;
  }

  /* ― CORPS ― */
  .th-body {
    display: flex; gap: 40px; align-items: flex-start;
    width: 900px;
  }

  /* ― LORE ― */
  .th-lore {
    flex: 1;
    border: 1px solid #0d2211;
    border-left: 2px solid ${CSS.ACCENT};
    padding: 14px 18px;
    background: rgba(0,5,0,0.7);
  }
  .th-lore-title {
    font-size: 9px; letter-spacing: 0.3em; color: #1a5533;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .th-lore p {
    font-size: 12px; color: #3a6644; line-height: 1.7; margin: 0;
  }
  .th-lore p + p { margin-top: 8px; }

  /* ― DÉMONS ― */
  .th-demons {
    width: 200px;
    border: 1px solid #0d2211;
    border-left: 2px solid ${CSS.ACCENT2};
    padding: 14px 16px;
    background: rgba(0,0,5,0.7);
  }
  .th-demons-title {
    font-size: 9px; letter-spacing: 0.3em; color: #2a1a44;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .th-demon-row {
    display: flex; justify-content: space-between;
    font-size: 11px; padding: 3px 0;
    border-bottom: 1px solid #0d0d0d;
  }
  .th-demon-name { font-weight: bold; }
  .th-demon-role { color: #2a2a3a; font-size: 10px; }

  /* ― HISTORIQUE ― */
  .th-history {
    border: 1px solid #0d2211;
    padding: 14px 18px;
    background: rgba(0,5,0,0.7);
    width: 900px; margin-top: 12px;
  }
  .th-hist-title {
    font-size: 9px; letter-spacing: 0.3em; color: #1a5533;
    text-transform: uppercase; margin-bottom: 8px;
  }
  .th-hist-row {
    display: flex; gap: 24px; font-size: 11px;
    color: #2a3a2a; padding: 3px 0;
    border-bottom: 1px solid #0a150a;
  }
  .th-hist-best { color: ${CSS.ACCENT}; }
  .th-hist-best span:first-child { color: #2a5535; }
  .th-hist-empty { font-size: 11px; color: #1a2a1a; }

  /* ― RECORD ― */
  .th-record {
    font-size: 11px; color: #1a4422; letter-spacing: 0.1em;
    margin-top: 6px;
  }
  .th-record span { color: ${CSS.ACCENT}; }

  /* ― BOUTON ― */
  .th-btn-wrap {
    margin-top: 18px;
    pointer-events: all;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  #th-start-btn {
    background: rgba(0,0,0,0.9);
    border: 1px solid ${CSS.ACCENT};
    color: ${CSS.ACCENT};
    font-family: 'Courier New', monospace;
    font-size: 16px; font-weight: bold;
    letter-spacing: 0.2em;
    padding: 14px 64px;
    cursor: pointer;
    transition: box-shadow 0.2s, background 0.2s, color 0.2s;
    text-transform: uppercase;
  }
  #th-start-btn:hover {
    background: rgba(51,255,102,0.07);
    box-shadow: 0 0 24px ${CSS.ACCENT}44, inset 0 0 12px ${CSS.ACCENT}11;
    color: #fff;
  }
  .th-hint {
    font-size: 10px; color: #1a3322; letter-spacing: 0.15em;
  }
  .th-penta { opacity: 0.5; }
  .th-version {
    position: fixed; bottom: 12px; right: 16px;
    font-size: 10px; color: #0d2211; letter-spacing: 0.1em;
    pointer-events: none;
  }
</style>

<div class="th-header">
  <div class="th-grimoire">${grimoireSVG}</div>
  <div class="th-eyebrow">Ars Goetia • Grimoire Noire • MMXXVI</div>
  <div id="title-glow">G O E T I A</div>
  <div class="th-subtitle">La Main du Charnier</div>
  ${best.score > 0 ? `<div class="th-record">★ Record&nbsp;: <span>${best.score} pts</span> — Vague&nbsp;<span>${best.wave}</span></div>` : ''}
</div>

<div class="th-body">
  <div class="th-lore">
    <div class="th-lore-title">⧗ Lore</div>
    <p>Vous êtes le Nécromancien. Les corps qui jonchent la plaine sont votre matière première.</p>
    <p>Bifrons transporte. Murmur extrait. La fosse consume. Lerajé tue.</p>
    <p>Chaque âme collectée renforce votre armée des morts. Chaque cadavre béni par un Prêtre vous affaiblit.</p>
    <p>Le cycle recommence. Jusqu'à ce que la chaîne ne se brise.</p>
  </div>
  <div class="th-demons">
    <div class="th-demons-title">⧖ Démons</div>
    <div class="th-demon-row"><span class="th-demon-name" style="color:${CSS.BIFRONS}">Bifrons</span><span class="th-demon-role">porteur</span></div>
    <div class="th-demon-row"><span class="th-demon-name" style="color:${CSS.BATHIN}">Bathin</span><span class="th-demon-role">×2 corps</span></div>
    <div class="th-demon-row"><span class="th-demon-name" style="color:${CSS.SEIR}">Seir</span><span class="th-demon-role">blink</span></div>
    <div class="th-demon-row"><span class="th-demon-name" style="color:${CSS.MURMUR}">Murmur</span><span class="th-demon-role">extrait</span></div>
    <div class="th-demon-row"><span class="th-demon-name" style="color:${CSS.GAMIGIN}">Gamigin</span><span class="th-demon-role">extrait+</span></div>
  </div>
</div>

<div class="th-history">
  <div class="th-hist-title">⧗ Parties précédentes</div>
  ${histRows}
</div>

<div class="th-btn-wrap">
  <div class="th-penta">${pentaSVG}</div>
  <button id="th-start-btn">▲ Invoquer le Rituel</button>
  <div class="th-hint">[SPACE] ou [ENTRÉE] pour commencer</div>
</div>

<div class="th-version">v0.4-alpha</div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('th-start-btn')?.addEventListener('click', () => this._start());
  }
}
