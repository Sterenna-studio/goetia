// ============================================================
// GOETIA — WaveSystem v2
// • Vagues automatiques avec cooldown de respiration
// • Composition croissante : soldats, prêtres, chevaliers, boss
// • Placement en 3 couloirs (Nord / Centre / Sud)
// • Chaque ennemi mort génère un cadavre exploitable
// • Annonce publique via waveAnnouncer (lu par le HUD)
// ============================================================

import type { GameSystem, SimContext, WorldState } from '../types';
import { spawnEnemy, spawnCorpse } from '../world';

// ── Timings (en ticks à 100ms/tick) ────────────────────────
// Première vague après 8s
const FIRST_WAVE_TICK  = 80;
// Pause entre la fin d'une vague et le début de la suivante : 12s
const REST_TICKS       = 120;
// Durée de l'annonce HUD
const ANNOUNCE_TICKS   = 30;
// Cadence de spawn à l'intérieur d'une vague (1 unité toutes les X ticks)
const SPAWN_CADENCE    = 6;

const MAP_W = 1280;

// 3 couloirs Y
const LANES = [
  { yMin: 60,  yMax: 230 },   // Nord
  { yMin: 270, yMax: 450 },   // Centre
  { yMax: 650, yMin: 490 },   // Sud
];

// ── Composition d'une vague ──────────────────────────────
type EnemyType = 'soldier' | 'priest' | 'knight';
interface SpawnOrder { type: EnemyType; lane: number; }

function buildWave(wave: number): SpawnOrder[] {
  const orders: SpawnOrder[] = [];

  // Soldats : 2 + 1.5 par vague
  const soldiers = 2 + Math.floor(wave * 1.5);
  for (let i = 0; i < soldiers; i++) {
    orders.push({ type: 'soldier', lane: i % 3 });
  }

  // Prêtres : 1 dès v3, +1 tous les 3 vagues
  if (wave >= 3) {
    const priests = 1 + Math.floor((wave - 3) / 3);
    for (let i = 0; i < priests; i++) {
      orders.push({ type: 'priest', lane: (i + 1) % 3 });
    }
  }

  // Chevaliers : 1 dès v5, +1 tous les 4 vagues
  if (wave >= 5) {
    const knights = 1 + Math.floor((wave - 5) / 4);
    for (let i = 0; i < knights; i++) {
      orders.push({ type: 'knight', lane: (i + 2) % 3 });
    }
  }

  // Boss vague 10, 20, 30…
  if (wave % 10 === 0) {
    orders.push({ type: 'knight', lane: 1 }); // Boss centre
  }

  // Mélange l'ordre pour varier l'entrée
  for (let i = orders.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orders[i], orders[j]] = [orders[j], orders[i]];
  }
  return orders;
}

// ── Stats par type et vague ─────────────────────────────
function stats(type: EnemyType, wave: number) {
  const scale = 1 + wave * 0.12;
  switch (type) {
    case 'soldier': return { hp: Math.round(18 * scale), dmg: 5,  speed: Math.min(1.4, 0.65 + wave * 0.06) };
    case 'priest':  return { hp: Math.round(12 * scale), dmg: 3,  speed: Math.min(1.1, 0.55 + wave * 0.04) };
    case 'knight':  return {
      hp:    Math.round((wave % 10 === 0 ? 80 : 45) * scale),  // boss vs normal
      dmg:   wave % 10 === 0 ? 18 : 9,
      speed: Math.min(0.85, 0.38 + wave * 0.025),
    };
  }
}

// ── Annonceur (lu par le HUD) ────────────────────────────
export interface WaveAnnouncement {
  wave: number;
  label: string;   // ex. "Vague 5", "BOSS — Vague 10"
  isBoss: boolean;
  ticksLeft: number;
}
export let currentAnnouncement: WaveAnnouncement | null = null;

