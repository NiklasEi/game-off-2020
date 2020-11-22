use crate::server::game_objects::{Coordinates, GameMap, Planet, PlanetType};

impl GameMap {
    pub fn create_random() -> Self {
        GameMap {
            size: Coordinates { x: 3200, y: 3200 },
            start_point: Coordinates { x: 50, y: 50 },
            planets: vec![Planet {
                planet_type: PlanetType::EARTH,
                position: Coordinates { x: 80, y: 80 },
                radius: 30,
            }],
        }
    }
}

impl Default for GameMap {
    fn default() -> Self {
        GameMap::create_random()
    }
}
