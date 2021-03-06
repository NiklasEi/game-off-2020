import { GameMode } from '../session/GameMode';

export const tileSize = 256;

export const bodyLabels = {
  ownSpaceship: 'own-spaceship',
  otherSpaceship: 'other-spaceship',
  ownLaserShot: 'own-laser-shot',
  otherLaserShot: 'other-laser-shot',
  asteroid: 'asteroid',
  planet: 'planet',
  evilPlanet: 'evil-planet',
  missile: 'enemy-rocket',
  otherMissile: 'other-player-missile'
};

export const events = {
  laserFireLeft: 'laser-fire-left',
  laserFireRight: 'laser-fire-right',
  startGame: 'start-game',
  updatePing: 'update-ping',
  joinGame: 'join-game',
  serverConnected: 'server-connected',
  playerIsRoomLeader: 'is-room-leader',
  newFrameTimestamp: 'new-frame',
  updateHealth: 'update-health',
  spawnAsteroid: 'spawn-asteroid',
  playerDied: 'player-died',
  playerDiedInSinglePlayer: 'player-died-single-player',
  playerWonInSinglePlayer: 'player-won-single-player',
  playerWonInMultiPlayer: 'player-won-multi-player',
  playerRespawn: 'player-respawn',
  missileAdded: 'added-missile',
  missileRemoved: 'removed-missile',
  removeOwnLaserShot: 'remove-own-laser-shot',
  indicatePlayers: 'indicate-players'
};

export const assetKeys = {
  enemyRocket: 'enemy-rocket-image',
  enemyRocketParticles: 'enemy-rocket-particles-image',
  planets: {
    earth: 'planet-earth',
    gas: 'planet-gas',
    red: 'planet-red',
    white: 'planet-white',
    yellow: 'planet-yellow',
    evil: 'evil-planet'
  },
  ship: {
    yellow: 'spaceship-yellow',
    blue: 'spaceship-blue',
    green: 'spaceship-green',
    red: 'spaceship-red',
    gray: 'spaceship-gray',
    lightblue: 'spaceship-lightblue',
    orange: 'spaceship-orange',
    pink: 'spaceship-pink',
    purple: 'spaceship-purple',
    turquoise: 'spaceship-turquoise',

    shape: 'spaceship-shape',
    fire: 'fire',
    laserShot: 'laser-shot'
  },
  menu: {
    start: 'start-button',
    controls: 'controls',
    createUniverse: 'create-universe',
    joinUniverse: 'join-universe',
    play: 'play-button',
    background: 'menu-background'
  },
  hud: {
    icon: 'spaceship-icon',
    laser: 'laser',
    roomCode: 'room-code-area',
    redBar: 'red-bar',
    grayBar: 'grey-bar',
    missileWarning: 'missile-warning'
  },
  map: {
    space: 'space',
    tiles: {
      stars: 'stars-tiles',
      asteroids: 'asteroids-tiles'
    }
  },
  asteroid: {
    one: 'asteroid-1',
    two: 'asteroid-2',
    three: 'asteroid-3',
    four: 'asteroid-4',
    five: 'asteroid-5',
    six: 'asteroid-6'
  },
  icons: {
    yellow: 'spaceship-yellow-icon',
    blue: 'spaceship-blue-icon',
    green: 'spaceship-green-icon',
    red: 'spaceship-red-icon',
    gray: 'spaceship-gray-icon',
    lightblue: 'spaceship-lightblue-icon',
    orange: 'spaceship-orange-icon',
    pink: 'spaceship-pink-icon',
    purple: 'spaceship-purple-icon',
    turquoise: 'spaceship-turquoise-icon'
  }
};

export const scenes = {
  gameHud: 'gameHud',
  gameScene: 'game',
  mainMenu: 'menu',
  preloader: 'preloader'
};

export const difficulty = {
  missile: {
    coolDown: (gameMode: GameMode): number => {
      if (gameMode === GameMode.MULTI_PLAYER) {
        return 10000;
      } else {
        return 15000;
      }
    },
    fireDistance: (gameMode: GameMode): number => {
      if (gameMode === GameMode.MULTI_PLAYER) {
        return 4000;
      } else {
        return 5000;
      }
    },
    damageToPlayer: (gameMode: GameMode): number => {
      if (gameMode === GameMode.MULTI_PLAYER) {
        return 30;
      } else {
        return 30;
      }
    }
  },
  asteroids: {
    damageToPlayer: (gameMode: GameMode): number => {
      if (gameMode === GameMode.MULTI_PLAYER) {
        return 24;
      } else {
        return 22;
      }
    }
  },
  player: {
    laserDamageToEvil: (gameMode: GameMode): number => {
      if (gameMode === GameMode.MULTI_PLAYER) {
        return 5;
      } else {
        return 15;
      }
    }
  }
};

export const zoom = 0.5;

export const dimensions = {
  width: 1200,
  height: 900
};
