// ============================================================
// GOETIA — SpawnSystem
// Consomme Corpse + Soul dans une fosse → produit une Unit.
// ============================================================

import type { GameSystem, SimContext, WorldState, Unit, Pit } from '../types';
import { newId } from '../world';
import lerajeData from '../../data/units/leraje.json';

export class SpawnSystem implements GameSystem {
  readonly name = 'SpawnSystem';

  update(_ctx: SimContext, world: WorldState): void {
    for (const pit of world.pits.values()) {
      if (pit.state !== 'processing') continue;
      pit.progressTick--;
      if (pit.progressTick <= 0) this._spawnUnit(pit, world);
    }
  }

  private _spawnUnit(pit: Pit, world: WorldState): void {
    if (pit.corpseId) {
      world.corpses.delete(pit.corpseId);
      world.resources.corpsesAvailable = Math.max(0, world.resources.corpsesAvailable - 1);
    }
    if (pit.soulId) {
      world.souls.delete(pit.soulId);
      world.resources.soulsAvailable = Math.max(0, world.resources.soulsAvailable - 1);
    }

    const def = lerajeData;
    const unit: Unit = {
      id: newId('unit'),
      archetypeId: def.id,
      demonName: def.demonName,
      pos: { ...pit.pos },
      hp: def.stats.hp,
      maxHp: def.stats.hp,
      speed: def.stats.speed,
      damage: def.stats.damage,
      state: 'idle',
      createdAtTick: world.tick,
    };
    world.units.set(unit.id, unit);

    pit.state = 'empty';
    pit.corpseId = undefined;
    pit.soulId = undefined;
    pit.assignedUnitType = undefined;
    pit.progressTick = 0;
  }
}
