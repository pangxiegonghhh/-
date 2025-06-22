use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password_hash: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,
    pub student_id: Option<String>,
    pub email: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Task {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub creator_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub team_size: i32,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Progress {
    pub id: Uuid,
    pub task_id: Uuid,
    pub content: String,
    pub percent: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Evaluation {
    pub id: Uuid,
    pub task_id: Uuid,
    pub username: String,
    pub content: String,
    pub rate: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub username: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskRole {
    pub id: Uuid,
    pub task_id: Uuid,
    pub role_name: String,
    pub user_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MyRole {
    pub task_id: Uuid,
    pub title: String,
    pub description: String,
    pub role_name: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SubTask {
    pub id: Uuid,
    pub task_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RoleInfo {
    pub role_id: Uuid,
    pub role_name: String,
    pub user_id: Option<Uuid>,
    pub name: Option<String>,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub student_id: Option<String>,
    pub email: Option<String>,
}
