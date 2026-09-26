-- Create the pickloan database if it doesn't exist
-- This is optional as docker-compose already creates the POSTGRES_DB

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default values
SET timezone = 'UTC';

-- Log initialization
SELECT 'PickLoan database initialized' as message;
