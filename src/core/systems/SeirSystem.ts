// ============================================================
// GOETIA — SeirSystem
// Seir ne marche pas : il se téléporte instantanément.
//
// Comportement :
//   1. IDLE → cherche un cadavre dispo + une fosse vide
//   2. PICKUP : téléportation instantanée au cadavre (flash)
//   3. DELIVER : téléportation instantanée à la fosse (flash)
//   4. Cooldown de COOLDOWN_TICKS entre chaque téléportation
// ============================================================

import type { GameSystem, SimContext, WorldState, Hauler } from '../types';
import { getAvailableCorpses, getEmptyPits, dist } from '../world';

const COOLDOWN_TICKS = 8;  // ~0.8s entre deux téléportations
const BLINK_DURATION = 3;  // ticks pendant lesquels le flash est visible

const cooldowns = new Map<string, number>();
export const seirFlashes = new Map<string, number>();

export class SeirSystem implements GameSystem {
  readonly name = 'SeirSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const hauler of world.haulers.values()) {
      if (hauler.hp <= 0 || hauler.demonName !== 'seir') continue;
      this._tick(hauler, world);
    }
  }

  private _tick(hauler: Hauler, world: WorldState): void {
    const cd = cooldowns.get(hauler.id) ?? 0;
    if (cd > 0) { cooldowns.set(hauler.id, cd - 1); return; }

    const flash = seirFlashes.get(hauler.id) ?? 0;
    if (flash > 0) seirFlashes.set(hauler.id, flash - 1);

    switch (hauler.task.kind) {
      case 'idle':    this._assign(hauler, world);  break;
      case 'pickup':  this._blink(hauler, world);   break;
      case 'deliver': this._deliver(hauler, world); break;
    }
  }

  private _assign(hauler: Hauler, world: WorldState): void {
    const corpses = getAvailableCorpses(world);
    const pits    = getEmptyPits(world);
    if (corpses.length === 0 || pits.length === 0) return;
    corpses.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const target = corpses[0];
    target.reservedBy = hauler.id;
    hauler.task = { kind: 'pickup', corpseId: target.id };
  }

  private _blink(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'pickup') return;
    const corpse = world.corpses.get(hauler.task.corpseId);
    if (!corpse || corpse.freshness01 <= 0) { hauler.task = { kind: 'idle' }; return; }

    hauler.pos = { ...corpse.pos };
    hauler.carriedCorpseId = corpse.id;
    seirFlashes.set(hauler.id, BLINK_DURATION);

    const pits = getEmptyPits(world);
    if (pits.length === 0) { hauler.task = { kind: 'idle' }; return; }
    pits.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const pit = pits[0];
    pit.state = 'loading';
    hauler.task = { kind: 'deliver', corpseId: corpse.id, targetPitId: pit.id };
    cooldowns.set(hauler.id, COOLDOWN_TICKS);
  }

  private _deliver(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'deliver') return;
    const pit    = world.pits.get(hauler.task.targetPitId);
    const corpse = world.corpses.get(hauler.task.corpseId);
    if (!pit || !corpse) { hauler.task = { kind: 'idle' }; hauler.carriedCorpseId = undefined; return; }

    hauler.pos = { ...pit.pos };
    corpse.pos = { ...pit.pos };
    seirFlashes.set(hauler.id, BLINK_DURATION);

    pit.state            = 'processing';
    pit.corpseId         = corpse.id;
    pit.soulId           = corpse.soulId;
    pit.progressTick     = 30;
    pit.assignedUnitType = 'leraje';
    corpse.reservedBy    = undefined;
    hauler.carriedCorpseId = undefined;
    hauler.task = { kind: 'idle' };
    cooldowns.set(hauler.id, COOLDOWN_TICKS);
  }
}
