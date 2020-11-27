use rand::distributions::Alphanumeric;
use rand::{random, Rng};

use log::info;

use actix::prelude::*;
use actix_broker::BrokerSubscribe;

mod events;
mod game_objects;
mod map;
mod planet;

use std::collections::HashMap;

use crate::message::{GameMessage, GameState, JoinGame, LeaveGame, ListGames, Message};
use crate::server::events::{JoinedGame, PlayerType, SetMapGameEvent};
use crate::server::game_objects::GameMap;
use events::{
    GameStateEvent, MultiplayerEvent, PlayerJoinedGameEvent, PlayerLeftGameEvent, RoomLeaderEvent,
};

type Client = Recipient<Message>;

#[derive(Default, Debug)]
pub struct Game {
    players: HashMap<String, Player>,
    leader: Option<String>,
    secret: Option<String>,
    map: GameMap,
}

#[derive(Debug)]
pub struct Player {
    client: Client,
    player_type: PlayerType,
}

#[derive(Default)]
pub struct WsGameServer {
    games: HashMap<String, Game>,
}

impl WsGameServer {
    fn add_player_to_game(&mut self, game_name: &str, client: Client) -> (String, PlayerType) {
        let mut id = rand::random::<usize>().to_string();
        let player_type: PlayerType = random();

        let game = self
            .games
            .entry(game_name.to_owned())
            .or_insert_with(Game::default);
        loop {
            if game.players.contains_key(&id) {
                id = rand::random::<usize>().to_string();
            } else {
                break;
            }
        }
        game.players.iter().for_each(|(player_id, player)| {
            client
                .do_send(Message(
                    PlayerJoinedGameEvent {
                        player_id: player_id.clone(),
                        player_type: player.player_type.clone(),
                    }
                    .to_message(),
                ))
                .ok();
        });
        game.players.insert(
            id.clone(),
            Player {
                client,
                player_type: player_type.clone(),
            },
        );
        (id, player_type)
    }

    fn send_message_to_game(&mut self, game_name: &str, msg: &str, src: &String) -> Option<()> {
        let mut game = self.games.remove(game_name)?;
        let players = game
            .players
            .drain()
            .filter(|(player_id, player)| {
                if player_id == src {
                    return true;
                }
                player.client.do_send(Message(msg.to_owned())).is_ok()
            })
            .collect();
        game.players = players;
        self.games.insert(game_name.to_owned(), game);

        Some(())
    }

    fn send_message_to_player(&self, recipient: &String, msg: &str) -> Option<()> {
        for (_game_name, game) in self.games.iter() {
            if game.players.contains_key(recipient) {
                let player = game
                    .players
                    .get(recipient)
                    .expect("failed to find expected player in game");
                player
                    .client
                    .do_send(Message(msg.to_owned()))
                    .expect("Failed to send message to player");
            }
        }

        Some(())
    }

    fn make_player_leader(&mut self, player_id: &String, game_name: String) -> Option<()> {
        let secret = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(10)
            .collect::<String>();
        self.send_message_to_player(
            &player_id,
            &RoomLeaderEvent {
                secret: secret.clone(),
            }
            .to_message(),
        )
        .expect("failed to send initialisation message for game room");
        let mut game = self.games.remove(&game_name)?;
        game.leader = Some(player_id.clone());
        game.secret = Some(secret);
        self.games.insert(game_name, game);

        Some(())
    }
}

impl Actor for WsGameServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.subscribe_system_async::<LeaveGame>(ctx);
        self.subscribe_system_async::<GameMessage>(ctx);
        self.subscribe_system_async::<GameState>(ctx);
    }
}

impl Handler<JoinGame> for WsGameServer {
    type Result = MessageResult<JoinGame>;

    fn handle(&mut self, msg: JoinGame, _ctx: &mut Self::Context) -> Self::Result {
        let JoinGame { game_name, player } = msg;

        let (id, player_type) = self.add_player_to_game(&game_name, player);

        let game = self.games.get(&game_name).expect("Failed to get room");
        self.send_message_to_player(
            &id,
            &JoinedGame {
                ok: true,
                reason: None,
                player_type: player_type.clone(),
            }
            .to_message(),
        );
        self.send_message_to_player(&id, &SetMapGameEvent { map: &game.map }.to_message());
        if game.leader.is_none() {
            info!("Making {} leader of game {}", id, &game_name);
            self.make_player_leader(&id, String::from(&game_name));
        }
        self.send_message_to_game(
            &game_name,
            &PlayerJoinedGameEvent {
                player_id: id.clone(),
                player_type,
            }
            .to_message(),
            &id,
        );
        MessageResult(id)
    }
}

impl Handler<LeaveGame> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveGame, _ctx: &mut Self::Context) {
        let mut removed_player: Option<Client> = None;
        let mut new_lead: Option<String> = None;
        if let Some(room) = self.games.get_mut(&msg.game_name) {
            removed_player = room
                .players
                .remove(&msg.player_id)
                .map(|player| -> Client { player.client });
            if room.leader == Some(msg.player_id.clone()) {
                if room.players.len() < 1 {
                    self.games.remove(&msg.game_name);
                    return;
                }

                if let Some((player_id, _client)) = room.players.iter().next() {
                    new_lead = Some(player_id.clone());
                }
            }
        }
        if removed_player.is_some() {
            info!("Removing {} from game {:?}", msg.player_id, msg.game_name);
            self.send_message_to_game(
                &msg.game_name,
                &PlayerLeftGameEvent {
                    player_id: msg.player_id.clone(),
                }
                .to_message(),
                &msg.player_id,
            );
        }
        if let Some(player_id) = new_lead {
            self.make_player_leader(&player_id, msg.game_name.clone());
        }
    }
}

impl Handler<GameState> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: GameState, _ctx: &mut Self::Context) {
        let GameState {
            game_name,
            sender_id,
            secret,
            payload,
        } = msg;
        if let Some(room) = self.games.get(&game_name) {
            if room.leader == Some(sender_id.clone()) && room.secret == Some(secret) {
                self.send_message_to_game(
                    &game_name,
                    &GameStateEvent { payload }.to_message(),
                    &sender_id.clone(),
                );
            }
        }
    }
}

impl Handler<ListGames> for WsGameServer {
    type Result = MessageResult<ListGames>;

    fn handle(&mut self, _: ListGames, _ctx: &mut Self::Context) -> Self::Result {
        MessageResult(self.games.keys().cloned().collect())
    }
}

impl Handler<GameMessage> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: GameMessage, _ctx: &mut Self::Context) {
        let GameMessage {
            game_name,
            message,
            sender_id,
        } = msg;
        self.send_message_to_game(&game_name, &message, &sender_id);
    }
}

impl SystemService for WsGameServer {}
impl Supervised for WsGameServer {}
