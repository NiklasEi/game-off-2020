import * as Phaser from 'phaser';
import { Session } from '../networking/Session';
import { GameStatePayload, PlayerJoinedGamePayload, PlayerStateInboundPayload } from '../networking/MultiplayerEvent';
import { tileSize } from '../utils/constants';
import Vector2 = Phaser.Math.Vector2;

export class GameScene extends Phaser.Scene {
  private spaceShip!: Phaser.Physics.Arcade.Image;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly gameOver = false;
  private angularVelocity: number = 0;
  private readonly players: any[] = [];
  private session?: Session;

  constructor() {
    super('game');
    this.session = new Session(this);
  }

  public preload() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  public disconnectSession() {
    this.session = undefined;
  }

  public create() {
    // prepare map
    const map = this.make.tilemap({ key: 'space' });
    const tileset = map.addTilesetImage('space', 'spacetiles', tileSize, tileSize, 1, 2);
    map.createStaticLayer('background', tileset);

    // The player and its settings
    this.spaceShip = this.physics.add.image(100, 450, 'spaceship');

    //  Player physics properties. Give the little guy a slight bounce.
    this.spaceShip.setBounce(0.2);
    this.spaceShip.setCollideWorldBounds(true);
    this.spaceShip.setAngularDrag(50);

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    this.session?.initializedGame();
    setInterval(() => this.sendGameEvents(), 100);
  }

  public update() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.gameOver) {
      return;
    }
    const speed = 125;
    if (this.cursors === undefined) return;

    const velocityVector = new Vector2(speed, 0).rotate(this.spaceShip.rotation);

    if (this.cursors.left?.isDown === true) {
      this.angularVelocity = this.angularVelocity - 20;
    } else if (this.cursors.right?.isDown === true) {
      this.angularVelocity = this.angularVelocity + 20;
    }
    if (this.cursors.up?.isDown === true) {
      this.spaceShip.setVelocity(velocityVector.x, velocityVector.y);
      this.spaceShip.setDrag(0);
    } else if (this.cursors.down?.isDown === true) {
      this.spaceShip.setDrag(100);
    } else {
      this.spaceShip.setDrag(0);
    }
    if (this.angularVelocity > 200) {
      this.angularVelocity = 200;
    }
    if (this.angularVelocity < -200) {
      this.angularVelocity = -200;
    }
    const drag = this.angularVelocity > 0 ? -5 : 5;
    if (Math.abs(this.angularVelocity) < 5) {
      this.angularVelocity = 0;
    } else {
      this.angularVelocity += drag;
    }
    this.spaceShip.setAngularVelocity(this.angularVelocity);
  }

  private sendGameEvents() {
    if (this.session !== undefined) {
      this.session.sendPlayerStateEvent({
        position: {
          x: this.spaceShip.x,
          y: this.spaceShip.y
        },
        velocity: {
          x: this.spaceShip.body.velocity.x,
          y: this.spaceShip.body.velocity.y
        },
        rotation: this.spaceShip.rotation,
        angularVelocity: this.angularVelocity
      });
    }
  }

  addNewPlayer(payload: PlayerJoinedGamePayload) {
    console.log(`New player ${payload.playerId}`);
    const player = this.physics.add.image(100, 450, 'spaceship');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.name = payload.playerId;
    this.players.push(player);
  }

  updatePlayer(payload: PlayerStateInboundPayload) {
    console.log(`update ${payload.playerId}`);
    const player = this.players.find((player) => player.name === payload.playerId);
    if (player === undefined) return;
    player.x = payload.position.x;
    player.y = payload.position.y;
    player.setVelocityX(payload.velocity.x);
    player.setVelocityY(payload.velocity.y);
    player.setAngularVelocity(payload.angularVelocity);
    player.setRotation(payload.rotation);
  }

  public updateGameState(payload: GameStatePayload) {
    console.log(`update state ${payload}`);
  }
}
