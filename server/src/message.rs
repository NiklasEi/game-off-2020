use actix::prelude::*;

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct ChatMessage(pub String);

#[derive(Clone, Message)]
#[rtype(result = "usize")]
pub struct JoinGame(pub String, pub Option<String>, pub Recipient<ChatMessage>);

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct LeaveGame(pub String, pub usize);

#[derive(Clone, Message, Debug)]
#[rtype(result = "()")]
pub struct GameState {
    pub room_name: String,
    pub source_id: usize,
    pub secret: String,
    pub payload: serde_json::Value,
}

#[derive(Clone, Message)]
#[rtype(result = "Vec<String>")]
pub struct ListRooms;

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct SendMessage(pub String, pub usize, pub String);
