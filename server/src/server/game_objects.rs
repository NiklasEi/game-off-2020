#[derive(Debug)]
pub struct GameMap {
    pub size: Coordinates,
    pub start_point: Coordinates,
    pub planets: Vec<Planet>,
}

#[derive(Debug)]
pub struct Planet {
    pub position: Coordinates,
    pub radius: usize,
    pub planet_type: PlanetType,
}

#[derive(Default, Debug)]
pub struct Coordinates {
    pub x: usize,
    pub y: usize,
}

#[derive(Debug)]
pub enum PlanetType {
    EARTH,
    RED,
    YELLOW,
    GAS,
    WHITE,
}
