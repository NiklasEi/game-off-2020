use rand::distributions::Alphanumeric;
use rand::Rng;

use log::info;

use actix::prelude::*;
use actix_broker::BrokerSubscribe;

mod events;
mod game_objects;
mod map;
mod planet;

use std::collections::HashMap;

use crate::message::{GameMessage, GameState, JoinGame, LeaveGame, ListGames, Message};
use crate::server::events::SetMapGameEvent;
use crate::server::game_objects::GameMap;
use events::{
    GameStateEvent, MultiplayerEvent, PlayerJoinedGameEvent, PlayerLeftGameEvent, RoomLeaderEvent,
};

type Client = Recipient<Message>;

#[derive(Default, Debug)]
pub struct Game {
    players: HashMap<usize, Client>,
    leader: Option<usize>,
    secret: Option<String>,
    map: GameMap,
}

#[derive(Default)]
pub struct WsGameServer {
    games: HashMap<String, Game>,
}

impl WsGameServer {
    fn add_player_to_game(&mut self, game_name: &str, id: Option<usize>, client: Client) -> usize {
        let mut id = id.unwrap_or_else(rand::random::<usize>);

        let game = self
            .games
            .entry(game_name.to_owned())
            .or_insert_with(Game::default);
        loop {
            if game.players.contains_key(&id) {
                id = rand::random::<usize>();
            } else {
                break;
            }
        }
        game.players.iter().for_each(|(player_id, _player)| {
            client
                .do_send(Message(
                    PlayerJoinedGameEvent {
                        player_id: player_id.to_owned(),
                    }
                    .to_message(),
                ))
                .ok();
        });
        game.players.insert(id, client);
        id
    }

    fn send_message_to_game(&mut self, game_name: &str, msg: &str, src: usize) -> Option<()> {
        let mut game = self.games.remove(game_name)?;
        let players = game
            .players
            .drain()
            .filter(|(player_id, player)| {
                if player_id == &src {
                    return true;
                }
                player.do_send(Message(msg.to_owned())).is_ok()
            })
            .collect();
        game.players = players;
        self.games.insert(game_name.to_owned(), game);

        Some(())
    }

    fn send_message_to_player(&self, recipient: usize, msg: &str) -> Option<()> {
        for (_game_name, game) in self.games.iter() {
            if game.players.contains_key(&recipient) {
                let player = game
                    .players
                    .get(&recipient)
                    .expect("failed to find expected player in game");
                player
                    .do_send(Message(msg.to_owned()))
                    .expect("Failed to send message to player");
            }
        }

        Some(())
    }

    fn make_player_leader(&mut self, player_id: usize, game_name: String) -> Option<()> {
        let secret = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(10)
            .collect::<String>();
        self.send_message_to_player(
            player_id,
            &RoomLeaderEvent {
                secret: secret.clone(),
            }
            .to_message(),
        )
        .expect("failed to send initialisation message for game room");
        let mut game = self.games.remove(&game_name)?;
        game.leader = Some(player_id);
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

        let id = self.add_player_to_game(&game_name, None, player);

        let game = self.games.get(&game_name).expect("Failed to get room");
        self.send_message_to_player(id, &SetMapGameEvent { map: &game.map }.to_message());
        if game.leader.is_none() {
            info!("Making {} leader of game {:?}", id, game);
            self.make_player_leader(id, String::from(&game_name));
        }
        self.send_message_to_game(
            &game_name,
            &PlayerJoinedGameEvent {
                player_id: id.clone(),
            }
            .to_message(),
            id,
        );
        MessageResult(id)
    }
}

impl Handler<LeaveGame> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveGame, _ctx: &mut Self::Context) {
        if let Some(room) = self.games.get_mut(&msg.game_name) {
            let removed_player = room.players.remove(&msg.player_id);
            if removed_player.is_some() {
                info!("Removing {} from game {:?}", msg.player_id, msg.game_name);
                if room.leader == Some(msg.player_id) {
                    if room.players.len() < 1 {
                        self.games.remove(&msg.game_name);
                        return;
                    }

                    if let Some((&player_id, _client)) = room.players.iter().next() {
                        self.make_player_leader(player_id, msg.game_name.clone());
                    }
                }
                self.send_message_to_game(
                    &msg.game_name,
                    &PlayerLeftGameEvent {
                        player_id: msg.player_id,
                    }
                    .to_message(),
                    msg.player_id,
                );
            }
        }
    }
}

impl Handler<GameState> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: GameState, _ctx: &mut Self::Context) {
        if let Some(room) = self.games.get(&msg.game_name) {
            if room.leader == Some(msg.sender_id) && room.secret == Some(msg.secret) {
                self.send_message_to_game(
                    &msg.game_name,
                    &GameStateEvent {
                        payload: msg.payload,
                    }
                    .to_message(),
                    msg.sender_id,
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
        self.send_message_to_game(&game_name, &message, sender_id);
    }
}

impl SystemService for WsGameServer {}
impl Supervised for WsGameServer {}
