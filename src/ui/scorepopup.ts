// ============================================================
// GOETIA — Score Popups flottants v2
// Accepte maintenant des coords monde {wx, wy} + caméra Phaser
// pour convertir en pixels écran.
// ============================================================

const POOL_MAX = 24;
const _pool: HTMLDivElement[] = [];

/** Optionnel : enregistrer la caméra Phaser une fois la scène créée. */
let _cam: { worldView: { x: number; y: number }; zoom: number } | null = null;

export function registerCamera(
  cam: { worldView: { x: number; y: number }; zoom: number }
): void {
  _cam = cam;
}

/**
 * Convertit des coordonnées monde Phaser en pixels écran.
 * Si la caméra n'est pas enregistrée, utilise les coords brutes.
 */
function worldToScreen(wx: number, wy: number): { x: number; y: number } {
  if (!_cam) return { x: wx, y: wy };
  return {
    x: (wx - _cam.worldView.x) * _cam.zoom,
    y: (wy - _cam.worldView.y) * _cam.zoom,
  };
}

/**
 * Affiche un popup flottant.
 * @param label  Texte (ex. "+24 x3 combo!")
 * @param pts    Points numériques (influence couleur + montée)
 * @param worldPos  Position monde {x, y} | null → position aléatoire canvas
 */
export function spawnScorePopup(
  label:    string,
  pts:      number,
  worldPos: { x: number; y: number } | null,
): void {
  const screen = worldPos
    ? worldToScreen(worldPos.x, worldPos.y)
    : { x: 400 + Math.random() * 480, y: 80 + Math.random() * 60 };

  const color =
    label.includes('combo') ? '#ffcc33' :
    label.includes('\u2605')     ? '#ffffff' :
    pts >= 30               ? '#ccff33' :
    '#33ff66';

  const shadow =
    label.includes('combo') ? '0 0 14px #ffcc3388' :
    label.includes('\u2605')     ? '0 0 18px #ffffff88' :
    '0 0 8px #33ff6644';

  const d = document.createElement('div');
  d.style.cssText = [
    'position:fixed',
    `left:${screen.x.toFixed(0)}px`,
    `top:${screen.y.toFixed(0)}px`,
    'pointer-events:none',
    'z-index:500',
    "font-family:'Courier New',monospace",
    'font-size:15px',
    'font-weight:bold',
    'letter-spacing:0.08em',
    `color:${color}`,
    `text-shadow:${shadow}`,
    'opacity:1',
    'transform:translateY(0px)',
    'transition:opacity 0.85s ease-out, transform 1.0s ease-out',
    'will-change:transform,opacity',
    'white-space:nowrap',
  ].join(';');
  d.textContent = label;
  document.body.appendChild(d);

  requestAnimationFrame(() => {
    d.style.opacity   = '0';
    d.style.transform = `translateY(-${(34 + pts * 0.4).toFixed(0)}px)`;
  });

  setTimeout(() => { d.remove(); _pool.splice(_pool.indexOf(d), 1); }, 1100);

  _pool.push(d);
  if (_pool.length > POOL_MAX) _pool.shift()?.remove();
}

export function clearScorePopups(): void {
  _pool.forEach(d => d.remove());
  _pool.length = 0;
}
