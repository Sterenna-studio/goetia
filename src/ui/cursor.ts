// ============================================================
// GOETIA — Main nécromancienne SVG réelle (overlay DOM)
// On cache le curseur natif et on affiche une vraie main SVG qui suit la souris.
// ============================================================

const HAND_ID = 'goetia-hand-cursor';
const STYLE_ID = 'goetia-hand-style';

function handSVG(pressed = false): string {
  const glow = pressed ? '0 0 18px rgba(51,255,102,0.55)' : '0 0 10px rgba(51,255,102,0.28)';
  const scale = pressed ? 'scale(0.96)' : 'scale(1)';
  return `
  <svg width="72" height="92" viewBox="0 0 72 92" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:${glow}; transform:${scale}; overflow:visible;">
    <g>
      <!-- Aura -->
      <ellipse cx="37" cy="76" rx="20" ry="7" stroke="#33ff66" stroke-width="1.1" opacity="0.24"/>
      <ellipse cx="37" cy="76" rx="12" ry="3.8" stroke="#9933ff" stroke-width="0.9" opacity="0.20"/>

      <!-- Avant-bras -->
      <path d="M28 88 L46 88 L50 70 L24 70 Z" fill="#081008" stroke="#1d5f33" stroke-width="1.2"/>
      <line x1="31" y1="72" x2="29" y2="86" stroke="#33ff66" stroke-width="0.8" opacity="0.20"/>
      <line x1="37" y1="71" x2="37" y2="87" stroke="#33ff66" stroke-width="0.8" opacity="0.24"/>
      <line x1="43" y1="72" x2="45" y2="86" stroke="#33ff66" stroke-width="0.8" opacity="0.20"/>

      <!-- Paume -->
      <path d="M24 38 C24 30, 31 24, 38 24 C48 24, 54 30, 54 40 L54 61 C54 68, 48 72, 40 72 L31 72 C24 72, 18 66, 18 58 L18 48 C18 43, 20 40, 24 38 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.4"/>

      <!-- Tendons paume -->
      <line x1="29" y1="35" x2="27" y2="66" stroke="#33ff66" stroke-width="0.7" opacity="0.18"/>
      <line x1="36" y1="31" x2="36" y2="69" stroke="#33ff66" stroke-width="0.8" opacity="0.25"/>
      <line x1="43" y1="33" x2="45" y2="68" stroke="#33ff66" stroke-width="0.7" opacity="0.18"/>

      <!-- Index pointé -->
      <path d="M33 7 C33 3, 36 1, 39 1 C43 1, 45 4, 45 8 L45 35 C45 39, 42 42, 38 42 C34 42, 33 39, 33 35 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.4"/>
      <line x1="34" y1="15" x2="44" y2="15" stroke="#33ff66" stroke-width="0.8" opacity="0.35"/>
      <line x1="34" y1="25" x2="44" y2="25" stroke="#33ff66" stroke-width="0.8" opacity="0.28"/>
      <path d="M35 3 L43 3" stroke="#e8ffe8" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>

      <!-- Majeur -->
      <path d="M46 12 C46 8, 49 6, 52 6 C55 6, 58 9, 58 13 L58 39 C58 42, 56 45, 52 45 C49 45, 46 42, 46 39 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.2" opacity="0.92"/>
      <line x1="47" y1="20" x2="57" y2="20" stroke="#33ff66" stroke-width="0.7" opacity="0.28"/>
      <line x1="47" y1="30" x2="57" y2="30" stroke="#33ff66" stroke-width="0.7" opacity="0.22"/>
      <path d="M48 8 L56 8" stroke="#e8ffe8" stroke-width="1.0" stroke-linecap="round" opacity="0.74"/>

      <!-- Annulaire -->
      <path d="M22 14 C22 10, 24 8, 28 8 C31 8, 33 10, 33 14 L33 39 C33 42, 31 45, 28 45 C24 45, 22 42, 22 39 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.2" opacity="0.9"/>
      <line x1="23" y1="22" x2="32" y2="22" stroke="#33ff66" stroke-width="0.7" opacity="0.26"/>
      <line x1="23" y1="31" x2="32" y2="31" stroke="#33ff66" stroke-width="0.7" opacity="0.20"/>
      <path d="M24 10 L31 10" stroke="#e8ffe8" stroke-width="1.0" stroke-linecap="round" opacity="0.70"/>

      <!-- Auriculaire -->
      <path d="M15 23 C15 20, 17 18, 20 18 C23 18, 25 20, 25 23 L25 43 C25 46, 23 48, 20 48 C17 48, 15 46, 15 43 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.1" opacity="0.84"/>
      <line x1="16" y1="29" x2="24" y2="29" stroke="#33ff66" stroke-width="0.6" opacity="0.22"/>
      <line x1="16" y1="36" x2="24" y2="36" stroke="#33ff66" stroke-width="0.6" opacity="0.18"/>
      <path d="M17 20 L23 20" stroke="#e8ffe8" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>

      <!-- Pouce latéral -->
      <path d="M10 43 C6 43, 3 46, 3 50 C3 54, 6 57, 10 57 L24 57 C28 57, 31 54, 31 50 C31 46, 28 43, 24 43 Z"
            fill="#0a140a" stroke="#33ff66" stroke-width="1.2"/>
      <line x1="10" y1="50" x2="25" y2="50" stroke="#33ff66" stroke-width="0.7" opacity="0.22"/>

      <!-- Rune violette au poignet -->
      <circle cx="53" cy="73" r="5" stroke="#9933ff" stroke-width="1.1" opacity="0.50"/>
      <line x1="53" y1="68" x2="53" y2="78" stroke="#9933ff" stroke-width="0.9" opacity="0.42"/>
      <line x1="48" y1="73" x2="58" y2="73" stroke="#9933ff" stroke-width="0.9" opacity="0.42"/>
    </g>
  </svg>`;
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    html.goetia-hide-cursor, html.goetia-hide-cursor * {
      cursor: none !important;
    }
    #${HAND_ID} {
      position: fixed;
      left: 0;
      top: 0;
      width: 72px;
      height: 92px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-12px, -6px);
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
}

export function installSkullCursor(): void {
  removeSkullCursor();
  ensureStyle();
  document.documentElement.classList.add('goetia-hide-cursor');

  const hand = document.createElement('div');
  hand.id = HAND_ID;
  hand.innerHTML = handSVG(false);
  document.body.appendChild(hand);

  const move = (ev: MouseEvent) => {
    hand.style.transform = `translate(${ev.clientX - 12}px, ${ev.clientY - 6}px)`;
  };
  const down = () => { hand.innerHTML = handSVG(true); };
  const up   = () => { hand.innerHTML = handSVG(false); };

  (hand as any)._goetiaMove = move;
  (hand as any)._goetiaDown = down;
  (hand as any)._goetiaUp   = up;

  window.addEventListener('mousemove', move);
  window.addEventListener('mousedown', down);
  window.addEventListener('mouseup', up);
}

export function removeSkullCursor(): void {
  const hand = document.getElementById(HAND_ID) as (HTMLDivElement & {
    _goetiaMove?: (ev: MouseEvent) => void;
    _goetiaDown?: () => void;
    _goetiaUp?: () => void;
  }) | null;

  if (hand?._goetiaMove) window.removeEventListener('mousemove', hand._goetiaMove);
  if (hand?._goetiaDown) window.removeEventListener('mousedown', hand._goetiaDown);
  if (hand?._goetiaUp)   window.removeEventListener('mouseup', hand._goetiaUp);

  hand?.remove();
  document.documentElement.classList.remove('goetia-hide-cursor');
}
