import { GameScene } from '../scenes/GameScene';
import { bodyLabels, tileSize } from '../utils/constants';
import { Position, Velocity } from '../networking/MultiplayerEvent';

class AsteroidGroup {
  private readonly gameScene: GameScene;

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
  }

  shootAsteroid() {
    const randomPosition = Math.random();
    let spawn: Position;
    let velocity: Velocity;
    if (randomPosition > 0.75) {
      // upper border
      spawn = {
        x: (Math.floor(Math.random() * (GameScene.LOWER_WORLD_BOUND - 10)) + 10) * tileSize,
        y: (GameScene.UPPER_WORLD_BOUND + 1) * tileSize
      };
      velocity = {
        x: Math.floor(Math.random() * 5) - 2.5,
        y: Math.floor(Math.random() * 6) + 4
      };
    } else if (randomPosition > 0.5) {
      // right border
      spawn = {
        y: (Math.floor(Math.random() * (GameScene.LOWER_WORLD_BOUND - 10)) + 10) * tileSize,
        x: (GameScene.LOWER_WORLD_BOUND - 1) * tileSize
      };
      velocity = {
        y: Math.floor(Math.random() * 5) - 2.5,
        x: -Math.floor(Math.random() * 6) - 4
      };
    } else if (randomPosition > 0.25) {
      // lower border
      spawn = {
        x: (Math.floor(Math.random() * (GameScene.LOWER_WORLD_BOUND - 10)) + 10) * tileSize,
        y: (GameScene.LOWER_WORLD_BOUND - 1) * tileSize
      };
      velocity = {
        x: Math.floor(Math.random() * 5) - 2.5,
        y: -Math.floor(Math.random() * 6) - 4
      };
    } else {
      // left border
      spawn = {
        y: (Math.floor(Math.random() * (GameScene.LOWER_WORLD_BOUND - 10)) + 10) * tileSize,
        x: (GameScene.UPPER_WORLD_BOUND + 1) * tileSize
      };
      velocity = {
        y: Math.floor(Math.random() * 5) - 2.5,
        x: Math.floor(Math.random() * 6) + 4
      };
    }

    console.log(`firing asteroid: speed (${velocity.x},${velocity.y}), position: (${spawn.x},${spawn.y})`);

    const asteroid = this.gameScene.matter.add.image(spawn.x, spawn.y, 'asteroid-1', undefined, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: bodyLabels.asteroid
    });

    asteroid.scale = 2;
    asteroid.setAngularVelocity(Math.random() * (Math.random() - 0.5));
    asteroid.setVelocity(velocity.x, velocity.y);
  }
}

export default AsteroidGroup;
