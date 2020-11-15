import { GameScene } from './scenes/GameScene';
import MainMenu from './scenes/MainMenu';
import Preloader from './scenes/Preloader';
import * as Phaser from 'phaser';

// import SettingsConfig = Phaser.Types.Scenes.SettingsConfig;

// const sceneConfig: SettingsConfig = {
//   active: false,
//   visible: false,
//   key: 'Game'
// };

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Phaser',
  type: Phaser.WEBGL,
  scene: [Preloader, MainMenu, GameScene],
  backgroundColor: '#000000',
  parent: 'content',

  width: 800,
  height: 600,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  }
};

export const game = new Phaser.Game(gameConfig);
