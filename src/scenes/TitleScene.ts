// ============================================================
// GOETIA — TitleScene v3
// Menu complet : Jouer | Contrôles | Codex | Crédits
// Navigation clavier (haut/bas/entrée) + clic
// Sous-écrans détaillés pour chaque entrée
// ============================================================

import Phaser from 'phaser';
import { loadBest, loadHistory } from '../core/persistence';
import { CSS } from '../ui/theme';
import { installSkullCursor, removeSkullCursor } from '../ui/cursor';

type MenuItem = 'play' | 'controls' | 'lore' | 'credits';

const MENU_ITEMS: { id: MenuItem; label: string; hint: string }[] = [
  { id: 'play',     label: '\u25b6  Invoquer le Rituel',   hint: 'Lancer une nouvelle partie' },
  { id: 'controls',label: '\u25a1  Contrôles',            hint: 'Clavier & souris' },
  { id: 'lore',    label: '\u25cf  Codex Lore',            hint: 'Histoire & démons' },
  { id: 'credits', label: '\u25c6  Crédits',              hint: 'Auteurs & remerciements' },
];

const CONTROLS_DATA = [
  { key: 'Clic gauche',      action: 'Invoquer un démon à la position' },
  { key: 'Clic droit',       action: 'Ouvrir la roue de sélection démon' },
  { key: '1 – 5',            action: 'Sélectionner un démon (Bifrons…Gamigin)' },
  { key: 'U',                action: 'Ouvrir/fermer les Rituels d’amélioration' },
  { key: 'C',                action: 'Ouvrir/fermer le Codex' },
  { key: 'P · ESC',          action: 'Pause / Reprise' },
  { key: 'R',                action: 'Recommencer (hors pause)' },
  { key: 'ESPACE · ENTRÉE',  action: 'Confirmer / Commencer' },
];

const LORE_DATA = [
  { name: 'Bifrons',  color: CSS.BIFRONS,  role: 'Porteur',        desc: 'Transporte les corps vers les fosses. Rapide, indéfectible.' },
  { name: 'Bathin',   color: CSS.BATHIN,   role: 'Porteur double', desc: 'Peut porter 2 corps simultanément. Upgrade : brancard de 3.' },
  { name: 'Seir',     color: CSS.SEIR,     role: 'Blink',          desc: 'Se téléporte au cadavre le plus proche. Ignore la distance.' },
  { name: 'Murmur',   color: CSS.MURMUR,   role: 'Extracteur',     desc: 'Extrait les âmes des corps avant livraison. Bonus soul.' },
  { name: 'Gamigin',  color: CSS.GAMIGIN,  role: 'Extracteur+',    desc: 'Extrait plus vite que Murmur. Priorité aux prêtres.' },
  { name: 'Leràjé',  color: '#cc3333',    role: 'Archer',         desc: 'Produit par les fosses. Attaque automatiquement les ennemis.' },
];

const CREDITS_DATA = [
  { role: 'Direction',        name: 'Sterenna Studio' },
  { role: 'Code & Design',    name: 'Équipe Goetia' },
  { role: 'Moteur',           name: 'Phaser 3 · TypeScript · Vite' },
  { role: 'Inspiration',      name: 'Ars Goetia (XVIIe siècle)' },
  { role: 'Merci',            name: 'Les âmes sacrifiées en chemin' },
];

export class TitleScene extends Phaser.Scene {
  private _cursor   = 0;
  private _subScreen: MenuItem | null = null;
  private _overlay: HTMLDivElement | null = null;

  constructor() { super({ key: 'TitleScene' }); }

  create(): void {
    this.cameras.main.setBackgroundColor('#050a05');
    installSkullCursor();
    this._drawBg();
    this._spawnDots();
    this._renderOverlay();

    this.input.keyboard?.addKey('UP').on('down',    () => this._move(-1));
    this.input.keyboard?.addKey('DOWN').on('down',  () => this._move(+1));
    this.input.keyboard?.addKey('ENTER').on('down', () => this._confirm());
    this.input.keyboard?.addKey('SPACE').on('down', () => { if (!this._subScreen) this._confirm(); });
    this.input.keyboard?.addKey('ESC').on('down',   () => { if (this._subScreen) { this._subScreen = null; this._renderOverlay(); } });
    this.input.keyboard?.addKey('BACKSPACE').on('down', () => { if (this._subScreen) { this._subScreen = null; this._renderOverlay(); } });
  }

