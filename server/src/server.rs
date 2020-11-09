use log::info;

use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use std::collections::HashMap;
use std::mem;

use crate::message::{ChatMessage, JoinGame, LeaveGame, ListRooms, SendMessage};

type Client = Recipient<ChatMessage>;

#[derive(Default, Debug)]
pub struct Game {
    players: HashMap<usize, Client>,
    leader: Option<usize>,
}

#[derive(Default)]
pub struct WsGameServer {
    games: HashMap<String, Game>,
}

impl WsGameServer {
    fn take_game(&mut self, game_name: &str) -> Option<Game> {
        let game = self.games.get_mut(game_name)?;
        let game = mem::replace(game, Game::default());
        Some(game)
    }

    fn add_player_to_game(&mut self, game_name: &str, id: Option<usize>, client: Client) -> usize {
        let mut id = id.unwrap_or_else(rand::random::<usize>);

        if let Some(game) = self.games.get_mut(game_name) {
            loop {
                if game.players.contains_key(&id) {
                    id = rand::random::<usize>();
                } else {
                    break;
                }
            }
            game.players.iter().for_each(|(player_id, _player)| {
                let join_msg = format!("Event PlayerJoinedGame:{{\"playerId\":\"{}\"}}", player_id);
                client.do_send(ChatMessage(join_msg)).ok();
            });
            game.players.insert(id, client);
            return id;
        }

        // Create a new room for the first client
        let mut game: Game = Game::default();

        game.players.insert(id, client);
        self.games.insert(game_name.to_owned(), game);

        id
    }

    fn send_message_to_game(&mut self, game_name: &str, msg: &str, src: usize) -> Option<()> {
        let mut game = self.take_game(game_name)?;
        let players = game
            .players
            .drain()
            .filter(|(player_id, player)| {
                if player_id == &src {
                    return true;
                }
                player.do_send(ChatMessage(msg.to_owned())).is_ok()
            })
            .collect();
        game.players = players;
        self.games.insert(String::from(game_name), game);

        Some(())
    }

    fn send_message_to_player(&mut self, recipient: usize, msg: &str, _src: usize) -> Option<()> {
        for (_game_name, game) in self.games.iter() {
            if game.players.contains_key(&recipient) {
                let player = game
                    .players
                    .get(&recipient)
                    .expect("failed to find expected player in game");
                player
                    .do_send(ChatMessage(msg.to_owned()))
                    .expect("Failed to send message to player");
            }
        }

        Some(())
    }

    fn make_player_leader(&mut self, player_id: usize, game_name: String) -> Option<()> {
        self.send_message_to_player(
            player_id,
            "Event RoomLeader:{\"secret\":\"super-secret\"}",
            player_id,
        )
        .expect("failed to send initialisation message for game room");
        let mut game = self.games.remove(&game_name)?;
        game.leader = Some(player_id);
        self.games.insert(game_name, game);

        Some(())
    }
}

impl Actor for WsGameServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.subscribe_system_async::<LeaveGame>(ctx);
        self.subscribe_system_async::<SendMessage>(ctx);
    }
}

impl Handler<JoinGame> for WsGameServer {
    type Result = MessageResult<JoinGame>;

    fn handle(&mut self, msg: JoinGame, _ctx: &mut Self::Context) -> Self::Result {
        let JoinGame(room_name, _client_name, client) = msg;

        let id = self.add_player_to_game(&room_name, None, client);
        let join_msg = format!("Event PlayerJoinedGame:{{\"playerId\":\"{}\"}}", id);

        let game = self.games.get(&room_name).expect("Failed to get room");
        if game.leader.is_none() {
            info!("Making {} leader of game {:?}", id, game);
            self.make_player_leader(id, String::from(&room_name));
        }
        let game = self.games.get(&room_name).expect("Failed to get room");
        info!("Making {} leader of game {:?}", id, game);

        self.send_message_to_game(&room_name, &join_msg, id);
        MessageResult(id)
    }
}

impl Handler<LeaveGame> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveGame, _ctx: &mut Self::Context) {
        if let Some(room) = self.games.get_mut(&msg.0) {
            room.players.remove(&msg.1);
        }
    }
}

impl Handler<ListRooms> for WsGameServer {
    type Result = MessageResult<ListRooms>;

    fn handle(&mut self, _: ListRooms, _ctx: &mut Self::Context) -> Self::Result {
        MessageResult(self.games.keys().cloned().collect())
    }
}

impl Handler<SendMessage> for WsGameServer {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, _ctx: &mut Self::Context) {
        let SendMessage(room_name, id, msg) = msg;
        self.send_message_to_game(&room_name, &msg, id);
    }
}

impl SystemService for WsGameServer {}
impl Supervised for WsGameServer {}
