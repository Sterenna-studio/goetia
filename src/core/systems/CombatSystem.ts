// ============================================================
// GOETIA — CombatSystem (Leraje)
// Ciblage, déplacement, attaque. Ennemis morts → Corpse.
// ============================================================

import type { GameSystem, SimContext, WorldState, Enemy } from '../types';
import { dist, moveToward, spawnCorpse } from '../world';

const ATTACK_COOLDOWN_TICKS = 5;

export class CombatSystem implements GameSystem {
  readonly name = 'CombatSystem';
  private cooldowns = new Map<string, number>();

  update(_ctx: SimContext, world: WorldState): void {
    this._tickUnits(world);
    this._tickEnemies(world);
    this._cleanDead(world);
  }

  private _tickUnits(world: WorldState): void {
    for (const unit of world.units.values()) {
      if (unit.state === 'dead') continue;
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      for (const enemy of world.enemies.values()) {
        if (enemy.state === 'dead') continue;
        const d = dist(unit.pos, enemy.pos);
        if (d < nearestDist) { nearestDist = d; nearest = enemy; }
      }
      if (!nearest) { unit.state = 'idle'; unit.targetId = undefined; continue; }
      unit.targetId = nearest.id;
      const range = 80;
      if (nearestDist > range) {
        unit.state = 'move';
        unit.pos = moveToward(unit.pos, nearest.pos, unit.speed);
      } else {
        unit.state = 'attack';
        const cd = this.cooldowns.get(unit.id) ?? 0;
        if (world.tick >= cd) {
          nearest.hp -= unit.damage;
          this.cooldowns.set(unit.id, world.tick + ATTACK_COOLDOWN_TICKS);
        }
      }
    }
  }

  private _tickEnemies(world: WorldState): void {
    for (const enemy of world.enemies.values()) {
      if (enemy.state === 'dead') continue;
      enemy.pos = moveToward(enemy.pos, { x: 0, y: enemy.pos.y }, enemy.speed);
      for (const unit of world.units.values()) {
        if (unit.state === 'dead') continue;
        if (dist(enemy.pos, unit.pos) < 20) {
          unit.hp -= enemy.damage * 0.1;
          if (unit.hp <= 0) unit.state = 'dead';
        }
      }
      if (enemy.hp <= 0) enemy.state = 'dead';
    }
  }

  private _cleanDead(world: WorldState): void {
    for (const enemy of world.enemies.values()) {
      if (enemy.state !== 'dead') continue;
      if (enemy.dropsCorpse) spawnCorpse(world, enemy.pos, ['human'], 1.0);
      world.enemies.delete(enemy.id);
    }
    for (const unit of world.units.values()) {
      if (unit.state === 'dead') {
        this.cooldowns.delete(unit.id);
        world.units.delete(unit.id);
      }
    }
  }
}
