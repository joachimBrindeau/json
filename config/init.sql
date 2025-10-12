-- Optimize PostgreSQL for JSON processing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable JIT for better JSON query performance
SET jit = on;
SET jit_above_cost = 10000;
SET jit_optimize_above_cost = 500000;

-- Create optimized indexes for JSON operations
CREATE OR REPLACE FUNCTION create_json_indexes() RETURNS void AS $$
BEGIN
  -- This function will be called after tables are created
  PERFORM 1;
END;
$$ LANGUAGE plpgsql;