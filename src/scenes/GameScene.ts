// ============================================================
// GOETIA — GameScene
// ============================================================

import Phaser from 'phaser';
import { createWorld, spawnCorpse, spawnHauler, spawnPit, spawnEnemy } from '../core/world';
import { Simulation } from '../core/sim';
import type { WorldState, DemonName } from '../core/types';
import { initHUD, initHUDButtons, updateHUD, updateActiveDemon } from '../ui/hud';
import { initCodex, toggleCodex, isCodexVisible } from '../ui/codex';
import { initRadial, showRadial, hideRadial, isRadialVisible, getSelectedDemon, selectDemonByKey } from '../ui/radial';
import { initUpgradePanel, toggleUpgradePanel, isUpgradePanelVisible } from '../ui/upgradepanel';

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
    initRadial(() => updateActiveDemon(getSelectedDemon()));
    initUpgradePanel(this.sim.upgrades, () => this.sim.score, (id) => this.sim.buyUpgrade(id, this.world));
    initHUDButtons(() => toggleCodex(), () => toggleUpgradePanel());
    updateActiveDemon(getSelectedDemon());

    spawnPit(this.world, { x: 580, y: 300 });
    spawnPit(this.world, { x: 580, y: 440 });
    spawnHauler(this.world, { x: 80, y: 250 }, 'bifrons');
    spawnCorpse(this.world, { x: 280, y: 200 }, ['human']);
    spawnCorpse(this.world, { x: 380, y: 420 }, ['soldier']);
    spawnEnemy(this.world, { x: 1150, y: 280 }, 20, 5, 1.0, 'soldier');
    spawnEnemy(this.world, { x: 1220, y: 430 }, 20, 5, 1.0, 'soldier');

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.sim.gameOver || isCodexVisible() || isUpgradePanelVisible()) return;
      if (ptr.rightButtonDown()) { showRadial(ptr.x, ptr.y); return; }
      if (isRadialVisible()) { hideRadial(); return; }
      const demon = getSelectedDemon();
      spawnHauler(this.world, { x: ptr.x, y: ptr.y }, demon.id as DemonName);
    });

    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.input.keyboard?.addKey('R').on('down', () => this.scene.restart());
    this.input.keyboard?.addKey('C').on('down', () => toggleCodex());
    this.input.keyboard?.addKey('U').on('down', () => toggleUpgradePanel());
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => {
      this.input.keyboard?.addKey(k).on('down', () => {
        selectDemonByKey(String(i + 1)); updateActiveDemon(getSelectedDemon());
      });
    });
  }

  update(_time: number, delta: number): void {
    this.sim.update(this.world, delta);
    if (this.sim.gameOver && !this.gameOverShown) {
      this.gameOverShown = true; this._showGameOver();
    }
    this._render();
    updateHUD(this.world, this.sim.waveSystem.currentWave, this.sim.score, this.sim.gameOver);
  }

  private _showGameOver(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(10);
    this.add.text(640, 240, 'GAME OVER', { fontSize: '64px', color: '#cc4444', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 330, `Score : ${this.sim.score}`, { fontSize: '32px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 380, `Vague atteinte : ${this.sim.waveSystem.currentWave}`, { fontSize: '20px', color: '#88ccff', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 420, `Upgrades achetées : ${this.sim.upgrades.getPurchased().length}`, { fontSize: '16px', color: '#aa9966', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 480, '[R] Recommencer', { fontSize: '22px', color: '#ffaa44', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(11);
  }

  private _render(): void {
    const g = this.gfx;
    g.clear();

    // Ligne de défense
    g.lineStyle(1, 0x440000, 0.4);
    g.lineBetween(4, 0, 4, 720);

    // Zones bénies (prêtre) — cercle blanc translucide
    for (const zone of this.world.blessedZones) {
      g.lineStyle(1, 0xffffff, 0.12);
      g.strokeCircle(zone.pos.x, zone.pos.y, zone.radius);
      g.fillStyle(0xffffff, 0.04);
      g.fillCircle(zone.pos.x, zone.pos.y, zone.radius);
    }

    // Fosses
    for (const pit of this.world.pits.values()) {
      g.lineStyle(2, pit.state === 'processing' ? 0xffaa00 : 0x444466);
      g.strokeRect(pit.pos.x - 20, pit.pos.y - 20, 40, 40);
      if (pit.state === 'processing') {
        const p = 1 - pit.progressTick / 30;
        g.fillStyle(0xffaa00, 0.3);
        g.fillRect(pit.pos.x - 20, pit.pos.y + 10, 40 * p, 6);
      }
    }

    // Cadavres
    for (const corpse of this.world.corpses.values()) {
      g.fillStyle(corpse.blessed ? 0xffffff : 0x886644, corpse.freshness01);
      g.fillCircle(corpse.pos.x, corpse.pos.y, corpse.blessed ? 6 : 8);
      if (corpse.soulAttached) {
        g.lineStyle(1, 0x88ccff, 0.6);
        g.strokeCircle(corpse.pos.x, corpse.pos.y, 14);
      }
      // Croix sur cadavre béni
      if (corpse.blessed) {
        g.lineStyle(1, 0xffffff, 0.5);
        g.lineBetween(corpse.pos.x - 5, corpse.pos.y, corpse.pos.x + 5, corpse.pos.y);
        g.lineBetween(corpse.pos.x, corpse.pos.y - 5, corpse.pos.x, corpse.pos.y + 5);
      }
    }

    // Âmes
    for (const soul of this.world.souls.values()) {
      g.fillStyle(0x88ccff, soul.stability01);
      g.fillCircle(soul.pos.x, soul.pos.y - 12, 4);
    }

    // Porteurs
    const haulerColors: Record<string, number> = { bifrons: 0x9966cc, bathin: 0x44aacc, seir: 0xffaa44 };
    for (const hauler of this.world.haulers.values()) {
      const base = haulerColors[hauler.demonName] ?? 0x9966cc;
      g.fillStyle(hauler.carriedCorpseId ? 0xffffff : base);
      g.fillTriangle(hauler.pos.x, hauler.pos.y - 10, hauler.pos.x - 8, hauler.pos.y + 8, hauler.pos.x + 8, hauler.pos.y + 8);
      if (hauler.task.kind === 'pickup') {
        const c = this.world.corpses.get(hauler.task.corpseId);
        if (c) { g.lineStyle(1, base, 0.3); g.lineBetween(hauler.pos.x, hauler.pos.y, c.pos.x, c.pos.y); }
      }
      if (hauler.task.kind === 'deliver') {
        const pit = this.world.pits.get(hauler.task.targetPitId);
        if (pit) { g.lineStyle(1, 0xffaa00, 0.3); g.lineBetween(hauler.pos.x, hauler.pos.y, pit.pos.x, pit.pos.y); }
      }
    }

    // Unités
    for (const unit of this.world.units.values()) {
      g.fillStyle(0x44cc88);
      g.fillRect(unit.pos.x - 6, unit.pos.y - 6, 12, 12);
      if (unit.targetId) {
        const target = this.world.enemies.get(unit.targetId);
        if (target) { g.lineStyle(1, 0x44cc88, 0.25); g.lineBetween(unit.pos.x, unit.pos.y, target.pos.x, target.pos.y); }
      }
    }

    // Ennemis
    const enemyColors: Record<string, number> = { soldier: 0xcc4444, priest: 0xffffff, knight: 0x886622 };
    for (const enemy of this.world.enemies.values()) {
      const col = enemyColors[enemy.type] ?? 0xcc4444;
      const size = enemy.type === 'knight' ? 14 : enemy.type === 'priest' ? 8 : 10;

      if (enemy.type === 'knight') {
        // Chevalier : losange brun
        g.fillStyle(col);
        g.fillTriangle(enemy.pos.x, enemy.pos.y - size, enemy.pos.x - size, enemy.pos.y, enemy.pos.x, enemy.pos.y + size);
        g.fillTriangle(enemy.pos.x, enemy.pos.y - size, enemy.pos.x + size, enemy.pos.y, enemy.pos.x, enemy.pos.y + size);
      } else if (enemy.type === 'priest') {
        // Prêtre : croix blanche
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(enemy.pos.x - 3, enemy.pos.y - size, 6, size * 2);
        g.fillRect(enemy.pos.x - size, enemy.pos.y - 3, size * 2, 6);
      } else {
        g.fillStyle(col);
        g.fillCircle(enemy.pos.x, enemy.pos.y, size);
      }

      // Barre de vie
      const hpRatio = enemy.hp / enemy.maxHp;
      g.fillStyle(0x333333); g.fillRect(enemy.pos.x - 14, enemy.pos.y - 22, 28, 4);
      g.fillStyle(col); g.fillRect(enemy.pos.x - 14, enemy.pos.y - 22, 28 * hpRatio, 4);

      // Label armure pour chevalier
      if (enemy.type === 'knight' && enemy.armor > 0) {
        // Petit indicateur visuel : bordé de jaune
        g.lineStyle(1, 0xffdd44, 0.6);
        g.strokeCircle(enemy.pos.x, enemy.pos.y, size + 3);
      }
    }
  }
}
