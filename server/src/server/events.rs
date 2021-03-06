use crate::server::game_objects::{Coordinates, GameMap};
use rand::distributions::{Distribution, Standard};
use rand::Rng;
use serde;
use serde::Serialize;

#[derive(Default, Debug, Serialize)]
pub struct RoomLeaderEvent {
    pub secret: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerJoinedGameEvent {
    pub player_id: String,
    pub player_type: PlayerType,
    pub spawn: Coordinates,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerLeftGameEvent {
    pub player_id: String,
}

#[derive(Debug)]
pub struct SetMapGameEvent<'a> {
    pub map: &'a GameMap,
}

#[derive(Default, Debug)]
pub struct GameStateEvent {
    pub payload: serde_json::Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinedGame {
    pub ok: bool,
    pub reason: Option<String>,
    pub code: Option<String>,
    pub player_type: Option<PlayerType>,
    pub spawn: Option<Coordinates>,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
pub enum PlayerType {
    BLUE,
    RED,
    YELLOW,
    GREEN,
    GRAY,
    LIGHTBLUE,
    ORANGE,
    PINK,
    PURPLE,
    TURQUOISE,
}

impl Distribution<PlayerType> for Standard {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> PlayerType {
        match rng.gen_range(0, 10) {
            0 => PlayerType::BLUE,
            1 => PlayerType::RED,
            2 => PlayerType::YELLOW,
            3 => PlayerType::GREEN,
            4 => PlayerType::GRAY,
            5 => PlayerType::LIGHTBLUE,
            6 => PlayerType::ORANGE,
            7 => PlayerType::PINK,
            8 => PlayerType::PURPLE,
            _ => PlayerType::TURQUOISE,
        }
    }
}

pub trait MultiplayerEvent {
    fn to_message(&self) -> String;
}

impl MultiplayerEvent for RoomLeaderEvent {
    fn to_message(&self) -> String {
        format!("Event RoomLeader:{}", serde_json::to_string(self).unwrap())
    }
}

impl MultiplayerEvent for JoinedGame {
    fn to_message(&self) -> String {
        format!("Event JoinGame:{}", serde_json::to_string(self).unwrap())
    }
}

impl MultiplayerEvent for PlayerJoinedGameEvent {
    fn to_message(&self) -> String {
        format!(
            "Event PlayerJoinedGame:{}",
            serde_json::to_string(self).unwrap()
        )
    }
}

impl MultiplayerEvent for PlayerLeftGameEvent {
    fn to_message(&self) -> String {
        format!(
            "Event PlayerLeftGame:{}",
            serde_json::to_string(self).unwrap()
        )
    }
}

impl MultiplayerEvent for SetMapGameEvent<'_> {
    fn to_message(&self) -> String {
        format!("Event SetMap:{}", serde_json::to_string(self.map).unwrap())
    }
}

impl MultiplayerEvent for GameStateEvent {
    fn to_message(&self) -> String {
        format!("Event GameState:{}", self.payload.to_string())
    }
}
