// ============================================================
// GOETIA — WorldState factory + entity helpers
// Aucune dépendance Phaser. Pure simulation.
// ============================================================

import type {
  WorldState,
  EntityId,
  Vec2,
  Corpse,
  CorpseTag,
  Soul,
  SoulQuality,
  Hauler,
  DemonName,
  Pit,
  Unit,
  Enemy,
} from './types';

// --- ID generator ---
let _idCounter = 0;
export function newId(prefix = 'e'): EntityId {
  return `${prefix}_${++_idCounter}`;
}

// --- WorldState initial ---
export function createWorld(): WorldState {
  return {
    tick: 0,
    corpses: new Map(),
    souls: new Map(),
    haulers: new Map(),
    pits: new Map(),
    units: new Map(),
    enemies: new Map(),
    resources: {
      soulsAvailable: 0,
      corpsesAvailable: 0,
    },
  };
}

// --- Entity helpers ---

export function spawnCorpse(
  world: WorldState,
  pos: Vec2,
  tags: CorpseTag[] = ['human'],
  mass = 1.0
): Corpse {
  const corpse: Corpse = {
    id: newId('corpse'),
    pos: { ...pos },
    mass,
    freshness01: 1.0,
    soulAttached: false,
    tags,
    createdAtTick: world.tick,
  };
  world.corpses.set(corpse.id, corpse);
  world.resources.corpsesAvailable++;
  return corpse;
}

export function spawnSoul(
  world: WorldState,
  corpse: Corpse,
  quality: SoulQuality = 'common'
): Soul {
  const soul: Soul = {
    id: newId('soul'),
    originCorpseId: corpse.id,
    pos: { ...corpse.pos },
    quality,
    stability01: 1.0,
    captured: false,
    createdAtTick: world.tick,
  };
  world.souls.set(soul.id, soul);
  corpse.soulAttached = true;
  corpse.soulId = soul.id;
  world.resources.soulsAvailable++;
  return soul;
}

export function spawnHauler(
  world: WorldState,
  pos: Vec2,
  demonName: DemonName = 'bifrons'
): Hauler {
  const hauler: Hauler = {
    id: newId('hauler'),
    demonName,
    pos: { ...pos },
    hp: 30,
    speed: demonName === 'seir' ? 4.0 : demonName === 'bathin' ? 2.5 : 1.5,
    carryCapacity: 1,
    task: { kind: 'idle' },
    createdAtTick: world.tick,
  };
  world.haulers.set(hauler.id, hauler);
  return hauler;
}

export function spawnPit(
  world: WorldState,
  pos: Vec2
): Pit {
  const pit: Pit = {
    id: newId('pit'),
    pos: { ...pos },
    state: 'empty',
    progressTick: 0,
  };
  world.pits.set(pit.id, pit);
  return pit;
}

export function spawnEnemy(
  world: WorldState,
  pos: Vec2,
  hp = 20,
  damage = 5,
  speed = 1.0
): Enemy {
  const enemy: Enemy = {
    id: newId('enemy'),
    pos: { ...pos },
    hp,
    maxHp: hp,
    speed,
    damage,
    state: 'move',
    dropsCorpse: true,
    createdAtTick: world.tick,
  };
  world.enemies.set(enemy.id, enemy);
  return enemy;
}

// --- Helpers de requête ---

export function getAvailableCorpses(world: WorldState): Corpse[] {
  return [...world.corpses.values()].filter(
    (c) => !c.reservedBy && c.freshness01 > 0 && !c.soulAttached
  );
}

export function getAvailableSouls(world: WorldState): Soul[] {
  return [...world.souls.values()].filter(
    (s) => !s.captured && s.stability01 > 0
  );
}

export function getIdleHaulers(world: WorldState): Hauler[] {
  return [...world.haulers.values()].filter(
    (h) => h.task.kind === 'idle' && h.hp > 0
  );
}

export function getEmptyPits(world: WorldState): Pit[] {
  return [...world.pits.values()].filter((p) => p.state === 'empty');
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function moveToward(pos: Vec2, target: Vec2, speed: number): Vec2 {
  const d = dist(pos, target);
  if (d < speed) return { ...target };
  const ratio = speed / d;
  return {
    x: pos.x + (target.x - pos.x) * ratio,
    y: pos.y + (target.y - pos.y) * ratio,
  };
}
