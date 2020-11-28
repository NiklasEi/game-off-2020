import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;
import { sceneEvents } from '../events/EventCenter';
import { GameScene } from '../scenes/GameScene';
import { bodyLabels, events } from '../utils/constants';

class AsteroidGroup {
    public static readonly COOL_DOWN = 1000;
    private readonly shootingCoolDown = 500;
    private lastFire = Date.now().valueOf();
    private readonly gameScene: GameScene;

    constructor(gameScene: GameScene) {
        this.gameScene = gameScene;
        sceneEvents.once(events.startGame, () => {
            const timestamp = Date.now().valueOf();
            this.lastFire = Date.now().valueOf();
            sceneEvents.emit(events.shootAsteroids, timestamp + AsteroidGroup.COOL_DOWN);
        });
    }

    shootAsteroids(x: number, y: number, velocity: Vector2) {
        const timestamp = Date.now().valueOf();
        const rotation = velocity.angle();
        const asteroidPositions = {
            x: 40,
            y: 50
        }

        const asteroid = this.gameScene.matter.add.image(x + asteroidPositions.x, y + asteroidPositions.y, 'asteroid-1', undefined, {
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0,
            label: bodyLabels.ownLaserShot
        });

        asteroid.setRotation(velocity.angle() + Math.PI / 2);
        asteroid.setVelocity(velocity.x, velocity.y);
    }
}

export default AsteroidGroup;
