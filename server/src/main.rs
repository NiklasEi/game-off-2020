use log::info;

//use actix_files::Files;
use actix_web::{middleware, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;

mod message;
mod server;
mod session;

use session::PlayerSession;

async fn game_route(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(PlayerSession::default(), &req, stream)
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    env_logger::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let addr = "127.0.0.1:8080";

    let srv = HttpServer::new(|| {
        App::new()
            .wrap(middleware::Logger::default())
            .service(web::resource("/ws/").to(game_route))
        //.service(Files::new("/", "./static/").index_file("index.html"))
    })
    .bind(&addr)?;

    info!("Starting server: {}", &addr);

    srv.run().await
}
