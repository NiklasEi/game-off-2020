use log::info;

use crate::server::game_objects::{Coordinates, GameMap, Planet, PlanetType};
use rand::{random, thread_rng, Rng};

impl GameMap {
    const PLANET_RADIUS: usize = 125;
    const DISTANCE_BETWEEN_PLANETS: usize = 1000;
    const NUMBER_OF_PLANETS: usize = 25;
    const MAP_TILE_SIZE: usize = 256;
    const MAP_NUMBER_OF_TILES: usize = 100;
    const OUTER_BOUNDS: usize = 10 * Self::MAP_TILE_SIZE;
    const INNER_AREA: (usize, usize) = (35 * Self::MAP_TILE_SIZE, 65 * Self::MAP_TILE_SIZE);
    const MAP_SIZE: usize = Self::MAP_TILE_SIZE * Self::MAP_NUMBER_OF_TILES;
    pub fn create_random() -> Self {
        let mut rng = thread_rng();
        let enemy_planet = Planet {
            planet_type: PlanetType::EARTH,
            position: Coordinates {
                x: rng.gen_range(Self::INNER_AREA.0, Self::INNER_AREA.1),
                y: rng.gen_range(Self::INNER_AREA.0, Self::INNER_AREA.1),
            },
            radius: Self::PLANET_RADIUS,
        };
        GameMap {
            size: Coordinates {
                x: Self::MAP_SIZE,
                y: Self::MAP_SIZE,
            },
            planets: Self::place_random_planets(&enemy_planet),
            player_cap: 10,
            enemy_planet,
            spawns: vec![
                Coordinates {
                    x: 7 * Self::MAP_TILE_SIZE,
                    y: 7 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 8 * Self::MAP_TILE_SIZE,
                    y: 7 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 7 * Self::MAP_TILE_SIZE,
                    y: 8 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 8 * Self::MAP_TILE_SIZE,
                    y: 8 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 9 * Self::MAP_TILE_SIZE,
                    y: 7 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 9 * Self::MAP_TILE_SIZE,
                    y: 8 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 7 * Self::MAP_TILE_SIZE,
                    y: 9 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 8 * Self::MAP_TILE_SIZE,
                    y: 9 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 9 * Self::MAP_TILE_SIZE,
                    y: 9 * Self::MAP_TILE_SIZE,
                },
                Coordinates {
                    x: 10 * Self::MAP_TILE_SIZE,
                    y: 7 * Self::MAP_TILE_SIZE,
                },
            ],
        }
    }

    fn place_random_planets(enemy_planet: &Planet) -> Vec<Planet> {
        let mut rng = thread_rng();
        let mut planets: Vec<Planet> = vec![];
        for _ in 0..Self::NUMBER_OF_PLANETS {
            let mut y: usize =
                rng.gen_range(Self::OUTER_BOUNDS, Self::MAP_SIZE - Self::OUTER_BOUNDS);
            let mut x: usize =
                rng.gen_range(Self::OUTER_BOUNDS, Self::MAP_SIZE - Self::OUTER_BOUNDS);
            let mut tries = 0;
            while !Self::does_fit_with_planets(&planets, enemy_planet, x, y) {
                if tries > 20 {
                    info!("tried to place a planet more than 20 times");
                    break;
                }
                y = rng.gen_range(
                    0 + Self::DISTANCE_BETWEEN_PLANETS,
                    Self::MAP_SIZE - Self::DISTANCE_BETWEEN_PLANETS,
                );
                x = rng.gen_range(
                    0 + Self::DISTANCE_BETWEEN_PLANETS,
                    Self::MAP_SIZE - Self::DISTANCE_BETWEEN_PLANETS,
                );
                tries += 1;
            }
            if Self::does_fit_with_planets(&planets, enemy_planet, x, y) {
                planets.push(Planet {
                    planet_type: random(),
                    position: Coordinates { x, y },
                    radius: Self::PLANET_RADIUS,
                })
            }
        }

        planets
    }

