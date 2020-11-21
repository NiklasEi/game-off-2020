use crate::server::game_objects::{Coordinates, GameMap, Planet, PlanetType};

impl GameMap {
    pub fn create_random() -> Self {
        GameMap {
            size: Coordinates { x: 100, y: 100 },
            start_point: Coordinates { x: 50, y: 50 },
            planets: vec![Planet {
                planet_type: PlanetType::EARTH,
                position: Coordinates { x: 80, y: 80 },
                radius: 30,
            }],
        }
    }
}
