// ============================================================
// GOETIA — WaveSystem
// Vagues croissantes avec ennemis spéciaux dès vague 3.
// ============================================================

import type { GameSystem, SimContext, WorldState } from '../types';
import { spawnEnemy } from '../world';

const WAVE_INTERVAL_TICKS = 150;
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
    const w = this.currentWave;
    const baseHp = 15 + w * 8;
    const baseSpeed = 0.6 + w * 0.1;
    const x = MAP_WIDTH - 20;

    // Soldats de base
    const soldierCount = 1 + Math.floor(w * 1.2);
    for (let i = 0; i < soldierCount; i++) {
      spawnEnemy(world, { x, y: 80 + Math.random() * 560 }, baseHp, 5, baseSpeed, 'soldier');
    }

    // Prêtre dès vague 3 (1 tous les 2 vagues)
    if (w >= 3 && w % 2 === 1) {
      spawnEnemy(world, { x, y: 200 + Math.random() * 320 }, baseHp * 0.6, 3, baseSpeed * 0.8, 'priest');
    }

    // Chevalier dès vague 5 (1 par vague)
    if (w >= 5) {
      const knightHp = baseHp * 2.5;
      spawnEnemy(world, { x, y: 150 + Math.random() * 420 }, knightHp, 8, baseSpeed * 0.5, 'knight');
    }

    // Boss vague 10 : Chevalier élite
    if (w === 10) {
      spawnEnemy(world, { x: x - 50, y: 360 }, baseHp * 5, 15, baseSpeed, 'knight');
    }
  }

  reset(): void { this.currentWave = 0; this.nextWaveTick = WAVE_INTERVAL_TICKS; }
}
