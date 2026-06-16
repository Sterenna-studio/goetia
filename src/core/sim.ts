// ============================================================
// GOETIA — Boucle de simulation fixed-step
// Découplée du rendu. Appelée par GameScene à chaque frame.
// ============================================================

import type { WorldState, SimContext, GameSystem, GameCommand } from './types';
import { NecromancySystem } from './systems/NecromancySystem';
import { HaulingSystem } from './systems/HaulingSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { CombatSystem } from './systems/CombatSystem';

const FIXED_STEP_MS = 100; // 10 ticks/seconde

export class Simulation {
  private systems: GameSystem[];
  private accumulator = 0;
  private _tick = 0;
  private pendingCommands: GameCommand[] = [];

  constructor() {
    this.systems = [
      new NecromancySystem(),
      new HaulingSystem(),
      new SpawnSystem(),
      new CombatSystem(),
    ];
  }

  pushCommand(cmd: GameCommand): void {
    this.pendingCommands.push(cmd);
  }

  update(world: WorldState, deltaMs: number): void {
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
      for (const system of this.systems) {
        system.update(ctx, world);
      }
      this.pendingCommands = [];
    }
  }

  reset(): void {
    this.accumulator = 0;
    this._tick = 0;
    this.pendingCommands = [];
  }

  get tick(): number { return this._tick; }
}
