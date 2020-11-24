import { GameScene } from './scenes/GameScene';
import MainMenu from './scenes/MainMenu';
import Preloader from './scenes/Preloader';
import * as Phaser from 'phaser';
import GameHud from './scenes/GameHud';

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Phaser',
  type: Phaser.WEBGL,
  scene: [Preloader, MainMenu, GameScene, GameHud],
  backgroundColor: '#000000',
  parent: 'content',

  width: 1200,
  height: 900,

  physics: {
    default: 'matter',
    matter: {
      debug: true,
      gravity: false
    }
  }
};

export const game = new Phaser.Game(gameConfig);
