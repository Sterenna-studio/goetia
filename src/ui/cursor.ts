// ============================================================
// GOETIA — Curseur main squelettique SVG
// Injecte un curseur CSS data:URI + un halo canvas au clic.
// ============================================================

const SKULL_HAND_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <!-- Paume -->
  <rect x="7" y="18" width="18" height="16" rx="3" fill="%230a1a0a" stroke="%2333ff66" stroke-width="1"/>

  <!-- Doigt index -->
  <rect x="14" y="4" width="5" height="16" rx="2" fill="%230a1a0a" stroke="%2333ff66" stroke-width="1"/>
  <!-- Jointure index -->
  <line x1="14" y1="11" x2="19" y2="11" stroke="%2333ff66" stroke-width="0.7" opacity="0.5"/>

  <!-- Doigt majeur -->
  <rect x="20" y="7" width="5" height="14" rx="2" fill="%230a1a0a" stroke="%2333ff66" stroke-width="1"/>
  <!-- Jointure majeur -->
  <line x1="20" y1="13" x2="25" y2="13" stroke="%2333ff66" stroke-width="0.7" opacity="0.5"/>

  <!-- Doigt annulaire -->
  <rect x="8" y="8" width="5" height="13" rx="2" fill="%230a1a0a" stroke="%2333ff66" stroke-width="1"/>
  <!-- Jointure annulaire -->
  <line x1="8" y1="14" x2="13" y2="14" stroke="%2333ff66" stroke-width="0.7" opacity="0.5"/>

  <!-- Pouce -->
  <rect x="2" y="20" width="7" height="4" rx="2" fill="%230a1a0a" stroke="%2333ff66" stroke-width="1"/>

  <!-- Ongles (traits aux extrémités) -->
  <line x1="15" y1="4" x2="18" y2="4" stroke="%2333ff66" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="21" y1="7" x2="24" y2="7" stroke="%2333ff66" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="9"  y1="8" x2="12" y2="8" stroke="%2333ff66" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Lignes de force (veines/nerfs) -->
  <line x1="16" y1="19" x2="16" y2="33" stroke="%2333ff66" stroke-width="0.5" opacity="0.3"/>
  <line x1="11" y1="19" x2="10" y2="33" stroke="%2333ff66" stroke-width="0.5" opacity="0.2"/>
  <line x1="21" y1="19" x2="22" y2="33" stroke="%2333ff66" stroke-width="0.5" opacity="0.2"/>

  <!-- Anneau runique (poignet) -->
  <ellipse cx="16" cy="34" rx="9" ry="2.5" stroke="%2333ff66" stroke-width="0.8" fill="none" opacity="0.4"/>
</svg>`;

// URL encodée pour CSS cursor
const CURSOR_URL = `url("data:image/svg+xml,${SKULL_HAND_SVG}") 4 0, crosshair`;

let _styleEl: HTMLStyleElement | null = null;

export function installSkullCursor(): void {
  removeSkullCursor();
  _styleEl = document.createElement('style');
  _styleEl.id = 'goetia-cursor-style';
  _styleEl.textContent = `
    * { cursor: ${CURSOR_URL} !important; }
    canvas { cursor: ${CURSOR_URL} !important; }
  `;
  document.head.appendChild(_styleEl);
}

export function removeSkullCursor(): void {
  document.getElementById('goetia-cursor-style')?.remove();
  _styleEl = null;
}
