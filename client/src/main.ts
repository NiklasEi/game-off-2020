import { GameScene } from './scenes/GameScene';
import SettingsConfig = Phaser.Types.Scenes.SettingsConfig;

const sceneConfig: SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game'
};

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Phaser',

  scene: new GameScene(sceneConfig),

  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',

  width: 800,
  height: 600,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: true
    }
  }
};

export const game = new Phaser.Game(gameConfig);
