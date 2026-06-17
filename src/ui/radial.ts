// ============================================================
// GOETIA — Menu radial (thème néromancien)
// ============================================================

import { CSS } from './theme';

export interface DemonOption {
  id: string;
  label: string;
  color: string;
  key: string;
  kind: 'hauler' | 'extractor';
  desc: string;
}

const DEMONS: DemonOption[] = [
  { id:'bifrons',  label:'Bifrons',  color: CSS.BIFRONS,  key:'1', kind:'hauler',    desc:'Porteur standard' },
  { id:'bathin',   label:'Bathin',   color: CSS.BATHIN,   key:'2', kind:'hauler',    desc:'Porte 2 cadavres' },
  { id:'seir',     label:'Seir',     color: CSS.SEIR,     key:'3', kind:'hauler',    desc:'Téléportation' },
  { id:'murmur',   label:'Murmur',   color: CSS.MURMUR,   key:'4', kind:'extractor', desc:'Extrait lentement' },
  { id:'gamigin',  label:'Gamigin',  color: CSS.GAMIGIN,  key:'5', kind:'extractor', desc:'Extrait vite +rang' },
];

let selectedIndex = 0;
let onChangeCallback: (() => void) | null = null;

export function getSelectedDemon(): DemonOption { return DEMONS[selectedIndex]; }

export function selectDemonByKey(key: string): void {
  const idx = DEMONS.findIndex(d => d.key === key);
  if (idx >= 0) { selectedIndex = idx; onChangeCallback?.(); }
}

// ―― Init ――
export function initRadial(onChange: () => void): void {
  onChangeCallback = onChange;
  document.getElementById('goetia-radial')?.remove();
  document.getElementById('goetia-radial-style')?.remove();

  const style = document.createElement('style');
  style.id = 'goetia-radial-style';
  style.textContent = `
    #goetia-radial {
      display: none;
      position: fixed; z-index: 200;
      pointer-events: all;
    }
    .radial-ring {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 220px; height: 220px;
    }
    .radial-center {
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 28px; height: 28px;
      border: 1px solid ${CSS.BORDER};
      border-radius: 50%;
      background: rgba(0,0,0,0.9);
    }
    .radial-item {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center;
      cursor: pointer; padding: 8px 12px;
      background: rgba(0,0,0,0.92);
      border: 1px solid #1a3320;
      min-width: 80px; text-align: center;
      transition: border-color 0.12s, box-shadow 0.12s;
      font-family: 'Courier New', monospace;
    }
    .radial-item:hover, .radial-item.active {
      border-color: var(--rc, ${CSS.BIFRONS});
      box-shadow: 0 0 12px var(--rc, ${CSS.BIFRONS})44;
    }
    .radial-key  { font-size: 9px; color: ${CSS.TEXT_DIM}; margin-bottom:2px; }
    .radial-name { font-size: 13px; font-weight: bold; color: var(--rc, white); }
    .radial-kind {
      font-size: 9px; margin-top: 2px; padding: 1px 5px;
      border: 1px solid currentColor; border-radius: 1px;
      opacity: 0.7;
    }
    .radial-desc { font-size: 9px; color: ${CSS.TEXT_DIM}; margin-top:3px; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'goetia-radial';
  document.body.appendChild(wrap);
}

export function showRadial(cx: number, cy: number): void {
  const wrap = document.getElementById('goetia-radial');
  if (!wrap) return;
  wrap.style.display = 'block';
  wrap.style.left    = `${cx}px`;
  wrap.style.top     = `${cy}px`;
  wrap.innerHTML     = '';

  const ring = document.createElement('div');
  ring.className = 'radial-ring';

  // Centre
  const center = document.createElement('div');
  center.className = 'radial-center';
  ring.appendChild(center);

  const R = 88;
  DEMONS.forEach((d, i) => {
    const angle = (i / DEMONS.length) * Math.PI * 2 - Math.PI / 2;
    const x = 110 + Math.cos(angle) * R;
    const y = 110 + Math.sin(angle) * R;
    const item = document.createElement('div');
    item.className = 'radial-item' + (i === selectedIndex ? ' active' : '');
    item.style.left = `${x}px`;
    item.style.top  = `${y}px`;
    item.style.setProperty('--rc', d.color);
    item.innerHTML = `
      <div class="radial-key">[${d.key}]</div>
      <div class="radial-name">${d.label}</div>
      <div class="radial-kind" style="color:${d.color}">${d.kind === 'extractor' ? '◆ extracteur' : '▲ porteur'}</div>
      <div class="radial-desc">${d.desc}</div>
    `;
    item.addEventListener('click', () => {
      selectedIndex = i;
      onChangeCallback?.();
      hideRadial();
    });
    ring.appendChild(item);
  });

  wrap.appendChild(ring);
}

export function hideRadial(): void {
  const wrap = document.getElementById('goetia-radial');
  if (wrap) wrap.style.display = 'none';
}
export function isRadialVisible(): boolean {
  return document.getElementById('goetia-radial')?.style.display === 'block';
}
