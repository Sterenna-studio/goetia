// ============================================================
// GOETIA — CombatSystem v2
// Ennemis avancent, attaquent les porteurs, meurent → cadavre.
// ============================================================

import type { GameSystem, SimContext, WorldState } from '../types';
import { leaveCorpse } from './WaveSystem';

const ENEMY_MOVE_TICK = 1;   // avance chaque tick
const ATTACK_RANGE   = 32;   // pixels
const ATTACK_TICKS   = 10;   // 1 attaque toutes les ~1s

export class CombatSystem implements GameSystem {
  readonly name = 'CombatSystem';
  public killCount = 0;

  update(ctx: SimContext, world: WorldState): void {
    const toRemove: string[] = [];

    for (const enemy of world.enemies.values()) {
      if (enemy.state === 'dead') {
        toRemove.push(enemy.id);
        continue;
      }

      // Avancer vers x=0
      if (ctx.tick % ENEMY_MOVE_TICK === 0) {
        enemy.pos.x -= enemy.speed;
      }

      // Attaquer les porteurs proches
      if (ctx.tick % ATTACK_TICKS === 0) {
        for (const hauler of world.haulers.values()) {
          const dx = enemy.pos.x - hauler.pos.x;
          const dy = enemy.pos.y - hauler.pos.y;
          if (Math.sqrt(dx*dx + dy*dy) <= ATTACK_RANGE) {
            hauler.hp -= enemy.damage;
            if (hauler.hp <= 0) {
              world.haulers.delete(hauler.id);
            }
          }
        }
      }

      // Réception des dégâts des unités (Leraje)
      for (const unit of world.units.values()) {
        if (unit.targetId !== enemy.id) continue;
        if (ctx.tick % unit.attackTicks === 0) {
          enemy.hp -= unit.damage;
          if (enemy.hp <= 0 && enemy.state !== 'dead') {
            enemy.state = 'dead';
            this.killCount++;
            leaveCorpse(world, enemy.pos, enemy.type);
          }
        }
      }
    }

    // Nettoyage différé des morts
    for (const id of toRemove) world.enemies.delete(id);
  }

  reset(): void { this.killCount = 0; }
}
