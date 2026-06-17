// ============================================================
// GOETIA — CombatSystem
// Leraje attaque. Armor du Chevalier réduit les dégâts.
// ============================================================

import type { GameSystem, SimContext, WorldState, Enemy } from '../types';
import { dist, moveToward, spawnCorpse } from '../world';

const ATTACK_COOLDOWN_TICKS = 5;

export class CombatSystem implements GameSystem {
  readonly name = 'CombatSystem';
  private cooldowns = new Map<string, number>();
  public killCount = 0;

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
      // Priorité : prêtres d'abord
      for (const enemy of world.enemies.values()) {
        if (enemy.state === 'dead') continue;
        let d = dist(unit.pos, enemy.pos);
        if (enemy.type === 'priest') d -= 50; // bonus aggro
        if (d < nearestDist) { nearestDist = d; nearest = enemy; }
      }
      if (!nearest) { unit.state = 'idle'; unit.targetId = undefined; continue; }
      unit.targetId = nearest.id;
      const realDist = dist(unit.pos, nearest.pos);
      const range = 80;
      if (realDist > range) {
        unit.state = 'move';
        unit.pos = moveToward(unit.pos, nearest.pos, unit.speed);
      } else {
        unit.state = 'attack';
        const cd = this.cooldowns.get(unit.id) ?? 0;
        if (world.tick >= cd) {
          const rawDmg = unit.damage;
          const finalDmg = Math.max(1, rawDmg - nearest.armor);
          nearest.hp -= finalDmg;
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
      if (enemy.dropsCorpse) {
        const tags = enemy.type === 'knight' ? ['knight' as const] : ['human' as const];
        const mass = enemy.type === 'knight' ? 2.0 : 1.0;
        spawnCorpse(world, enemy.pos, tags, mass);
      }
      this.killCount++;
      world.enemies.delete(enemy.id);
    }
    for (const unit of world.units.values()) {
      if (unit.state === 'dead') { this.cooldowns.delete(unit.id); world.units.delete(unit.id); }
    }
  }

  reset(): void { this.killCount = 0; this.cooldowns.clear(); }
}
