// ============================================================
// GOETIA — CorpseRenderer
// Rendu Phaser des cadavres, auras d'âme attachée et anneaux d'extraction.
// ============================================================

import type Phaser from 'phaser';
import type { Corpse, Tick } from '../core/types';
import { C } from '../ui/theme';

const TAU = Math.PI * 2;

export function renderCorpses(g: Phaser.GameObjects.Graphics, corpses: Iterable<Corpse>, tick: Tick): void {
  for (const corpse of corpses) renderCorpse(g, corpse, tick);
}

function renderCorpse(g: Phaser.GameObjects.Graphics, corpse: Corpse, tick: Tick): void {
  const { x, y } = corpse.pos;
  const seed = hash01(corpse.id);
  const angle = seed * TAU;
  const radius = corpseRadius(corpse);
  const alpha = clamp01(corpse.freshness01 * 0.78 + 0.18);
  const color = corpseColor(corpse);

  // Ombre organique au sol : garde la lisibilité sur la grille.
  g.fillStyle(0x000000, 0.22);
  g.fillCircle(x + 2, y + 3, radius + 2);

  // Corps principal.
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, radius);
  g.lineStyle(1, corpse.blessed ? C.BLESSED : C.CORPSE, corpse.blessed ? 0.72 : 0.52);
  g.strokeCircle(x, y, radius);

  // Petit squelette abstrait, déterministe par id pour éviter l'effet clone.
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const ox = Math.cos(angle + Math.PI / 2);
  const oy = Math.sin(angle + Math.PI / 2);
  const boneAlpha = corpse.blessed ? 0.72 : 0.28 + alpha * 0.22;
  g.lineStyle(1, corpse.blessed ? C.BLESSED : C.CORPSE, boneAlpha);
  g.lineBetween(x - dx * radius * 0.9, y - dy * radius * 0.9, x + dx * radius * 0.9, y + dy * radius * 0.9);
  g.lineBetween(x - ox * radius * 0.55, y - oy * radius * 0.55, x + ox * radius * 0.55, y + oy * radius * 0.55);

  if (corpse.soulAttached) {
    const pulse = 0.5 + Math.sin(tick * 0.18 + seed * TAU) * 0.5;
    const aura = 13 + pulse * 2;
    g.lineStyle(1, C.SOUL, 0.28 + pulse * 0.22);
    g.strokeCircle(x, y, aura);
    g.lineStyle(1, C.SOUL, 0.12 + pulse * 0.12);
    g.strokeCircle(x, y, aura + 5);
  }

  if (corpse.extractorId) {
    const phase = tick * 0.15 + seed * TAU;
    const ring = 18 + Math.sin(tick * 0.28 + seed) * 1.6;
    g.lineStyle(1, C.EXTRACTOR_RING, 0.52);
    g.strokeCircle(x, y, ring);
    renderRingMarks(g, x, y, ring, phase, C.EXTRACTOR_RING, 0.72);
  }

  if (corpse.blessed) {
    g.lineStyle(1, C.BLESSED, 0.72);
    g.lineBetween(x - 5, y, x + 5, y);
    g.lineBetween(x, y - 5, x, y + 5);
    g.strokeCircle(x, y, radius + 4);
  }
}

function corpseRadius(corpse: Corpse): number {
  const tagBonus = corpse.tags.includes('large') || corpse.tags.includes('knight') ? 2.5 : 0;
  const massBonus = Math.min(2.5, Math.max(0, corpse.mass - 1) * 0.7);
  return corpse.blessed ? 5.5 : 6.5 + tagBonus + massBonus;
}

function corpseColor(corpse: Corpse): number {
  if (corpse.blessed) return C.BLESSED;
  if (corpse.tags.includes('burned')) return 0x4a2415;
  if (corpse.tags.includes('crushed')) return 0x3a3a2a;
  if (corpse.tags.includes('priest')) return 0xaaccaa;
  if (corpse.tags.includes('knight')) return 0x667744;
  if (corpse.tags.includes('soldier')) return 0x448844;
  return C.CORPSE_FRESH;
}

function renderRingMarks(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  phase: number,
  color: number,
  alpha: number,
): void {
  g.lineStyle(1, color, alpha);
  for (let i = 0; i < 4; i += 1) {
    const a = phase + i * (TAU / 4);
    const inner = radius - 3;
    const outer = radius + 3;
    g.lineBetween(
      x + Math.cos(a) * inner,
      y + Math.sin(a) * inner,
      x + Math.cos(a) * outer,
      y + Math.sin(a) * outer,
    );
  }
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
