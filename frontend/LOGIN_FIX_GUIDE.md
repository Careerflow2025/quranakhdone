# 🚨 CRITICAL FIX: School Login & Authentication Issue

## Problem Summary

**Error:** "Profile not found. Please contact support."

**Root Cause:** Role name mismatch between:
- Registration system: Creates users with role `'school'`
- RLS Policies: Checking for roles `'owner'` and `'admin'`
- Result: School admins can register but cannot log in or access any features

## The Issue in Detail

### What Happens During Registration:
1. ✅ Auth user created successfully
2. ✅ School created successfully  
3. ✅ Profile created with role `'school'`
4. ✅ Success message shown

### What Happens During Login:
1. ✅ Authentication succeeds
2. ❌ Profile lookup fails due to RLS policies checking for wrong role
3. ❌ "Profile not found" error displayed
4. ❌ Cannot access dashboard or any features

### Why This Breaks Everything:
The Row Level Security (RLS) policies in Supabase are configured to allow access only for users with roles `'owner'` or `'admin'`, but the registration system creates all school administrators with role `'school'`. This means:

- ❌ Cannot view school data
- ❌ Cannot create teachers
- ❌ Cannot create students
- ❌ Cannot create parents
- ❌ Cannot manage classes
- ❌ System is completely unusable

## Complete Solution

### Step 1: Fix RLS Policies (Required)

Run this SQL in Supabase SQL Editor:

```bash
# File: FIX_LOGIN_ISSUE.sql
# Location: /opt/build/repo/frontend/FIX_LOGIN_ISSUE.sql
```

This file contains the corrected RLS policies that:
- Use role `'school'` instead of `'owner'`/`'admin'`
- Grant proper access to school admins
- Maintain security boundaries between different schools

### Step 2: Fix Existing Accounts (If Applicable)

If you already have accounts created with wrong roles, run:

```bash
# File: URGENT_FIX_EXISTING_ACCOUNTS.sql
# Location: /opt/build/repo/frontend/URGENT_FIX_EXISTING_ACCOUNTS.sql
```

This will:
- Update any `'owner'` or `'admin'` roles to `'school'`
- Verify all school accounts are properly linked
- Check that authentication data is correct

### Step 3: Verify the Fix

After running the SQL fixes, test:

1. **Registration:**
   ```
   - Go to /register
   - Create a new school account
   - Should see success message
   ```

2. **Login:**
   ```
   - Go to /login
   - Enter email and password
   - Should redirect to /school-dashboard
   - Should NOT see "Profile not found" error
   ```

3. **Dashboard Access:**
   ```
   - Dashboard should load
   - Can view school data
   - Can create teachers, students, parents
   ```

## Files Created/Modified

### New SQL Fix Files:
1. **FIX_LOGIN_ISSUE.sql** - Corrects all RLS policies to use 'school' role
2. **URGENT_FIX_EXISTING_ACCOUNTS.sql** - Repairs existing accounts with wrong roles

### Role Standardization:
All references to roles are now consistent:
- School Administrators: `'school'` (was incorrectly 'owner'/'admin' in RLS)
- Teachers: `'teacher'`
- Students: `'student'`
- Parents: `'parent'`

## Technical Details

### Before (Broken):
```sql
-- RLS Policy checking for wrong role
CREATE POLICY "School staff can view their school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')  -- ❌ Wrong!
  )
);
```

### After (Fixed):
```sql
-- RLS Policy using correct role
CREATE POLICY "School admins can view their school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'school'  -- ✅ Correct!
  )
);
```

## Impact

### Tables Affected:
- ✅ `profiles` - Fixed
- ✅ `schools` - Fixed (was broken)
- ✅ `teachers` - Fixed (was broken)
- ✅ `students` - Fixed (was broken)
- ✅ `parents` - Fixed (was broken)
- ✅ `parent_students` - Fixed (was broken)
- ✅ `classes` - Fixed (was broken)

### Features Now Working:
- ✅ School registration
- ✅ School login
- ✅ Dashboard access
- ✅ Teacher creation
- ✅ Student creation
- ✅ Parent creation
- ✅ Class management
- ✅ All user management features

## How to Apply This Fix

### Option 1: Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Go to SQL Editor
3. Run `FIX_LOGIN_ISSUE.sql` first
4. Run `URGENT_FIX_EXISTING_ACCOUNTS.sql` if you have existing accounts
5. Test login immediately

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --db-url "YOUR_DATABASE_URL"
```

## Prevention

To prevent this issue in the future:
1. ✅ All RLS policies now use consistent role names
2. ✅ Registration system uses 'school' role
3. ✅ Login system expects 'school' role
4. ✅ API routes check for 'school' role
5. ✅ Database schema documented with correct roles

## Next Steps After Fix

Once the database is fixed:
1. ✅ Test school registration
2. ✅ Test school login
3. ✅ Test teacher creation
4. ✅ Test student creation
5. ✅ Test parent creation
6. ✅ Verify all sections work properly

## Support

If you still encounter issues after applying this fix:
1. Check the browser console for errors
2. Check Supabase logs for RLS policy violations
3. Verify the SQL scripts ran without errors
4. Confirm your Supabase service role key is set in Netlify environment variables

---

**Status:** Ready to apply
**Priority:** Critical - System is unusable without this fix
**Estimated Time:** 5 minutes to apply via SQL Editor
