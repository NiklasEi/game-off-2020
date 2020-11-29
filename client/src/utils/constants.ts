export const tileSize = 256;

export const bodyLabels = {
  ownSpaceship: 'own-spaceship',
  otherSpaceship: 'other-spaceship',
  ownLaserShot: 'own-laser-shot',
  asteroid: 'asteroid'
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
  shootAsteroids: 'shoot-asteroids',
  updateHealth: 'update-health'
};

export const assetKeys = {
  planets: {
    earth: 'planet-earth',
    gas: 'planet-gas',
    red: 'planet-red',
    white: 'planet-white',
    yellow: 'planet-yellow'
  },
  ship: {
    yellow: 'spaceship-yellow',
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
      stars: 'stars-tiles'
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
