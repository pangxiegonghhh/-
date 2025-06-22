use actix_cors::Cors;
use actix_files::Files;
use actix_web::{App, HttpServer, web};
use dotenv::dotenv;
use serde::Serialize;
use std::env;
use uuid::Uuid;

mod auth;
mod db;
mod handlers;
mod models;
mod ws;

use crate::handlers::{
    add_evaluation, add_message, add_progress, claim_role, create_sub_task, create_task,
    delete_sub_task, finish_task, get_my_published_tasks, get_my_roles, get_task_roles,
    get_user_info, list_evaluations, list_messages, list_progress, list_sub_tasks, list_tasks,
    update_sub_task, update_task, update_user_profile, upload_avatar,
};
use crate::models::RoleInfo;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let pool = db::get_db_pool().await;
    let bind_addr = "127.0.0.1:8080";
    println!("Server running on http://{}", bind_addr);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .service(
                web::scope("/api")
                    .route("/register", web::post().to(auth::register))
                    .route("/login", web::post().to(auth::login))
                    .route("/tasks", web::get().to(handlers::list_tasks))
                    .route("/tasks", web::post().to(handlers::create_task))
                    .route(
                        "/task_roles/{task_id}",
                        web::get().to(handlers::get_task_roles),
                    )
                    .route("/claim_role", web::post().to(handlers::claim_role))
                    .route(
                        "/user_info/{user_id}",
                        web::get().to(handlers::get_user_info),
                    )
                    .route(
                        "/update_profile",
                        web::post().to(handlers::update_user_profile),
                    )
                    .route("/my_roles/{user_id}", web::get().to(handlers::get_my_roles))
                    .route(
                        "/my_published_tasks/{user_id}",
                        web::get().to(handlers::get_my_published_tasks),
                    )
                    .route("/finish_task", web::post().to(handlers::finish_task))
                    .route("/update_task", web::post().to(handlers::update_task))
                    .route("/upload_avatar", web::post().to(handlers::upload_avatar))
                    .route(
                        "/tasks/{task_id}/sub_tasks",
                        web::post().to(create_sub_task),
                    )
                    .route("/tasks/{task_id}/sub_tasks", web::get().to(list_sub_tasks))
                    .route(
                        "/tasks/{task_id}/sub_tasks/{sub_task_id}",
                        web::put().to(update_sub_task),
                    )
                    .route(
                        "/tasks/{task_id}/sub_tasks/{sub_task_id}",
                        web::delete().to(delete_sub_task),
                    )
                    .route(
                        "/task_roles/{role_id}/remove_member",
                        web::post().to(handlers::remove_member_from_task_role),
                    ),
            )
            .route("/ws/", web::get().to(ws::ws_index))
            .service(Files::new("/static", "./static"))
            .service(Files::new("/", "./frontend/build").index_file("index.html"))
    })
    .bind(bind_addr)?
    .run()
    .await
}
