import { GameScene } from './scenes/GameScene';
import MainMenu from './scenes/MainMenu';
import Preloader from './scenes/Preloader';
import * as Phaser from 'phaser';
import GameHud from './scenes/GameHud';
// @ts-ignore
import * as PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin';

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
  },
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin, // The plugin class
        key: 'matterCollision', // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
        mapping: 'matterCollision' // Where to store in the Scene, e.g. scene.matterCollision
      }
    ]
  }
};

export const game = new Phaser.Game(gameConfig);
