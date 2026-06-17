// ============================================================
// GOETIA — Main nécromancienne SVG — singleton global
// • bootCursor() une seule fois depuis main.ts
// • RAF loop : position + rotation selon vélocité
// • Mousedown : 6 étoiles SVG trail vert/violet
// • installSkullCursor / removeSkullCursor → no-op
// ============================================================

const HAND_ID  = 'goetia-hand';
const STYLE_ID = 'goetia-cursor-style';

// ── SVG main ──────────────────────────────────────────────────
function buildHandSVG(rotDeg: number, pressed: boolean): string {
  const glowR = pressed ? 28 : 14;
  const glowA = pressed ? 0.65 : 0.30;
  const scY   = pressed ? 0.94 : 1;
  return [
    `<svg width="72" height="92" viewBox="0 0 72 92" fill="none"`,
    ` xmlns="http://www.w3.org/2000/svg"`,
    ` style="overflow:visible;transform:rotate(${rotDeg.toFixed(1)}deg) scaleY(${scY});transform-origin:38px 52px;">`,

    // Halo sol
    `<ellipse cx="38" cy="76" rx="${glowR}" ry="${(glowR*0.35).toFixed(1)}" fill="#33ff66" opacity="${(glowA*0.35).toFixed(2)}"/>`,
    `<ellipse cx="38" cy="76" rx="${(glowR*0.55).toFixed(1)}" ry="${(glowR*0.20).toFixed(1)}" fill="#9933ff" opacity="${(glowA*0.28).toFixed(2)}"/>`,

    // Avant-bras
    `<path d="M28 90 L47 90 L51 68 L24 68 Z" fill="#081008" stroke="#1d5f33" stroke-width="1.2"/>`,
    `<line x1="32" y1="70" x2="30" y2="88" stroke="#33ff66" stroke-width="0.7" opacity="0.18"/>`,
    `<line x1="38" y1="69" x2="38" y2="89" stroke="#33ff66" stroke-width="0.7" opacity="0.22"/>`,
    `<line x1="44" y1="70" x2="46" y2="88" stroke="#33ff66" stroke-width="0.7" opacity="0.18"/>`,

    // Paume
    `<path d="M24 36 C24 28 32 22 39 22 C50 22 55 30 55 41 L55 62 C55 69 49 73 41 73 L31 73 C24 73 18 67 18 59 L18 48 C18 42 20 38 24 36 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.4"/>`,
    `<line x1="29" y1="34" x2="27" y2="68" stroke="#33ff66" stroke-width="0.65" opacity="0.17"/>`,
    `<line x1="37" y1="29" x2="37" y2="70" stroke="#33ff66" stroke-width="0.75" opacity="0.24"/>`,
    `<line x1="44" y1="31" x2="46" y2="69" stroke="#33ff66" stroke-width="0.65" opacity="0.17"/>`,

    // Index pointé
    `<path d="M33 5 C33 1 36 0 39.5 0 C43 0 45 3 45 7 L45 35 C45 39 42 43 38.5 43 C35 43 33 40 33 36 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.4"/>`,
    `<line x1="34" y1="13" x2="44" y2="13" stroke="#33ff66" stroke-width="0.8" opacity="0.34"/>`,
    `<line x1="34" y1="24" x2="44" y2="24" stroke="#33ff66" stroke-width="0.7" opacity="0.26"/>`,
    `<path d="M35 1.5 Q39 0 43 1.5" stroke="#d0ffd8" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.85"/>`,
    `<text x="37" y="32" font-size="7" fill="#33ff66" opacity="0.35" text-anchor="middle" font-family="serif">ᛃ</text>`,

    // Majeur
    `<path d="M46 10 C46 6 49 4 52.5 4 C56 4 58 8 58 12 L58 39 C58 43 56 46 52.5 46 C49 46 46 43 46 39 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.2" opacity="0.90"/>`,
    `<line x1="47" y1="19" x2="57" y2="19" stroke="#33ff66" stroke-width="0.7" opacity="0.26"/>`,
    `<line x1="47" y1="30" x2="57" y2="30" stroke="#33ff66" stroke-width="0.65" opacity="0.20"/>`,
    `<path d="M48 5.5 Q52 4 56 5.5" stroke="#d0ffd8" stroke-width="1.0" fill="none" stroke-linecap="round" opacity="0.75"/>`,

    // Annulaire
    `<path d="M22 12 C22 8 25 6 28.5 6 C32 6 34 9 34 13 L34 38 C34 42 31 45 28 45 C24 45 22 42 22 38 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.2" opacity="0.88"/>`,
    `<line x1="23" y1="21" x2="33" y2="21" stroke="#33ff66" stroke-width="0.65" opacity="0.24"/>`,
    `<line x1="23" y1="31" x2="33" y2="31" stroke="#33ff66" stroke-width="0.65" opacity="0.19"/>`,
    `<path d="M24 8 Q28.5 6.5 32 8" stroke="#d0ffd8" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.70"/>`,

    // Auriculaire
    `<path d="M14 22 C14 18 17 16 20 16 C23 16 25 19 25 22 L25 44 C25 47 23 49 20 49 C17 49 14 47 14 44 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.1" opacity="0.82"/>`,
    `<line x1="15" y1="29" x2="24" y2="29" stroke="#33ff66" stroke-width="0.6" opacity="0.21"/>`,
    `<line x1="15" y1="37" x2="24" y2="37" stroke="#33ff66" stroke-width="0.6" opacity="0.17"/>`,
    `<path d="M16 18 Q20 16.5 23.5 18" stroke="#d0ffd8" stroke-width="0.85" fill="none" stroke-linecap="round" opacity="0.64"/>`,

    // Pouce
    `<path d="M9 44 C5 44 2 47 2 51 C2 55 5 58 9 58 L24 58 C28 58 31 55 31 51 C31 47 28 44 24 44 Z" fill="#0a140a" stroke="#33ff66" stroke-width="1.2"/>`,
    `<line x1="8" y1="51" x2="25" y2="51" stroke="#33ff66" stroke-width="0.7" opacity="0.20"/>`,
    `<path d="M3 47 Q5.5 44.5 8 47" stroke="#d0ffd8" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.60"/>`,

    // Anneau poignet
    `<ellipse cx="38" cy="71" rx="16" ry="4.5" stroke="#33ff66" stroke-width="0.9" fill="none" opacity="0.28"/>`,
    // Rune violette
    `<circle cx="55" cy="73" r="5.5" stroke="#9933ff" stroke-width="1.1" fill="none" opacity="0.52"/>`,
    `<line x1="55" y1="67.5" x2="55" y2="78.5" stroke="#9933ff" stroke-width="0.9" opacity="0.44"/>`,
    `<line x1="49.5" y1="73" x2="60.5" y2="73" stroke="#9933ff" stroke-width="0.9" opacity="0.44"/>`,

    `</svg>`,
  ].join('');
}

