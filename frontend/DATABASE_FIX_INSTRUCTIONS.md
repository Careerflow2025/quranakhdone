
# Database Fix Instructions

## Problem
The database enum for 'role' column doesn't include 'school' as a valid value,  
and some RLS policies are checking for old role names like 'owner' and 'admin'.

## Solution
The SQL script COMPLETE_DATABASE_FIX.sql contains all necessary fixes:
- Adds 'school' to the role enum if not present
- Updates profiles with 'owner'/'admin' roles to 'school'
- Recreates all RLS policies to use 'school' instead of 'owner'/'admin'

## How to Apply

### Method 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/rlfvubgyogkkqbjjmjwd/sql/new
2. Copy the contents of COMPLETE_DATABASE_FIX.sql
3. Paste into the SQL Editor
4. Click "Run"
5. Verify success messages

### Method 2: Supabase CLI (if installed)
```bash
supabase db execute --file COMPLETE_DATABASE_FIX.sql --project-ref rlfvubgyogkkqbjjmjwd
```

## Verification
After applying, verify the fix:
1. Check profiles table - all should have valid roles
2. Test login with school account
3. Verify school dashboard access

## What This Fixes
✅ Adds 'school' role to database enum
✅ Updates existing profiles from 'owner'/'admin' to 'school'
✅ Fixes all RLS policies to check for 'school' role
✅ Enables school admins to access their data
✅ Fixes "Profile not found" login errors
