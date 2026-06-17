// ============================================================
// GOETIA — Pause overlay (thème néromancien)
// ============================================================

import { CSS } from './theme';

let _paused = false;

export function isPaused(): boolean { return _paused; }

export function togglePause(): void {
  _paused = !_paused;
  const ov = document.getElementById('goetia-pause');
  if (ov) ov.style.display = _paused ? 'flex' : 'none';
}
export function hidePause(): void {
  _paused = false;
  const ov = document.getElementById('goetia-pause');
  if (ov) ov.style.display = 'none';
}

export function initPause(
  onResume:  () => void,
  onRestart: () => void,
  onMenu:    () => void,
): void {
  document.getElementById('goetia-pause')?.remove();
  document.getElementById('goetia-pause-style')?.remove();
  _paused = false;

  const style = document.createElement('style');
  style.id = 'goetia-pause-style';
  style.textContent = `
    #goetia-pause {
      display: none;
      position: fixed; inset: 0; z-index: 300;
      background: rgba(0,0,0,0.88);
      flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; font-family: 'Courier New', monospace;
    }
    #goetia-pause h2 {
      color: ${CSS.ACCENT};
      font-size: 28px; letter-spacing: 0.4em;
      text-shadow: 0 0 18px ${CSS.ACCENT}66;
      margin: 0 0 8px;
    }
    .pause-btn {
      background: rgba(0,0,0,0.8);
      border: 1px solid ${CSS.BORDER};
      color: ${CSS.TEXT};
      font-family: monospace; font-size: 14px;
      padding: 10px 40px; cursor: pointer; width: 260px;
      text-align: center; letter-spacing: 0.1em;
      transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
    }
    .pause-btn:hover {
      border-color: ${CSS.ACCENT};
      color: ${CSS.ACCENT};
      box-shadow: 0 0 10px ${CSS.ACCENT}33;
    }
    .pause-btn.danger:hover {
      border-color: ${CSS.WARNING};
      color: ${CSS.WARNING};
      box-shadow: 0 0 10px ${CSS.WARNING}33;
    }
    .pause-sep {
      width: 260px; border: none;
      border-top: 1px solid ${CSS.BORDER}; margin: 4px 0;
    }
  `;
  document.head.appendChild(style);

  const ov = document.createElement('div');
  ov.id = 'goetia-pause';
  ov.innerHTML = `
    <h2>⧖ PAUSE ⧖</h2>
    <button class="pause-btn" id="pause-resume">[ESC] Reprendre</button>
    <hr class="pause-sep">
    <button class="pause-btn" id="pause-restart">[R] Recommencer</button>
    <button class="pause-btn danger" id="pause-menu">Menu principal</button>
  `;
  document.body.appendChild(ov);

  document.getElementById('pause-resume') ?.addEventListener('click', () => { hidePause(); onResume(); });
  document.getElementById('pause-restart')?.addEventListener('click', () => { hidePause(); onRestart(); });
  document.getElementById('pause-menu')   ?.addEventListener('click', () => { hidePause(); onMenu(); });
}
