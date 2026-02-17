-- ARQ Backend Database Initialization Script
-- Development environment setup
-- This script runs automatically when the PostgreSQL container starts

-- Create custom types if needed
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator', 'guest');

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create arq_dev user
DO $$ BEGIN CREATE ROLE arq_dev WITH LOGIN PASSWORD 'arq_dev_password'; EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;
GRANT ALL PRIVILEGES ON DATABASE arq_development TO arq_dev;
-- Grant privileges to the ARQ user
GRANT CREATE ON SCHEMA public TO arq_dev;
GRANT USAGE ON SCHEMA public TO arq_dev;

-- Log initialization
COMMENT ON DATABASE arq_development IS 'ARQ Backend Development Database - Auto-initialized';

-- All database tables will be created by TypeORM migrations
-- This script only handles initial setup and extensions