  update(time: number): void {
    const el = document.getElementById('title-glow');
    if (el) {
      const v = 0.5 + 0.5 * Math.sin(time * 0.0018);
      el.style.textShadow = `0 0 ${12 + v * 24}px ${CSS.ACCENT}${Math.round(v * 200).toString(16).padStart(2, '0')}, 0 0 40px ${CSS.ACCENT}22`;
    }
    const activeEl = document.querySelector<HTMLElement>('.tm-item.active');
    if (activeEl) {
      const pulse = 0.55 + 0.45 * Math.sin(time * 0.006);
      activeEl.style.borderLeftColor = `rgba(51,255,102,${pulse})`;
    }
  }

  private _move(dir: -1 | 1): void {
    if (this._subScreen) return;
    this._cursor = (this._cursor + dir + MENU_ITEMS.length) % MENU_ITEMS.length;
    this._renderOverlay();
  }

  private _confirm(): void {
    if (this._subScreen) { this._subScreen = null; this._renderOverlay(); return; }
    const item = MENU_ITEMS[this._cursor];
    if (item.id === 'play') { this._start(); return; }
    this._subScreen = item.id;
    this._renderOverlay();
  }

  private _start(): void {
    removeSkullCursor();
    this._overlay?.remove();
    document.getElementById('goetia-title-style')?.remove();
    this.scene.start('GameScene');
  }

  private _renderOverlay(): void {
    if (!this._overlay) {
      this._injectStyle();
      this._overlay = document.createElement('div');
      this._overlay.id = 'goetia-title-overlay';
      document.body.appendChild(this._overlay);
    }
    this._overlay.innerHTML = this._subScreen
      ? this._buildSubScreen(this._subScreen)
      : this._buildMainMenu();

    this._overlay.querySelectorAll<HTMLElement>('.tm-item').forEach((el, i) => {
      el.addEventListener('click', () => { this._cursor = i; this._confirm(); });
      el.addEventListener('mouseenter', () => { this._cursor = i; this._renderOverlay(); });
    });
    this._overlay.querySelector('#tm-back')?.addEventListener('click', () => { this._subScreen = null; this._renderOverlay(); });
    this._overlay.querySelector('#tm-play-now')?.addEventListener('click', () => this._start());
  }

  private _buildMainMenu(): string {
    const best    = loadBest();
    const history = loadHistory();

    const histRows = history.length === 0
      ? `<div class="tm-hist-empty">Aucune partie enregistrée</div>`
      : history.slice(0, 4).map((r, i) =>
          `<div class="tm-hist-row${i === 0 ? ' tm-hist-best' : ''}">
            <span>${r.date}</span><span>${r.score}\u00a0pts</span>
            <span>v.${r.wave}</span><span>${r.upgrades}\u00a0rites</span>
          </div>`).join('');

    const items = MENU_ITEMS.map((item, i) => {
      const active = i === this._cursor;
      return `<div class="tm-item${active ? ' active' : ''}" data-idx="${i}">
        <span class="tm-label">${item.label}</span>
        ${active ? `<span class="tm-hint">${item.hint}</span>` : ''}
      </div>`;
    }).join('');

    return `
      <div class="tm-left">
        <div class="tm-header">
          <div class="tm-eyebrow">Ars Goetia \u2022 Grimoire Noire \u2022 MMXXVI</div>
          <div id="title-glow">G O E T I A</div>
          <div class="tm-subtitle">La Main du Charnier</div>
          ${best.score > 0
            ? `<div class="tm-record">\u2605 Record\u00a0: <span>${best.score}\u00a0pts</span> \u2014 Vague\u00a0<span>${best.wave}</span></div>`
            : '<div class="tm-record-empty">Aucun record</div>'}
        </div>
        <nav class="tm-menu">${items}</nav>
        <div class="tm-keyhint">\u2191\u2193\u00a0naviguer\u00a0\u00b7\u00a0ENTRÉE\u00a0confirmer\u00a0\u00b7\u00a0ESC\u00a0retour</div>
      </div>
      <div class="tm-right">
        <div class="tm-panel">
          <div class="tm-panel-title">\u29d7 DERNI\u00c8RES PARTIES</div>
          ${histRows}
        </div>
        <div class="tm-panel">
          <div class="tm-panel-title">\u29d7 ASTUCE</div>
          <div class="tm-tip">${_randomTip()}</div>
        </div>
        <div class="tm-version">v0.5-alpha</div>
      </div>`;
  }

