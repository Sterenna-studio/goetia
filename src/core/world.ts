// ============================================================
// GOETIA — WorldState factory + entity helpers
// ============================================================

import type {
  WorldState, EntityId, Vec2, Corpse, CorpseTag,
  Soul, SoulQuality, Hauler, DemonName, Pit, Enemy, EnemyType,
} from './types';

let _idCounter = 0;
export function newId(prefix = 'e'): EntityId { return `${prefix}_${++_idCounter}`; }

export function createWorld(): WorldState {
  return {
    tick: 0,
    corpses: new Map(),
    souls: new Map(),
    haulers: new Map(),
    pits: new Map(),
    units: new Map(),
    enemies: new Map(),
    resources: { soulsAvailable: 0, corpsesAvailable: 0 },
    blessedZones: [],
  };
}

export function spawnCorpse(world: WorldState, pos: Vec2, tags: CorpseTag[] = ['human'], mass = 1.0): Corpse {
  const corpse: Corpse = {
    id: newId('corpse'), pos: { ...pos }, mass,
    freshness01: 1.0, soulAttached: false, tags,
    createdAtTick: world.tick,
  };
  world.corpses.set(corpse.id, corpse);
  world.resources.corpsesAvailable++;
  return corpse;
}

export function spawnSoul(world: WorldState, corpse: Corpse, quality: SoulQuality = 'common'): Soul {
  const soul: Soul = {
    id: newId('soul'), originCorpseId: corpse.id,
    pos: { ...corpse.pos }, quality, stability01: 1.0,
    captured: false, createdAtTick: world.tick,
  };
  world.souls.set(soul.id, soul);
  corpse.soulAttached = true;
  corpse.soulId = soul.id;
  world.resources.soulsAvailable++;
  return soul;
}

export function spawnHauler(world: WorldState, pos: Vec2, demonName: DemonName = 'bifrons'): Hauler {
  const speedMap: Record<DemonName, number> = {
    bifrons: 1.5, seir: 4.0, bathin: 2.5,
    murmur: 1.0, gamigin: 1.2, leraje: 2.0,
  };
  const hauler: Hauler = {
    id: newId('hauler'), demonName, pos: { ...pos },
    hp: 30, speed: speedMap[demonName] ?? 1.5,
    carryCapacity: demonName === 'bathin' ? 2 : 1,
    task: { kind: 'idle' }, createdAtTick: world.tick,
  };
  world.haulers.set(hauler.id, hauler);
  return hauler;
}

export function spawnPit(world: WorldState, pos: Vec2): Pit {
  const pit: Pit = {
    id: newId('pit'), pos: { ...pos },
    state: 'empty', progressTick: 0,
  };
  world.pits.set(pit.id, pit);
  return pit;
}

export function spawnEnemy(
  world: WorldState,
  pos: Vec2,
  hp = 20,
  damage = 5,
  speed = 1.0,
  type: EnemyType = 'soldier'
): Enemy {
  const configs: Record<EnemyType, Partial<Enemy>> = {
    soldier: { armor: 0, blessRadius: 0, dropsCorpse: true },
    priest:  { armor: 0, blessRadius: 80, dropsCorpse: true, hp: hp * 0.6, damage: damage * 0.5 },
    knight:  { armor: 4, blessRadius: 0, dropsCorpse: true, hp: hp * 2, speed: speed * 0.6 },
  };
  const cfg = configs[type];
  const enemy: Enemy = {
    id: newId('enemy'), type,
    pos: { ...pos },
    hp: (cfg.hp ?? hp),
    maxHp: (cfg.hp ?? hp),
    speed: (cfg.speed ?? speed),
    damage: (cfg.damage ?? damage),
    state: 'move',
    dropsCorpse: cfg.dropsCorpse ?? true,
    armor: cfg.armor ?? 0,
    blessRadius: cfg.blessRadius ?? 0,
    createdAtTick: world.tick,
  };
  world.enemies.set(enemy.id, enemy);
  return enemy;
}

export function getAvailableCorpses(world: WorldState): Corpse[] {
  return [...world.corpses.values()].filter(
    c => !c.reservedBy && c.freshness01 > 0 && !c.soulAttached && !c.blessed
  );
}
export function getAvailableSouls(world: WorldState): Soul[] {
  return [...world.souls.values()].filter(s => !s.captured && s.stability01 > 0);
}
export function getIdleHaulers(world: WorldState): Hauler[] {
  return [...world.haulers.values()].filter(h => h.task.kind === 'idle' && h.hp > 0);
}
export function getEmptyPits(world: WorldState): Pit[] {
  return [...world.pits.values()].filter(p => p.state === 'empty');
}
export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x; const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
export function moveToward(pos: Vec2, target: Vec2, speed: number): Vec2 {
  const d = dist(pos, target);
  if (d < speed) return { ...target };
  return { x: pos.x + (target.x - pos.x) * speed / d, y: pos.y + (target.y - pos.y) * speed / d };
}
