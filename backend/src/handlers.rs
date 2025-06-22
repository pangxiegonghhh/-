use crate::RoleInfo;
use crate::auth::Claims;
use crate::models::{Evaluation, Message, MyRole, Progress, SubTask, Task, TaskRole, User};
use actix_multipart::Multipart;
use actix_web::{HttpResponse, web};
use chrono::{DateTime, Utc};
use futures_util::{StreamExt, TryStreamExt};
use jsonwebtoken::{DecodingKey, Validation, decode};
use sanitize_filename::sanitize;
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;
use sqlx::PgPool;
use std::env;
use std::io::Write;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TaskDetails {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub creator_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub team_size: i32,
    pub status: String,
    pub creator_name: Option<String>,
    pub creator_username: String,
}

#[derive(Debug, Deserialize)]
pub struct TaskInput {
    pub title: String,
    pub description: String,
    pub creator_id: Uuid,
    pub team_size: i32,
    pub roles: Vec<String>,
}

pub async fn create_task(pool: web::Data<PgPool>, form: web::Json<TaskInput>) -> HttpResponse {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(json!({"success": false, "message": format!("{}", e)}));
        }
    };
    let res = sqlx::query!(
        "INSERT INTO tasks (id, title, description, creator_id, created_at, team_size) VALUES ($1, $2, $3, $4, $5, $6)",
        id, form.title, form.description, form.creator_id, now, form.team_size
    )
    .execute(&mut *tx)
    .await;
    if let Err(e) = res {
        tx.rollback().await.ok();
        return HttpResponse::Ok().json(json!({"success": false, "message": format!("{}", e)}));
    }
    // 插入职责
    for role_name in &form.roles {
        let role_id = Uuid::new_v4();
        let res = sqlx::query!(
            "INSERT INTO task_roles (id, task_id, role_name, user_id) VALUES ($1, $2, $3, $4)",
            role_id,
            id,
            role_name,
            Option::<Uuid>::None
        )
        .execute(&mut *tx)
        .await;
        if let Err(e) = res {
            tx.rollback().await.ok();
            return HttpResponse::Ok().json(json!({"success": false, "message": format!("{}", e)}));
        }
    }
    tx.commit().await.ok();
    HttpResponse::Ok().json(json!({"success": true, "id": id}))
}

