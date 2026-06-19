// ============================================================
// GOETIA — GameOverScene
// Écran de fin de partie : stats, record, historique, boutons
// Reçoit les données via scene.start('GameOverScene', data)
// ============================================================

import Phaser from 'phaser';
import { loadBest, loadHistory } from '../core/persistence';
import { CSS } from '../ui/theme';
import { installSkullCursor, removeSkullCursor } from '../ui/cursor';

export interface GameOverData {
  score:    number;
  wave:     number;
  upgrades: number;
  isRecord: boolean;
  bestScore: number;
  bestWave:  number;
  // Stats étendues (optionnelles)
  corpses?:    number;
  souls?:      number;
  kills?:      number;
  combos?:     number;
  demons?:     number;
}

export class GameOverScene extends Phaser.Scene {
  private _overlay: HTMLDivElement | null = null;

  constructor() { super({ key: 'GameOverScene' }); }

  init(data: GameOverData): void {
    // Stocké dans le registry Phaser pour usage dans create()
    this.registry.set('goData', data);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050a05');
    installSkullCursor();
    this._drawBg();
    this._injectStyle();
    this._renderOverlay();

    // Clavier
    this.input.keyboard?.addKey('R').on('down',     () => this._restart());
    this.input.keyboard?.addKey('ENTER').on('down', () => this._restart());
    this.input.keyboard?.addKey('SPACE').on('down', () => this._restart());
    this.input.keyboard?.addKey('ESC').on('down',   () => this._toTitle());
    this.input.keyboard?.addKey('T').on('down',     () => this._toTitle());
  }

  private _restart(): void {
    this._destroy();
    this.scene.start('GameScene');
  }

  private _toTitle(): void {
    this._destroy();
    this.scene.start('TitleScene');
  }

  private _destroy(): void {
    removeSkullCursor();
    this._overlay?.remove();
    document.getElementById('goetia-go-style')?.remove();
  }

  private _renderOverlay(): void {
    const data    = this.registry.get('goData') as GameOverData;
    const history = loadHistory();

    if (!this._overlay) {
      this._overlay = document.createElement('div');
      this._overlay.id = 'goetia-go-overlay';
      document.body.appendChild(this._overlay);
    }

    const isRecord = data.isRecord;

    // Lignes d'historique (5 max)
    const histRows = history.length === 0
      ? `<div class="go-hist-empty">Aucune partie antérieure</div>`
      : history.map((r, i) =>
          `<div class="go-hist-row${i === 0 ? ' go-hist-first' : ''}">
            <span class="go-hist-date">${r.date}</span>
            <span class="go-hist-score">${r.score.toLocaleString('fr-FR')}\u00a0pts</span>
            <span class="go-hist-wave">v.${r.wave}</span>
            <span class="go-hist-up">${r.upgrades}\u00a0rites</span>
          </div>`
        ).join('');

    // Stats étendues
    const extStats = [
      { label: 'Corps livrés',  value: data.corpses  ?? '—', icon: '\u25cf' },
      { label: '\u00c2mes extract.',   value: data.souls    ?? '—', icon: '\u25e6' },
      { label: 'Ennemis tirés', value: data.kills    ?? '—', icon: '\u2020' },
      { label: 'Combos',         value: data.combos   ?? '—', icon: '\u2605' },
      { label: 'Démons invoqu.', value: data.demons   ?? '—', icon: '\u25b3' },
      { label: 'Rituels',        value: data.upgrades ?? 0,  icon: '\u29d7' },
    ].map(s =>
      `<div class="go-stat">
        <span class="go-stat-icon">${s.icon}</span>
        <span class="go-stat-val">${s.value}</span>
        <span class="go-stat-label">${s.label}</span>
      </div>`
    ).join('');

    this._overlay.innerHTML = `
      <div class="go-left">
        <div class="go-eyebrow">RITUEL TERMINÉ</div>
        <div class="go-title">GAME OVER</div>

        ${isRecord ? `<div class="go-record-banner">\u2605 NOUVEAU RECORD \u2605</div>` : ''}

        <div class="go-score">${data.score.toLocaleString('fr-FR')}</div>
        <div class="go-score-unit">points</div>

        <div class="go-wave">
          <span class="go-wave-num">Vague ${data.wave}</span>
          ${isRecord ? '' : `<span class="go-wave-best">| record\u00a0: ${data.bestScore.toLocaleString('fr-FR')}\u00a0pts \u2014 v.${data.bestWave}</span>`}
        </div>

        <div class="go-sep"></div>

        <div class="go-stats-grid">${extStats}</div>

        <div class="go-sep"></div>

        <div class="go-buttons">
          <button id="go-btn-restart">
            <span class="go-btn-key">[R]</span>
            Recommencer
          </button>
          <button id="go-btn-title">
            <span class="go-btn-key">[ESC]</span>
            Menu principal
          </button>
        </div>

        <div class="go-keyhint">ENTRÉE\u00a0\u00b7\u00a0ESPACE pour recommencer</div>
      </div>

      <div class="go-right">
        <div class="go-panel">
          <div class="go-panel-title">\u29d7 HISTORIQUE</div>
          ${histRows}
        </div>

        <div class="go-panel go-panel-quote">
          <div class="go-panel-title">\u29d7 LES MORTS PARLENT</div>
          <div class="go-quote">${_randomQuote(data.wave)}</div>
        </div>
      </div>
    `;

    this._overlay.querySelector('#go-btn-restart')?.addEventListener('click', () => this._restart());
    this._overlay.querySelector('#go-btn-title')?.addEventListener('click',   () => this._toTitle());
  }