    fn does_fit_with_planets(
        planets: &Vec<Planet>,
        enemy_planet: &Planet,
        x: usize,
        y: usize,
    ) -> bool {
        if x < Self::OUTER_BOUNDS || x > Self::MAP_SIZE - Self::OUTER_BOUNDS {
            return false;
        }
        if y < Self::OUTER_BOUNDS || y > Self::MAP_SIZE - Self::OUTER_BOUNDS {
            return false;
        }
        let distance_to_enemy: (i64, i64) = (
            x as i64 - enemy_planet.position.x as i64,
            y as i64 - enemy_planet.position.y as i64,
        );
        if distance_to_enemy.0.pow(2) + distance_to_enemy.1.pow(2)
            < Self::DISTANCE_BETWEEN_PLANETS.pow(2) as i64
        {
            return false;
        }
        planets
            .iter()
            .find(|planet| -> bool {
                let vector: (i64, i64) = (
                    x as i64 - planet.position.x as i64,
                    y as i64 - planet.position.y as i64,
                );

                vector.0.pow(2) + vector.1.pow(2) < Self::DISTANCE_BETWEEN_PLANETS.pow(2) as i64
            })
            .is_none()
    }

    pub fn get_spawn_for_player(&self, player_number: usize) -> Coordinates {
        let spawn = self.spawns.get(player_number);
        match spawn {
            Some(spawn) => Coordinates {
                x: spawn.x,
                y: spawn.y,
            },
            None => Coordinates {
                x: 5 * 256,
                y: 5 * 256,
            },
        }
    }
}

impl Default for GameMap {
    fn default() -> Self {
        GameMap::create_random()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::server::game_objects::{Planet, PlanetType};

    #[test]
    fn planets_are_distance_between_planets_apart_from_each_other() {
        let planets: Vec<Planet> = vec![
            Planet {
                planet_type: PlanetType::EARTH,
                position: Coordinates {
                    x: super::GameMap::OUTER_BOUNDS,
                    y: super::GameMap::OUTER_BOUNDS,
                },
                radius: super::GameMap::PLANET_RADIUS,
            },
            Planet {
                planet_type: PlanetType::EARTH,
                position: Coordinates {
                    x: super::GameMap::OUTER_BOUNDS,
                    y: super::GameMap::OUTER_BOUNDS - 2
                        + 2 * super::GameMap::DISTANCE_BETWEEN_PLANETS,
                },
                radius: super::GameMap::PLANET_RADIUS,
            },
        ];
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                &Planet {
                    planet_type: PlanetType::EARTH,
                    position: Coordinates {
                        x: super::GameMap::MAP_SIZE / 2,
                        y: super::GameMap::MAP_SIZE / 2
                    },
                    radius: super::GameMap::PLANET_RADIUS
                },
                super::GameMap::OUTER_BOUNDS,
                super::GameMap::OUTER_BOUNDS + super::GameMap::DISTANCE_BETWEEN_PLANETS
            ),
            false
        );
    }

    #[test]
    fn does_not_place_planets_in_outer_bounds() {
        let planets: Vec<Planet> = vec![];
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                &Planet {
                    planet_type: PlanetType::EARTH,
                    position: Coordinates {
                        x: super::GameMap::MAP_SIZE / 2,
                        y: super::GameMap::MAP_SIZE / 2
                    },
                    radius: super::GameMap::PLANET_RADIUS
                },
                super::GameMap::OUTER_BOUNDS - 1,
                super::GameMap::OUTER_BOUNDS
            ),
            false,
            "Cannot be too far left"
        );
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                &Planet {
                    planet_type: PlanetType::EARTH,
                    position: Coordinates {
                        x: super::GameMap::MAP_SIZE / 2,
                        y: super::GameMap::MAP_SIZE / 2
                    },
                    radius: super::GameMap::PLANET_RADIUS
                },
                super::GameMap::MAP_SIZE - super::GameMap::OUTER_BOUNDS + 1,
                super::GameMap::OUTER_BOUNDS
            ),
            false,
            "Cannot be too far right"
        );
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                &Planet {
                    planet_type: PlanetType::EARTH,
                    position: Coordinates {
                        x: super::GameMap::MAP_SIZE / 2,
                        y: super::GameMap::MAP_SIZE / 2
                    },
                    radius: super::GameMap::PLANET_RADIUS
                },
                super::GameMap::OUTER_BOUNDS,
                super::GameMap::OUTER_BOUNDS - 1
            ),
            false,
            "Cannot be too far up"
        );
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                &Planet {
                    planet_type: PlanetType::EARTH,
                    position: Coordinates {
                        x: super::GameMap::MAP_SIZE / 2,
                        y: super::GameMap::MAP_SIZE / 2
                    },
                    radius: super::GameMap::PLANET_RADIUS
                },
                super::GameMap::OUTER_BOUNDS,
                super::GameMap::MAP_SIZE - super::GameMap::OUTER_BOUNDS + 1
            ),
            false,
            "Cannot be too far down"
        );
    }
}
