// ============================================================
// GOETIA — BlessSystem
// Les Prêtres émettent un rayon de bénédiction.
// Les cadavres dans ce rayon ne peuvent plus être récupérés.
// ============================================================

import type { GameSystem, SimContext, WorldState } from '../types';
import { dist } from '../world';

export class BlessSystem implements GameSystem {
  readonly name = 'BlessSystem';

  update(_ctx: SimContext, world: WorldState): void {
    // Recalcule les zones bénies depuis les prêtres vivants
    world.blessedZones = [];
    for (const enemy of world.enemies.values()) {
      if (enemy.state === 'dead' || enemy.blessRadius === 0) continue;
      world.blessedZones.push({
        pos: { ...enemy.pos },
        radius: enemy.blessRadius,
        sourceId: enemy.id,
      });
    }

    // Marque les cadavres bénis
    for (const corpse of world.corpses.values()) {
      const wasBlessed = corpse.blessed;
      corpse.blessed = world.blessedZones.some(
        zone => dist(corpse.pos, zone.pos) <= zone.radius
      );
      // Si un porteur avait réservé ce cadavre et qu'il devient béni, libère la réservation
      if (!wasBlessed && corpse.blessed && corpse.reservedBy) {
        const hauler = world.haulers.get(corpse.reservedBy);
        if (hauler && hauler.task.kind === 'pickup') {
          hauler.task = { kind: 'idle' };
        }
        corpse.reservedBy = undefined;
      }
    }
  }
}
