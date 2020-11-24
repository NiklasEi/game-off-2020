use rand::distributions::Standard;
use rand::prelude::Distribution;
use rand::Rng;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameMap {
    pub size: Coordinates,
    pub start_point: Coordinates,
    pub planets: Vec<Planet>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Planet {
    pub position: Coordinates,
    pub radius: usize,
    pub planet_type: PlanetType,
}

#[derive(Default, Debug, Serialize)]
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
        match rng.gen_range(0, 5) {
            0 => PlanetType::EARTH,
            1 => PlanetType::RED,
            2 => PlanetType::YELLOW,
            3 => PlanetType::GAS,
            _ => PlanetType::WHITE,
        }
    }
}
