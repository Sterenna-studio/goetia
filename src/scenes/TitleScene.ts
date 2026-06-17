// ============================================================
// GOETIA — TitleScene
// Écran titre avec lore intro. Clic ou [ESPACE] pour jouer.
// ============================================================

import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create(): void {
    const cx = 640, cy = 360;

    // Fond
    this.add.rectangle(cx, cy, 1280, 720, 0x0d0d1a);

    // Titre
    this.add.text(cx, 180, 'G O E T I A', {
      fontSize: '72px',
      color: '#cc4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 12,
    }).setOrigin(0.5);

    this.add.text(cx, 255, 'La Main du Charnier', {
      fontSize: '22px',
      color: '#886644',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Lore intro
    this.add.text(cx, 340, [
      'Vous êtes le Nécromancien.',
      'Les corps qui jonchent la plaine sont votre matière première.',
      'Bifrons transporte. Murmur extrait. La fosse consume. Leràjé tue.',
      'Et les corps refont le cycle.',
    ], {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Clic pour jouer
    this.add.text(cx, 490, '[ Cliquer ou ESPACE pour invoquer ]', {
      fontSize: '18px',
      color: '#ffaa44',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Démons disponibles
    const demons = [
      { name: 'Bifrons', role: 'Porteur', color: '#9966cc' },
      { name: 'Murmur', role: 'Extracteur', color: '#cc8844' },
      { name: 'Leràjé', role: 'Combattant', color: '#44cc88' },
      { name: 'Bathin', role: 'Téléporteur', color: '#44aacc' },
      { name: 'Seir', role: 'Coureur', color: '#ffaa44' },
      { name: 'Gamigin', role: 'Extracteur rapide', color: '#aabb44' },
    ];

    demons.forEach((d, i) => {
      const x = 200 + (i % 3) * 300;
      const y = 580 + Math.floor(i / 3) * 50;
      this.add.text(x, y, `${d.name}  —  ${d.role}`, {
        fontSize: '13px',
        color: d.color,
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Input
    this.input.once('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard?.addKey('SPACE').once('down', () => this.scene.start('GameScene'));
  }
}