// ── étoile trail ──────────────────────────────────────────────
function spawnStar(x: number, y: number, col: string): void {
  const size = 8 + Math.random() * 12;
  const s    = size / 2;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.42;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(s + Math.cos(a) * r).toFixed(1)},${(s + Math.sin(a) * r).toFixed(1)}`);
  }
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><polygon points="${pts.join(' ')}" fill="${col}"/></svg>`;

  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed',
    `left:${(x - s + (Math.random() - 0.5) * 32).toFixed(0)}px`,
    `top:${(y - s + (Math.random() - 0.5) * 32).toFixed(0)}px`,
    'pointer-events:none',
    'z-index:9998',
    `width:${size}px`,
    `height:${size}px`,
    'opacity:0.88',
    'transition:opacity 0.48s ease-out, transform 0.48s ease-out',
    `transform:scale(1) rotate(${(Math.random()*360).toFixed(0)}deg)`,
  ].join(';');
  div.innerHTML = svg;
  document.body.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity = '0';
    div.style.transform = `scale(0.2) rotate(${(Math.random()*360+180).toFixed(0)}deg)`;
  });
  setTimeout(() => div.remove(), 520);
}

// ── état interne ──────────────────────────────────────────────
let _installed = false;
let _px = -200, _py = -200;
let _vx = 0,    _vy = 0;
let _rot = 0;
let _pressed = false;

function _onMove(ev: MouseEvent): void {
  const dx = ev.clientX - _px;
  const dy = ev.clientY - _py;
  _vx = _vx * 0.55 + dx * 0.45;
  _vy = _vy * 0.55 + dy * 0.45;
  _px = ev.clientX;
  _py = ev.clientY;
}

function _onDown(): void {
  _pressed = true;
  for (let i = 0; i < 6; i++) {
    spawnStar(_px, _py, Math.random() > 0.5 ? '#9933ff' : '#33ff66');
  }
}

function _onUp(): void {
  _pressed = false;
}

function _loop(): void {
  const hand = document.getElementById(HAND_ID);
  if (hand) {
    const speed     = Math.sqrt(_vx * _vx + _vy * _vy);
    const targetRot = speed > 1 ? Math.max(-22, Math.min(22, _vx * 0.75)) : 0;
    _rot += (targetRot - _rot) * 0.13;

    hand.style.transform = `translate(${(_px - 12).toFixed(1)}px, ${(_py - 6).toFixed(1)}px)`;

    const svg = hand.querySelector('svg');
    if (svg) {
      svg.style.transform       = `rotate(${_rot.toFixed(1)}deg) scaleY(${_pressed ? 0.94 : 1})`;
      svg.style.transformOrigin = '38px 52px';
    }

    _vx *= 0.86;
    _vy *= 0.86;
  }
  requestAnimationFrame(_loop);
}

// ── API publique ──────────────────────────────────────────────

/** Appelé UNE SEULE FOIS depuis main.ts avant Phaser. */
export function bootCursor(): void {
  if (_installed) return;
  _installed = true;

  const style = document.createElement('style');
  style.id    = STYLE_ID;
  style.textContent = 'html, html * { cursor: none !important; }';
  document.head.appendChild(style);

  const hand = document.createElement('div');
  hand.id = HAND_ID;
  hand.style.cssText = [
    'position:fixed', 'left:0', 'top:0',
    'width:72px', 'height:92px',
    'pointer-events:none',
    'z-index:9999',
    'will-change:transform',
  ].join(';');
  hand.innerHTML = buildHandSVG(0, false);
  document.body.appendChild(hand);

  window.addEventListener('mousemove', _onMove, { passive: true });
  window.addEventListener('mousedown', _onDown);
  window.addEventListener('mouseup',   _onUp);

  requestAnimationFrame(_loop);
}

/** No-op — compatibilité avec les appels existants dans les scènes. */
export function installSkullCursor(): void { /* global singleton, rien à faire */ }
export function removeSkullCursor():  void { /* global singleton, rien à faire */ }
