// ============================================================
// GOETIA — Boucle de simulation fixed-step
// ============================================================

import type { WorldState, SimContext, GameSystem, GameCommand } from './types';
import { NecromancySystem } from './systems/NecromancySystem';
import { HaulingSystem } from './systems/HaulingSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { CombatSystem } from './systems/CombatSystem';
import { WaveSystem } from './systems/WaveSystem';

const FIXED_STEP_MS = 100;

export class Simulation {
  private systems: GameSystem[];
  private accumulator = 0;
  private _tick = 0;
  private pendingCommands: GameCommand[] = [];
  public waveSystem: WaveSystem;
  public gameOver = false;
  public score = 0;

  constructor() {
    this.waveSystem = new WaveSystem();
    this.systems = [
      new NecromancySystem(),
      new HaulingSystem(),
      new SpawnSystem(),
      new CombatSystem(),
      this.waveSystem,
    ];
  }

  pushCommand(cmd: GameCommand): void {
    this.pendingCommands.push(cmd);
  }

  update(world: WorldState, deltaMs: number): void {
    if (this.gameOver) return;

    this.accumulator += deltaMs;
    while (this.accumulator >= FIXED_STEP_MS) {
      this.accumulator -= FIXED_STEP_MS;
      this._tick++;
      world.tick = this._tick;

      const ctx: SimContext = {
        tick: this._tick,
        dtMs: FIXED_STEP_MS,
        rngSeed: this._tick,
        commands: this.pendingCommands,
      };

      // Traiter les commandes
      for (const cmd of this.pendingCommands) {
        if (cmd.type === 'SPAWN_HAULER') {
          const { spawnHauler } = require('./world');
          spawnHauler(world, cmd.pos, cmd.demonName);
        }
      }

      for (const system of this.systems) {
        system.update(ctx, world);
      }

      this.pendingCommands = [];

      // Score : +1 par ennemi tué (détecté par delta enemies)
      this._checkGameOver(world);
    }
  }

  private _checkGameOver(world: WorldState): void {
    // Condition : un ennemi atteint x <= 0
    for (const enemy of world.enemies.values()) {
      if (enemy.pos.x <= 0) {
        this.gameOver = true;
        return;
      }
    }
  }

  addScore(points: number): void {
    this.score += points;
  }

  reset(): void {
    this.accumulator = 0;
    this._tick = 0;
    this.pendingCommands = [];
    this.gameOver = false;
    this.score = 0;
    this.waveSystem.reset();
  }

  get tick(): number { return this._tick; }
}
