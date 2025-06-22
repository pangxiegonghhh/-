use actix_web::{HttpResponse, web};
use bcrypt::{DEFAULT_COST, hash, verify};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

#[derive(Debug, Deserialize)]
pub struct RegisterInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

pub async fn register(pool: web::Data<PgPool>, form: web::Json<RegisterInput>) -> HttpResponse {
    let hashed = hash(&form.password, DEFAULT_COST).unwrap();
    let user_id = Uuid::new_v4();
    let now = Utc::now();
    let res = sqlx::query!(
        "INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4)",
        user_id,
        form.username,
        hashed,
        now
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(_) => HttpResponse::Ok().json(json!({"success": true})),
        Err(_) => HttpResponse::Ok().json(json!({"success": false, "message": "用户名已存在"})),
    }
}

pub async fn login(pool: web::Data<PgPool>, form: web::Json<LoginInput>) -> HttpResponse {
    let row = sqlx::query!(
        "SELECT id, password_hash FROM users WHERE username = $1",
        form.username
    )
    .fetch_optional(pool.get_ref())
    .await
    .unwrap();
    if let Some(user) = row {
        if verify(&form.password, &user.password_hash).unwrap() {
            let exp = (Utc::now() + Duration::hours(24)).timestamp() as usize;
            let claims = Claims {
                sub: user.id.to_string(),
                exp,
            };
            let secret = env::var("JWT_SECRET").unwrap();
            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(secret.as_ref()),
            )
            .unwrap();
            return HttpResponse::Ok().json(json!({"success": true, "token": token}));
        }
    }
    HttpResponse::Ok().json(json!({"success": false, "message": "用户名或密码错误"}))
}
