-- Direct test: Create school bypassing PostgREST cache
-- This will prove if the database itself works

-- Test 1: Direct INSERT (should work)
INSERT INTO schools (name, timezone)
VALUES ('Direct Test School', 'Africa/Casablanca')
RETURNING *;

-- Test 2: Check if any views reference old columns
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition ILIKE '%address%'
AND schemaname = 'public';

-- Test 3: Check for any cached query plans
SELECT
    query,
    calls,
    mean_exec_time
FROM pg_stat_statements
WHERE query ILIKE '%schools%address%'
LIMIT 5;

-- Test 4: Check if there are any triggers on schools table
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'schools';
