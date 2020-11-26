use log::info;

use crate::server::game_objects::{Coordinates, GameMap, Planet};
use rand::{random, thread_rng, Rng};

impl GameMap {
    const PLANET_RADIUS: usize = 125;
    const DISTANCE_BETWEEN_PLANETS: usize = 2000;
    const NUMBER_OF_PLANETS: usize = 50;
    const MAP_SIZE: usize = 51_200;
    pub fn create_random() -> Self {
        GameMap {
            size: Coordinates {
                x: Self::MAP_SIZE,
                y: Self::MAP_SIZE,
            },
            start_point: Coordinates { x: 50, y: 50 },
            planets: Self::place_random_planets(),
        }
    }

    fn place_random_planets() -> Vec<Planet> {
        let mut rng = thread_rng();
        let mut planets: Vec<Planet> = vec![];
        for _ in 0..Self::NUMBER_OF_PLANETS {
            let mut y: usize = rng.gen_range(
                0 + Self::DISTANCE_BETWEEN_PLANETS,
                Self::MAP_SIZE - Self::DISTANCE_BETWEEN_PLANETS,
            );
            let mut x: usize = rng.gen_range(
                0 + Self::DISTANCE_BETWEEN_PLANETS,
                Self::MAP_SIZE - Self::DISTANCE_BETWEEN_PLANETS,
            );
            let mut tries = 0;
            while !Self::does_fit_with_planets(&planets, x, y) {
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
            if Self::does_fit_with_planets(&planets, x, y) {
                planets.push(Planet {
                    planet_type: random(),
                    position: Coordinates { x, y },
                    radius: Self::PLANET_RADIUS,
                })
            }
        }

        planets
    }

    fn does_fit_with_planets(planets: &Vec<Planet>, x: usize, y: usize) -> bool {
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
                position: Coordinates { x: 150, y: 150 },
                radius: super::GameMap::PLANET_RADIUS,
            },
            Planet {
                planet_type: PlanetType::EARTH,
                position: Coordinates {
                    x: 150,
                    y: 140 + 2 * super::GameMap::DISTANCE_BETWEEN_PLANETS,
                },
                radius: super::GameMap::PLANET_RADIUS,
            },
        ];
        assert_eq!(
            super::GameMap::does_fit_with_planets(
                &planets,
                150,
                150 + super::GameMap::DISTANCE_BETWEEN_PLANETS
            ),
            false
        );
    }
}
