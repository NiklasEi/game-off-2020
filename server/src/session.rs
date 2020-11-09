use log::{debug, info};

use actix::fut;
use actix::prelude::*;
use actix_broker::BrokerIssue;
use actix_web_actors::ws;

use crate::message::{ChatMessage, JoinGame, LeaveGame, ListRooms, SendMessage};
use crate::server::WsGameServer;
use std::time::{Duration, Instant};

/// How often heartbeat pings are sent
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
/// How long before lack of client response causes a timeout
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct PlayerSession {
    id: usize,
    game: String,
    name: Option<String>,
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT),
    /// otherwise we drop connection.
    hb: Instant,
}

impl Default for PlayerSession {
    fn default() -> Self {
        PlayerSession {
            id: usize::default(),
            game: String::default(),
            name: Option::default(),
            hb: Instant::now(),
        }
    }
}

impl PlayerSession {
    pub fn join_game(&mut self, game_name: &str, ctx: &mut ws::WebsocketContext<Self>) {
        let game_name = game_name.to_owned();

        // First send a leave message for the current room
        let leave_msg = LeaveGame(self.game.clone(), self.id);

        // issue_sync comes from having the `BrokerIssue` trait in scope.
        self.issue_system_sync(leave_msg, ctx);

        // Then send a join message for the new room
        let join_msg = JoinGame(
            game_name.to_owned(),
            self.name.clone(),
            ctx.address().recipient(),
        );

        WsGameServer::from_registry()
            .send(join_msg)
            .into_actor(self)
            .then(|id, act, _ctx| {
                if let Ok(id) = id {
                    act.id = id;
                    act.game = game_name;
                }

                fut::ready(())
            })
            .wait(ctx);
    }

    pub fn list_games(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        WsGameServer::from_registry()
            .send(ListRooms)
            .into_actor(self)
            .then(|res, _, ctx| {
                if let Ok(rooms) = res {
                    for room in rooms {
                        ctx.text(room);
                    }
                }

                fut::ready(())
            })
            .wait(ctx);
    }

    pub fn send_msg(&self, msg: &str) {
        let msg = SendMessage(self.game.clone(), self.id, String::from(msg));

        // issue_async comes from having the `BrokerIssue` trait in scope.
        self.issue_system_async(msg);
    }

    fn hb(&self, ctx: &mut <Self as Actor>::Context) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("Websocket Client heartbeat timed out, disconnecting!");
                ctx.stop();
                return;
            }

            ctx.ping(b"");
        });
    }
}

impl Actor for PlayerSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
        self.join_game("MainGame", ctx);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        info!(
            "WsChatSession closed for {}({}) in game {}",
            self.name.clone().unwrap_or_else(|| "anon".to_string()),
            self.id,
            self.game
        );
    }
}

impl Handler<ChatMessage> for PlayerSession {
    type Result = ();

    fn handle(&mut self, msg: ChatMessage, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for PlayerSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        debug!("WEBSOCKET MESSAGE: {:?}", msg);

        match msg {
            ws::Message::Text(text) => {
                let msg = text.trim();

                if msg.starts_with('/') {
                    let mut command = msg.splitn(2, ' ');

                    match command.next() {
                        Some("/list") => self.list_games(ctx),

                        Some("/join") => {
                            if let Some(room_name) = command.next() {
                                self.join_game(room_name, ctx);
                            } else {
                                ctx.text("!!! room name is required");
                            }
                        }

                        Some("/name") => {
                            if let Some(name) = command.next() {
                                self.name = Some(name.to_owned());
                                ctx.text(format!("name changed to: {}", name));
                            } else {
                                ctx.text("!!! name is required");
                            }
                        }

                        _ => ctx.text(format!("!!! unknown command: {:?}", msg)),
                    }

                    return;
                } else if msg.starts_with("Event ") {
                    let mut command = msg.splitn(2, ':');

                    match command.next() {
                        Some("Event GameState") => {
                            if let Some(payload) = command.next() {
                                debug!("{} => GameState payload: {}", self.id, payload);
                            }
                        }
                        Some("Event PlayerState") => {
                            if let Some(payload) = command.next() {
                                let mut json: serde_json::Value = serde_json::from_str(payload)
                                    .expect("JSON was not well-formatted");
                                json.as_object_mut().expect("malformed_json").insert(
                                    String::from("playerId"),
                                    serde_json::Value::String(self.id.to_string()),
                                );
                                self.send_msg(&format!("Event PlayerState:{}", &json.to_string()));
                                debug!("{} => PlayerState payload: {}", self.id, payload);
                            }
                        }
                        _ => ctx.text(format!("!!! unknown event: {:?}", msg)),
                    }
                }
                self.send_msg(msg);
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Pong(_bytes) => {
                self.hb = Instant::now();
            }
            _ => {}
        }
    }
}
