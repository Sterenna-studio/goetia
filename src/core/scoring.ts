// ============================================================
// GOETIA — ScoringSystem v2
// + scoreMult depuis UpgradeSystem
// + passe worldPos au popup pour coords monde→écran
// ============================================================

import { EventBus } from './events';

const BASE_DELIVER = 10;

const FRESHNESS_MULT = (f: number) => 0.5 + f * 1.5; // 0.5 → 2.0

const SOUL_BONUS: Record<string, number> = {
  common:  8,
  potent:  14,
  sainted: 20,
  tainted: -4,
};

const TYPE_BONUS: Record<string, number> = {
  soldier: 5,
  large:   10,
  priest:  2,
  human:   0,
};

export interface ScoreEvent {
  base:       number;
  freshBonus: number;
  soulBonus:  number;
  typeBonus:  number;
  comboBonus: number;
  total:      number;
  worldPos?:  { x: number; y: number };
  label:      string;
}

export class ScoringSystem {
  private _combo     = 0;
  private _comboTick = 0;
  private readonly COMBO_WINDOW = 15;

  /** Multiplicateur global injecté par la sim depuis upgrades.scoreMult */
  scoreMult = 1.0;

  install(): void {
    EventBus.on('CORPSE_DELIVERED', ev => this._onDeliver(ev));
  }

  uninstall(): void { EventBus.clear(); this._combo = 0; }

  private _onDeliver(
    ev: Extract<import('./events').GoetiaEvent, { type: 'CORPSE_DELIVERED' }>
  ): void {
    this._combo++;
    const combo = this._combo >= 3 ? this._combo : 0;

    const base       = BASE_DELIVER;
    const freshBonus = Math.round(base * (FRESHNESS_MULT(ev.freshness) - 1));
    const soulBonus  = ev.soulQuality ? (SOUL_BONUS[ev.soulQuality] ?? 0) : 0;
    const typeBonus  = TYPE_BONUS[ev.corpseType] ?? 0;
    const comboBonus = combo * 5;
    const raw        = base + freshBonus + soulBonus + typeBonus + comboBonus;
    const total      = Math.max(1, Math.round(raw * this.scoreMult));

    const label = [
      `+${total}`,
      ev.soulQuality === 'sainted' ? ' \u2605\u00c2me sa\u00eente' : '',
      combo >= 3                   ? ` x${combo}\u00a0combo!` : '',
    ].join('');

    this._onScore?.({ base, freshBonus, soulBonus, typeBonus, comboBonus, total, worldPos: ev.worldPos, label });
  }

  tickComboDecay(currentTick: number): void {
    if (currentTick - this._comboTick > this.COMBO_WINDOW) this._combo = 0;
    this._comboTick = currentTick;
  }

  private _onScore?: (ev: ScoreEvent) => void;
  onScore(fn: (ev: ScoreEvent) => void): void { this._onScore = fn; }

  get combo(): number { return this._combo; }
  reset(): void { this._combo = 0; this._comboTick = 0; }
}
