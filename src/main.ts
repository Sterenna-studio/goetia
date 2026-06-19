import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { bootCursor } from './ui/cursor';

// Main nécromancienne — singleton global, lancé avant Phaser
bootCursor();

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#050a05',
  parent: 'app',
  scene: [TitleScene, GameScene, GameOverScene],
});
