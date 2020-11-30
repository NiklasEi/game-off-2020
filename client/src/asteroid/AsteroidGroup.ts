import { GameScene } from '../scenes/GameScene';
import { bodyLabels, events, tileSize } from '../utils/constants';
import { NamedEntity, Position, Velocity } from '../networking/MultiplayerEvent';
import { sceneEvents } from '../events/EventCenter';
import { GameMode } from '../session/GameMode';

class AsteroidGroup {
  private readonly gameScene: GameScene;
  private asteroids: Phaser.Physics.Matter.Image[] = [];

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
    sceneEvents.on(
      events.playerWonInSinglePlayer,
      () => {
        for (const asteroid of this.asteroids) {
          asteroid.destroy();
        }
        this.asteroids = [];
      },
      this
    );
  }

  update(asteroids: { remove?: string[]; add?: NamedEntity[] }) {
    if (asteroids.remove !== undefined) {
      for (const name of asteroids.remove) {
        const toRemove = this.asteroids.find((asteroid: Phaser.Physics.Matter.Image) => asteroid.name === name);
        toRemove?.destroy();
      }
    }
    if (asteroids.add !== undefined) {
      for (const toAdd of asteroids.add) {
        const asteroid = this.gameScene.matter.add.image(toAdd.position.x, toAdd.position.y, 'asteroid-1', undefined, {
          friction: 0,
          frictionStatic: 0,
          frictionAir: 0,
          label: bodyLabels.asteroid
        });
        asteroid.name = toAdd.name;

        asteroid.setRotation(toAdd.rotation);
        asteroid.setAngularVelocity(toAdd.angularVelocity);
        asteroid.setVelocity(toAdd.velocity.x, toAdd.velocity.y);
        this.asteroids.push(asteroid);
      }
    }
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

    // console.log(`firing asteroid: speed (${velocity.x},${velocity.y}), position: (${spawn.x},${spawn.y})`);

    const asteroid = this.gameScene.matter.add.image(spawn.x, spawn.y, 'asteroid-1', undefined, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: bodyLabels.asteroid
    });
    const name = `${Date.now().valueOf()}`;
    asteroid.name = name;

    const angularVelocity = Math.random() * (Math.random() - 0.5);
    asteroid.setAngularVelocity(angularVelocity);
    asteroid.setVelocity(velocity.x, velocity.y);
    this.asteroids.push(asteroid);
    if (this.gameScene.gameMode === GameMode.MULTI_PLAYER) {
      const namedEntity: NamedEntity = {
        name,
        position: spawn,
        velocity,
        rotation: 0,
        angularVelocity
      };
      sceneEvents.emit(events.spawnAsteroid, namedEntity);
    }
  }
}

export default AsteroidGroup;
