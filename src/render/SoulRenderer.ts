// ============================================================
// GOETIA — SoulRenderer
// Rendu Phaser des âmes : qualité, stabilité, lien au cadavre d'origine.
// ============================================================

import type Phaser from 'phaser';
import type { Corpse, Soul, SoulQuality, Tick } from '../core/types';
import { C } from '../ui/theme';

interface SoulLook {
  color: number;
  radius: number;
  halo: number;
}

const TAU = Math.PI * 2;

export function renderSouls(
  g: Phaser.GameObjects.Graphics,
  souls: Iterable<Soul>,
  corpses: ReadonlyMap<string, Corpse>,
  tick: Tick,
): void {
  for (const soul of souls) renderSoul(g, soul, corpses, tick);
}

function renderSoul(
  g: Phaser.GameObjects.Graphics,
  soul: Soul,
  corpses: ReadonlyMap<string, Corpse>,
  tick: Tick,
): void {
  const look = soulLook(soul.quality);
  const seed = hash01(soul.id);
  const pulse = 0.5 + Math.sin(tick * 0.22 + seed * TAU) * 0.5;
  const drift = Math.sin(tick * 0.07 + seed * TAU) * 2;
  const x = soul.pos.x;
  const y = soul.pos.y - 14 + drift;
  const stability = clamp01(soul.stability01);
  const alpha = soul.captured ? 0.28 : 0.22 + stability * 0.72;

  const origin = corpses.get(soul.originCorpseId);
  if (origin && !soul.captured) {
    g.lineStyle(1, look.color, 0.08 + stability * 0.14);
    g.lineBetween(origin.pos.x, origin.pos.y, x, y);
  }

  g.fillStyle(look.color, 0.06 + pulse * 0.04);
  g.fillCircle(x, y, look.halo + pulse * 3);

  g.lineStyle(1, look.color, alpha * 0.45);
  g.strokeCircle(x, y, look.halo + pulse * 2);

  g.fillStyle(look.color, alpha);
  g.fillCircle(x, y, look.radius + pulse * 1.2);

  g.lineStyle(1, look.color, alpha * 0.7);
  g.strokeCircle(x, y, look.radius + 3 + pulse * 1.5);

  renderSpark(g, x, y, look.color, alpha, tick * 0.12 + seed * TAU);

  if (soul.quality === 'tainted') {
    g.lineStyle(1, C.WARNING, alpha * 0.4);
    g.strokeCircle(x, y, look.halo + 6);
  }
}

function soulLook(quality: SoulQuality): SoulLook {
  switch (quality) {
    case 'faint':
      return { color: C.CORPSE_FRESH, radius: 3, halo: 7 };
    case 'potent':
      return { color: C.ACCENT, radius: 5, halo: 11 };
    case 'sainted':
      return { color: C.BLESSED, radius: 5, halo: 12 };
    case 'tainted':
      return { color: C.ACCENT2, radius: 5, halo: 12 };
    case 'common':
    default:
      return { color: C.SOUL, radius: 4, halo: 9 };
  }
}

function renderSpark(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  alpha: number,
  phase: number,
): void {
  const radius = 8;
  const a = phase;
  const b = phase + Math.PI / 2;
  g.lineStyle(1, color, alpha * 0.38);
  g.lineBetween(
    x + Math.cos(a) * radius,
    y + Math.sin(a) * radius,
    x - Math.cos(a) * radius,
    y - Math.sin(a) * radius,
  );
  g.lineBetween(
    x + Math.cos(b) * radius * 0.55,
    y + Math.sin(b) * radius * 0.55,
    x - Math.cos(b) * radius * 0.55,
    y - Math.sin(b) * radius * 0.55,
  );
}

function hash01(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