  private _drawBg(): void {
    const g = this.add.graphics();
    // Grille sombre
    g.lineStyle(1, 0x0d1a0d, 0.3);
    for (let x = 0; x <= 1280; x += 64) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720;  y += 64) g.lineBetween(0, y, 1280, y);
    // Cercle rouge central
    g.lineStyle(1, 0x330000, 0.5); g.strokeCircle(640, 360, 260);
    g.lineStyle(1, 0x220000, 0.3); g.strokeCircle(640, 360, 280);
    // Pentagone inversé (pointe en bas → signe de défaite)
    const pts: [number,number][] = Array.from({length:5}, (_,i) => {
      const a = (i/5)*Math.PI*2 + Math.PI/2; // inversé
      return [640 + Math.cos(a)*270, 360 + Math.sin(a)*270] as [number,number];
    });
    g.lineStyle(1, 0x1a0000, 0.6);
    for (let i = 0; i < 5; i++) g.lineBetween(...pts[i], ...pts[(i+2)%5]);
    // Bord
    g.lineStyle(1, 0x2a0000, 0.4); g.strokeRect(16, 16, 1248, 688);
    // Points ambiants rouges
    const dots: {x:number;y:number;vy:number;alpha:number}[] = [];
    for (let i = 0; i < 30; i++) dots.push({
      x: Math.random()*1280, y: Math.random()*720,
      vy: -0.1 - Math.random()*0.2, alpha: Math.random()*0.4,
    });
    this.time.addEvent({ delay: 60, loop: true, callback: () => {
      g.clear();
      g.lineStyle(1, 0x0d1a0d, 0.3);
      for (let x = 0; x <= 1280; x += 64) g.lineBetween(x, 0, x, 720);
      for (let y = 0; y <= 720;  y += 64) g.lineBetween(0, y, 1280, y);
      g.lineStyle(1, 0x330000, 0.5); g.strokeCircle(640, 360, 260);
      g.lineStyle(1, 0x220000, 0.3); g.strokeCircle(640, 360, 280);
      g.lineStyle(1, 0x1a0000, 0.6);
      for (let i = 0; i < 5; i++) g.lineBetween(...pts[i], ...pts[(i+2)%5]);
      g.lineStyle(1, 0x2a0000, 0.4); g.strokeRect(16, 16, 1248, 688);
      dots.forEach(d => {
        d.y += d.vy;
        if (d.y < -4) { d.y = 724; d.x = Math.random()*1280; }
        g.fillStyle(0xcc0000, d.alpha); g.fillCircle(d.x, d.y, 1.5);
      });
    }});
  }

  private _injectStyle(): void {
    if (document.getElementById('goetia-go-style')) return;
    const s = document.createElement('style');
    s.id = 'goetia-go-style';
    s.textContent = `
      #goetia-go-overlay {
        position: fixed; inset: 0; z-index: 50;
        font-family: 'Courier New', monospace;
        display: flex; align-items: stretch;
        color: ${CSS.TEXT};
        animation: go-fadein 0.5s ease both;
      }
      @keyframes go-fadein { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }

      /* ====== LEFT ====== */
      .go-left {
        flex: 0 0 580px;
        display: flex; flex-direction: column;
        justify-content: center;
        padding: 60px 64px;
        border-right: 1px solid #1a0000;
        background: rgba(0,0,0,0.5);
      }
      .go-eyebrow {
        font-size: 10px; letter-spacing: 0.4em; color: #4a1111;
        text-transform: uppercase; margin-bottom: 8px;
      }
      .go-title {
        font-size: 72px; font-weight: 900; letter-spacing: 0.14em;
        color: #cc0000; line-height: 1;
        text-shadow: 0 0 24px #cc000066, 0 0 60px #cc000022;
        margin-bottom: 12px;
        animation: go-title-pulse 2.5s ease-in-out infinite;
      }
      @keyframes go-title-pulse {
        0%,100% { text-shadow: 0 0 20px #cc000066, 0 0 50px #cc000022; }
        50%      { text-shadow: 0 0 36px #cc0000aa, 0 0 80px #cc000044; }
      }
      .go-record-banner {
        font-size: 12px; letter-spacing: 0.3em;
        color: ${CSS.ACCENT};
        text-shadow: 0 0 8px ${CSS.ACCENT}66;
        margin-bottom: 12px;
        animation: go-record-blink 1.2s ease-in-out infinite;
      }
      @keyframes go-record-blink {
        0%,100% { opacity:1; } 50% { opacity:0.5; }
      }
      .go-score {
        font-size: 56px; font-weight: 900; color: ${CSS.ACCENT};
        letter-spacing: 0.04em; line-height: 1;
        text-shadow: 0 0 16px ${CSS.ACCENT}44;
      }
      .go-score-unit {
        font-size: 12px; color: #2a5535; letter-spacing: 0.2em;
        margin-bottom: 8px;
      }
      .go-wave {
        font-size: 13px; color: #9933ff;
        margin-bottom: 16px; display: flex; gap: 12px; align-items: baseline;
      }
      .go-wave-num { font-size: 18px; font-weight: bold; }
      .go-wave-best { font-size: 11px; color: #2a3a2a; }
      .go-sep {
        height: 1px; background: #1a0a0a;
        margin: 14px 0;
      }

      /* Stats grid */
      .go-stats-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      }
      .go-stat {
        display: flex; flex-direction: column; align-items: center;
        padding: 8px 6px;
        background: rgba(0,0,0,0.4);
        border: 1px solid #1a0a0a;
      }
      .go-stat-icon { font-size: 16px; color: #330000; margin-bottom: 2px; }
      .go-stat-val  { font-size: 18px; font-weight: bold; color: ${CSS.TEXT_BRIGHT}; }
      .go-stat-label{ font-size: 10px; color: #3a4433; letter-spacing: 0.06em; text-align: center; }

      /* Boutons */
      .go-buttons {
        display: flex; gap: 12px; margin-bottom: 14px;
      }
      #go-btn-restart, #go-btn-title {
        flex: 1; background: none;
        font-family: 'Courier New', monospace;
        font-size: 13px; letter-spacing: 0.1em;
        padding: 10px 0; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: background 0.12s, box-shadow 0.12s, border-color 0.12s;
      }
      #go-btn-restart {
        border: 1px solid #cc0000; color: #cc0000;
      }
      #go-btn-restart:hover {
        background: rgba(204,0,0,0.08);
        box-shadow: 0 0 12px #cc000044;
      }
      #go-btn-title {
        border: 1px solid #1a3322; color: ${CSS.TEXT_DIM};
      }
      #go-btn-title:hover {
        border-color: ${CSS.ACCENT}; color: ${CSS.ACCENT};
      }
      .go-btn-key { font-size: 10px; color: #555; }
      .go-keyhint {
        font-size: 10px; color: #1a2a1a; letter-spacing: 0.1em;
      }

      /* ====== RIGHT ====== */
      .go-right {
        flex: 1; display: flex; flex-direction: column;
        justify-content: center; padding: 60px 48px; gap: 20px;
      }
      .go-panel {
        border: 1px solid #1a0000; border-left: 2px solid #330000;
        padding: 16px 20px; background: rgba(0,0,0,0.6);
      }
      .go-panel-title {
        font-size: 9px; letter-spacing: 0.25em; color: #3a1010;
        text-transform: uppercase; margin-bottom: 12px;
      }
      .go-hist-row {
        display: flex; gap: 16px; align-items: baseline;
        font-size: 11px; color: #2a2020; padding: 4px 0;
        border-bottom: 1px solid #100505;
      }
      .go-hist-first { color: ${CSS.ACCENT}; border-bottom-color: #1a1a0a; }
      .go-hist-first .go-hist-date { color: #2a5535; }
      .go-hist-date  { font-size: 10px; color: #2a1a1a; min-width: 36px; }
      .go-hist-score { font-weight: bold; }
      .go-hist-wave  { color: #9933ff88; }
      .go-hist-up    { color: #2a2a2a; margin-left: auto; }
      .go-hist-empty { font-size: 11px; color: #1a1010; }
      .go-panel-quote { border-left-color: #220022; }
      .go-quote {
        font-size: 12px; color: #2a2a3a; line-height: 1.7;
        font-style: italic;
      }
    `;
    document.head.appendChild(s);
  }
}

// Citations contextuelles selon la vague atteinte
const QUOTES_EARLY = [
  '\u201c Les ossements ne paient pas d\u2019eux-m\u00eames. \u201d',
  '\u201c Apprends d\u2019abord \u00e0 marcher avec les morts. \u201d',
  '\u201c Bifrons attend tes ordres, mais il faut d\u2019abord les donner. \u201d',
];
const QUOTES_MID = [
  '\u201c Le sang des preux engraisse la terre des fosses. \u201d',
  '\u201c Murmur extrait les \u00e2mes, mais il faut le guider. \u201d',
  '\u201c Les rituels ne se font pas seuls. Investis dans ton art. \u201d',
];
const QUOTES_LATE = [
  '\u201c Les vagues ne cessent jamais. Tu as tenu longtemps. \u201d',
  '\u201c Le charnier se souvient de ceux qui l\u2019ont rempli. \u201d',
  '\u201c La n\u00e9cromance est une patience sans fin. \u201d',
];
function _randomQuote(wave: number): string {
  const pool = wave < 3 ? QUOTES_EARLY : wave < 7 ? QUOTES_MID : QUOTES_LATE;
  return pool[Math.floor(Math.random() * pool.length)];
}
