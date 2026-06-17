// ============================================================
// GOETIA — UpgradeSystem v2
// Corrige label/desc, ajoute effects corpse_decay, score_mult,
// spawn_hauler. Expose getAll() proprement.
// ============================================================

import upgradeData from '../data/upgrades.json';
import type { WorldState } from './types';
import { spawnPit, spawnHauler } from './world';

export interface UpgradeDef {
  id:       string;
  label:    string;
  desc:     string;
  cost:     number;
  icon:     string;
  requires: string[];
  tier:     number;
  effect:   { type: string; value: number };
}

export const ALL_UPGRADES: UpgradeDef[] = upgradeData as UpgradeDef[];

export class UpgradeSystem {
  private purchased = new Set<string>();

  // Multiplicateurs cumulés
  haulerSpeedMult    = 1.0;
  pitSpeedMult       = 1.0;
  unitDamageMult     = 1.0;
  soulDecayMult      = 1.0;
  corpseDecayMult    = 1.0;
  scoreMult          = 1.0;

  getAll(): UpgradeDef[] { return ALL_UPGRADES; }

  canAfford(id: string, score: number): boolean {
    const def = ALL_UPGRADES.find(u => u.id === id);
    if (!def) return false;
    if (this.purchased.has(id)) return false;
    if (!def.requires.every(r => this.purchased.has(r))) return false;
    return score >= def.cost;
  }

  isUnlocked(id: string): boolean {
    const def = ALL_UPGRADES.find(u => u.id === id);
    if (!def) return false;
    return def.requires.every(r => this.purchased.has(r));
  }

  isPurchased(id: string): boolean { return this.purchased.has(id); }

  buy(id: string, score: number, world: WorldState): number {
    if (!this.canAfford(id, score)) return score;
    const def = ALL_UPGRADES.find(u => u.id === id)!;
    this.purchased.add(id);
    this._apply(def, world);
    return score - def.cost;
  }

  private _apply(def: UpgradeDef, world: WorldState): void {
    const v = def.effect.value;
    switch (def.effect.type) {
      case 'hauler_speed':
        this.haulerSpeedMult *= (1 + v);
        for (const h of world.haulers.values()) h.speed *= (1 + v);
        break;
      case 'pit_speed':
        this.pitSpeedMult *= (1 + v);
        break;
      case 'unit_damage':
        this.unitDamageMult *= (1 + v);
        for (const u of world.units.values()) u.damage *= (1 + v);
        break;
      case 'soul_decay':
        this.soulDecayMult   = Math.max(0.05, this.soulDecayMult + v);
        break;
      case 'corpse_decay':
        this.corpseDecayMult = Math.max(0.05, this.corpseDecayMult + v);
        break;
      case 'score_mult':
        this.scoreMult *= (1 + v);
        break;
      case 'spawn_pit':
        spawnPit(world, { x: 480, y: 370 });
        break;
      case 'bathin_capacity':
        for (const h of world.haulers.values()) {
          if (h.demonName === 'bathin') h.carryCapacity += v;
        }
        break;
      case 'spawn_hauler':
        spawnHauler(world, { x: 100 + Math.random() * 180, y: 150 + Math.random() * 420 }, 'bifrons');
        break;
    }
  }

  reset(): void {
    this.purchased.clear();
    this.haulerSpeedMult = 1.0; this.pitSpeedMult   = 1.0;
    this.unitDamageMult  = 1.0; this.soulDecayMult  = 1.0;
    this.corpseDecayMult = 1.0; this.scoreMult       = 1.0;
  }

  getPurchased(): string[] { return [...this.purchased]; }
}
