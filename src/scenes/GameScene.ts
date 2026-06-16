// ============================================================
// GOETIA — GameScene
// Shell Phaser : init monde, boucle update, rendu debug.
// ============================================================

import Phaser from 'phaser';
import { createWorld, spawnCorpse, spawnHauler, spawnPit, spawnEnemy } from '../core/world';
import { Simulation } from '../core/sim';
import type { WorldState } from '../core/types';

export class GameScene extends Phaser.Scene {
  private world!: WorldState;
  private sim!: Simulation;
  private gfx!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.world = createWorld();
    this.sim = new Simulation();
    this.gfx = this.add.graphics();
    this.debugText = this.add.text(12, 12, '', {
      fontSize: '13px',
      color: '#aaffaa',
      fontFamily: 'monospace',
    });

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
    this._updateHUD();
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

    // Âmes
    for (const soul of this.world.souls.values()) {
      g.fillStyle(0x88ccff, soul.stability01);
      g.fillCircle(soul.pos.x, soul.pos.y - 12, 4);
    }

    // Haulers (Bifrons)
    for (const hauler of this.world.haulers.values()) {
      g.fillStyle(0x9966cc);
      g.fillTriangle(
        hauler.pos.x, hauler.pos.y - 10,
        hauler.pos.x - 8, hauler.pos.y + 8,
        hauler.pos.x + 8, hauler.pos.y + 8
      );
    }

    // Unités (Leraje)
    for (const unit of this.world.units.values()) {
      g.fillStyle(0x44cc88);
      g.fillRect(unit.pos.x - 6, unit.pos.y - 6, 12, 12);
    }

    // Ennemis
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

  private _updateHUD(): void {
    const w = this.world;
    this.debugText.setText([
      `GOETIA — MVP  [R] Restart`,
      `Tick: ${w.tick}`,
      `Cadavres: ${w.corpses.size}  Âmes: ${w.souls.size}`,
      `Haulers: ${w.haulers.size}  Unités: ${w.units.size}`,
      `Ennemis: ${w.enemies.size}`,
    ]);
  }
}
