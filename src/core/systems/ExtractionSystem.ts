// ============================================================
// GOETIA — ExtractionSystem
// Murmur : extrait à vitesse normale, bonus sur cadavres bénits.
// Gamigin : extrait 2× plus vite, qualité +1 rang.
// Les deux se déplacent activement vers les cadavres sans âme.
// ============================================================

import type { GameSystem, SimContext, WorldState, Hauler, Corpse, SoulQuality } from '../types';
import { dist, moveToward, spawnSoul } from '../world';

const EXTRACT_TICKS_MURMUR  = 40;
const EXTRACT_TICKS_GAMIGIN = 20;
const EXTRACT_RANGE = 10;

const EXTRACTOR_DEMONS = new Set(['murmur', 'gamigin']);

export class ExtractionSystem implements GameSystem {
  readonly name = 'ExtractionSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const hauler of world.haulers.values()) {
      if (hauler.hp <= 0) continue;
      if (!EXTRACTOR_DEMONS.has(hauler.demonName)) continue;
      this._tick(hauler, world);
    }
  }

  private _tick(hauler: Hauler, world: WorldState): void {
    switch (hauler.task.kind) {
      case 'idle':    this._assign(hauler, world); break;
      case 'extract': this._doExtract(hauler, world); break;
    }
  }

  private _assign(hauler: Hauler, world: WorldState): void {
    const candidates = [...world.corpses.values()].filter(
      c => !c.soulAttached && c.freshness01 > 0.2 && !c.extractorId
    );
    if (candidates.length === 0) return;
    candidates.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const target = candidates[0];
    target.extractorId = hauler.id;
    const ticks = hauler.demonName === 'gamigin' ? EXTRACT_TICKS_GAMIGIN : EXTRACT_TICKS_MURMUR;
    hauler.task = { kind: 'extract', corpseId: target.id, ticksLeft: ticks };
  }

  private _doExtract(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'extract') return;
    const corpse = world.corpses.get(hauler.task.corpseId);

    if (!corpse || corpse.soulAttached || corpse.freshness01 <= 0) {
      this._releaseCorpse(hauler.task.corpseId, world);
      hauler.task = { kind: 'idle' };
      return;
    }

    hauler.pos = moveToward(hauler.pos, corpse.pos, hauler.speed);
    if (dist(hauler.pos, corpse.pos) > EXTRACT_RANGE) return;

    hauler.task.ticksLeft--;

    if (hauler.task.ticksLeft <= 0) {
      const quality = this._quality(hauler.demonName, corpse);
      spawnSoul(world, corpse, quality);
      this._releaseCorpse(corpse.id, world);
      hauler.task = { kind: 'idle' };
    }
  }

  private _releaseCorpse(corpseId: string, world: WorldState): void {
    const c = world.corpses.get(corpseId);
    if (c) c.extractorId = undefined;
  }

  private _quality(demonName: string, corpse: Corpse): SoulQuality {
    const rankOrder: SoulQuality[] = ['faint', 'common', 'potent', 'sainted'];
    let base: SoulQuality;
    if (corpse.tags.includes('priest'))        base = 'sainted';
    else if (corpse.blessed)                   base = 'sainted';
    else if (corpse.tags.includes('soldier'))  base = 'potent';
    else if (corpse.tags.includes('burned'))   base = 'tainted';
    else                                       base = 'common';

    if (demonName === 'gamigin' && base !== 'tainted') {
      const idx = rankOrder.indexOf(base);
      if (idx >= 0 && idx < rankOrder.length - 1) base = rankOrder[idx + 1];
    }
    return base;
  }
}
