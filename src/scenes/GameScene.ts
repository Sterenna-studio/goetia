// ============================================================
// GOETIA — GameScene (thème néromancien)
// ============================================================

import Phaser from 'phaser';
import { createWorld, spawnCorpse, spawnHauler, spawnPit, spawnEnemy } from '../core/world';
import { Simulation } from '../core/sim';
import type { WorldState, DemonName, Hauler } from '../core/types';
import { initHUD, initHUDButtons, updateHUD, updateActiveDemon, updatePauseButton } from '../ui/hud';
import { initCodex, toggleCodex, isCodexVisible } from '../ui/codex';
import { initRadial, showRadial, hideRadial, isRadialVisible, getSelectedDemon, selectDemonByKey } from '../ui/radial';
import { initUpgradePanel, toggleUpgradePanel, isUpgradePanelVisible } from '../ui/upgradepanel';
import { initPause, togglePause, isPaused, hidePause } from '../ui/pause';
import { saveBest, saveRun, loadBest } from '../core/persistence';
import { seirFlashes } from '../core/systems/SeirSystem';
import { initParticles, destroyParticles, fxPickup, fxDeliver, fxBlink, fxDust, fxExtract } from '../ui/particles';
import { C, CSS } from '../ui/theme';

export class GameScene extends Phaser.Scene {
  private world!: WorldState;
  private sim!: Simulation;
  private gfx!: Phaser.GameObjects.Graphics;
  private gameOverShown = false;
  private prevTasks = new Map<string, string>();

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.world = createWorld();
    this.sim   = new Simulation();
    this.gfx   = this.add.graphics();
    this.gameOverShown = false;
    this.prevTasks.clear();

    // Fond noir profond
    this.cameras.main.setBackgroundColor('#050a05');

    initParticles();
    initHUD();
    initCodex();
    initRadial(() => updateActiveDemon(getSelectedDemon()));
    initUpgradePanel(
      this.sim.upgrades,
      () => this.sim.score,
      (id) => this.sim.buyUpgrade(id, this.world),
    );
    initPause(
      () => { /* resume */ },
      () => this.scene.restart(),
      () => { hidePause(); this._destroyOverlays(); this.scene.start('TitleScene'); },
    );
    initHUDButtons(
      () => toggleCodex(),
      () => toggleUpgradePanel(),
      () => { if (!this.sim.gameOver) togglePause(); },
    );
    updateActiveDemon(getSelectedDemon());

    const best = loadBest();
    if (best.score > 0) updateBestHUD(best.score, best.wave);

