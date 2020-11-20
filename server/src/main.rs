use log::info;

//use actix_files::Files;
use actix_web::{middleware, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;

mod events;
mod message;
mod server;
mod session;

use actix_files::Files;
use session::PlayerSession;
use std::env;

async fn game_route(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(PlayerSession::default(), &req, stream)
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    env_logger::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a number");

    let srv = HttpServer::new(|| {
        App::new()
            .wrap(middleware::Logger::default())
            .service(web::resource("/ws/").to(game_route))
            .service(Files::new("/", "./static/").index_file("index.html"))
    })
    .bind(("0.0.0.0", port))
    .expect("Failed to bind to port {}");

    info!("Starting server: 0.0.0.0:{}", port);

    srv.run().await
}
