// ============================================================
// GOETIA — Bootstrap Phaser
// ============================================================

import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: 'app',
};

new Phaser.Game(config);
