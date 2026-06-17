// ============================================================
// GOETIA — TitleScene
// Écran titre avec lore, meilleur score et historique des parties.
// ============================================================

import Phaser from 'phaser';
import { loadBest, loadHistory } from '../core/persistence';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create(): void {
    const cx = 640;

    // ----- Fond -----
    this.add.rectangle(cx, 360, 1280, 720, 0x0d0d1a);

    // Ligne de décoration gauche
    const g = this.add.graphics();
    g.lineStyle(1, 0x330000, 0.6);
    g.lineBetween(0, 0, 1280, 0);
    g.lineBetween(0, 719, 1280, 719);

    // ----- Titre -----
    this.add.text(cx, 80, 'G O E T I A', {
      fontSize: '72px', color: '#cc4444',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 148, 'La Main du Charnier', {
      fontSize: '20px', color: '#886644',
      fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);

    // ----- Meilleur score -----
    const best = loadBest();
    if (best.score > 0) {
      this.add.text(cx, 192, `★  Meilleur score : ${best.score} pts  —  Vague max : ${best.wave}  ★`, {
        fontSize: '15px', color: '#ffaa44',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // ----- Lore -----
    this.add.text(cx, 252, [
      'Vous êtes le Nécromancien.',
      'Les corps qui jonchent la plaine sont votre matière première.',
      'Bifrons transporte. Murmur extrait. La fosse consume. Leràjé tue.',
      'Et les corps refont le cycle.',
    ], {
      fontSize: '15px', color: '#888888',
      fontFamily: 'monospace', align: 'center', lineSpacing: 7,
    }).setOrigin(0.5);

    // ----- Historique -----
    const history = loadHistory();
    const histX = 880;
    const histY = 340;

    this.add.text(histX, histY - 24, 'PARTIES PRÉCÉDENTES', {
      fontSize: '11px', color: '#444444',
      fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5);

    // Ligne séparateur
    g.lineStyle(1, 0x222222);
    g.lineBetween(histX - 160, histY - 10, histX + 160, histY - 10);

    if (history.length === 0) {
      this.add.text(histX, histY + 20, 'Aucune partie enregistrée.', {
        fontSize: '13px', color: '#333333', fontFamily: 'monospace',
      }).setOrigin(0.5);
    } else {
      // En-tête colonnes
      this.add.text(histX - 140, histY + 4,  'Heure', { fontSize: '11px', color: '#444', fontFamily: 'monospace' });
      this.add.text(histX - 50,  histY + 4,  'Score', { fontSize: '11px', color: '#444', fontFamily: 'monospace' });
      this.add.text(histX + 30,  histY + 4,  'Vague', { fontSize: '11px', color: '#444', fontFamily: 'monospace' });
      this.add.text(histX + 100, histY + 4,  'Upg.',  { fontSize: '11px', color: '#444', fontFamily: 'monospace' });

      history.forEach((run, i) => {
        const rowY = histY + 26 + i * 28;
        const isFirst = i === 0;
        const col = isFirst ? '#ffcc66' : '#666666';
        const prefix = isFirst ? '▶ ' : '  ';

        this.add.text(histX - 140, rowY, prefix + run.date,    { fontSize: '13px', color: col, fontFamily: 'monospace' });
        this.add.text(histX - 50,  rowY, String(run.score),    { fontSize: '13px', color: col, fontFamily: 'monospace' });
        this.add.text(histX + 30,  rowY, String(run.wave),     { fontSize: '13px', color: col, fontFamily: 'monospace' });
        this.add.text(histX + 100, rowY, String(run.upgrades), { fontSize: '13px', color: col, fontFamily: 'monospace' });
      });

      g.lineStyle(1, 0x222222);
      g.lineBetween(histX - 160, histY + 200, histX + 160, histY + 200);
    }

    // ----- Démons disponibles -----
    const demons = [
      { name: 'Bifrons', role: 'Porteur',          color: '#9966cc' },
      { name: 'Murmur',  role: 'Extracteur',        color: '#cc8844' },
      { name: 'Leràjé', role: 'Combattant',         color: '#44cc88' },
      { name: 'Bathin',  role: 'Téléporteur',       color: '#44aacc' },
      { name: 'Seir',    role: 'Coureur',            color: '#ffaa44' },
      { name: 'Gamigin', role: 'Extracteur rapide', color: '#aabb44' },
    ];

    const demonStartX = 100;
    const demonY = 390;
    demons.forEach((d, i) => {
      const x = demonStartX + (i % 3) * 200;
      const y = demonY + Math.floor(i / 3) * 26;
      this.add.text(x, y, `${d.name}  —  ${d.role}`, {
        fontSize: '13px', color: d.color, fontFamily: 'monospace',
      });
    });

    // ----- Contrôles raccourcis -----
    this.add.text(100, 470, [
      'Clic gauche : poser un démon       Clic droit : menu radial',
      '[1][2][3] changer de démon         [C] Codex   [U] Upgrades   [R] Restart',
    ], {
      fontSize: '12px', color: '#333333',
      fontFamily: 'monospace', lineSpacing: 6,
    });

    // ----- Bouton lancer -----
    const btnY = 570;
    const btnRect = this.add.rectangle(cx, btnY, 360, 52, 0x1a0000)
      .setInteractive({ useHandCursor: true });
    const btnBorder = this.add.graphics();
    btnBorder.lineStyle(1, 0x882222);
    btnBorder.strokeRect(cx - 180, btnY - 26, 360, 52);
    const btnText = this.add.text(cx, btnY, '[ INVOQUER — COMMENCER ]', {
      fontSize: '18px', color: '#cc4444',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    btnRect.on('pointerover', () => {
      btnBorder.clear();
      btnBorder.lineStyle(2, 0xcc4444);
      btnBorder.strokeRect(cx - 180, btnY - 26, 360, 52);
      btnText.setColor('#ff6666');
    });
    btnRect.on('pointerout', () => {
      btnBorder.clear();
      btnBorder.lineStyle(1, 0x882222);
      btnBorder.strokeRect(cx - 180, btnY - 26, 360, 52);
      btnText.setColor('#cc4444');
    });
    btnRect.on('pointerdown', () => this.scene.start('GameScene'));

    // Version
    this.add.text(1260, 708, 'v0.3', {
      fontSize: '11px', color: '#222222', fontFamily: 'monospace',
    }).setOrigin(1, 1);

    // Spacebar
    this.input.keyboard?.addKey('SPACE').once('down', () => this.scene.start('GameScene'));
  }
}
