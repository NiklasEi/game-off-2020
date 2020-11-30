export const tileSize = 256;

export const bodyLabels = {
  ownSpaceship: 'own-spaceship',
  otherSpaceship: 'other-spaceship',
  ownLaserShot: 'own-laser-shot',
  otherLaserShot: 'other-laser-shot',
  asteroid: 'asteroid',
  planet: 'planet',
  evilPlanet: 'evil-planet',
  enemyRocket: 'enemy-rocket'
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
  playerRespawn: 'player-respawn'
};

export const assetKeys = {
  enemyRocket: 'enemy-rocket-image',
  enemyRocketParticles: 'enemy-rocket-particles-image',
  planets: {
    earth: 'planet-earth',
    gas: 'planet-gas',
    red: 'planet-red',
    white: 'planet-white',
    yellow: 'planet-yellow'
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
    play: 'play-button'
  },
  hud: {
    icon: 'spaceship-icon',
    laser: 'laser',
    roomCode: 'room-code-area',
    redBar: 'red-bar',
    grayBar: 'grey-bar'
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
  }
};

export const scenes = {
  gameHud: 'gameHud',
  gameScene: 'game',
  mainMenu: 'menu',
  preloader: 'preloader'
};