pub async fn list_tasks(pool: web::Data<PgPool>) -> HttpResponse {
    let query = r#"
        SELECT
            t.id, t.title, t.description, t.creator_id, t.created_at, t.team_size, t.status,
            u.name as creator_name, u.username as creator_username
        FROM tasks t
        INNER JOIN users u ON t.creator_id = u.id
        WHERE t.status = '进行中'
        ORDER BY t.created_at DESC
    "#;
    let rows = sqlx::query_as::<_, TaskDetails>(query)
        .fetch_all(pool.get_ref())
        .await;

    match rows {
        Ok(tasks) => HttpResponse::Ok().json(tasks),
        Err(e) => {
            eprintln!("Failed to fetch tasks: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ProgressInput {
    pub task_id: Uuid,
    pub content: String,
    pub percent: i32,
}

pub async fn add_progress(pool: web::Data<PgPool>, form: web::Json<ProgressInput>) -> HttpResponse {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let res = sqlx::query!(
        "INSERT INTO progress (id, task_id, content, percent, created_at) VALUES ($1, $2, $3, $4, $5)",
        id, form.task_id, form.content, form.percent, now
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(_) => HttpResponse::Ok().json(json!({"success": true, "id": id})),
        Err(e) => HttpResponse::Ok().json(json!({"success": false, "message": format!("{}", e)})),
    }
}

pub async fn list_progress(pool: web::Data<PgPool>, task_id: web::Path<Uuid>) -> HttpResponse {
    let rows = sqlx::query_as::<_, Progress>(
        "SELECT * FROM progress WHERE task_id = $1 ORDER BY created_at DESC",
    )
    .bind(*task_id)
    .fetch_all(pool.get_ref())
    .await;
    match rows {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[derive(Debug, Deserialize)]
pub struct EvaluationInput {
    pub task_id: Uuid,
    pub username: String,
    pub content: String,
    pub rate: i32,
}

pub async fn add_evaluation(
    pool: web::Data<PgPool>,
    form: web::Json<EvaluationInput>,
) -> HttpResponse {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let res = sqlx::query!(
        "INSERT INTO evaluations (id, task_id, username, content, rate, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        id, form.task_id, form.username, form.content, form.rate, now
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(_) => HttpResponse::Ok().json(json!({"success": true, "id": id})),
        Err(e) => HttpResponse::Ok().json(json!({"success": false, "message": format!("{}", e)})),
    }
}

pub async fn list_evaluations(pool: web::Data<PgPool>, task_id: web::Path<Uuid>) -> HttpResponse {
    let rows = sqlx::query_as::<_, Evaluation>(
        "SELECT * FROM evaluations WHERE task_id = $1 ORDER BY created_at DESC",
    )
    .bind(*task_id)
    .fetch_all(pool.get_ref())
    .await;
    match rows {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[derive(Debug, Deserialize)]
pub struct MessageInput {
    pub username: String,
    pub content: String,
}

pub async fn add_message(pool: web::Data<PgPool>, form: web::Json<MessageInput>) -> HttpResponse {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let res = sqlx::query!(
        "INSERT INTO messages (id, username, content, created_at) VALUES ($1, $2, $3, $4)",
        id,
        form.username,
        form.content,
        now
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(_) => HttpResponse::Ok().json(json!({"success": true, "id": id})),
        Err(e) => HttpResponse::Ok().json(json!({"success": false, "message": format!("{}", e)})),
    }
}

pub async fn list_messages(pool: web::Data<PgPool>) -> HttpResponse {
    let rows = sqlx::query_as::<_, Message>("SELECT * FROM messages ORDER BY created_at ASC")
        .fetch_all(pool.get_ref())
        .await;
    match rows {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn get_task_roles(pool: web::Data<PgPool>, task_id: web::Path<Uuid>) -> HttpResponse {
    let rows = sqlx::query_as::<_, RoleInfo>(
        r#"
        SELECT tr.id as role_id, tr.role_name, tr.user_id, u.name, u.username, u.phone, u.student_id, u.email
        FROM task_roles tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.task_id = $1
        "#,
    )
    .bind(*task_id)
    .fetch_all(pool.get_ref())
    .await;

    match rows {
        Ok(roles) => HttpResponse::Ok().json(roles),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn remove_member_from_task_role(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let role_id = path.into_inner();
    // 先查出该 role_id 对应的 task_id 和 user_id
    let row = sqlx::query!(
        "SELECT task_id, user_id FROM task_roles WHERE id = $1",
        role_id
    )
    .fetch_one(pool.get_ref())
    .await;

    if let Ok(r) = row {
        if let Some(user_id) = r.user_id {
            // 批量释放该成员在该任务下的所有职责
            let res = sqlx::query!(
                "UPDATE task_roles SET user_id = NULL WHERE task_id = $1 AND user_id = $2",
                r.task_id,
                user_id
            )
            .execute(pool.get_ref())
            .await;

            // 将该成员在该任务下的所有子任务 assignee_id 置为 NULL
            let _ = sqlx::query!(
                "UPDATE sub_tasks SET assignee_id = NULL WHERE task_id = $1 AND assignee_id = $2",
                r.task_id,
                user_id
            )
            .execute(pool.get_ref())
            .await;

            return match res {
                Ok(_) => HttpResponse::Ok().json(json!({"success": true})),
                Err(e) => HttpResponse::InternalServerError()
                    .json(json!({"success": false, "message": e.to_string()})),
            };
        }
    }
    HttpResponse::Ok().json(json!({"success": true}))
}

#[derive(Debug, Deserialize)]
pub struct ClaimRoleInput {
    pub role_id: Uuid,
    pub user_id: Uuid,
}

pub async fn claim_role(pool: web::Data<PgPool>, form: web::Json<ClaimRoleInput>) -> HttpResponse {
    let res = sqlx::query!(
        "UPDATE task_roles SET user_id = $1 WHERE id = $2 AND user_id IS NULL",
        form.user_id,
        form.role_id
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(r) if r.rows_affected() == 1 => HttpResponse::Ok().json(json!({"success": true})),
        _ => HttpResponse::Ok().json(json!({"success": false, "message": "认领失败或已被认领"})),
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileInput {
    pub user_id: Uuid,
    pub name: String,
    pub phone: Option<String>,
    pub student_id: Option<String>,
    pub email: Option<String>,
}

pub async fn get_user_info(pool: web::Data<PgPool>, user_id: web::Path<Uuid>) -> HttpResponse {
    let row = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(*user_id)
        .fetch_one(pool.get_ref())
        .await;
    match row {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(_) => HttpResponse::NotFound().finish(),
    }
}

pub async fn update_user_profile(
    pool: web::Data<PgPool>,
    form: web::Json<UpdateProfileInput>,
) -> HttpResponse {
    let res = sqlx::query!(
        "UPDATE users SET name = $1, phone = $2, student_id = $3, email = $4 WHERE id = $5",
        form.name,
        form.phone,
        form.student_id,
        form.email,
        form.user_id
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(r) if r.rows_affected() == 1 => HttpResponse::Ok().json(json!({"success": true})),
        _ => HttpResponse::Ok().json(json!({"success": false, "message": "修改失败"})),
    }
}

// 获取自己认领的所有任务及职责
pub async fn get_my_roles(pool: web::Data<PgPool>, user_id: web::Path<Uuid>) -> HttpResponse {
    #[derive(sqlx::FromRow)]
    struct QueryResult {
        task_id: Uuid,
        title: Option<String>,
        description: Option<String>,
        role_name: Option<String>,
        status: Option<String>,
    }

    let rows = sqlx::query_as::<_, QueryResult>(
        r#"SELECT t.id as task_id, t.title, t.description, tr.role_name, t.status
            FROM task_roles tr
            JOIN tasks t ON tr.task_id = t.id
            WHERE tr.user_id = $1
            ORDER BY t.status ASC, t.created_at DESC"#,
    )
    .bind(*user_id)
    .fetch_all(pool.get_ref())
    .await;
    match rows {
        Ok(rows) => {
            let mut list: Vec<MyRole> = rows
                .into_iter()
                .map(|r| MyRole {
                    task_id: r.task_id,
                    title: r.title.unwrap_or_default(),
                    description: r.description.unwrap_or_default(),
                    role_name: r.role_name.unwrap_or_default(),
                    status: r.status.unwrap_or_else(|| "进行中".to_string()),
                })
                .collect();
            // 进行中排前，已结束排后
            list.sort_by_key(|r| r.status.clone());
            HttpResponse::Ok().json(list)
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[derive(Debug, Serialize)]
pub struct TaskWithMembers {
    pub id: Uuid,
    pub title: String,
    pub status: String,
    pub members: Vec<MemberRole>,
}

#[derive(Debug, Serialize)]
pub struct MemberRole {
    pub name: String,
    pub username: String,
    pub role_name: String,
    pub phone: Option<String>,
    pub student_id: Option<String>,
    pub email: Option<String>,
}

pub async fn get_my_published_tasks(
    pool: web::Data<PgPool>,
    user_id: web::Path<Uuid>,
) -> HttpResponse {
    // 获取自己发布的所有任务
    let tasks = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE creator_id = $1")
        .bind(*user_id)
        .fetch_all(pool.get_ref())
        .await;
    match tasks {
        Ok(task_list) => {
            let mut result = Vec::new();
            for task in task_list {
                // 获取成员
                let members = sqlx::query!(
                    r#"SELECT u.name, u.username, tr.role_name, u.phone, u.student_id, u.email
                        FROM task_roles tr
                        LEFT JOIN users u ON tr.user_id = u.id
                        WHERE tr.task_id = $1"#,
                    task.id
                )
                .fetch_all(pool.get_ref())
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|r| MemberRole {
                    name: r.name.unwrap_or_default(),
                    username: r.username,
                    role_name: r.role_name,
                    phone: r.phone,
                    student_id: r.student_id,
                    email: r.email,
                })
                .collect();
                result.push(TaskWithMembers {
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    members,
                });
            }
            // 进行中排前，已结束排后
            result.sort_by_key(|t| t.status.clone());
            HttpResponse::Ok().json(result)
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[derive(Debug, Deserialize)]
pub struct FinishTaskInput {
    pub task_id: Uuid,
}

pub async fn finish_task(
    pool: web::Data<PgPool>,
    form: web::Json<FinishTaskInput>,
) -> HttpResponse {
    let res = sqlx::query!(
        "UPDATE tasks SET status = '已结束' WHERE id = $1",
        form.task_id
    )
    .execute(pool.get_ref())
    .await;
    match res {
        Ok(r) if r.rows_affected() == 1 => HttpResponse::Ok().json(json!({"success": true})),
        _ => HttpResponse::Ok().json(json!({"success": false, "message": "结束失败"})),
    }
}

#[derive(Debug, Deserialize)]
pub struct TaskUpdateInput {
    pub task_id: Uuid,
    pub title: String,
    pub description: String,
}

pub async fn update_task(
    pool: web::Data<PgPool>,
    form: web::Json<TaskUpdateInput>,
) -> HttpResponse {
    let res = sqlx::query!(
        "UPDATE tasks SET title = $1, description = $2 WHERE id = $3",
        form.title,
        form.description,
        form.task_id
    )
    .execute(pool.get_ref())
    .await;

    match res {
        Ok(result) if result.rows_affected() == 1 => {
            HttpResponse::Ok().json(json!({"success": true}))
        }
        Ok(_) => {
            HttpResponse::Ok().json(json!({"success": false, "message": "未找到任务或信息无变化"}))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(json!({"success": false, "message": format!("{}", e)})),
    }
}

pub async fn upload_avatar(
    pool: web::Data<PgPool>,
    req: actix_web::HttpRequest,
    mut payload: Multipart,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json("Missing token"),
    };
    if !auth_header.starts_with("Bearer ") {
        return HttpResponse::Unauthorized().json("Invalid token format");
    }
    let token = &auth_header["Bearer ".len()..];
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let decoding_key = DecodingKey::from_secret(secret.as_ref());

    let token_data = match decode::<Claims>(token, &decoding_key, &Validation::default()) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json("Invalid token"),
    };

    let user_id = match Uuid::parse_str(&token_data.claims.sub) {
        Ok(id) => id,
        Err(_) => return HttpResponse::BadRequest().json("Invalid user ID in token"),
    };

    let uploads_dir = "./static/avatars";
    if let Err(_) = std::fs::create_dir_all(uploads_dir) {
        return HttpResponse::InternalServerError().json("Could not create uploads directory");
    }

    let mut filepath: Option<String> = None;

    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let filename = match content_disposition.get_filename() {
            Some(name) => sanitize(name),
            None => continue,
        };

        let ext = std::path::Path::new(&filename)
            .extension()
            .and_then(std::ffi::OsStr::to_str)
            .unwrap_or("tmp");
        let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
        let file_path_str = format!("{}/{}", uploads_dir, new_filename);

        filepath = Some(format!("/static/avatars/{}", new_filename));

        let file_path_clone = file_path_str.clone();
        let mut f = web::block(|| std::fs::File::create(file_path_clone))
            .await
            .unwrap()
            .unwrap();

        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f))
                .await
                .unwrap()
                .unwrap();
        }
    }

    if let Some(path) = filepath {
        let res = sqlx::query!(
            "UPDATE users SET avatar_url = $1 WHERE id = $2",
            path,
            user_id
        )
        .execute(pool.get_ref())
        .await;

        return match res {
            Ok(_) => HttpResponse::Ok().json(json!({"success": true, "avatar_url": path})),
            Err(_) => HttpResponse::InternalServerError().json("Failed to update database"),
        };
    }

    HttpResponse::BadRequest().json("File upload failed.")
}

// --- Sub-task Handlers ---

#[derive(Debug, Deserialize)]
pub struct SubTaskInput {
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct SubTaskUpdateInput {
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub assignee_id: Option<Uuid>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SubTaskDetails {
    id: Uuid,
    title: String,
    description: Option<String>,
    status: String,
    due_date: Option<DateTime<Utc>>,
    assignee_id: Option<Uuid>,
    assignee_name: Option<String>,
}

pub async fn create_sub_task(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    form: web::Json<SubTaskInput>,
) -> HttpResponse {
    let task_id = path.into_inner();
    let sub_task_id = Uuid::new_v4();
    let now = Utc::now();

    let res = sqlx::query!(
        r#"
        INSERT INTO sub_tasks (id, task_id, title, description, created_at, due_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, '未开始')
        "#,
        sub_task_id,
        task_id,
        form.title,
        form.description,
        now,
        form.due_date
    )
    .execute(pool.get_ref())
    .await;

    match res {
        Ok(_) => HttpResponse::Created().json(json!({ "success": true, "id": sub_task_id })),
        Err(e) => HttpResponse::InternalServerError()
            .json(json!({ "success": false, "message": e.to_string() })),
    }
}

pub async fn list_sub_tasks(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> HttpResponse {
    let task_id = path.into_inner();
    let query = r#"
        SELECT
            st.id,
            st.title,
            st.description,
            st.status,
            st.due_date,
            st.assignee_id,
            COALESCE(u.name, u.username, NULL) as assignee_name
        FROM sub_tasks st
        LEFT JOIN users u ON st.assignee_id = u.id
        WHERE st.task_id = $1
        ORDER BY st.created_at ASC
    "#;

    let rows = sqlx::query_as::<_, SubTaskDetails>(query)
        .bind(task_id)
        .fetch_all(pool.get_ref())
        .await;

    match rows {
        Ok(sub_tasks) => HttpResponse::Ok().json(sub_tasks),
        Err(e) => HttpResponse::InternalServerError()
            .json(json!({ "success": false, "message": e.to_string() })),
    }
}

pub async fn update_sub_task(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    form: web::Json<SubTaskUpdateInput>,
) -> HttpResponse {
    let (_task_id, sub_task_id) = path.into_inner();
    let res = sqlx::query!(
        r#"
        UPDATE sub_tasks
        SET title = $1, description = $2, due_date = $3, assignee_id = $4
        WHERE id = $5
        "#,
        form.title,
        form.description,
        form.due_date,
        form.assignee_id,
        sub_task_id
    )
    .execute(pool.get_ref())
    .await;

    match res {
        Ok(_) => HttpResponse::Ok().json(json!({"success": true})),
        Err(e) => HttpResponse::InternalServerError()
            .json(json!({ "success": false, "message": e.to_string() })),
    }
}

pub async fn delete_sub_task(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
) -> HttpResponse {
    let (_task_id, sub_task_id) = path.into_inner();
    let res = sqlx::query!("DELETE FROM sub_tasks WHERE id = $1", sub_task_id)
        .execute(pool.get_ref())
        .await;

    match res {
        Ok(result) if result.rows_affected() == 1 => {
            HttpResponse::Ok().json(json!({ "success": true }))
        }
        Ok(_) => HttpResponse::NotFound().json("Sub-task not found"),
        Err(e) => HttpResponse::InternalServerError()
            .json(json!({ "success": false, "message": e.to_string() })),
    }
}
