use log::{debug, info};

use actix::fut;
use actix::prelude::*;
use actix_broker::BrokerIssue;
use actix_web_actors::ws;

use serde_json::json;

use crate::message::{GameMessage, GameState, JoinGame, LeaveGame, Message};
use crate::server::WsGameServer;
use std::time::{Duration, Instant};

#[derive(Default)]
pub struct PlayerSession {
    id: usize,
    game_name: String,
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT),
    /// otherwise we drop connection.
    hb: HeartBeat,
}

struct HeartBeat {
    last_client_hb: Instant,
    interval: Duration,
    timeout: Duration,
}

impl Default for HeartBeat {
    fn default() -> Self {
        HeartBeat {
            last_client_hb: Instant::now(),
            interval: Duration::from_secs(5),
            timeout: Duration::from_secs(10),
        }
    }
}

impl PlayerSession {
    pub fn join_game(&mut self, game_name: &str, ctx: &mut ws::WebsocketContext<Self>) {
        let game_name = game_name.to_owned();

        // First send a leave message for the current room
        let leave_msg = LeaveGame {
            game_name: self.game_name.clone(),
            player_id: self.id,
        };

        // issue_sync comes from having the `BrokerIssue` trait in scope.
        self.issue_system_sync(leave_msg, ctx);

        // Then send a join message for the new room
        let join_msg = JoinGame {
            game_name: game_name.to_owned(),
            player: ctx.address().recipient(),
        };

        WsGameServer::from_registry()
            .send(join_msg)
            .into_actor(self)
            .then(|id, act, _ctx| {
                if let Ok(id) = id {
                    act.id = id;
                    act.game_name = game_name;
                }

                fut::ready(())
            })
            .wait(ctx);
    }

    // pub fn list_games(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
    //     WsGameServer::from_registry()
    //         .send(ListGames)
    //         .into_actor(self)
    //         .then(|res, _, ctx| {
    //             if let Ok(rooms) = res {
    //                 for room in rooms {
    //                     ctx.text(room);
    //                 }
    //             }
    //
    //             fut::ready(())
    //         })
    //         .wait(ctx);
    // }

    pub fn send_msg(&self, msg: &str) {
        let msg = GameMessage {
            game_name: self.game_name.clone(),
            message: String::from(msg),
            sender_id: self.id,
        };

        // issue_async comes from having the `BrokerIssue` trait in scope.
        self.issue_system_async(msg);
    }

    pub fn send_game_state(&self, payload: serde_json::Value, secret: String) {
        let msg = GameState {
            sender_id: self.id,
            game_name: self.game_name.to_owned(),
            payload,
            secret,
        };

        // issue_async comes from having the `BrokerIssue` trait in scope.
        self.issue_system_async(msg);
    }

    fn hb(&self, ctx: &mut <Self as Actor>::Context) {
        ctx.run_interval(self.hb.interval, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb.last_client_hb) > act.hb.timeout {
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
            "WsGameSession closed for {} in game {}",
            self.id, self.game_name
        );
    }
}

impl Handler<Message> for PlayerSession {
    type Result = ();

    fn handle(&mut self, msg: Message, ctx: &mut Self::Context) {
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

                if msg.starts_with("Event ") {
                    let mut command = msg.splitn(2, ':');

                    match command.next() {
                        Some("Event GameState") => {
                            if let Some(payload) = command.next() {
                                let json: serde_json::Value =
                                    serde_json::from_str(payload).expect("malformed_json");
                                let json_map =
                                    json.as_object().expect("malformed_json: not an object");
                                let secret = json_map.get("secret").expect("No secret").as_str();

                                if let Some(secret) = secret {
                                    self.send_game_state(json!(json_map), secret.to_string());
                                }
                            }
                        }
                        Some("Event PlayerState") => {
                            if let Some(payload) = command.next() {
                                let mut json: serde_json::Value =
                                    serde_json::from_str(payload).expect("malformed_json");
                                json.as_object_mut()
                                    .expect("malformed_json: not an object")
                                    .insert(
                                        String::from("playerId"),
                                        serde_json::Value::String(self.id.to_string()),
                                    );
                                self.send_msg(&format!("Event PlayerState:{}", &json.to_string()));
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
                self.hb.last_client_hb = Instant::now();
            }
            _ => {}
        }
    }
}
