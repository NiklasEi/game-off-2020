use rand::distributions::Standard;
use rand::prelude::Distribution;
use rand::Rng;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameMap {
    pub size: Coordinates,
    pub planets: Vec<Planet>,
    pub player_cap: usize,
    pub spawns: Vec<Coordinates>,
    pub enemy_planet: Planet,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Planet {
    pub position: Coordinates,
    pub radius: usize,
    pub planet_type: PlanetType,
}

#[derive(Default, Debug, Serialize, Clone)]
pub struct Coordinates {
    pub x: usize,
    pub y: usize,
}

#[derive(Debug, Serialize)]
pub enum PlanetType {
    EARTH,
    RED,
    YELLOW,
    GAS,
    WHITE,
}

impl Distribution<PlanetType> for Standard {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> PlanetType {
        match rng.gen_range(0, 4) {
            0 => PlanetType::RED,
            1 => PlanetType::YELLOW,
            2 => PlanetType::GAS,
            _ => PlanetType::WHITE,
        }
    }
}
