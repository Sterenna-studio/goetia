// ============================================================
// GOETIA — Types core
// ============================================================

export type EntityId = string;
export type Tick = number;
export type DemonName = 'bifrons' | 'murmur' | 'gamigin' | 'bathin' | 'seir' | 'leraje';
export type SoulQuality = 'faint' | 'common' | 'potent' | 'sainted' | 'tainted';
export type CorpseTag = 'human' | 'soldier' | 'priest' | 'burned' | 'crushed' | 'large' | 'knight';
export type EnemyType = 'soldier' | 'priest' | 'knight';

export interface Vec2 { x: number; y: number; }

export interface Corpse {
  id: EntityId;
  pos: Vec2;
  mass: number;
  freshness01: number;
  soulAttached: boolean;
  soulId?: EntityId;
  reservedBy?: EntityId;
  tags: CorpseTag[];
  createdAtTick: Tick;
  blessed?: boolean;
}

export interface Soul {
  id: EntityId;
  originCorpseId: EntityId;
  pos: Vec2;
  quality: SoulQuality;
  stability01: number;
  captured: boolean;
  createdAtTick: Tick;
}

export type HaulerTask =
  | { kind: 'idle' }
  | { kind: 'pickup'; corpseId: EntityId }
  | { kind: 'deliver'; corpseId: EntityId; targetPitId: EntityId }
  | { kind: 'evade'; threatPos: Vec2 };

export interface Hauler {
  id: EntityId;
  demonName: DemonName;
  pos: Vec2;
  hp: number;
  speed: number;
  carryCapacity: number;
  carriedCorpseId?: EntityId;
  task: HaulerTask;
  createdAtTick: Tick;
}

export interface Unit {
  id: EntityId;
  archetypeId: string;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: 'idle' | 'move' | 'attack' | 'dead';
  targetId?: EntityId;
  createdAtTick: Tick;
}

export interface Pit {
  id: EntityId;
  pos: Vec2;
  state: 'empty' | 'loading' | 'processing' | 'ready';
  progressTick: number;
  loadedCorpseId?: EntityId;
  loadedSoulId?: EntityId;
  corpseId?: EntityId;
  soulId?: EntityId;
  assignedUnitType?: string;
}

export interface Enemy {
  id: EntityId;
  type: EnemyType;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: 'move' | 'dead';
  dropsCorpse: boolean;
  armor: number;
  blessRadius: number;
  createdAtTick: Tick;
}

export interface WorldState {
  tick: Tick;
  corpses: Map<EntityId, Corpse>;
  souls: Map<EntityId, Soul>;
  haulers: Map<EntityId, Hauler>;
  pits: Map<EntityId, Pit>;
  units: Map<EntityId, Unit>;
  enemies: Map<EntityId, Enemy>;
  resources: { soulsAvailable: number; corpsesAvailable: number; };
  blessedZones: Array<{ pos: Vec2; radius: number; sourceId: EntityId }>;
}

export interface SimContext {
  tick: Tick;
  dtMs: number;
  rngSeed: number;
  commands: readonly GameCommand[];
}

export interface GameSystem {
  readonly name: string;
  update(ctx: SimContext, world: WorldState): void;
}

export type GameCommand =
  | { type: 'SPAWN_HAULER'; pos: Vec2; demonName: DemonName };
