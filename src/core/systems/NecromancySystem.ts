// ============================================================
// GOETIA — NecromancySystem (Murmur)
// Extrait les âmes des cadavres frais.
// Fait décroître la stabilité des âmes non capturées.
// ============================================================

import type { GameSystem, SimContext, WorldState, Corpse, SoulQuality } from '../types';
import { spawnSoul } from '../world';

const SOUL_DECAY_PER_TICK = 0.02;
const FRESHNESS_DECAY_PER_TICK = 0.005;

export class NecromancySystem implements GameSystem {
  readonly name = 'NecromancySystem';

  update(_ctx: SimContext, world: WorldState): void {
    this._decaySouls(world);
    this._decayCorpses(world);
    this._extractSouls(world);
  }

  private _decaySouls(world: WorldState): void {
    for (const soul of world.souls.values()) {
      if (soul.captured) continue;
      soul.stability01 = Math.max(0, soul.stability01 - SOUL_DECAY_PER_TICK);
      if (soul.stability01 === 0) {
        const corpse = world.corpses.get(soul.originCorpseId);
        if (corpse) { corpse.soulAttached = false; corpse.soulId = undefined; }
        world.souls.delete(soul.id);
        world.resources.soulsAvailable = Math.max(0, world.resources.soulsAvailable - 1);
      }
    }
  }

  private _decayCorpses(world: WorldState): void {
    for (const corpse of world.corpses.values()) {
      corpse.freshness01 = Math.max(0, corpse.freshness01 - FRESHNESS_DECAY_PER_TICK);
      if (corpse.freshness01 === 0) {
        if (corpse.reservedBy) {
          const hauler = world.haulers.get(corpse.reservedBy);
          if (hauler) hauler.task = { kind: 'idle' };
        }
        world.corpses.delete(corpse.id);
        world.resources.corpsesAvailable = Math.max(0, world.resources.corpsesAvailable - 1);
      }
    }
  }

  private _extractSouls(world: WorldState): void {
    for (const corpse of world.corpses.values()) {
      if (corpse.soulAttached) continue;
      if (corpse.freshness01 < 0.3) continue;
      spawnSoul(world, corpse, this._qualityFromCorpse(corpse));
    }
  }

  private _qualityFromCorpse(corpse: Corpse): SoulQuality {
    if (corpse.tags.includes('priest')) return 'sainted';
    if (corpse.tags.includes('soldier')) return 'potent';
    if (corpse.tags.includes('burned')) return 'tainted';
    return 'common';
  }
}