    spawnPit(this.world,    { x: 580, y: 300 });
    spawnPit(this.world,    { x: 580, y: 440 });
    spawnHauler(this.world, { x: 80,  y: 250 }, 'bifrons');
    spawnCorpse(this.world, { x: 280, y: 200 }, ['human']);
    spawnCorpse(this.world, { x: 380, y: 420 }, ['soldier']);
    spawnEnemy(this.world,  { x: 1150, y: 280 }, 20, 5, 1.0, 'soldier');
    spawnEnemy(this.world,  { x: 1220, y: 430 }, 20, 5, 1.0, 'soldier');

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.sim.gameOver || isPaused() || isCodexVisible() || isUpgradePanelVisible()) return;
      if (ptr.rightButtonDown()) { showRadial(ptr.x, ptr.y); return; }
      if (isRadialVisible()) { hideRadial(); return; }
      spawnHauler(this.world, { x: ptr.x, y: ptr.y }, getSelectedDemon().id as DemonName);
    });

    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.input.keyboard?.addKey('ESC').on('down', () => {
      if (this.sim.gameOver || isCodexVisible() || isUpgradePanelVisible()) return;
      togglePause();
    });
    this.input.keyboard?.addKey('P').on('down', () => {
      if (this.sim.gameOver || isCodexVisible() || isUpgradePanelVisible()) return;
      togglePause();
    });
    this.input.keyboard?.addKey('R').on('down', () => { if (!isPaused()) this.scene.restart(); });
    this.input.keyboard?.addKey('C').on('down', () => { if (!isPaused()) toggleCodex(); });
    this.input.keyboard?.addKey('U').on('down', () => { if (!isPaused()) toggleUpgradePanel(); });
    ['ONE','TWO','THREE','FOUR','FIVE'].forEach((k, i) => {
      this.input.keyboard?.addKey(k).on('down', () => {
        if (isPaused()) return;
        selectDemonByKey(String(i + 1));
        updateActiveDemon(getSelectedDemon());
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!isPaused()) {
      this.sim.update(this.world, delta);
      this._emitParticles();
    }
    updatePauseButton(isPaused());
    if (this.sim.gameOver && !this.gameOverShown) {
      this.gameOverShown = true;
      const best = saveBest(this.sim.score, this.sim.waveSystem.currentWave);
      saveRun(this.sim.score, this.sim.waveSystem.currentWave, this.sim.upgrades.getPurchased().length);
      this._showGameOver(best.score, best.wave);
    }
    this._render();
    updateHUD(this.world, this.sim.waveSystem.currentWave, this.sim.score, this.sim.gameOver);
  }

  // ―― Particules ――
  private _emitParticles(): void {
    for (const hauler of this.world.haulers.values()) {
      const prev = this.prevTasks.get(hauler.id) ?? 'idle';
      const curr = hauler.task.kind;
      const css  = ({
        bifrons:'#33ff66', bathin:'#9933ff', seir:'#66ffcc',
        murmur:'#ff9933',  gamigin:'#ccff33',
      } as Record<string,string>)[hauler.demonName] ?? '#33ff66';

      if ((prev === 'pickup' || prev === 'pickup2') && curr === 'deliver') fxPickup(hauler.pos.x, hauler.pos.y, css);
      if (prev === 'deliver' && curr === 'idle')                           fxDeliver(hauler.pos.x, hauler.pos.y, '#33ff66');
      if (hauler.demonName === 'seir' && (seirFlashes.get(hauler.id) ?? 0) === 3) fxBlink(hauler.pos.x, hauler.pos.y);
      if ((curr === 'pickup' || curr === 'deliver' || curr === 'pickup2') &&
          hauler.demonName !== 'seir' && hauler.demonName !== 'murmur' && hauler.demonName !== 'gamigin') {
        fxDust(hauler.pos.x, hauler.pos.y, css);
      }
      if (curr === 'extract') fxExtract(hauler.pos.x, hauler.pos.y, css);
      this.prevTasks.set(hauler.id, curr);
    }
  }

  // ―― Rendu principal ――
  private _render(): void {
    const g = this.gfx;
    g.clear();

    // Grille de fond subtile
    g.lineStyle(1, C.GRID, 0.35);
    for (let x = 0; x < 1280; x += 80) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y < 720;  y += 80) g.lineBetween(0, y, 1280, y);

    // Ligne de défaite
    g.lineStyle(1, 0x220000, 0.7); g.lineBetween(4, 0, 4, 720);
    g.fillStyle(0x110000, 0.25);   g.fillRect(0, 0, 8, 720);

    // Zones bénies
    for (const zone of this.world.blessedZones) {
      g.lineStyle(1, 0xffffff, 0.08); g.strokeCircle(zone.pos.x, zone.pos.y, zone.radius);
      g.fillStyle(0xffffff, 0.02);    g.fillCircle(zone.pos.x, zone.pos.y, zone.radius);
    }

    // Fosses
    for (const pit of this.world.pits.values()) {
      const active = pit.state === 'processing' || pit.state === 'loading';
      g.lineStyle(2, active ? C.ACCENT : C.PIT_IDLE, active ? 1 : 0.5);
      g.strokeRect(pit.pos.x - 20, pit.pos.y - 20, 40, 40);
      // Coins accent
      const s = 5;
      g.lineStyle(2, C.ACCENT, active ? 0.9 : 0.25);
      [[pit.pos.x-20,pit.pos.y-20],[pit.pos.x+20,pit.pos.y-20],[pit.pos.x-20,pit.pos.y+20],[pit.pos.x+20,pit.pos.y+20]].forEach(([cx,cy]) => {
        g.lineBetween(cx, cy - s, cx, cy); g.lineBetween(cx, cy, cx + (cx < pit.pos.x ? s : -s), cy);
      });
      if (pit.state === 'processing') {
        const p = 1 - pit.progressTick / 30;
        g.fillStyle(C.PIT_PROGRESS, 0.25); g.fillRect(pit.pos.x - 20, pit.pos.y - 20, 40, 40);
        g.fillStyle(C.ACCENT, 0.9);        g.fillRect(pit.pos.x - 18, pit.pos.y + 14, 36 * p, 3);
      }
    }

    // Cadavres
    for (const corpse of this.world.corpses.values()) {
      const r = corpse.blessed ? 5 : 7;
      g.fillStyle(corpse.blessed ? C.BLESSED : C.CORPSE_FRESH, corpse.freshness01 * 0.85 + 0.15);
      g.fillCircle(corpse.pos.x, corpse.pos.y, r);
      g.lineStyle(1, corpse.blessed ? C.BLESSED : C.CORPSE, 0.5);
      g.strokeCircle(corpse.pos.x, corpse.pos.y, r);
      if (corpse.soulAttached) {
        g.lineStyle(1, C.SOUL, 0.5); g.strokeCircle(corpse.pos.x, corpse.pos.y, 14);
      }
      if (corpse.extractorId) {
        g.lineStyle(1, C.EXTRACTOR_RING, 0.6); g.strokeCircle(corpse.pos.x, corpse.pos.y, 18);
      }
      if (corpse.blessed) {
        g.lineStyle(1, C.BLESSED, 0.6);
        g.lineBetween(corpse.pos.x-5, corpse.pos.y, corpse.pos.x+5, corpse.pos.y);
        g.lineBetween(corpse.pos.x, corpse.pos.y-5, corpse.pos.x, corpse.pos.y+5);
      }
    }

    // Âmes
    for (const soul of this.world.souls.values()) {
      g.fillStyle(C.SOUL, soul.stability01 * 0.8 + 0.2);
      g.fillCircle(soul.pos.x, soul.pos.y - 14, 4);
      g.lineStyle(1, C.SOUL, soul.stability01 * 0.4);
      g.strokeCircle(soul.pos.x, soul.pos.y - 14, 7);
    }

    // Porteurs
    for (const hauler of this.world.haulers.values()) this._renderHauler(g, hauler);

    // Unités (Leraje)
    for (const unit of this.world.units.values()) {
      g.fillStyle(C.UNIT, 0.9);   g.fillRect(unit.pos.x-5, unit.pos.y-5, 10, 10);
      g.lineStyle(1, C.UNIT_BORDER); g.strokeRect(unit.pos.x-5, unit.pos.y-5, 10, 10);
      g.lineStyle(1, C.UNIT, 0.15);
      g.strokeCircle(unit.pos.x, unit.pos.y, 80); // rayon d'attaque
      if (unit.targetId) {
        const t = this.world.enemies.get(unit.targetId);
        if (t) {
          // Trait de visée
          g.lineStyle(1, C.UNIT, 0.5); g.lineBetween(unit.pos.x, unit.pos.y, t.pos.x, t.pos.y);
        }
      }
    }

    // Ennemis
    for (const enemy of this.world.enemies.values()) {
      const col  = enemy.type === 'knight' ? C.ENEMY_KNIGHT : enemy.type === 'priest' ? C.ENEMY_PRIEST : C.ENEMY_SOL;
      const size = enemy.type === 'knight' ? 13 : enemy.type === 'priest' ? 7 : 9;

      if (enemy.type === 'knight') {
        g.fillStyle(col);
        g.fillTriangle(enemy.pos.x, enemy.pos.y-size, enemy.pos.x-size, enemy.pos.y, enemy.pos.x, enemy.pos.y+size);
        g.fillTriangle(enemy.pos.x, enemy.pos.y-size, enemy.pos.x+size, enemy.pos.y, enemy.pos.x, enemy.pos.y+size);
        if (enemy.armor > 0) { g.lineStyle(1, C.ARMOR_RING, 0.7); g.strokeCircle(enemy.pos.x, enemy.pos.y, size+4); }
      } else if (enemy.type === 'priest') {
        g.fillStyle(col, 0.9);
        g.fillRect(enemy.pos.x-2.5, enemy.pos.y-size, 5, size*2);
        g.fillRect(enemy.pos.x-size, enemy.pos.y-2.5, size*2, 5);
        // Aura bénie
        g.lineStyle(1, 0xffffff, 0.12); g.strokeCircle(enemy.pos.x, enemy.pos.y, enemy.blessRadius ?? 60);
      } else {
        g.fillStyle(col); g.fillCircle(enemy.pos.x, enemy.pos.y, size);
        g.lineStyle(1, 0x660000, 0.5); g.strokeCircle(enemy.pos.x, enemy.pos.y, size);
      }

      // Barre de vie
      const hp = enemy.hp / enemy.maxHp;
      g.fillStyle(C.ENEMY_HP_BG); g.fillRect(enemy.pos.x-13, enemy.pos.y-size-8, 26, 3);
      g.fillStyle(col);            g.fillRect(enemy.pos.x-13, enemy.pos.y-size-8, 26*hp, 3);
    }
  }

  private _renderHauler(g: Phaser.GameObjects.Graphics, hauler: Hauler): void {
    const colMap: Record<string,number> = {
      bifrons: C.BIFRONS, bathin: C.BATHIN, seir: C.SEIR,
      murmur:  C.MURMUR,  gamigin: C.GAMIGIN,
    };
    const base       = colMap[hauler.demonName] ?? C.BIFRONS;
    const isExtract  = hauler.demonName === 'murmur' || hauler.demonName === 'gamigin';
    const isSeir     = hauler.demonName === 'seir';
    const isBathin   = hauler.demonName === 'bathin';
    const flashTicks = seirFlashes.get(hauler.id) ?? 0;

    if (isSeir) {
      // Halo de téléportation
      if (flashTicks > 0) {
        const a = flashTicks / 3;
        g.fillStyle(C.SEIR, a * 0.18);   g.fillCircle(hauler.pos.x, hauler.pos.y, 32);
        g.lineStyle(1.5, C.SEIR, a * 0.8); g.strokeCircle(hauler.pos.x, hauler.pos.y, 32);
      }
      // Triangle un peu plus grand
      g.fillStyle(hauler.carriedCorpseId ? 0xffffff : base);
      g.fillTriangle(hauler.pos.x, hauler.pos.y-13, hauler.pos.x-11, hauler.pos.y+10, hauler.pos.x+11, hauler.pos.y+10);
      g.lineStyle(1, base, 0.5);
      g.strokeTriangle(hauler.pos.x, hauler.pos.y-13, hauler.pos.x-11, hauler.pos.y+10, hauler.pos.x+11, hauler.pos.y+10);

    } else if (isBathin) {
      const c2 = !!hauler.carriedCorpse2Id;
      // Triangle 1
      g.fillStyle(hauler.carriedCorpseId ? 0xffffff : base);
      g.fillTriangle(hauler.pos.x-3, hauler.pos.y-11, hauler.pos.x-12, hauler.pos.y+9, hauler.pos.x+6, hauler.pos.y+9);
      // Triangle 2 (décalé)
      g.fillStyle(c2 ? 0xffffff : base, c2 ? 1 : 0.4);
      g.fillTriangle(hauler.pos.x+3, hauler.pos.y-11, hauler.pos.x-6, hauler.pos.y+9, hauler.pos.x+12, hauler.pos.y+9);
      // Contour
      g.lineStyle(1, base, 0.4);
      g.strokeTriangle(hauler.pos.x-3, hauler.pos.y-11, hauler.pos.x-12, hauler.pos.y+9, hauler.pos.x+6, hauler.pos.y+9);

    } else if (isExtract) {
      // Losange
      const extracting = hauler.task.kind === 'extract';
      g.fillStyle(extracting ? 0xffffff : base, extracting ? 0.95 : 0.8);
      g.fillTriangle(hauler.pos.x, hauler.pos.y-11, hauler.pos.x+9,  hauler.pos.y, hauler.pos.x,  hauler.pos.y+11);
      g.fillTriangle(hauler.pos.x, hauler.pos.y-11, hauler.pos.x-9,  hauler.pos.y, hauler.pos.x,  hauler.pos.y+11);
      g.lineStyle(1, base, 0.4); g.strokeCircle(hauler.pos.x, hauler.pos.y, 13);

      if (extracting) {
        const c = this.world.corpses.get(hauler.task.corpseId);
        if (c) { g.lineStyle(1, base, 0.3); g.lineBetween(hauler.pos.x, hauler.pos.y, c.pos.x, c.pos.y); }
        const total    = hauler.demonName === 'gamigin' ? 20 : 40;
        const progress = 1 - hauler.task.ticksLeft / total;
        g.fillStyle(base, 0.85);   g.fillRect(hauler.pos.x-12, hauler.pos.y+14, 24*progress, 3);
        g.lineStyle(1, base, 0.25); g.strokeRect(hauler.pos.x-12, hauler.pos.y+14, 24, 3);
      }

    } else {
      // Porteur standard (Bifrons…)
      const moving = hauler.task.kind === 'pickup' || hauler.task.kind === 'deliver';
      g.fillStyle(hauler.carriedCorpseId ? 0xffffff : base, moving ? 1 : 0.75);
      g.fillTriangle(hauler.pos.x, hauler.pos.y-10, hauler.pos.x-8, hauler.pos.y+8, hauler.pos.x+8, hauler.pos.y+8);
      g.lineStyle(1, base, 0.35);
      g.strokeTriangle(hauler.pos.x, hauler.pos.y-10, hauler.pos.x-8, hauler.pos.y+8, hauler.pos.x+8, hauler.pos.y+8);

      // Trait vers cible
      if (hauler.task.kind === 'pickup') {
        const c = this.world.corpses.get(hauler.task.corpseId);
        if (c) { g.lineStyle(1, base, 0.2); g.lineBetween(hauler.pos.x, hauler.pos.y, c.pos.x, c.pos.y); }
      } else if (hauler.task.kind === 'deliver') {
        const pit = this.world.pits.get(hauler.task.targetPitId);
        if (pit) { g.lineStyle(1, C.ACCENT, 0.2); g.lineBetween(hauler.pos.x, hauler.pos.y, pit.pos.x, pit.pos.y); }
      }
    }
  }

  private _destroyOverlays(): void {
    destroyParticles();
    ['goetia-hud','goetia-codex','goetia-radial','goetia-upgrades','goetia-pause','hud-best',
     'goetia-hud-style','goetia-codex-style','goetia-radial-style',
     'goetia-upgrades-style','goetia-pause-style'].forEach(id => document.getElementById(id)?.remove());
  }

  private _showGameOver(bestScore: number, bestWave: number): void {
    const score = this.sim.score;
    const wave  = this.sim.waveSystem.currentWave;
    const isNR  = score >= bestScore && wave > 0;
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.88).setDepth(10);
    this.add.text(640, 180, 'GOETIA', { fontSize:'18px', color:'#1a4422', fontFamily:'monospace', letterSpacing: 16 }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 230, 'GAME OVER', { fontSize:'56px', color:'#cc0000', fontFamily:'monospace', fontStyle:'bold' }).setOrigin(0.5).setDepth(11);
    if (isNR) this.add.text(640, 295, '★ NOUVEAU RECORD ★', { fontSize:'16px', color:'#33ff66', fontFamily:'monospace', letterSpacing: 8 }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 338, `${score} pts`, { fontSize:'36px', color:'#33ff66', fontFamily:'monospace', fontStyle:'bold' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 382, `vague ${wave}`, { fontSize:'18px', color:'#9933ff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 416, `${this.sim.upgrades.getPurchased().length} rituels accomplis`, { fontSize:'13px', color:'#3a6644', fontFamily:'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 448, '―'.repeat(28), { fontSize:'11px', color:'#1a3320', fontFamily:'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 468, `record : ${bestScore} pts  |  vague ${bestWave}`, { fontSize:'12px', color:'#3a6644', fontFamily:'monospace' }).setOrigin(0.5).setDepth(11);
    this.add.text(640, 530, '[R] recommencer', { fontSize:'18px', color:'#33ff66', fontFamily:'monospace' }).setOrigin(0.5).setDepth(11);
  }
}

function updateBestHUD(score: number, wave: number): void {
  let el = document.getElementById('hud-best');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hud-best';
    el.style.cssText = `
      position:fixed; top:38px; left:50%;
      transform: translateX(-50%);
      font-family:monospace; font-size:10px; color:#1a4422;
      background:rgba(0,0,0,0.7);
      padding:3px 12px; border-top: 1px solid #0d2211;
      pointer-events:none; z-index:101;
      letter-spacing: 0.08em;
    `;
    document.body.appendChild(el);
  }
  el.textContent = `★ record : ${score} pts | vague ${wave}`;
}
