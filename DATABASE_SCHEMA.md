# Phase 22 Step 3: Database Schema Design (280 lines)

## Overview
PostgreSQL 15 normalized schema design supporting multi-tenancy, row-level security (RLS), JSONB flexibility, and query optimization. Core tables: users, workspaces, projects, tasks, comments, attachments, notifications.

## 1. Core Tables

### 1.1 Tenants Table
```sql
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_tenants_subscription ON tenants(subscription_tier);
```

### 1.2 Users Table
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX idx_users_email_tenant ON users(email, tenant_id);
CREATE INDEX idx_users_status ON users(status);
```

### 1.3 Workspaces Table
```sql
CREATE TABLE workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  owner_id UUID NOT NULL REFERENCES users(user_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_archived ON workspaces(is_archived);
```

### 1.4 Workspace Members Table
```sql
CREATE TABLE workspace_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  role VARCHAR(50) NOT NULL, -- admin, editor, member, viewer
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);
```

### 1.5 Projects Table
```sql
CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(50) DEFAULT 'kanban', -- kanban, scrum, list
  is_archived BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_archived ON projects(is_archived);
```

### 1.6 Tasks Table
```sql
CREATE TABLE tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  assignee_id UUID REFERENCES users(user_id),
  due_date DATE,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

### 1.7 Comments Table
```sql
CREATE TABLE comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(user_id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]', -- @mentions JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

### 1.8 Attachments Table
```sql
CREATE TABLE attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  s3_key VARCHAR(500),
  uploaded_by UUID NOT NULL REFERENCES users(user_id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_task ON attachments(task_id);
```

### 1.9 Notifications Table
```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  event_type VARCHAR(50), -- task_created, task_updated, comment_added
  task_id UUID REFERENCES tasks(task_id),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## 2. Row-Level Security (RLS) Policies

### 2.1 RLS Setup
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Set tenant context via session variable
SET app.current_tenant_id = 'tenant-uuid';
SET app.current_user_id = 'user-uuid';
```

### 2.2 Task Access Policy
```sql
CREATE POLICY task_isolation ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = current_setting('app.current_user_id')::UUID
      )
    )
  );

CREATE POLICY task_insert ON tasks
  FOR INSERT WITH CHECK (
    created_by = current_setting('app.current_user_id')::UUID
  );
```

## 3. Indexes for Query Optimization

### 3.1 Composite Indexes
```sql
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_workspace_members_lookup ON workspace_members(workspace_id, user_id, role);
```

### 3.2 JSONB Indexes
```sql
CREATE INDEX idx_tasks_metadata_gin ON tasks USING GIN (metadata);
CREATE INDEX idx_users_metadata_gin ON users USING GIN (metadata);
```

## 4. Migrations Strategy

### 4.1 Migration Files
```
migrations/
  ├─ 001_create_tenants.sql
  ├─ 002_create_users.sql
  ├─ 003_create_workspaces.sql
  ├─ 004_create_projects.sql
  ├─ 005_create_tasks.sql
  ├─ 006_create_comments.sql
  ├─ 007_create_attachments.sql
  ├─ 008_create_notifications.sql
  ├─ 009_enable_rls_policies.sql
  └─ 010_create_indexes.sql
```

## 5. Backup & Recovery

### 5.1 Backup Strategy
```bash
# Daily full backup
pg_dump -h localhost -U postgres arq > arq_backup_$(date +%Y%m%d).sql

# Continuous WAL archiving
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

### 5.2 Recovery
```bash
# Point-in-time recovery
pg_restore -d arq arq_backup_20250101.sql
```

## 6. Performance Tuning

### 6.1 Connection Pooling (PgBouncer)
```ini
[databases]
arq = host=localhost port=5432 dbname=arq

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### 6.2 Query Analysis
```sql
-- Enable slow query logging
log_min_duration_statement = 100; -- ms

-- Explain analysis
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE project_id = 'uuid' AND status = 'in_progress';
```

## 7. Data Integrity

### 7.1 Constraints
```sql
-- Foreign keys cascade on delete
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_project
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Check constraints
ALTER TABLE tasks
  ADD CONSTRAINT check_valid_priority
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
```

## Integration Points
- **Phase 22.1:** Database connection pooling per service (PgBouncer)
- **Phase 22.2:** All REST endpoints map to schema tables
- **Phase 22.4:** Service layer implements ORM/query builders

## Next: Phase 22.4
Service layer implementation using TypeORM/Prisma ORM patterns
