// ============================================================
// GOETIA — UpgradeSystem
// G\u00e8re l'achat et l'application des upgrades.
// ============================================================

import upgradeData from '../data/upgrades.json';
import type { WorldState } from './types';
import { spawnPit } from './world';

export interface UpgradeDef {
  id: string;
  label: string;
  desc: string;
  cost: number;
  icon: string;
  requires: string[];
  effect: { type: string; value: number };
}

export const ALL_UPGRADES: UpgradeDef[] = upgradeData as UpgradeDef[];

export class UpgradeSystem {
  private purchased = new Set<string>();

  // Multiplicateurs cumul\u00e9s
  haulerSpeedMult = 1.0;
  pitSpeedMult = 1.0;
  unitDamageMult = 1.0;
  soulDecayMult = 1.0;

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

  isPurchased(id: string): boolean {
    return this.purchased.has(id);
  }

  buy(id: string, score: number, world: WorldState): number {
    if (!this.canAfford(id, score)) return score;
    const def = ALL_UPGRADES.find(u => u.id === id)!;
    this.purchased.add(id);
    const newScore = score - def.cost;
    this._apply(def, world);
    return newScore;
  }

  private _apply(def: UpgradeDef, world: WorldState): void {
    switch (def.effect.type) {
      case 'hauler_speed':
        this.haulerSpeedMult *= (1 + def.effect.value);
        for (const h of world.haulers.values()) {
          h.speed *= (1 + def.effect.value);
        }
        break;
      case 'pit_speed':
        this.pitSpeedMult *= (1 + def.effect.value);
        break;
      case 'unit_damage':
        this.unitDamageMult *= (1 + def.effect.value);
        for (const u of world.units.values()) {
          u.damage *= (1 + def.effect.value);
        }
        break;
      case 'soul_decay':
        this.soulDecayMult *= (1 + def.effect.value);
        break;
      case 'spawn_pit':
        spawnPit(world, { x: 480, y: 370 });
        break;
      case 'bathin_capacity':
        for (const h of world.haulers.values()) {
          if (h.demonName === 'bathin') h.carryCapacity += def.effect.value;
        }
        break;
    }
  }

  reset(): void {
    this.purchased.clear();
    this.haulerSpeedMult = 1.0;
    this.pitSpeedMult = 1.0;
    this.unitDamageMult = 1.0;
    this.soulDecayMult = 1.0;
  }

  getPurchased(): string[] {
    return [...this.purchased];
  }
}
