// ============================================================
// GOETIA — HaulingSystem (Bifrons)
// Réservation, ramassage et livraison des corps à la fosse.
// ============================================================

import type { GameSystem, SimContext, WorldState, Hauler } from '../types';
import { getAvailableCorpses, getEmptyPits, moveToward, dist } from '../world';

const PICKUP_RANGE = 8;
const DELIVER_RANGE = 8;

export class HaulingSystem implements GameSystem {
  readonly name = 'HaulingSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const hauler of world.haulers.values()) {
      if (hauler.hp <= 0) continue;
      this._tick(hauler, world);
    }
  }

  private _tick(hauler: Hauler, world: WorldState): void {
    switch (hauler.task.kind) {
      case 'idle':    this._assignTask(hauler, world); break;
      case 'pickup':  this._doPickup(hauler, world);   break;
      case 'deliver': this._doDeliver(hauler, world);  break;
      case 'evade':   hauler.task = { kind: 'idle' };  break;
    }
  }

  private _assignTask(hauler: Hauler, world: WorldState): void {
    const corpses = getAvailableCorpses(world);
    const pits = getEmptyPits(world);
    if (corpses.length === 0 || pits.length === 0) return;
    corpses.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const target = corpses[0];
    target.reservedBy = hauler.id;
    hauler.task = { kind: 'pickup', corpseId: target.id };
  }

  private _doPickup(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'pickup') return;
    const corpse = world.corpses.get(hauler.task.corpseId);
    if (!corpse || corpse.freshness01 <= 0) { hauler.task = { kind: 'idle' }; return; }

    hauler.pos = moveToward(hauler.pos, corpse.pos, hauler.speed);

    if (dist(hauler.pos, corpse.pos) < PICKUP_RANGE) {
      hauler.carriedCorpseId = corpse.id;
      const pits = getEmptyPits(world);
      if (pits.length === 0) { hauler.task = { kind: 'idle' }; return; }
      pits.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
      const pit = pits[0];
      pit.state = 'loading';
      hauler.task = { kind: 'deliver', corpseId: corpse.id, targetPitId: pit.id };
    }
  }

  private _doDeliver(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'deliver') return;
    const pit = world.pits.get(hauler.task.targetPitId);
    const corpse = world.corpses.get(hauler.task.corpseId);
    if (!pit || !corpse) { hauler.task = { kind: 'idle' }; hauler.carriedCorpseId = undefined; return; }

    hauler.pos = moveToward(hauler.pos, pit.pos, hauler.speed);
    corpse.pos = { ...hauler.pos };

    if (dist(hauler.pos, pit.pos) < DELIVER_RANGE) {
      pit.state = 'processing';
      pit.corpseId = corpse.id;
      pit.soulId = corpse.soulId;
      pit.progressTick = 30;
      pit.assignedUnitType = 'leraje';
      corpse.reservedBy = undefined;
      hauler.carriedCorpseId = undefined;
      hauler.task = { kind: 'idle' };
    }
  }
}
