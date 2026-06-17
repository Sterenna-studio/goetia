// ============================================================
// GOETIA — Système de particules léger (Canvas 2D pur)
// Aucune dépendance externe — overlay transparent par-dessus Phaser.
//
// Types d'événements :
//   'pickup'   — étincelles quand un porteur charge un cadavre
//   'deliver'  — explosion de particules à la fosse
//   'blink'    — anneau éphémère Seir (téléportation)
//   'dust'     — traînée de poussière pour porteurs normaux
//   'extract'  — spirale lumineuse Murmur/Gamigin
// ============================================================

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;   // 0..1, décroît chaque frame
  decay: number;  // vitesse de déclin
  size: number;
  color: string;
  type: 'spark' | 'ring' | 'dust' | 'spiral';
  // Pour les rings : rayon croissant
  radius?: number;
  maxRadius?: number;
}

const CANVAS_ID = 'goetia-particles';
let canvas: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId = 0;

export function initParticles(): void {
  const old = document.getElementById(CANVAS_ID);
  if (old) old.remove();

  canvas = document.createElement('canvas');
  canvas.id = CANVAS_ID;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = `
    position:fixed; top:0; left:0;
    pointer-events:none; z-index:99;
  `;
  document.body.appendChild(canvas);
  ctx2d = canvas.getContext('2d')!;
  particles = [];

  if (rafId) cancelAnimationFrame(rafId);
  loop();
}

export function destroyParticles(): void {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  document.getElementById(CANVAS_ID)?.remove();
  canvas = null; ctx2d = null; particles = [];
}

// ―― API publique ――

export function fxPickup(x: number, y: number, color = '#9966cc'): void {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1, decay: 0.045 + Math.random() * 0.03,
      size: 2 + Math.random() * 2,
      color, type: 'spark',
    });
  }
}

export function fxDeliver(x: number, y: number, color = '#ffaa00'): void {
  // Burst d'étincelles
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 2.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1, decay: 0.03 + Math.random() * 0.025,
      size: 2.5 + Math.random() * 2,
      color, type: 'spark',
    });
  }
  // Anneau d'impact
  particles.push({
    x, y, vx: 0, vy: 0,
    life: 1, decay: 0.06,
    size: 2, color,
    type: 'ring', radius: 4, maxRadius: 36,
  });
}

export function fxBlink(x: number, y: number): void {
  // Double anneau Seir
  for (const maxR of [30, 50]) {
    particles.push({
      x, y, vx: 0, vy: 0,
      life: 1, decay: 0.07,
      size: 1.5, color: '#ffaa44',
      type: 'ring', radius: 2, maxRadius: maxR,
    });
  }
  // Petites étincelles orange
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (0.5 + Math.random()),
      vy: Math.sin(a) * (0.5 + Math.random()),
      life: 1, decay: 0.06,
      size: 1.5, color: '#ffdd88', type: 'spark',
    });
  }
}

export function fxDust(x: number, y: number, color = '#9966cc'): void {
  if (Math.random() > 0.25) return; // 25% chance par tick pour ne pas saturer
  particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + 8,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.2 - Math.random() * 0.3,
    life: 1, decay: 0.04,
    size: 2 + Math.random() * 1.5,
    color, type: 'dust',
  });
}

export function fxExtract(x: number, y: number, color = '#cc8844'): void {
  if (Math.random() > 0.4) return;
  const angle = Math.random() * Math.PI * 2;
  const r = 14 + Math.random() * 8;
  particles.push({
    x: x + Math.cos(angle) * r,
    y: y + Math.sin(angle) * r,
    vx: -Math.cos(angle) * 0.6,
    vy: -Math.sin(angle) * 0.6 - 0.4,
    life: 1, decay: 0.055,
    size: 2, color, type: 'spiral',
  });
}

// ―― Boucle interne ――

function loop(): void {
  rafId = requestAnimationFrame(loop);
  if (!ctx2d || !canvas) return;

  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }

    ctx2d.globalAlpha = Math.max(0, p.life);

    if (p.type === 'ring') {
      const t = 1 - p.life;
      p.radius = 4 + (p.maxRadius! - 4) * t;
      ctx2d.strokeStyle = p.color;
      ctx2d.lineWidth   = p.size * p.life;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.radius!, 0, Math.PI * 2);
      ctx2d.stroke();
    } else {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.04; // gravité légère
      ctx2d.fillStyle = p.color;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx2d.fill();
    }
  }
  ctx2d.globalAlpha = 1;
}