  private _buildSubScreen(id: MenuItem): string {
    let content = '';

    if (id === 'controls') {
      content = `
        <div class="ts-title">\u25a1 Contrôles</div>
        <div class="ts-rows">
          ${CONTROLS_DATA.map(c =>
            `<div class="ts-row"><kbd>${c.key}</kbd><span>${c.action}</span></div>`
          ).join('')}
        </div>`;
    }
    if (id === 'lore') {
      content = `
        <div class="ts-title">\u25cf Codex Lore</div>
        <p class="ts-lore-intro">Vous \u00eates le N\u00e9cromancien. Les corps qui jonchent la plaine sont votre mati\u00e8re premi\u00e8re.
        Chaque \u00e2me collect\u00e9e renforce votre arm\u00e9e. Chaque pr\u00eatre vivant b\u00e9nit vos cadavres et vous affaiblit.</p>
        <div class="ts-demons">
          ${LORE_DATA.map(d =>
            `<div class="ts-demon-card" style="border-left-color:${d.color}">
              <div class="ts-demon-name" style="color:${d.color}">${d.name}</div>
              <div class="ts-demon-role">${d.role}</div>
              <div class="ts-demon-desc">${d.desc}</div>
            </div>`
          ).join('')}
        </div>`;
    }
    if (id === 'credits') {
      content = `
        <div class="ts-title">\u25c6 Crédits</div>
        <div class="ts-credits">
          ${CREDITS_DATA.map(c =>
            `<div class="ts-cred-row">
              <span class="ts-cred-role">${c.role}</span>
              <span class="ts-cred-name">${c.name}</span>
            </div>`
          ).join('')}
        </div>
        <div class="ts-cred-quote">\u201c Les morts ne reposent jamais en paix. \u201d</div>`;
    }

    return `
      <div class="ts-wrapper">
        <div id="title-glow" style="font-size:32px;letter-spacing:0.28em;margin-bottom:20px">G O E T I A</div>
        <div class="ts-body">${content}</div>
        <div class="ts-footer">
          <button id="tm-back">\u2190 Retour</button>
          ${id === 'controls' ? '<button id="tm-play-now">\u25b6 Jouer maintenant</button>' : ''}
        </div>
      </div>`;
  }

