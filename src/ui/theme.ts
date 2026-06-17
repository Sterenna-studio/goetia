// ============================================================
// GOETIA — Palette thématique néromancien
// Source unique de vérité pour toutes les couleurs.
// ============================================================

// Couleurs Phaser (0xRRGGBB)
export const C = {
  // Fond & structure
  BG:           0x050a05,
  GRID:         0x0d1a0d,
  BORDER:       0x1a3320,

  // Démons porteurs
  BIFRONS:      0x33ff66,   // vert vif
  BATHIN:       0x9933ff,   // violet électrique
  SEIR:         0x66ffcc,   // cyan menthe
  MURMUR:       0xff9933,   // ambre
  GAMIGIN:      0xccff33,   // jaune-vert acide

  // Entités monde
  CORPSE:       0x335533,
  CORPSE_FRESH: 0x55aa55,
  SOUL:         0x55ff99,
  BLESSED:      0xeeffee,
  EXTRACTOR_RING: 0xff9933,

  // Fosses
  PIT_IDLE:     0x1a331a,
  PIT_ACTIVE:   0x33ff66,
  PIT_PROGRESS: 0x00cc44,

  // Combat
  UNIT:         0x33ff66,
  UNIT_BORDER:  0x006622,
  ENEMY_SOL:    0x990000,
  ENEMY_PRIEST: 0xdddddd,
  ENEMY_KNIGHT: 0x553300,
  ENEMY_HP_BG:  0x1a0000,
  ARMOR_RING:   0xaa6600,

  // UI acc
  ACCENT:       0x33ff66,
  ACCENT2:      0x9933ff,
  WARNING:      0xff6600,
  DIM:          0x1a2a1a,
} as const;

// CSS équivalents
export const CSS = {
  BG:           '#050a05',
  BORDER:       '#1a4422',
  ACCENT:       '#33ff66',
  ACCENT2:      '#9933ff',
  ACCENT_DIM:   '#1a5533',
  WARNING:      '#ff6600',
  TEXT:         '#99ddaa',
  TEXT_DIM:     '#3a6644',
  TEXT_BRIGHT:  '#ccffcc',
  SCORE:        '#33ff66',
  WAVE:         '#9933ff',
  CORPSE:       '#336633',
  SOUL:         '#55ff99',
  HAULER:       '#33ff66',
  UNIT:         '#33ff66',
  ENEMY:        '#cc0000',
  PIT:          '#33ff66',

  BIFRONS:      '#33ff66',
  BATHIN:       '#9933ff',
  SEIR:         '#66ffcc',
  MURMUR:       '#ff9933',
  GAMIGIN:      '#ccff33',
} as const;