// ── Cadavres laissés par les ennemis ───────────────────────
// Appelé depuis CombatSystem quand un ennemi passe state='dead'
export function leaveCorpse(world: WorldState, pos: { x: number; y: number }, type: EnemyType): void {
  const tags: ('human' | 'soldier' | 'priest' | 'burned' | 'crushed' | 'large')[] =
    type === 'priest'  ? ['human', 'priest'] :
    type === 'knight'  ? ['soldier', 'large'] :
    ['soldier'];
  spawnCorpse(world, { x: pos.x + (Math.random() - 0.5) * 12, y: pos.y + (Math.random() - 0.5) * 12 }, tags);
}

// ── WaveSystem ────────────────────────────────────────────
export class WaveSystem implements GameSystem {
  readonly name = 'WaveSystem';

  public  currentWave   = 0;
  private phase: 'waiting' | 'announcing' | 'spawning' | 'resting' = 'waiting';
  private nextTick      = FIRST_WAVE_TICK;
  private spawnQueue:   SpawnOrder[] = [];
  private spawnTick     = 0;
  private announceTick  = 0;

  update(_ctx: SimContext, world: WorldState): void {
    const t = world.tick;

    // ─ Tick annonce
    if (currentAnnouncement) {
      currentAnnouncement.ticksLeft--;
      if (currentAnnouncement.ticksLeft <= 0) currentAnnouncement = null;
    }

    switch (this.phase) {

      // ─ Attente avant la première ou prochaine vague
      case 'waiting':
        if (t >= this.nextTick) {
          this.currentWave++;
          const isBoss = this.currentWave % 10 === 0;
          currentAnnouncement = {
            wave:     this.currentWave,
            label:    isBoss ? `⚠ BOSS — Vague ${this.currentWave}` : `Vague ${this.currentWave}`,
            isBoss,
            ticksLeft: ANNOUNCE_TICKS,
          };
          this.spawnQueue  = buildWave(this.currentWave);
          this.spawnTick   = t + ANNOUNCE_TICKS;  // commence après l'annonce
          this.announceTick = t;
          this.phase       = 'announcing';
        }
        break;

      // ─ Pause d'annonce (le HUD affiche "Vague X")
      case 'announcing':
        if (t >= this.spawnTick) this.phase = 'spawning';
        break;

      // ─ Spawn cadencé des unités
      case 'spawning':
        if (this.spawnQueue.length === 0) {
          // Toute la vague est spawnée — on attend qu'elle soit vidée
          this.phase = 'resting';
          this.nextTick = t + REST_TICKS;
          break;
        }
        if (t % SPAWN_CADENCE === 0) {
          const order = this.spawnQueue.shift()!;
          this._spawnUnit(world, order);
        }
        break;

      // ─ Repos : attend que les ennemis soient éliminés OU que le timer expire
      case 'resting': {
        const alive = [...world.enemies.values()].filter(e => e.state !== 'dead').length;
        if (alive === 0 || t >= this.nextTick) {
          this.phase    = 'waiting';
          this.nextTick = t + (alive === 0 ? 40 : 10); // bonus si tout nettoyé
        }
        break;
      }
    }
  }

  private _spawnUnit(world: WorldState, order: SpawnOrder): void {
    const lane = LANES[order.lane];
    const y    = lane.yMin + Math.random() * (lane.yMax - lane.yMin);
    const x    = MAP_W - 20 + Math.random() * 30; // léger décalage X
    const s    = stats(order.type, this.currentWave);
    spawnEnemy(world, { x, y }, s.hp, s.dmg, s.speed, order.type);
  }

  /** Appelé depuis CombatSystem au kill — génère un cadavre. */
  onEnemyKilled(world: WorldState, pos: { x: number; y: number }, type: string): void {
    leaveCorpse(world, pos, type as EnemyType);
  }

  get phase_(): string { return this.phase; }

  /** Pourcentage de progression du repos [0–1] pour la barre HUD. */
  get restProgress(): number {
    if (this.phase !== 'resting') return 1;
    // not exposed directly, HUD uses waveSystem.restProgress via sim
    return 0;
  }

  reset(): void {
    this.currentWave  = 0;
    this.phase        = 'waiting';
    this.nextTick     = FIRST_WAVE_TICK;
    this.spawnQueue   = [];
    this.spawnTick    = 0;
    this.announceTick = 0;
    currentAnnouncement = null;
  }
}
