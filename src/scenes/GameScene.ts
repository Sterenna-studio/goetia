// ============================================================
// GOETIA — GameScene
// ============================================================

import Phaser from 'phaser';
import { createWorld, spawnCorpse, spawnHauler, spawnPit, spawnEnemy } from '../core/world';
import { Simulation } from '../core/sim';
import type { WorldState } from '../core/types';
import { initHUD, initHUDCodexButton, updateHUD } from '../ui/hud';
import { initCodex, toggleCodex, isCodexVisible } from '../ui/codex';

export class GameScene extends Phaser.Scene {
  private world!: WorldState;
  private sim!: Simulation;
  private gfx!: Phaser.GameObjects.Graphics;
  private gameOverShown = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.world = createWorld();
    this.sim = new Simulation();
    this.gfx = this.add.graphics();
    this.gameOverShown = false;

    initHUD();
    initCodex();
    initHUDCodexButton(() => toggleCodex());

    spawnPit(this.world, { x: 580, y: 300 });
    spawnPit(this.world, { x: 580, y: 440 });
    spawnHauler(this.world, { x: 80, y: 250 }, 'bifrons');
    spawnCorpse(this.world, { x: 280, y: 200 }, ['human']);
    spawnCorpse(this.world, { x: 380, y: 420 }, ['soldier']);
    spawnEnemy(this.world, { x: 1150, y: 280 });
    spawnEnemy(this.world, { x: 1220, y: 430 });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.sim.gameOver || isCodexVisible()) return;
      spawnHauler(this.world, { x: ptr.x, y: ptr.y }, 'bifrons');
    });

    this.input.keyboard?.addKey('R').on('down', () => this.scene.restart());
    this.input.keyboard?.addKey('C').on('down', () => toggleCodex());
  }

  update(_time: number, delta: number): void {
    this.sim.update(this.world, delta);

    if (this.sim.gameOver && !this.gameOverShown) {
      this.gameOverShown = true;
      this._showGameOver();
    }

    this._render();
    updateHUD(this.world, this.sim.waveSystem.currentWave, this.sim.score, this.sim.gameOver);
  }

  private _showGameOver(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(10);
    this.add.text(640, 280, 'GAME OVER', {
      fontSize: '64px', color: '#cc4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 370, `Score : ${this.sim.score}`, {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 440, '[R] Recommencer', {
      fontSize: '22px', color: '#ffaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
  }

  private _render(): void {
    const g = this.gfx;
    g.clear();

    g.lineStyle(1, 0x440000, 0.4);
    g.lineBetween(4, 0, 4, 720);

    for (const pit of this.world.pits.values()) {
      g.lineStyle(2, pit.state === 'processing' ? 0xffaa00 : 0x444466);
      g.strokeRect(pit.pos.x - 20, pit.pos.y - 20, 40, 40);
      if (pit.state === 'processing') {
        const progress = 1 - pit.progressTick / 30;
        g.fillStyle(0xffaa00, 0.3);
        g.fillRect(pit.pos.x - 20, pit.pos.y + 10, 40 * progress, 6);
      }
    }

    for (const corpse of this.world.corpses.values()) {
      g.fillStyle(0x886644, corpse.freshness01);
      g.fillCircle(corpse.pos.x, corpse.pos.y, 8);
      if (corpse.soulAttached) {
        g.lineStyle(1, 0x88ccff, 0.6);
        g.strokeCircle(corpse.pos.x, corpse.pos.y, 14);
      }
    }

    for (const soul of this.world.souls.values()) {
      g.fillStyle(0x88ccff, soul.stability01);
      g.fillCircle(soul.pos.x, soul.pos.y - 12, 4);
    }

    for (const hauler of this.world.haulers.values()) {
      g.fillStyle(hauler.carriedCorpseId ? 0xcc88ff : 0x9966cc);
      g.fillTriangle(
        hauler.pos.x, hauler.pos.y - 10,
        hauler.pos.x - 8, hauler.pos.y + 8,
        hauler.pos.x + 8, hauler.pos.y + 8
      );
      if (hauler.task.kind === 'pickup') {
        const c = this.world.corpses.get(hauler.task.corpseId);
        if (c) { g.lineStyle(1, 0x9966cc, 0.3); g.lineBetween(hauler.pos.x, hauler.pos.y, c.pos.x, c.pos.y); }
      }
      if (hauler.task.kind === 'deliver') {
        const pit = this.world.pits.get(hauler.task.targetPitId);
        if (pit) { g.lineStyle(1, 0xffaa00, 0.3); g.lineBetween(hauler.pos.x, hauler.pos.y, pit.pos.x, pit.pos.y); }
      }
    }

    for (const unit of this.world.units.values()) {
      g.fillStyle(0x44cc88);
      g.fillRect(unit.pos.x - 6, unit.pos.y - 6, 12, 12);
      if (unit.targetId) {
        const target = this.world.enemies.get(unit.targetId);
        if (target) { g.lineStyle(1, 0x44cc88, 0.25); g.lineBetween(unit.pos.x, unit.pos.y, target.pos.x, target.pos.y); }
      }
    }

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
