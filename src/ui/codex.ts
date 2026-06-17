// ============================================================
// GOETIA — Codex (thème néromancien)
// ============================================================

import { CSS } from './theme';

const CODEX_ID = 'goetia-codex';
let _visible = false;
export function isCodexVisible(): boolean { return _visible; }

const ENTRIES = [
  { id:'bifrons',  sigil:'▲',  color: CSS.BIFRONS,  name:'Bifrons',  kind:'Porteur standard',
    desc:'Collecte et livre les cadavres à la fosse. Vitesse moyenne, capacité 1.' },
  { id:'bathin',   sigil:'▲▲', color: CSS.BATHIN,   name:'Bathin',   kind:'Porteur double',
    desc:'Peut porter 2 cadavres simultanément. Fait deux trajectoires avant de revenir à l’IDLE.' },
  { id:'seir',     sigil:'✷',  color: CSS.SEIR,     name:'Seir',     kind:'Téléporteur',
    desc:'Se téléporte instantanément au cadavre puis à la fosse. Cooldown 0.8s entre chaque blink.' },
  { id:'murmur',   sigil:'◆',  color: CSS.MURMUR,   name:'Murmur',   kind:'Extracteur',
    desc:'S’installe près d’un cadavre et en extrait l’âme en 40 ticks. Qualité naturelle.' },
  { id:'gamigin',  sigil:'◆',  color: CSS.GAMIGIN,  name:'Gamigin',  kind:'Extracteur rapide',
    desc:'Extraction en 20 ticks. Élève le rang de l’âme d’un cran (common→potent, etc.).' },
  { id:'leraje',   sigil:'■',  color: CSS.UNIT,     name:'Leraje',   kind:'Archer (invoqué)',
    desc:'Invoqué par les fosses. Archer immobile. Prioritise les Prêtres ennemis.' },
  // Ennemis
  { id:'soldier',  sigil:'●',  color: CSS.ENEMY,    name:'Soldat',   kind:'Ennemi',
    desc:'Ennemi basique. Avance sans s’arrêter, attaque les unités au contact.' },
  { id:'priest',   sigil:'✝',  color:'#cccccc',    name:'Prêtre',   kind:'Ennemi — Bénit',
    desc:'Bénit les cadavres à portée, les rendant inutilisables. Cible prioritaire.' },
  { id:'knight',   sigil:'◆',  color:'#886622',    name:'Chevalier', kind:'Ennemi — Blindé',
    desc:'Armor absorbe une partie des dégâts. Laisse un cadavre lourd à la mort.' },
];

export function toggleCodex(): void {
  _visible = !_visible;
  const el = document.getElementById(CODEX_ID);
  if (el) el.style.display = _visible ? 'flex' : 'none';
}

export function initCodex(): void {
  document.getElementById(CODEX_ID)?.remove();
  document.getElementById('goetia-codex-style')?.remove();
  _visible = false;

  const style = document.createElement('style');
  style.id = 'goetia-codex-style';
  style.textContent = `
    #goetia-codex {
      display: none;
      position: fixed; inset: 0; z-index: 250;
      background: rgba(0,0,0,0.93);
      flex-wrap: wrap; gap: 12px;
      align-content: flex-start;
      justify-content: center;
      padding: 60px 24px 24px;
      overflow-y: auto; font-family: 'Courier New', monospace;
    }
    .codex-card {
      width: 240px; padding: 14px 16px;
      background: rgba(0,5,0,0.9);
      border: 1px solid ${CSS.BORDER};
      border-top: 2px solid var(--cc, ${CSS.ACCENT});
      display: flex; flex-direction: column; gap: 5px;
    }
    .codex-sigil { font-size: 24px; line-height:1; color: var(--cc); }
    .codex-name  { font-size: 15px; font-weight: bold; color: var(--cc); letter-spacing: 0.05em; }
    .codex-kind  {
      font-size: 9px; color: var(--cc); opacity: 0.7;
      text-transform: uppercase; letter-spacing: 0.12em;
      border: 1px solid var(--cc); display: inline-block;
      padding: 1px 6px; margin-bottom: 2px;
    }
    .codex-desc  { font-size: 11px; color: ${CSS.TEXT_DIM}; line-height: 1.55; }
    .codex-sep   { border: none; border-top: 1px solid ${CSS.BORDER}; margin: 4px 0; }
    #codex-close {
      position: fixed; top: 14px; right: 14px;
      background: none; border: 1px solid ${CSS.BORDER};
      color: ${CSS.TEXT_DIM}; font-family: monospace; font-size: 12px;
      padding: 6px 18px; cursor: pointer; z-index: 251;
      transition: border-color 0.15s, color 0.15s;
    }
    #codex-close:hover { border-color: ${CSS.WARNING}; color: ${CSS.WARNING}; }
    #codex-title {
      position: fixed; top: 14px; left: 50%;
      transform: translateX(-50%);
      font-family: monospace; font-size: 16px; letter-spacing: 0.3em;
      color: ${CSS.ACCENT}; z-index: 251;
      text-shadow: 0 0 12px ${CSS.ACCENT}55;
    }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = CODEX_ID;
  el.innerHTML = `<div id="codex-title">⧗ CODEX ⧗</div><button id="codex-close">[C] Fermer</button>`;
  ENTRIES.forEach(e => {
    const card = document.createElement('div');
    card.className = 'codex-card';
    card.style.setProperty('--cc', e.color);
    card.innerHTML = `
      <div class="codex-sigil">${e.sigil}</div>
      <div class="codex-name">${e.name}</div>
      <div class="codex-kind">${e.kind}</div>
      <hr class="codex-sep">
      <div class="codex-desc">${e.desc}</div>
    `;
    el.appendChild(card);
  });
  document.body.appendChild(el);
  document.getElementById('codex-close')?.addEventListener('click', () => toggleCodex());
}
