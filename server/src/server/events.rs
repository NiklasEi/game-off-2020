use crate::server::game_objects::GameMap;
use serde;
use serde::Serialize;

#[derive(Default, Debug, Serialize)]
pub struct RoomLeaderEvent {
    pub secret: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(into = "PlayerEvent")]
pub struct PlayerJoinedGameEvent {
    pub player_id: usize,
}

#[derive(Clone, Debug, Serialize)]
#[serde(into = "PlayerEvent")]
pub struct PlayerLeftGameEvent {
    pub player_id: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlayerEvent {
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

pub trait MultiplayerEvent {
    fn to_message(&self) -> String;
}

impl MultiplayerEvent for RoomLeaderEvent {
    fn to_message(&self) -> String {
        format!("Event RoomLeader:{}", serde_json::to_string(self).unwrap())
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

impl From<PlayerLeftGameEvent> for PlayerEvent {
    fn from(player_left_game_event: PlayerLeftGameEvent) -> Self {
        PlayerEvent {
            player_id: player_left_game_event.player_id.to_string(),
        }
    }
}

impl From<PlayerJoinedGameEvent> for PlayerEvent {
    fn from(player_joined_game_event: PlayerJoinedGameEvent) -> Self {
        PlayerEvent {
            player_id: player_joined_game_event.player_id.to_string(),
        }
    }
}
