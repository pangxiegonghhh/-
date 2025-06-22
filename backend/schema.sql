-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    name VARCHAR(64) DEFAULT '',
    avatar_url VARCHAR(255),
    phone VARCHAR(32),
    student_id VARCHAR(32),
    email VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL,
    team_size INT NOT NULL DEFAULT 1,
    status VARCHAR(16) DEFAULT '进行中'
);

-- 职责表
CREATE TABLE IF NOT EXISTS task_roles (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    role_name VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id)
);

-- 进度表
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    content TEXT NOT NULL,
    percent INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- 评价表
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    username VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    rate INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- 子任务表
CREATE TABLE IF NOT EXISTS sub_tasks (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id),
    status VARCHAR(16) NOT NULL DEFAULT '未开始',
    created_at TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ
); 