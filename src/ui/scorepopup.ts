// ============================================================
// GOETIA — Score Popups flottants
// Un div par livraison, monte et s'estompe en 1.2s.
// Couleur selon valeur : vert normal, or combo, blanc sérafin.
// ============================================================

const POOL_MAX = 20;
let _pool: HTMLDivElement[] = [];

function getDiv(): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:500',
    'font-family:\'Courier New\',monospace',
    'font-size:15px',
    'font-weight:bold',
    'letter-spacing:0.08em',
    'transition:opacity 0.9s ease-out, transform 1.1s ease-out',
    'will-change:transform,opacity',
  ].join(';');
  return d;
}

/**
 * Affiche un popup flottant.
 * @param label  Texte à afficher (ex. "+24 x3 combo!")
 * @param pts    Valeur numérique (détermine la couleur)
 * @param pos    Position écran {x,y} ou null (apparait en haut du canvas)
 */
export function spawnScorePopup(
  label: string,
  pts:   number,
  pos:   { x: number; y: number } | null,
): void {
  const x = pos?.x ?? (400 + Math.random() * 480);
  const y = pos?.y ?? (80  + Math.random() * 60);

  const color =
    label.includes('combo') ? '#ffcc33' :
    label.includes('★')     ? '#ffffff' :
    pts >= 30               ? '#ccff33' :
    '#33ff66';

  const shadow =
    label.includes('combo') ? '0 0 12px #ffcc3388' :
    label.includes('★')     ? '0 0 16px #ffffff88' :
    '0 0 8px #33ff6644';

  const d = getDiv();
  d.textContent  = label;
  d.style.color  = color;
  d.style.textShadow = shadow;
  d.style.left   = `${x}px`;
  d.style.top    = `${y}px`;
  d.style.opacity = '1';
  d.style.transform = 'translateY(0px)';
  document.body.appendChild(d);

  // Anim : monte + fade
  requestAnimationFrame(() => {
    d.style.opacity   = '0';
    d.style.transform = `translateY(-${36 + pts * 0.4}px)`;
  });

  setTimeout(() => d.remove(), 1250);

  // Garde le pool propre
  _pool.push(d);
  if (_pool.length > POOL_MAX) {
    _pool.shift()?.remove();
  }
}

export function clearScorePopups(): void {
  _pool.forEach(d => d.remove());
  _pool = [];
}
