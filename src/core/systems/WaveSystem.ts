// ============================================================
// GOETIA — WaveSystem
// Spawne des vagues d'ennemis croissantes toutes les N ticks.
// ============================================================

import type { GameSystem, SimContext, WorldState } from '../types';
import { spawnEnemy } from '../world';

const WAVE_INTERVAL_TICKS = 150; // ~15s à 10 ticks/s
const MAP_WIDTH = 1280;

export class WaveSystem implements GameSystem {
  readonly name = 'WaveSystem';
  private nextWaveTick = WAVE_INTERVAL_TICKS;
  public currentWave = 0;

  update(_ctx: SimContext, world: WorldState): void {
    if (world.tick < this.nextWaveTick) return;
    this.currentWave++;
    this.nextWaveTick = world.tick + WAVE_INTERVAL_TICKS;
    this._spawnWave(world);
  }

  private _spawnWave(world: WorldState): void {
    const count = 1 + Math.floor(this.currentWave * 1.5);
    for (let i = 0; i < count; i++) {
      const y = 80 + Math.random() * 560;
      const hp = 15 + this.currentWave * 8;
      const speed = 0.6 + this.currentWave * 0.1;
      spawnEnemy(world, { x: MAP_WIDTH - 20, y }, hp, 5, speed);
    }
  }

  reset(): void {
    this.currentWave = 0;
    this.nextWaveTick = WAVE_INTERVAL_TICKS;
  }
}
