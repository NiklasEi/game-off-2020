import { Planet, PlanetType, SetMapPayload } from '../networking/MultiplayerEvent';
import Vector2 = Phaser.Math.Vector2;

const PLANET_RADIUS: number = 125;
const DISTANCE_BETWEEN_PLANETS: number = 1000;
const NUMBER_OF_PLANETS: number = 50;
const MAP_TILE_SIZE: number = 256;
const MAP_NUMBER_OF_TILES: number = 100;
const OUTER_BOUNDS: number = 10 * MAP_TILE_SIZE;
const INNER_AREA: { lower: number; upper: number } = {
  lower: 35 * MAP_TILE_SIZE,
  upper: 65 * MAP_TILE_SIZE
};
const MAP_SIZE: number = MAP_TILE_SIZE * MAP_NUMBER_OF_TILES;

export function generateSinglePlayerMap(): SetMapPayload {
  const enemyPlanet = {
    position: {
      x: Math.floor(Math.random() * (INNER_AREA.upper - INNER_AREA.lower)) + INNER_AREA.lower,
      y: Math.floor(Math.random() * (INNER_AREA.upper - INNER_AREA.lower)) + INNER_AREA.lower
    },
    radius: PLANET_RADIUS,
    planetType: PlanetType.EARTH
  };
  const planets = generateRandomPlanets(enemyPlanet);
  return {
    planets,
    enemyPlanet
  };
}

function generateRandomPlanets(enemyPlanet: Planet): Planet[] {
  const planets: Planet[] = [];
  for (let i = 0; i < NUMBER_OF_PLANETS; i++) {
    let y: number = Math.floor(Math.random() * (MAP_SIZE - 2 * OUTER_BOUNDS)) + OUTER_BOUNDS;
    let x: number = Math.floor(Math.random() * (MAP_SIZE - 2 * OUTER_BOUNDS)) + OUTER_BOUNDS;
    let tries = 0;
    while (!doesFitWithPlanets(planets, enemyPlanet, x, y)) {
      if (tries > 20) {
        console.warn('tried to place a planet more than 20 times');
        break;
      }
      y = Math.floor(Math.random() * (MAP_SIZE - 2 * OUTER_BOUNDS)) + OUTER_BOUNDS;
      x = Math.floor(Math.random() * (MAP_SIZE - 2 * OUTER_BOUNDS)) + OUTER_BOUNDS;
      tries += 1;
    }
    if (doesFitWithPlanets(planets, enemyPlanet, x, y)) {
      planets.push({
        planetType: randomPlanetType(),
        position: {
          x,
          y
        },
        radius: PLANET_RADIUS
      });
    }
  }

  return planets;
}

function doesFitWithPlanets(planets: Planet[], enemyPlanet: Planet, x: number, y: number) {
  const vecToEnemy = new Vector2(enemyPlanet.position.x - x, enemyPlanet.position.y - y);
  if (vecToEnemy.length() < DISTANCE_BETWEEN_PLANETS) {
    return false;
  }
  return planets.every((planet) => {
    const distance = new Vector2(planet.position.x - x, planet.position.y - y);
    return distance.length() > DISTANCE_BETWEEN_PLANETS;
  });
}

function randomPlanetType(): PlanetType {
  const index = Math.floor(Math.random() * 5);
  switch (index) {
    case 0:
      return PlanetType.WHITE;
    case 1:
      return PlanetType.RED;
    case 2:
      return PlanetType.YELLOW;
    case 3:
      return PlanetType.GAS;
    default:
      return PlanetType.EARTH;
  }
}
