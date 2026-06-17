// ============================================================
// GOETIA — EventBus v2
// CORPSE_DELIVERED intègre maintenant worldPos optionnel
// pour que le popup appaïsse au bon endroit sur le canvas.
// ============================================================

export type GoetiaEvent =
  | { type: 'CORPSE_DELIVERED'; corpseId: string; pitId: string; freshness: number; soulQuality: string | null; corpseType: string; worldPos?: { x: number; y: number } }
  | { type: 'SOUL_CAPTURED';    soulId: string; quality: string }
  | { type: 'ENEMY_KILLED';     enemyId: string; enemyType: string }
  | { type: 'HAULER_DIED';      haulerId: string };

type Listener<T extends GoetiaEvent> = (ev: T) => void;
type AnyListener = (ev: GoetiaEvent) => void;

const _listeners = new Map<string, AnyListener[]>();

export const EventBus = {
  on<T extends GoetiaEvent>(type: T['type'], fn: Listener<T>): void {
    if (!_listeners.has(type)) _listeners.set(type, []);
    _listeners.get(type)!.push(fn as AnyListener);
  },
  off<T extends GoetiaEvent>(type: T['type'], fn: Listener<T>): void {
    const arr = _listeners.get(type);
    if (arr) _listeners.set(type, arr.filter(f => f !== fn));
  },
  emit(ev: GoetiaEvent): void { _listeners.get(ev.type)?.forEach(fn => fn(ev)); },
  clear(): void { _listeners.clear(); },
};
