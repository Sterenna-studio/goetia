// ============================================================
// GOETIA — ScoringSystem
// Calcule les points pour chaque action via l'EventBus.
//
// Table de points de base :
//   Cadavre livré         : 10 pts
//   + bonus fraîcheur     : × (0.5 → 2.0) selon freshness01
//   + bonus âme attachée  : +8 pts  (common) / +14 (potent) / +20 (sainted) / -4 (tainted)
//   + bonus type cadavre  : +5 (soldier) / +10 (knight=large) / +2 (priest)
//   + bonus combo        : +5×combo si combo >= 3
//   Ennemi tué           : 5 pts (géré dans sim.ts, non touché)
// ============================================================

import { EventBus } from './events';

const BASE_DELIVER = 10;

const FRESHNESS_MULTIPLIER = (f: number) => 0.5 + f * 1.5;  // 0.5 → 2.0

const SOUL_BONUS: Record<string, number> = {
  common:  8,
  potent:  14,
  sainted: 20,
  tainted: -4,
};

const TYPE_BONUS: Record<string, number> = {
  soldier: 5,
  large:   10,   // chevalier
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
  pos?:       { x: number; y: number };
  label:      string;
}

export class ScoringSystem {
  private _combo     = 0;
  private _comboTick = 0;          // tick de la dernière livraison
  private readonly COMBO_WINDOW = 15; // 1.5s à 100ms/tick

  /** Abonne les listeners au bus. */
  install(): void {
    EventBus.on('CORPSE_DELIVERED', ev => this._onDeliver(ev));
  }

  uninstall(): void {
    EventBus.clear();
    this._combo = 0;
  }

  private _onDeliver(ev: Extract<import('./events').GoetiaEvent, { type: 'CORPSE_DELIVERED' }>): ScoreEvent {
    // Combo : réinitialise si trop de ticks depuis la dernière livraison
    // (tick passé via ev n'est pas dispo ici — on utilise Date.now comme proxy)
    this._combo++;
    const combo = this._combo >= 3 ? this._combo : 0;

    const base       = BASE_DELIVER;
    const freshBonus = Math.round(base * (FRESHNESS_MULTIPLIER(ev.freshness) - 1));
    const soulBonus  = ev.soulQuality ? (SOUL_BONUS[ev.soulQuality] ?? 0) : 0;
    const typeBonus  = TYPE_BONUS[ev.corpseType] ?? 0;
    const comboBonus = combo * 5;
    const total      = Math.max(1, base + freshBonus + soulBonus + typeBonus + comboBonus);

    const label = [
      `+${total}`,
      ev.soulQuality === 'sainted' ? ' ★Âme saînte' : '',
      combo >= 3                   ? ` x${combo} combo!` : '',
    ].join('');

    const result: ScoreEvent = { base, freshBonus, soulBonus, typeBonus, comboBonus, total, label };
    // Notifie la sim via callback installé par la sim
    this._onScore?.(result);
    return result;
  }

  /** Appelé quand trop de temps s'écoule sans livraison (depuis sim.update). */
  tickComboDecay(currentTick: number): void {
    if (currentTick - this._comboTick > this.COMBO_WINDOW) {
      this._combo = 0;
    }
    this._comboTick = currentTick;
  }

  private _onScore?: (ev: ScoreEvent) => void;

  /** La sim s'enregistre ici pour recevoir les points. */
  onScore(fn: (ev: ScoreEvent) => void): void {
    this._onScore = fn;
  }

  get combo(): number { return this._combo; }
  reset(): void { this._combo = 0; this._comboTick = 0; }
}
