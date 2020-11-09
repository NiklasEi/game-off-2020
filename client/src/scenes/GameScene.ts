import * as Phaser from 'phaser';
import { Session } from '../networking/Session';
import { GameStatePayload, PlayerJoinedGamePayload, PlayerStateInboundPayload } from '../networking/MultiplayerEvent';
import SettingsConfig = Phaser.Types.Scenes.SettingsConfig;

export class GameScene extends Phaser.Scene {
  // @ts-ignore-next-line
  private player: any;
  // @ts-ignore-next-line
  private stars: any;
  // @ts-ignore-next-line
  private bombs: any;
  // @ts-ignore-next-line
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  // @ts-ignore-next-line
  private cursors: any;
  // @ts-ignore-next-line
  private score = 0;
  // @ts-ignore-next-line
  private gameOver = false;
  // @ts-ignore-next-line
  private scoreText: any;

  // @ts-ignore-next-line
  private readonly players: any[] = [];

  private session?: Session;

  // @ts-ignore-next-line
  private gameState?: GameStatePayload;

  constructor(config: SettingsConfig) {
    super(config);
    this.session = new Session(this);
  }

  public preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  }

  public receiveGameState(payload: GameStatePayload) {
    this.gameState = payload;
  }

  public disconnectSession() {
    this.session = undefined;
  }

  public create() {
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    this.platforms.create(600, 400, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(750, 220, 'ground');

    // The player and its settings
    this.player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    this.stars.children.iterate(function (child: any) {
      //  Give each star a slightly different bounce
      child.setBounceY(0.4);
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

    this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);

    this.session?.initializedGame();
    setInterval(() => this.sendGameEvents(), 100);
  }

  public update() {
    if (this.gameOver) {
      return;
    }

    if (this.cursors.left.isDown === true) {
      this.player.setVelocityX(-160);

      this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown === true) {
      this.player.setVelocityX(160);

      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play('turn');
    }

    if (this.cursors.up.isDown === true && this.player.body.touching.down === true) {
      this.player.setVelocityY(-330);
    }
  }

  private sendGameEvents() {
    const stars: any[] = [];
    this.stars.children.iterate((child: any) => stars.push(child));
    this.session?.sendGameStateEvent({
      stars: stars.map((star: any) => ({
        position: {
          x: star.x,
          y: star.y
        },
        velocity: {
          x: star.body.velocity.x,
          y: star.body.velocity.y
        }
      }))
    });
    this.session?.sendPlayerStateEvent({
      position: {
        x: this.player.x,
        y: this.player.y
      },
      velocity: {
        x: this.player.body.velocity.x,
        y: this.player.body.velocity.y
      }
    });
  }

  private hitBomb(player: any, _bomb: any) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    this.gameOver = true;
  }

  private collectStar(player: any, star: any) {
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child: any) {
        child.enableBody(true, child.x, 0, true, true);
      });

      const x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      const bomb = this.bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  addNewPlayer(payload: PlayerJoinedGamePayload) {
    const player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, this.platforms);
    player.name = payload.playerId;
    this.players.push(player);
  }

  updatePlayer(payload: PlayerStateInboundPayload) {
    const player = this.players.find((player) => player.name === payload.playerId);
    if (player === undefined) return;
    player.x = payload.position.x;
    player.y = payload.position.y;
    player.setVelocityX(payload.velocity.x);
    player.setVelocityY(payload.velocity.y);
    if (payload.velocity.x < 0) {
      player.anims.play('left', true);
    } else if (payload.velocity.x > 0) {
      player.anims.play('right', true);
    } else {
      player.anims.play('turn');
    }
  }
}
