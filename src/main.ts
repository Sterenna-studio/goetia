import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { bootCursor } from './ui/cursor';

const GAME_W = 1280;
const GAME_H = 720;
const RESPONSIVE_STYLE_ID = 'goetia-responsive-shell-style';

function installResponsiveShell(): void {
  document.getElementById(RESPONSIVE_STYLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = RESPONSIVE_STYLE_ID;
  style.textContent = `
    :root {
      --goetia-green: #33ff66;
      --goetia-purple: #9933ff;
      --goetia-border: rgba(51, 255, 102, 0.24);
      --goetia-glow-green: 0 0 6px rgba(51,255,102,.62), 0 0 18px rgba(51,255,102,.25);
      --goetia-glow-purple: 0 0 6px rgba(153,51,255,.62), 0 0 20px rgba(153,51,255,.28);
      --goetia-safe-top: env(safe-area-inset-top, 0px);
      --goetia-safe-bottom: env(safe-area-inset-bottom, 0px);
    }

    html, body, #app {
      width: 100%;
      height: 100%;
      min-height: 100svh;
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 15%, rgba(153,51,255,.16), transparent 34%),
        radial-gradient(circle at 50% 90%, rgba(51,255,102,.1), transparent 36%),
        #020402 !important;
      overscroll-behavior: none;
      touch-action: none;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 4px),
        radial-gradient(circle at 50% 50%, transparent 0 58%, rgba(0,0,0,.55) 100%);
      opacity: .34;
      z-index: 0;
    }

    #app {
      position: fixed;
      inset: 0;
      display: grid !important;
      place-items: center !important;
      max-width: none !important;
      margin: 0 !important;
      border: 0 !important;
      z-index: 1;
    }

    #app canvas {
      max-width: 100vw !important;
      max-height: 100svh !important;
      box-shadow:
        0 0 0 1px rgba(51,255,102,.18),
        0 0 34px rgba(51,255,102,.08),
        0 0 80px rgba(153,51,255,.08);
      touch-action: none;
    }

    #goetia-hud, #hud-buttons, #goetia-codex, #goetia-upgrades,
    #goetia-pause, #goetia-radial, #goetia-wave-announce, #hud-best {
      font-family: 'Courier New', ui-monospace, Menlo, Consolas, monospace !important;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }

    #goetia-hud {
      top: calc(var(--goetia-safe-top) + 10px) !important;
      left: 50% !important;
      right: auto !important;
      width: min(980px, calc(100vw - 24px)) !important;
      height: auto !important;
      min-height: 40px !important;
      transform: translateX(-50%) !important;
      padding: 7px 14px !important;
      border: 1px solid var(--goetia-border) !important;
      border-radius: 14px !important;
      background: linear-gradient(180deg, rgba(0,14,4,.92), rgba(0,0,0,.84)) !important;
      box-shadow: 0 0 24px rgba(51,255,102,.12), inset 0 0 18px rgba(51,255,102,.04) !important;
      backdrop-filter: blur(8px);
    }

    .hud-val, #hud-selected-demon, #hud-score, #hud-souls,
    #hud-corpses, #hud-enemies, #hud-wave-n,
    #goetia-wave-announce, #codex-title, .codex-sigil,
    .codex-name, .up-icon, .up-cost, .radial-name, .radial-kind {
      text-shadow: var(--goetia-glow-green) !important;
      font-weight: 700 !important;
    }

    #up-header h2, #goetia-pause h2 {
      text-shadow: var(--goetia-glow-purple) !important;
    }

    #hud-rest-bar {
      top: calc(var(--goetia-safe-top) + 58px) !important;
      background: rgba(51,255,102,.1) !important;
    }

    #hud-rest-fill {
      box-shadow: var(--goetia-glow-green) !important;
    }

    #hud-buttons {
      left: 50% !important;
      right: auto !important;
      bottom: calc(var(--goetia-safe-bottom) + 10px) !important;
      width: min(720px, calc(100vw - 24px)) !important;
      height: auto !important;
      min-height: 42px !important;
      transform: translateX(-50%) !important;
      padding: 6px !important;
      border: 1px solid var(--goetia-border) !important;
      border-radius: 16px !important;
      background: linear-gradient(180deg, rgba(0,10,3,.88), rgba(0,0,0,.84)) !important;
      box-shadow: 0 0 26px rgba(153,51,255,.12) !important;
      backdrop-filter: blur(8px);
    }

    .hud-btn, .pause-btn, .up-btn, #up-close, #codex-close,
    .codex-card, .up-card, .radial-item, .radial-center {
      border-radius: 12px !important;
    }

    .hud-btn, .pause-btn, .up-btn, #up-close, #codex-close {
      text-shadow: 0 0 8px currentColor !important;
    }

    .hud-btn:hover, .hud-btn:focus-visible, .pause-btn:hover,
    .up-btn:hover, #up-close:hover, #codex-close:hover {
      box-shadow: 0 0 14px currentColor !important;
    }

    #goetia-wave-announce {
      top: calc(var(--goetia-safe-top) + 66px) !important;
      max-width: calc(100vw - 28px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      border-radius: 999px !important;
      backdrop-filter: blur(8px);
    }

    #goetia-codex, #goetia-upgrades, #goetia-pause {
      background:
        radial-gradient(circle at 50% 12%, rgba(153,51,255,.14), transparent 30%),
        rgba(0,0,0,.94) !important;
      backdrop-filter: blur(7px);
    }

    @media (max-width: 760px), (pointer: coarse) {
      body::before { opacity: .24; }

      #app canvas {
        max-width: 100vw !important;
        max-height: calc(100svh - 92px) !important;
      }

      #goetia-hud {
        top: calc(var(--goetia-safe-top) + 6px) !important;
        width: calc(100vw - 12px) !important;
        min-height: 0 !important;
        padding: 6px !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 5px !important;
        font-size: clamp(9px, 2.5vw, 12px) !important;
        letter-spacing: .02em !important;
        pointer-events: none !important;
      }

      #goetia-hud > span {
        min-width: 0 !important;
        padding: 4px 5px !important;
        border: 1px solid rgba(51,255,102,.12) !important;
        border-radius: 9px !important;
        background: rgba(0,0,0,.28) !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-align: center !important;
      }

      #goetia-hud .hud-sep, #hud-phase { display: none !important; }
      #hud-pits { justify-content: center !important; gap: 4px !important; }
      .hud-pit { width: 8px !important; height: 8px !important; }
      #hud-rest-bar { top: calc(var(--goetia-safe-top) + 54px) !important; }

      #hud-buttons {
        bottom: var(--goetia-safe-bottom) !important;
        width: 100vw !important;
        min-height: 58px !important;
        border-radius: 16px 16px 0 0 !important;
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 6px !important;
        padding: 8px 8px calc(8px + var(--goetia-safe-bottom)) !important;
      }

      .hud-btn {
        width: 100% !important;
        min-height: 42px !important;
        padding: 8px 4px !important;
        font-size: clamp(10px, 3vw, 13px) !important;
      }

      #hud-selected-demon {
        grid-column: 1 / -1 !important;
        grid-row: 1 !important;
        margin: 0 !important;
        text-align: center !important;
        font-size: 10px !important;
        min-height: 14px !important;
      }

      #hud-btn-codex, #hud-btn-upgrades, #hud-btn-pause {
        grid-row: 2 !important;
        margin: 0 !important;
      }

      #goetia-wave-announce {
        top: calc(var(--goetia-safe-top) + 62px) !important;
        padding: 6px 16px !important;
        font-size: clamp(13px, 4vw, 17px) !important;
        letter-spacing: .12em !important;
      }

      #goetia-codex {
        padding: calc(56px + var(--goetia-safe-top)) 12px calc(88px + var(--goetia-safe-bottom)) !important;
      }

      #codex-title {
        top: calc(16px + var(--goetia-safe-top)) !important;
        left: 14px !important;
        right: 96px !important;
        transform: none !important;
        font-size: 13px !important;
        letter-spacing: .16em !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      #codex-close {
        top: calc(10px + var(--goetia-safe-top)) !important;
        right: 10px !important;
        padding: 8px 12px !important;
      }

      .codex-card {
        width: min(100%, 420px) !important;
        padding: 13px 14px !important;
      }

      #goetia-upgrades {
        padding: calc(56px + var(--goetia-safe-top)) 0 calc(94px + var(--goetia-safe-bottom)) !important;
      }

      #up-header { padding: 0 12px 16px !important; }
      #up-header h2 {
        font-size: clamp(13px, 4vw, 18px) !important;
        letter-spacing: .14em !important;
      }

      #up-tiers {
        justify-content: flex-start !important;
        overflow-x: auto !important;
        scroll-snap-type: x mandatory !important;
        min-height: auto !important;
        padding: 0 12px 12px !important;
        -webkit-overflow-scrolling: touch;
      }

      .up-tier-col {
        min-width: min(86vw, 320px) !important;
        padding: 0 10px !important;
        scroll-snap-align: center !important;
      }

      .up-card { width: 100% !important; padding: 12px 14px !important; }
      .up-name { font-size: 13px !important; }
      .up-desc { font-size: 11px !important; }
      .up-btn { min-height: 34px !important; padding-inline: 16px !important; }

      #up-close {
        width: calc(100vw - 24px) !important;
        max-width: 360px !important;
        min-height: 42px !important;
      }

      #goetia-pause {
        padding: calc(24px + var(--goetia-safe-top)) 18px calc(24px + var(--goetia-safe-bottom)) !important;
      }

      #goetia-pause h2 {
        font-size: clamp(22px, 8vw, 34px) !important;
        letter-spacing: .22em !important;
      }

      .pause-btn, .pause-sep { width: min(100%, 320px) !important; }
      .pause-btn { min-height: 46px !important; font-size: 13px !important; }

      .radial-ring {
        width: 210px !important;
        height: 210px !important;
        transform: translate(-50%, -50%) scale(.88) !important;
      }

      .radial-item {
        min-width: 76px !important;
        padding: 8px 9px !important;
      }

      .radial-desc { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

// Main nécromancienne — singleton global, lancé avant Phaser
installResponsiveShell();
bootCursor();

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#050a05',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  scene: [TitleScene, GameScene, GameOverScene],
});
