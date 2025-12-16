-- ========================================
-- LingoLab Database Initialization Script
-- ========================================
-- This script runs when PostgreSQL container starts for the first time
-- It ensures the uuid-ossp extension is enabled for UUID generation

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE '✅ LingoLab database initialized successfully';
    RAISE NOTICE '✅ UUID extension enabled';
END $$;
