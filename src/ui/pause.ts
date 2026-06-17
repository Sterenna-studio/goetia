// ============================================================
// GOETIA — PauseOverlay
// Overlay DOM pur, indépendant de Phaser.
// ============================================================

let _visible = false;
let _onResume: (() => void) | null = null;
let _onRestart: (() => void) | null = null;
let _onTitle: (() => void) | null = null;

export function initPause(
  onResume: () => void,
  onRestart: () => void,
  onTitle: () => void,
): void {
  _onResume  = onResume;
  _onRestart = onRestart;
  _onTitle   = onTitle;
  if (document.getElementById('goetia-pause')) return;

  // --- Style ---
  const style = document.createElement('style');
  style.id = 'goetia-pause-style';
  style.textContent = `
    #goetia-pause {
      position: fixed; inset: 0; z-index: 300;
      display: none; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.72);
      font-family: 'Courier New', monospace;
    }
    #pause-card {
      background: #0d0d1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      padding: 40px 60px;
      min-width: 340px;
      display: flex; flex-direction: column;
      align-items: center; gap: 0;
    }
    #pause-title {
      font-size: 32px; font-weight: bold;
      color: #cc4444; letter-spacing: 0.15em;
      margin-bottom: 6px;
    }
    #pause-sub {
      font-size: 12px; color: #333;
      letter-spacing: 0.2em; margin-bottom: 36px;
    }
    .pause-btn {
      width: 240px; padding: 12px 0;
      margin-bottom: 12px;
      background: #0d0d1a; border: 1px solid #333;
      border-radius: 6px; cursor: pointer;
      color: #aaa; font-family: monospace; font-size: 15px;
      letter-spacing: 0.05em; transition: border-color 0.15s, color 0.15s;
      text-align: center;
    }
    .pause-btn:hover { color: #fff; border-color: #cc4444; }
    .pause-btn.primary { color: #cc4444; border-color: #552222; margin-bottom: 24px; }
    .pause-btn.primary:hover { border-color: #cc4444; color: #ff6666; }
    #pause-hint {
      font-size: 11px; color: #292929;
      margin-top: 8px; letter-spacing: 0.05em;
    }
  `;
  if (!document.getElementById('goetia-pause-style')) document.head.appendChild(style);

  // --- Overlay ---
  const overlay = document.createElement('div');
  overlay.id = 'goetia-pause';
  overlay.innerHTML = `
    <div id="pause-card">
      <div id="pause-title">PAUSE</div>
      <div id="pause-sub">EN ATTENTE DE VOS ORDRES</div>
      <button class="pause-btn primary" id="pause-resume">[ Reprendre ]</button>
      <button class="pause-btn" id="pause-restart">Recommencer</button>
      <button class="pause-btn" id="pause-title-btn">Écran titre</button>
      <div id="pause-hint">[ESC] ou [P] pour reprendre</div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('pause-resume')!   .addEventListener('click', hidePause);
  document.getElementById('pause-restart')!  .addEventListener('click', () => { hidePause(); _onRestart?.(); });
  document.getElementById('pause-title-btn')!.addEventListener('click', () => { hidePause(); _onTitle?.(); });

  // Clic hors card = reprendre
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hidePause(); });
}

export function showPause(): void {
  if (_visible) return;
  _visible = true;
  const el = document.getElementById('goetia-pause');
  if (el) el.style.display = 'flex';
}

export function hidePause(): void {
  if (!_visible) return;
  _visible = false;
  const el = document.getElementById('goetia-pause');
  if (el) el.style.display = 'none';
  _onResume?.();
}

export function togglePause(): void { _visible ? hidePause() : showPause(); }
export function isPaused(): boolean { return _visible; }
