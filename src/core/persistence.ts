// ============================================================
// GOETIA — Persistence localStorage
// Meilleur score, vague max, historique 5 dernières parties.
// ============================================================

const KEY_BEST = 'goetia_best';
const KEY_HISTORY = 'goetia_history';
const HISTORY_MAX = 5;

export interface RunRecord {
  score: number;
  wave: number;
  upgrades: number;
  date: string;
}

export interface BestRecord {
  score: number;
  wave: number;
}

export function loadBest(): BestRecord {
  try {
    const raw = localStorage.getItem(KEY_BEST);
    if (!raw) return { score: 0, wave: 0 };
    return JSON.parse(raw) as BestRecord;
  } catch { return { score: 0, wave: 0 }; }
}

export function saveBest(score: number, wave: number): BestRecord {
  const current = loadBest();
  const best: BestRecord = {
    score: Math.max(current.score, score),
    wave: Math.max(current.wave, wave),
  };
  localStorage.setItem(KEY_BEST, JSON.stringify(best));
  return best;
}

export function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as RunRecord[];
  } catch { return []; }
}

export function saveRun(score: number, wave: number, upgrades: number): void {
  const history = loadHistory();
  history.unshift({
    score, wave, upgrades,
    date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  });
  if (history.length > HISTORY_MAX) history.pop();
  localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
}

export function resetPersistence(): void {
  localStorage.removeItem(KEY_BEST);
  localStorage.removeItem(KEY_HISTORY);
}
