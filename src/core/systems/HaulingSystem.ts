// ============================================================
// GOETIA — HaulingSystem v3
// Émet CORPSE_DELIVERED avec worldPos (position de la fosse)
// pour que le popup flottant apparaisse au bon endroit.
// ============================================================

import type { GameSystem, SimContext, WorldState, Hauler } from '../types';
import { getAvailableCorpses, getEmptyPits, moveToward, dist } from '../world';
import { EventBus } from '../events';

const PICKUP_RANGE  = 8;
const DELIVER_RANGE = 8;
const STANDARD_HAULERS = new Set(['bifrons', 'murmur', 'gamigin', 'leraje']);

export class HaulingSystem implements GameSystem {
  readonly name = 'HaulingSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const hauler of world.haulers.values()) {
      if (hauler.hp <= 0) continue;
      if (!STANDARD_HAULERS.has(hauler.demonName)) continue;
      this._tick(hauler, world);
    }
  }

  private _tick(h: Hauler, world: WorldState): void {
    switch (h.task.kind) {
      case 'idle':    this._assignTask(h, world); break;
      case 'pickup':  this._doPickup(h, world);   break;
      case 'deliver': this._doDeliver(h, world);  break;
      case 'evade':   h.task = { kind: 'idle' };  break;
    }
  }

  private _assignTask(h: Hauler, world: WorldState): void {
    const corpses = getAvailableCorpses(world);
    const pits    = getEmptyPits(world);
    if (!corpses.length || !pits.length) return;
    corpses.sort((a, b) => dist(h.pos, a.pos) - dist(h.pos, b.pos));
    const target = corpses[0];
    target.reservedBy = h.id;
    h.task = { kind: 'pickup', corpseId: target.id };
  }

  private _doPickup(h: Hauler, world: WorldState): void {
    if (h.task.kind !== 'pickup') return;
    const corpse = world.corpses.get(h.task.corpseId);
    if (!corpse || corpse.freshness01 <= 0) { h.task = { kind: 'idle' }; return; }
    h.pos = moveToward(h.pos, corpse.pos, h.speed);
    if (dist(h.pos, corpse.pos) < PICKUP_RANGE) {
      h.carriedCorpseId = corpse.id;
      const pits = getEmptyPits(world);
      if (!pits.length) { h.task = { kind: 'idle' }; return; }
      pits.sort((a, b) => dist(h.pos, a.pos) - dist(h.pos, b.pos));
      const pit = pits[0];
      pit.state = 'loading';
      h.task = { kind: 'deliver', corpseId: corpse.id, targetPitId: pit.id };
    }
  }

  private _doDeliver(h: Hauler, world: WorldState): void {
    if (h.task.kind !== 'deliver') return;
    const pit    = world.pits.get(h.task.targetPitId);
    const corpse = world.corpses.get(h.task.corpseId);
    if (!pit || !corpse) { h.task = { kind: 'idle' }; h.carriedCorpseId = undefined; return; }

    h.pos      = moveToward(h.pos, pit.pos, h.speed);
    corpse.pos = { ...h.pos };

    if (dist(h.pos, pit.pos) < DELIVER_RANGE) {
      // Émettre avant modification d'état
      EventBus.emit({
        type:        'CORPSE_DELIVERED',
        corpseId:    corpse.id,
        pitId:       pit.id,
        freshness:   corpse.freshness01,
        soulQuality: corpse.soulId ? (world.souls.get(corpse.soulId)?.quality ?? null) : null,
        corpseType:  corpse.tags.includes('large')   ? 'large'
                   : corpse.tags.includes('priest')  ? 'priest'
                   : corpse.tags.includes('soldier') ? 'soldier'
                   : 'human',
        worldPos:    { x: pit.pos.x, y: pit.pos.y - 20 },  // au-dessus de la fosse
      });

      pit.state            = 'processing';
      pit.corpseId         = corpse.id;
      pit.soulId           = corpse.soulId;
      pit.progressTick     = 30;
      pit.assignedUnitType = 'leraje';
      corpse.reservedBy    = undefined;
      h.carriedCorpseId    = undefined;
      h.task = { kind: 'idle' };
    }
  }
}
