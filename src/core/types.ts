// ============================================================
// GOETIA — Core Types
// Tous les contrats de la simulation. Aucune dépendance Phaser.
// ============================================================

// --- Primitives ---

export type EntityId = string;
export type Tick = number;
export type DemonName = string;

export interface Vec2 {
  x: number;
  y: number;
}

// --- Âmes (Murmur / Gamigin) ---

export type SoulQuality =
  | "faint"    // âme trop faible, peu utile
  | "common"   // qualité standard
  | "potent"   // âme puissante
  | "sainted"  // rare, corps de prêtre/noble
  | "tainted"; // corrompue — effets secondaires possibles

export interface Soul {
  id: EntityId;
  originCorpseId: EntityId;
  pos: Vec2;
  quality: SoulQuality;
  stability01: number;   // 1.0 = stable, 0.0 = dissipée
  captured: boolean;
  createdAtTick: Tick;
}

// --- Cadavres ---

export type CorpseTag =
  | "human"
  | "soldier"
  | "priest"
  | "burned"
  | "crushed"
  | "large";

export interface Corpse {
  id: EntityId;
  pos: Vec2;
  mass: number;
  freshness01: number;       // 1.0 = frais, 0.0 = inutilisable
  soulAttached: boolean;
  soulId?: EntityId;         // référence à l'âme extraite
  reservedBy?: EntityId;     // Bifrons qui l'a réservé
  sourceUnitType?: string;   // si vient d'un ennemi tué
  tags: CorpseTag[];
  createdAtTick: Tick;
}

// --- Porteurs / Haulers (Bifrons / Bathin / Seir) ---

export type HaulerTask =
  | { kind: "idle" }
  | { kind: "pickup";  corpseId: EntityId }
  | { kind: "deliver"; corpseId: EntityId; targetPitId: EntityId }
  | { kind: "evade";   threatPos: Vec2 };

export interface Hauler {
  id: EntityId;
  demonName: DemonName;      // "bifrons" | "bathin" | "seir"
  pos: Vec2;
  hp: number;
  speed: number;
  carryCapacity: number;
  carriedCorpseId?: EntityId;
  task: HaulerTask;
  createdAtTick: Tick;
}

// --- Fosses de production ---

export type PitState =
  | "empty"
  | "loading"    // Bifrons en chemin
  | "processing" // rituel en cours
  | "ready";     // unité prête à spawner

export interface Pit {
  id: EntityId;
  pos: Vec2;
  state: PitState;
  corpseId?: EntityId;
  soulId?: EntityId;
  progressTick: number;      // ticks restants avant spawn
  assignedUnitType?: string; // quelle unité sera produite
}

// --- Unités produites (ex: Leraje) ---

export type UnitState = "idle" | "move" | "attack" | "guard" | "dead";
export type UnitBehavior = "swarm" | "tank" | "ranged" | "support";

export interface Unit {
  id: EntityId;
  archetypeId: string;       // référence à UnitDefinition (ex: "leraje")
  demonName: DemonName;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: UnitState;
  targetId?: EntityId;
  createdAtTick: Tick;
}

// --- Définitions d'unités (data-driven JSON) ---

export interface UnitDefinition {
  id: string;                // "leraje"
  demonName: DemonName;      // "Leraje"
  rank: string;              // "Marquis"
  legions: number;           // 30
  tier: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  sourceBodyTags: CorpseTag[];
  sourceSoulQualities: SoulQuality[];
  cost: {
    corpses: number;
    souls: number;
    ticksToProduce: number;
  };
  stats: {
    hp: number;
    speed: number;
    damage: number;
    range: number;           // 0 = mêlée, >0 = ranged (Leraje)
    aggro: number;
  };
  behavior: UnitBehavior;
}

// --- Ennemis ---

export type EnemyState = "idle" | "move" | "attack" | "dead";

export interface Enemy {
  id: EntityId;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: EnemyState;
  targetId?: EntityId;
  dropsCorpse: boolean;      // si true → spawn Corpse à la mort
  createdAtTick: Tick;
}

// --- WorldState — état global de la simulation ---

export interface WorldState {
  tick: Tick;
  corpses: Map<EntityId, Corpse>;
  souls: Map<EntityId, Soul>;
  haulers: Map<EntityId, Hauler>;
  pits: Map<EntityId, Pit>;
  units: Map<EntityId, Unit>;
  enemies: Map<EntityId, Enemy>;
  resources: {
    soulsAvailable: number;
    corpsesAvailable: number;
  };
}

// --- Système de commandes (Input → Core) ---

export type GameCommand =
  | { type: "SPAWN_HAULER"; demonName: DemonName; pos: Vec2 }
  | { type: "ASSIGN_PIT";   pitId: EntityId; unitType: string }
  | { type: "RESTART" };

// --- Contexte de simulation (passé à chaque System.update) ---

export interface SimContext {
  tick: Tick;
  dtMs: number;
  rngSeed: number;
  commands: readonly GameCommand[];
}

// --- Interface commune des systèmes ---

export interface GameSystem {
  readonly name: string;
  update(ctx: SimContext, world: WorldState): void;
}