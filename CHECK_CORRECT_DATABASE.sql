-- RUN THIS ON: https://rlfvubgyogkkqbjjmjwd.supabase.co
-- This is the database your Netlify app is actually using!

-- Check 1: What columns does schools table have?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'schools'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: What role enum values exist?
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'role'
ORDER BY enumlabel;

-- Check 3: Does profiles table exist?
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
) as profiles_exists;

-- Check 4: Count total tables (should be 40+ for NEW schema)
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
