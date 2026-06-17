// ============================================================
// GOETIA — Simulation
// ============================================================

import type { WorldState, SimContext, GameSystem, GameCommand } from './types';
import { NecromancySystem } from './systems/NecromancySystem';
import { HaulingSystem }    from './systems/HaulingSystem';
import { ExtractionSystem } from './systems/ExtractionSystem';
import { SpawnSystem }      from './systems/SpawnSystem';
import { CombatSystem }     from './systems/CombatSystem';
import { WaveSystem }       from './systems/WaveSystem';
import { BlessSystem }      from './systems/BlessSystem';
import { UpgradeSystem }    from './upgrades';
import { spawnHauler }      from './world';

const FIXED_STEP_MS = 100;
const SCORE_PER_KILL = 5;

export class Simulation {
  private systems: GameSystem[];
  private accumulator = 0;
  private _tick = 0;
  private pendingCommands: GameCommand[] = [];

  public waveSystem:   WaveSystem;
  public combatSystem: CombatSystem;
  public upgrades:     UpgradeSystem;
  public gameOver = false;
  public score = 0;

  constructor() {
    this.waveSystem   = new WaveSystem();
    this.combatSystem = new CombatSystem();
    this.upgrades     = new UpgradeSystem();
    this.systems = [
      new BlessSystem(),
      new NecromancySystem(),
      new ExtractionSystem(),
      new HaulingSystem(),
      new SpawnSystem(),
      this.combatSystem,
      this.waveSystem,
    ];
  }

  update(world: WorldState, deltaMs: number): void {
    if (this.gameOver) return;
    this.accumulator += deltaMs;
    while (this.accumulator >= FIXED_STEP_MS) {
      this.accumulator -= FIXED_STEP_MS;
      this._tick++;
      world.tick = this._tick;
      const ctx: SimContext = {
        tick: this._tick, dtMs: FIXED_STEP_MS,
        rngSeed: this._tick, commands: this.pendingCommands,
      };
      for (const cmd of this.pendingCommands) {
        if (cmd.type === 'SPAWN_HAULER') spawnHauler(world, cmd.pos, cmd.demonName);
      }
      this.pendingCommands = [];
      for (const system of this.systems) system.update(ctx, world);
      const kills = this.combatSystem.killCount;
      if (kills > 0) { this.score += kills * SCORE_PER_KILL; this.combatSystem.killCount = 0; }
      this._checkGameOver(world);
    }
  }

  private _checkGameOver(world: WorldState): void {
    for (const enemy of world.enemies.values()) {
      if (enemy.pos.x <= 0) { this.gameOver = true; return; }
    }
  }

  buyUpgrade(id: string, world: WorldState): void {
    this.score = this.upgrades.buy(id, this.score, world);
  }

  reset(): void {
    this.accumulator = 0; this._tick = 0;
    this.pendingCommands = []; this.gameOver = false; this.score = 0;
    this.waveSystem.reset(); this.combatSystem.reset(); this.upgrades.reset();
  }

  get tick(): number { return this._tick; }
}
