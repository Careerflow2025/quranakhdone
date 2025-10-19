-- URGENT FIX: Disable RLS on profiles table temporarily
-- This will allow profile creation to work until we redeploy the new code

-- Step 1: Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Find your orphaned auth user and create their profile manually
-- Replace 'ridaapm@gmail.com' with your actual email if different

DO $$
DECLARE
    v_user_id uuid;
    v_school_id uuid;
BEGIN
    -- Find the auth user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'ridaapm@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User not found in auth.users';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user_id: %', v_user_id;

    -- Find the school (assuming they're the owner)
    SELECT id INTO v_school_id
    FROM schools
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_school_id IS NULL THEN
        RAISE NOTICE 'No school found';
        RETURN;
    END IF;

    RAISE NOTICE 'Found school_id: %', v_school_id;

    -- Delete existing profile if any (just in case)
    DELETE FROM profiles WHERE user_id = v_user_id;

    -- Create the profile
    INSERT INTO profiles (user_id, school_id, email, display_name, role)
    VALUES (
        v_user_id,
        v_school_id,
        'ridaapm@gmail.com',
        'Rida APM',  -- Replace with your actual name
        'owner'
    );

    RAISE NOTICE 'Profile created successfully!';
END $$;

-- Step 3: Verify the profile was created
SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.role,
    s.name as school_name
FROM profiles p
JOIN schools s ON s.id = p.school_id
WHERE p.email = 'ridaapm@gmail.com';
