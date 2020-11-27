use actix::prelude::*;

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

#[derive(Clone, Message)]
#[rtype(result = "String")]
pub struct JoinGame {
    pub game_name: String,
    pub player: Recipient<Message>,
}

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct LeaveGame {
    pub game_name: String,
    pub player_id: String,
}

#[derive(Clone, Message, Debug)]
#[rtype(result = "()")]
pub struct GameState {
    pub game_name: String,
    pub sender_id: String,
    pub secret: String,
    pub payload: serde_json::Value,
}

#[derive(Clone, Message)]
#[rtype(result = "Vec<String>")]
pub struct ListGames;

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct GameMessage {
    pub game_name: String,
    pub message: String,
    pub sender_id: String,
}
