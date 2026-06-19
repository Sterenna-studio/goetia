// ============================================================
// GOETIA — BathinSystem
// Bathin : porteur à double capacité.
//
// Flux :
//   IDLE     → réserve cadavre 1 (pickup)
//   PICKUP   → marche vers cadavre 1, le charge
//             → si un 2e cadavre dispo : réserve + task pickup2
//             → sinon : va livrer directement (deliver)
//   PICKUP2  → marche vers cadavre 2, le charge
//             → cherche 2 fosses vides, lance deliver
//   DELIVER  → marche vers fosse 1, dépose cadavre 1
//             → si corpse2Id présent : marche vers fosse 2, dépose cadavre 2
//   (Bathin ignore le HaulingSystem standard)
// ============================================================

import type { GameSystem, SimContext, WorldState, Hauler } from '../types';
import { getAvailableCorpses, getEmptyPits, moveToward, dist } from '../world';

const PICKUP_RANGE  = 8;
const DELIVER_RANGE = 8;

// État interne pour la livraison en 2 étapes
const deliveryStep = new Map<string, 1 | 2>();
const secondPitId  = new Map<string, string>();

export class BathinSystem implements GameSystem {
  readonly name = 'BathinSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const hauler of world.haulers.values()) {
      if (hauler.hp <= 0 || hauler.demonName !== 'bathin') continue;
      this._tick(hauler, world);
    }
  }

  private _tick(hauler: Hauler, world: WorldState): void {
    switch (hauler.task.kind) {
      case 'idle':    this._assign(hauler, world);    break;
      case 'pickup':  this._doPickup(hauler, world);  break;
      case 'pickup2': this._doPickup2(hauler, world); break;
      case 'deliver': this._doDeliver(hauler, world); break;
    }
  }

  // ―― Phase 1 : assigner le 1er cadavre ――
  private _assign(hauler: Hauler, world: WorldState): void {
    const corpses = getAvailableCorpses(world);
    if (corpses.length === 0) return;
    corpses.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const c = corpses[0];
    c.reservedBy = hauler.id;
    hauler.task = { kind: 'pickup', corpseId: c.id };
  }

  // ―― Phase 2 : marcher vers cadavre 1 ――
  private _doPickup(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'pickup') return;
    const corpse = world.corpses.get(hauler.task.corpseId);
    if (!corpse || corpse.freshness01 <= 0) { hauler.task = { kind: 'idle' }; return; }

    hauler.pos = moveToward(hauler.pos, corpse.pos, hauler.speed);

    if (dist(hauler.pos, corpse.pos) >= PICKUP_RANGE) return;

    // Cadavre 1 chargé
    hauler.carriedCorpseId = corpse.id;

    // Y a-t-il un 2e cadavre accessible ?
    const others = getAvailableCorpses(world);
    if (others.length > 0) {
      others.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
      const c2 = others[0];
      c2.reservedBy = hauler.id;
      hauler.task = { kind: 'pickup2', corpseId: corpse.id, corpse2Id: c2.id };
    } else {
      // Pas de 2e cadavre — livre directement
      this._startDeliver(hauler, world, corpse.id, undefined);
    }
  }

  // ―― Phase 3 : marcher vers cadavre 2 ――
  private _doPickup2(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'pickup2') return;
    const c2 = world.corpses.get(hauler.task.corpse2Id);
    if (!c2 || c2.freshness01 <= 0) {
      // Cadavre 2 disparu — livre juste le 1er
      this._startDeliver(hauler, world, hauler.task.corpseId, undefined);
      return;
    }

    hauler.pos = moveToward(hauler.pos, c2.pos, hauler.speed);
    // Traîne aussi le cadavre 1 avec soi
    const c1 = world.corpses.get(hauler.task.corpseId);
    if (c1) c1.pos = { ...hauler.pos };

    if (dist(hauler.pos, c2.pos) >= PICKUP_RANGE) return;

    hauler.carriedCorpse2Id = c2.id;
    this._startDeliver(hauler, world, hauler.task.corpseId, c2.id);
  }

  // ―― Démarrer la livraison ――
  private _startDeliver(hauler: Hauler, world: WorldState, c1Id: string, c2Id: string | undefined): void {
    const pits = getEmptyPits(world);
    if (pits.length === 0) { hauler.task = { kind: 'idle' }; return; }

    pits.sort((a, b) => dist(hauler.pos, a.pos) - dist(hauler.pos, b.pos));
    const pit1 = pits[0];
    pit1.state = 'loading';

    if (c2Id && pits.length >= 2) {
      const pit2 = pits[1];
      pit2.state = 'loading';
      secondPitId.set(hauler.id, pit2.id);
    } else {
      secondPitId.delete(hauler.id);
    }

    deliveryStep.set(hauler.id, 1);
    hauler.task = { kind: 'deliver', corpseId: c1Id, targetPitId: pit1.id, corpse2Id: c2Id };
  }

  // ―― Phase 4 : livrer (step 1 puis step 2) ――
  private _doDeliver(hauler: Hauler, world: WorldState): void {
    if (hauler.task.kind !== 'deliver') return;
    const step = deliveryStep.get(hauler.id) ?? 1;

    if (step === 1) {
      this._deliverStep(hauler, world, hauler.task.corpseId, hauler.task.targetPitId, () => {
        hauler.carriedCorpseId = undefined;
        const c2Id  = hauler.task.kind === 'deliver' ? hauler.task.corpse2Id : undefined;
        const pit2  = secondPitId.get(hauler.id);
        if (c2Id && pit2) {
          deliveryStep.set(hauler.id, 2);
          hauler.task = { kind: 'deliver', corpseId: c2Id, targetPitId: pit2 };
        } else {
          hauler.carriedCorpse2Id = undefined;
          secondPitId.delete(hauler.id);
          hauler.task = { kind: 'idle' };
        }
      });
    } else {
      this._deliverStep(hauler, world, hauler.task.corpseId, hauler.task.targetPitId, () => {
        hauler.carriedCorpse2Id = undefined;
        secondPitId.delete(hauler.id);
        hauler.task = { kind: 'idle' };
      });
    }
  }

  private _deliverStep(
    hauler: Hauler, world: WorldState,
    corpseId: string, pitId: string,
    onDone: () => void,
  ): void {
    const pit    = world.pits.get(pitId);
    const corpse = world.corpses.get(corpseId);
    if (!pit || !corpse) { onDone(); return; }

    hauler.pos = moveToward(hauler.pos, pit.pos, hauler.speed);
    corpse.pos = { ...hauler.pos };

    if (dist(hauler.pos, pit.pos) < DELIVER_RANGE) {
      pit.state            = 'processing';
      pit.corpseId         = corpse.id;
      pit.soulId           = corpse.soulId;
      pit.progressTick     = 30;
      pit.assignedUnitType = 'leraje';
      corpse.reservedBy    = undefined;
      onDone();
    }
  }
}
