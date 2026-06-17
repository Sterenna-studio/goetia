// ============================================================
// GOETIA — Menu radial sélection démon
// Clic droit = ouvre le radial. Clic sur un secteur = sélectionne.
// ============================================================

export interface DemonOption {
  id: string;
  label: string;
  role: string;
  color: string;
  key: string;
}

export const DEMON_OPTIONS: DemonOption[] = [
  { id: 'bifrons', label: 'Bifrons', role: 'Porteur standard', color: '#9966cc', key: '1' },
  { id: 'bathin',  label: 'Bathin',  role: 'Portée ×2 / Téléport', color: '#44aacc', key: '2' },
  { id: 'seir',    label: 'Seir',    role: 'Vitesse ×2.5', color: '#ffaa44', key: '3' },
];

let selectedIndex = 0;
let menuVisible = false;
let menuX = 0;
let menuY = 0;
let onSelect: ((id: string) => void) | null = null;

export function getSelectedDemon(): DemonOption {
  return DEMON_OPTIONS[selectedIndex];
}

export function initRadial(selectCallback: (id: string) => void): void {
  onSelect = selectCallback;
  if (document.getElementById('goetia-radial')) return;

  const container = document.createElement('div');
  container.id = 'goetia-radial';
  container.style.display = 'none';
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.id = 'goetia-radial-style';
  style.textContent = `
    #goetia-radial {
      position: fixed;
      pointer-events: none;
      z-index: 150;
    }
    .radial-item {
      position: absolute;
      pointer-events: all;
      cursor: pointer;
      background: rgba(10,10,20,0.92);
      border: 1px solid var(--rc);
      border-radius: 8px;
      padding: 8px 16px;
      font-family: monospace;
      font-size: 13px;
      color: var(--rc);
      white-space: nowrap;
      transform: translate(-50%, -50%);
      transition: background 0.1s, transform 0.1s;
      min-width: 140px;
      text-align: center;
    }
    .radial-item:hover {
      background: rgba(40,10,10,0.98);
      transform: translate(-50%, -50%) scale(1.08);
    }
    .radial-item.active-demon {
      border-width: 2px;
      box-shadow: 0 0 10px var(--rc);
    }
    .radial-item .ri-key {
      font-size: 10px;
      opacity: 0.5;
      margin-left: 6px;
    }
    .radial-item .ri-role {
      font-size: 10px;
      color: #666;
      display: block;
      margin-top: 2px;
    }
    #radial-hint {
      position: absolute;
      transform: translate(-50%, -50%);
      font-family: monospace;
      font-size: 11px;
      color: #444;
      pointer-events: none;
      text-align: center;
      white-space: nowrap;
    }
  `;
  if (!document.getElementById('goetia-radial-style')) document.head.appendChild(style);

  // Fermer sur clic ailleurs
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.radial-item')) hideRadial();
  });
}

export function showRadial(x: number, y: number): void {
  const container = document.getElementById('goetia-radial')!;
  container.style.display = 'block';
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  container.innerHTML = '';
  menuVisible = true;
  menuX = x;
  menuY = y;

  // Hint central
  const hint = document.createElement('div');
  hint.id = 'radial-hint';
  hint.textContent = 'Invoquer…';
  hint.style.left = '0px';
  hint.style.top = '0px';
  container.appendChild(hint);

  // Items en arc
  const angles = [-90, 30, 150]; // haut, bas-droite, bas-gauche
  const radius = 80;

  DEMON_OPTIONS.forEach((d, i) => {
    const angle = (angles[i] * Math.PI) / 180;
    const ix = Math.cos(angle) * radius;
    const iy = Math.sin(angle) * radius;

    const item = document.createElement('div');
    item.className = 'radial-item' + (i === selectedIndex ? ' active-demon' : '');
    item.style.setProperty('--rc', d.color);
    item.style.left = `${ix}px`;
    item.style.top = `${iy}px`;
    item.innerHTML = `
      <strong>${d.label}</strong><span class="ri-key">[${d.key}]</span>
      <span class="ri-role">${d.role}</span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedIndex = i;
      hideRadial();
      onSelect?.(d.id);
    });
    container.appendChild(item);
  });
}

export function hideRadial(): void {
  if (!menuVisible) return;
  menuVisible = false;
  const container = document.getElementById('goetia-radial');
  if (container) container.style.display = 'none';
}

export function isRadialVisible(): boolean { return menuVisible; }

export function selectDemonByKey(key: string): boolean {
  const i = DEMON_OPTIONS.findIndex(d => d.key === key);
  if (i === -1) return false;
  selectedIndex = i;
  onSelect?.(DEMON_OPTIONS[i].id);
  return true;
}