  private _drawBg(): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0x0d1a0d, 0.6);
    for (let x = 0; x <= 1280; x += 64) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720;  y += 64) g.lineBetween(0, y, 1280, y);
    g.lineStyle(1, 0x1a4422, 0.4);
    g.strokeCircle(640, 360, 280); g.strokeCircle(640, 360, 260);
    g.lineStyle(1, 0x0d2211, 0.7);
    const pts: [number,number][] = Array.from({length:5}, (_,i) => {
      const a = (i/5)*Math.PI*2 - Math.PI/2;
      return [640 + Math.cos(a)*270, 360 + Math.sin(a)*270] as [number,number];
    });
    for (let i = 0; i < 5; i++) g.lineBetween(...pts[i], ...pts[(i+2)%5]);
    const corners: [number,number][] = [[80,80],[1200,80],[80,640],[1200,640]];
    corners.forEach(([cx,cy]) => {
      g.lineStyle(1, 0x1a3320, 0.5);
      g.strokeCircle(cx, cy, 32); g.strokeCircle(cx, cy, 20);
      g.lineBetween(cx-32, cy, cx+32, cy); g.lineBetween(cx, cy-32, cx, cy+32);
    });
    g.lineStyle(1, 0x1a4422, 0.5); g.strokeRect(16, 16, 1248, 688);
    g.lineStyle(1, 0x0d2211, 0.3); g.strokeRect(24, 24, 1232, 672);
  }

  private _spawnDots(): void {
    const dots: { x:number; y:number; vy:number; alpha:number; r:number }[] = [];
    for (let i = 0; i < 40; i++) dots.push({
      x: Math.random()*1280, y: Math.random()*720,
      vy: -0.15 - Math.random()*0.25,
      alpha: Math.random(), r: 1 + Math.random()*1.5,
    });
    const g = this.add.graphics();
    this.time.addEvent({ delay: 50, loop: true, callback: () => {
      g.clear();
      dots.forEach(d => {
        d.y += d.vy; d.alpha += 0.015*(Math.random()>0.5?1:-1);
        d.alpha = Math.max(0.05, Math.min(0.7, d.alpha));
        if (d.y < -4) { d.y = 724; d.x = Math.random()*1280; }
        g.fillStyle(0x33ff66, d.alpha); g.fillCircle(d.x, d.y, d.r);
      });
    }});
  }

  private _injectStyle(): void {
    if (document.getElementById('goetia-title-style')) return;
    const s = document.createElement('style');
    s.id = 'goetia-title-style';
    s.textContent = `
      #goetia-title-overlay {
        position: fixed; inset: 0; z-index: 50;
        font-family: 'Courier New', monospace;
        display: flex; align-items: stretch;
        color: ${CSS.TEXT};
      }
      .tm-left {
        flex: 0 0 520px;
        display: flex; flex-direction: column; justify-content: center;
        padding: 60px 56px;
        border-right: 1px solid #0d2211;
        background: rgba(0,3,0,0.4);
      }
      .tm-right {
        flex: 1; display: flex; flex-direction: column;
        justify-content: center; padding: 60px 48px; gap: 20px;
      }
      .tm-header { margin-bottom: 36px; }
      .tm-eyebrow { font-size:10px; letter-spacing:0.4em; color:#1a5533; text-transform:uppercase; margin-bottom:8px; }
      #title-glow {
        font-size:64px; font-weight:900; letter-spacing:0.18em;
        color:${CSS.ACCENT}; font-family:'Courier New',monospace;
        text-shadow:0 0 18px ${CSS.ACCENT}88, 0 0 40px ${CSS.ACCENT}22;
        line-height:1; margin-bottom:6px;
      }
      .tm-subtitle { font-size:13px; color:#2a5535; letter-spacing:0.2em; font-style:italic; margin-bottom:6px; }
      .tm-record { font-size:11px; color:#1a4422; letter-spacing:0.08em; }
      .tm-record span { color:${CSS.ACCENT}; }
      .tm-record-empty { font-size:10px; color:#0d1a0d; }
      .tm-menu { display:flex; flex-direction:column; gap:4px; margin-bottom:28px; }
      .tm-item {
        padding:10px 16px;
        border:1px solid #0a1a0a; border-left:3px solid transparent;
        background:rgba(0,0,0,0.5); cursor:pointer;
        transition:background 0.1s, border-left-color 0.1s;
        display:flex; justify-content:space-between; align-items:center;
      }
      .tm-item:hover, .tm-item.active {
        background:rgba(51,255,102,0.04);
        border-color:#1a3320; border-left-color:${CSS.ACCENT};
      }
      .tm-label { font-size:15px; color:${CSS.TEXT_BRIGHT}; letter-spacing:0.08em; }
      .tm-item:not(.active) .tm-label { color:${CSS.TEXT_DIM}; }
      .tm-hint { font-size:10px; color:#2a5535; font-style:italic; }
      .tm-keyhint { font-size:10px; color:#1a3322; letter-spacing:0.1em; }
      .tm-panel {
        border:1px solid #0d2211; border-left:2px solid #1a4422;
        padding:14px 18px; background:rgba(0,3,0,0.6);
      }
      .tm-panel-title { font-size:9px; letter-spacing:0.25em; color:#1a5533; text-transform:uppercase; margin-bottom:10px; }
      .tm-hist-row { display:flex; gap:20px; font-size:11px; color:#2a3a2a; padding:3px 0; border-bottom:1px solid #0a150a; }
      .tm-hist-best { color:${CSS.ACCENT}; }
      .tm-hist-best span:first-child { color:#2a5535; }
      .tm-hist-empty { font-size:11px; color:#1a2a1a; }
      .tm-tip { font-size:12px; color:#2a4433; line-height:1.6; font-style:italic; }
      .tm-version { font-size:10px; color:#0d2211; letter-spacing:0.1em; text-align:right; margin-top:auto; }

      /* Sous-écrans */
      .ts-wrapper {
        width:100%; height:100%;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        padding:60px;
      }
      .ts-body {
        width:800px; max-height:520px; overflow-y:auto;
        border:1px solid #0d2211; border-left:2px solid ${CSS.ACCENT};
        padding:24px 32px; background:rgba(0,3,0,0.85); margin-bottom:24px;
      }
      .ts-title { font-size:18px; color:${CSS.ACCENT}; letter-spacing:0.2em; text-shadow:0 0 10px ${CSS.ACCENT}44; margin-bottom:20px; }
      .ts-rows { display:flex; flex-direction:column; gap:6px; }
      .ts-row { display:flex; align-items:baseline; gap:20px; padding:6px 0; border-bottom:1px solid #0a150a; font-size:12px; }
      kbd { display:inline-block; min-width:130px; font-family:'Courier New',monospace; font-size:11px; font-weight:bold; color:${CSS.ACCENT2}; letter-spacing:0.05em; flex-shrink:0; }
      .ts-row span { color:${CSS.TEXT_DIM}; }
      .ts-lore-intro { font-size:12px; color:#3a6644; line-height:1.7; margin-bottom:18px; }
      .ts-demons { display:flex; flex-wrap:wrap; gap:12px; }
      .ts-demon-card { width:220px; padding:10px 14px; border:1px solid #0d1a0d; border-left:2px solid; background:rgba(0,0,0,0.5); }
      .ts-demon-name { font-size:14px; font-weight:bold; margin-bottom:2px; }
      .ts-demon-role { font-size:10px; color:#2a3a2a; margin-bottom:4px; letter-spacing:0.1em; }
      .ts-demon-desc { font-size:11px; color:${CSS.TEXT_DIM}; line-height:1.5; }
      .ts-credits { display:flex; flex-direction:column; gap:8px; margin-bottom:24px; }
      .ts-cred-row { display:flex; gap:24px; padding:6px 0; border-bottom:1px solid #0a150a; }
      .ts-cred-role { font-size:10px; color:#1a5533; width:160px; flex-shrink:0; letter-spacing:0.1em; text-transform:uppercase; }
      .ts-cred-name { font-size:13px; color:${CSS.TEXT}; }
      .ts-cred-quote { font-size:13px; color:#2a4433; font-style:italic; text-align:center; margin-top:12px; }
      .ts-footer { display:flex; gap:16px; }
      #tm-back, #tm-play-now {
        background:none; font-family:'Courier New',monospace;
        font-size:13px; letter-spacing:0.12em;
        padding:8px 28px; cursor:pointer;
        transition:background 0.12s, box-shadow 0.12s;
      }
      #tm-back { border:1px solid #1a3322; color:${CSS.TEXT_DIM}; }
      #tm-back:hover { border-color:${CSS.ACCENT}; color:${CSS.ACCENT}; }
      #tm-play-now { border:1px solid ${CSS.ACCENT}; color:${CSS.ACCENT}; }
      #tm-play-now:hover { background:rgba(51,255,102,0.08); box-shadow:0 0 12px ${CSS.ACCENT}44; }
    `;
    document.head.appendChild(s);
  }
}

const TIPS = [
  'Les prêtres bénissent les corps au sol — invoquez Seir pour les ramasser en priorité.',
  'Le combo démarre à 3 livraisons rapides consécutives.',
  'Le rituel \u201cPacte lucratif\u201d augmente tous les points de 20\u00a0%.',
  'Bathin avec le Brancard peut porter 3 corps — idéal pour vider le champ vite.',
  'Gamigin extrait les âmes 2x plus vite que Murmur.',
  'Les chevaliers ont une armure\u00a0: il faut 2 hits de Leràjé pour les tuer.',
  'Une fosse ne peut traiter qu\u2019un corps à la fois. Trois fosses = plus de rendement.',
];
function _randomTip(): string { return TIPS[Math.floor(Math.random() * TIPS.length)]; }
