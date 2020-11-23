use crate::server::game_objects::GameMap;

#[derive(Default, Debug)]
pub struct RoomLeaderEvent {
    pub secret: String,
}

#[derive(Default, Debug)]
pub struct PlayerJoinedGameEvent {
    pub player_id: usize,
}

#[derive(Default, Debug)]
pub struct PlayerLeftGameEvent {
    pub player_id: usize,
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
        format!("Event RoomLeader:{{\"secret\":\"{}\"}}", self.secret)
    }
}

impl MultiplayerEvent for PlayerJoinedGameEvent {
    fn to_message(&self) -> String {
        format!(
            "Event PlayerJoinedGame:{{\"playerId\":\"{}\"}}",
            self.player_id
        )
    }
}

impl MultiplayerEvent for PlayerLeftGameEvent {
    fn to_message(&self) -> String {
        format!(
            "Event PlayerLeftGame:{{\"playerId\":\"{}\"}}",
            self.player_id
        )
    }
}

impl MultiplayerEvent for SetMapGameEvent<'_> {
    fn to_message(&self) -> String {
        let planets: String = self.map.planets.iter().map(|planet| -> String {
            return format!(
                    "{{\"position\":{{\"x\": {},\"y\": {}}},\"radius\":{},\"planetType\":\"{:?}\"}}",
                    planet.position.x, planet.position.y, planet.radius, planet.planet_type
                )
        }).collect::<Vec<String>>().join(",");
        format!(
            "Event SetMap:{{\"startPoint\":{{\"x\": {},\"y\": {}}},\"planets\":[{}]}}",
            self.map.start_point.x, self.map.start_point.y, planets
        )
    }
}

impl MultiplayerEvent for GameStateEvent {
    fn to_message(&self) -> String {
        format!("Event GameState:{}", self.payload.to_string())
    }
}
