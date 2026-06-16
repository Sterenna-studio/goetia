// ============================================================
// GOETIA — GameScene
// Shell Phaser : init monde, boucle update, rendu debug.
// ============================================================

import Phaser from 'phaser';
import { createWorld, spawnCorpse, spawnHauler, spawnPit, spawnEnemy } from '../core/world';
import { Simulation } from '../core/sim';
import type { WorldState } from '../core/types';
import { initHUD, updateHUD } from '../ui/hud';

export class GameScene extends Phaser.Scene {
  private world!: WorldState;
  private sim!: Simulation;
  private gfx!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.world = createWorld();
    this.sim = new Simulation();
    this.gfx = this.add.graphics();

    initHUD();

    // Scène test MVP
    spawnPit(this.world, { x: 640, y: 360 });
    spawnHauler(this.world, { x: 100, y: 200 }, 'bifrons');
    spawnCorpse(this.world, { x: 300, y: 180 }, ['human']);
    spawnCorpse(this.world, { x: 450, y: 400 }, ['soldier']);
    spawnEnemy(this.world, { x: 1100, y: 300 });
    spawnEnemy(this.world, { x: 1200, y: 450 });

    this.input.keyboard?.addKey('R').on('down', () => this.scene.restart());
  }

  update(_time: number, delta: number): void {
    this.sim.update(this.world, delta);
    this._render();
    updateHUD(this.world);
  }

  private _render(): void {
    const g = this.gfx;
    g.clear();

    // Fosses
    for (const pit of this.world.pits.values()) {
      g.lineStyle(2, pit.state === 'processing' ? 0xffaa00 : 0x444466);
      g.strokeRect(pit.pos.x - 20, pit.pos.y - 20, 40, 40);
      if (pit.state === 'processing') {
        const progress = 1 - pit.progressTick / 30;
        g.fillStyle(0xffaa00, 0.3);
        g.fillRect(pit.pos.x - 20, pit.pos.y + 10, 40 * progress, 6);
      }
    }

    // Cadavres
    for (const corpse of this.world.corpses.values()) {
      g.fillStyle(0x886644, corpse.freshness01);
      g.fillCircle(corpse.pos.x, corpse.pos.y, 8);
      if (corpse.soulAttached) {
        g.lineStyle(1, 0x88ccff, 0.6);
        g.strokeCircle(corpse.pos.x, corpse.pos.y, 14);
      }
    }

    // Âmes flottantes
    for (const soul of this.world.souls.values()) {
      g.fillStyle(0x88ccff, soul.stability01);
      g.fillCircle(soul.pos.x, soul.pos.y - 12, 4);
    }

    // Haulers (Bifrons) — triangle violet
    for (const hauler of this.world.haulers.values()) {
      g.fillStyle(hauler.carriedCorpseId ? 0xcc88ff : 0x9966cc);
      g.fillTriangle(
        hauler.pos.x, hauler.pos.y - 10,
        hauler.pos.x - 8, hauler.pos.y + 8,
        hauler.pos.x + 8, hauler.pos.y + 8
      );
      // Ligne vers la cible si en mouvement
      if (hauler.task.kind === 'pickup') {
        const c = this.world.corpses.get(hauler.task.corpseId);
        if (c) {
          g.lineStyle(1, 0x9966cc, 0.3);
          g.lineBetween(hauler.pos.x, hauler.pos.y, c.pos.x, c.pos.y);
        }
      }
      if (hauler.task.kind === 'deliver') {
        const pit = this.world.pits.get(hauler.task.targetPitId);
        if (pit) {
          g.lineStyle(1, 0xffaa00, 0.3);
          g.lineBetween(hauler.pos.x, hauler.pos.y, pit.pos.x, pit.pos.y);
        }
      }
    }

    // Unités (Leraje) — carré vert
    for (const unit of this.world.units.values()) {
      g.fillStyle(0x44cc88);
      g.fillRect(unit.pos.x - 6, unit.pos.y - 6, 12, 12);
      // Ligne vers la cible
      if (unit.targetId) {
        const target = this.world.enemies.get(unit.targetId);
        if (target) {
          g.lineStyle(1, 0x44cc88, 0.25);
          g.lineBetween(unit.pos.x, unit.pos.y, target.pos.x, target.pos.y);
        }
      }
    }

    // Ennemis — cercle rouge + barre de vie
    for (const enemy of this.world.enemies.values()) {
      g.fillStyle(0xcc4444);
      g.fillCircle(enemy.pos.x, enemy.pos.y, 10);
      const hpRatio = enemy.hp / enemy.maxHp;
      g.fillStyle(0x333333);
      g.fillRect(enemy.pos.x - 12, enemy.pos.y - 18, 24, 4);
      g.fillStyle(0xcc4444);
      g.fillRect(enemy.pos.x - 12, enemy.pos.y - 18, 24 * hpRatio, 4);
    }
  }
}
