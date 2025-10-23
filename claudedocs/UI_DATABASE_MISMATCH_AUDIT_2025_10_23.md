# UI vs DATABASE SCHEMA MISMATCH AUDIT

**Date**: October 23, 2025
**Status**: 🚨 **CRITICAL MISALIGNMENT DISCOVERED**
**Impact**: UI forms collecting unnecessary data, confusing user experience, potential bugs

---

## 🔍 ROOT CAUSE

The UI was built **FIRST** based on an **old SQLite seed schema** (`backend/seed.js`) which has been **COMPLETELY REPLACED** by the **Supabase PostgreSQL schema** (`supabase/migrations/20251016000001_complete_production_schema.sql`).

The UI forms are collecting fields that:
1. **Don't exist in the database**
2. **Are ignored by API endpoints**
3. **Confuse users** with unnecessary form complexity
4. **May cause future bugs** when developers expect these fields to exist

---

## 📊 DETAILED MISMATCHES

### 1. TEACHER CREATION FORM

**Location**: `frontend/components/dashboard/SchoolDashboard.tsx` (lines 443-455)

**UI Form Sends**:
```javascript
{
  name,           // ✅ Used (for profile.display_name)
  email,          // ✅ Used (for auth.users.email)
  password,       // ✅ Used (for auth.users.password)
  phone,          // ❌ COLLECTED BUT IGNORED
  schoolId,       // ✅ Used
  subject,        // ❌ COLLECTED BUT IGNORED
  qualification,  // ❌ COLLECTED BUT IGNORED
  experience,     // ❌ COLLECTED BUT IGNORED
  address,        // ❌ COLLECTED BUT IGNORED
  bio,            // ✅ Used (teachers.bio)
  classIds        // ✅ Used (for class_teachers table)
}
```

**API Endpoint** (`frontend/app/api/school/create-teacher/route.ts`):
- **Accepts** all fields (line 60)
- **Only uses**: name, email, password, schoolId, bio, classIds
- **Completely ignores**: phone, subject, qualification, experience, address

**Database Schema** (`teachers` table):
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  school_id UUID NOT NULL REFERENCES schools(id),
  bio TEXT,                    -- ✅ ONLY optional field used
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
);
```

**Fields NOT in Database**:
- ❌ `phone`
- ❌ `subject`
- ❌ `qualification`
- ❌ `experience`
- ❌ `address`

---

### 2. STUDENT CREATION FORM

**Location**: `frontend/components/dashboard/SchoolDashboard.tsx` (lines 375-385)

**UI Form Sends**:
```javascript
{
  name,     // ✅ Used (for profile.display_name)
  email,    // ✅ Used (for auth.users.email)
  age,      // ⚠️  Converted to dob (date of birth)
  gender,   // ✅ Used (students.gender)
  grade,    // ❌ COLLECTED BUT IGNORED
  address,  // ❌ COLLECTED BUT IGNORED
  phone,    // ❌ COLLECTED BUT IGNORED
  parent,   // ❌ COLLECTED BUT IGNORED
  schoolId  // ✅ Used
}
```

**API Endpoint** (`frontend/app/api/school/create-student/route.ts`):
- **Accepts** all fields (lines 60-69)
- **Converts**: age → dob (date of birth) calculation (lines 151-157)
- **Only uses**: name, email, age (for dob), gender, schoolId
- **Completely ignores**: grade, address, phone, parent

**Database Schema** (`students` table):
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  school_id UUID NOT NULL REFERENCES schools(id),
  dob DATE,               -- ✅ Calculated from age
  gender TEXT,            -- ✅ Used
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
);
```

**Fields NOT in Database**:
- ❌ `grade` (UI collects but database doesn't store)
- ❌ `address` (UI collects but database doesn't store)
- ❌ `phone` (UI collects but database doesn't store)
- ❌ `parent` (UI collects but database doesn't store)

**Age Field Issue**:
- ⚠️  UI collects `age` as a number
- ⚠️  API converts to `dob` (date of birth) with calculation: `birthYear = currentYear - age`
- ⚠️  Assumes January 1st birthday: `dob = "${birthYear}-01-01"`
- ⚠️  This is **inaccurate** - should collect actual date of birth instead

---

### 3. PARENT CREATION FORM

**Need to audit** - location TBD in SchoolDashboard.tsx

---

## 🚨 CRITICAL BUG DISCOVERED

**Location**: `frontend/app/api/school/create-student/route.ts` (lines 180-188)

```javascript
// 4. Store credentials for school admin
await supabaseAdmin
  .from('user_credentials')  // ❌ TABLE DOESN'T EXIST!
  .insert({
    user_id: authData.user.id,
    school_id: schoolId,
    email: email,
    password: tempPassword,
    role: 'student'
  });
```

**Problem**: The API attempts to insert into `user_credentials` table which **DOES NOT EXIST** in the database schema!

**Impact**: This insert likely fails silently or throws an error that's being swallowed.

---

## 🎯 REQUIRED FIXES

### Priority 1: Remove Unused Fields from UI Forms

#### Teacher Form - Remove These Fields:
- ❌ Remove `phone` input
- ❌ Remove `subject` input
- ❌ Remove `qualification` input
- ❌ Remove `experience` input
- ❌ Remove `address` input
- ✅ Keep: name, email, bio, classIds

#### Student Form - Fix These Issues:
- ❌ Remove `grade` input
- ❌ Remove `address` input
- ❌ Remove `phone` input
- ❌ Remove `parent` input
- ⚠️  **CRITICAL**: Replace `age` field with actual `Date of Birth` picker
- ✅ Keep: name, email, dob (date picker), gender

#### Parent Form - Audit Needed:
- Need to check what fields parent form collects
- Compare with `parents` table schema
- Remove any unnecessary fields

### Priority 2: Fix API Endpoint Bug

**File**: `frontend/app/api/school/create-student/route.ts`

**Remove lines 180-188** (user_credentials insert):
```javascript
// DELETE THIS ENTIRE BLOCK - TABLE DOESN'T EXIST
await supabaseAdmin
  .from('user_credentials')
  .insert({...});
```

### Priority 3: Improve Data Quality

**Student DOB Collection**:
- Replace age number input with proper date picker
- Store actual date of birth, not calculated approximation
- Remove the age → dob conversion logic

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Documentation & Audit
- [x] Read database schema
- [x] Read seed workflows
- [x] Compare UI forms with database
- [x] Document all mismatches
- [ ] Audit parent form
- [ ] Audit all other forms (homework, assignments, targets, messages)

### Phase 2: Fix Critical Bugs
- [ ] Remove user_credentials insert from create-student API
- [ ] Test student creation works without this insert
- [ ] Verify no errors in logs

### Phase 3: Fix Teacher Form UI
- [ ] Remove phone, subject, qualification, experience, address fields from UI
- [ ] Simplify form to only: name, email, bio, assign classes
- [ ] Update form validation
- [ ] Test teacher creation

### Phase 4: Fix Student Form UI
- [ ] Remove grade, address, phone, parent fields from UI
- [ ] Replace age number input with Date of Birth date picker
- [ ] Remove age → dob conversion from API
- [ ] Use actual dob value from form
- [ ] Update form validation
- [ ] Test student creation

### Phase 5: Audit & Fix Remaining Forms
- [ ] Check parent form
- [ ] Check homework creation
- [ ] Check assignment creation
- [ ] Check target creation
- [ ] Check message creation
- [ ] Fix any mismatches found

### Phase 6: Testing & Validation
- [ ] Test all form submissions
- [ ] Verify data appears correctly in database
- [ ] Check for any console errors
- [ ] Verify UI is cleaner and more user-friendly

---

## 📁 FILES REQUIRING CHANGES

### API Endpoints (Remove dead code):
1. `frontend/app/api/school/create-student/route.ts` - Remove user_credentials insert (lines 180-188)

### UI Forms (Remove unnecessary fields):
1. `frontend/components/dashboard/SchoolDashboard.tsx` - Teacher form section
2. `frontend/components/dashboard/SchoolDashboard.tsx` - Student form section
3. `frontend/components/dashboard/SchoolDashboard.tsx` - Parent form section (TBD)

### UI Components (Add date picker):
1. Need to add proper DatePicker component for student DOB
2. Replace age number input with date picker

---

## ✅ SUCCESS CRITERIA

- [ ] UI forms only collect fields that exist in database
- [ ] No fields are collected and then ignored by API
- [ ] Student DOB collected as actual date, not approximated from age
- [ ] All API endpoints work without errors
- [ ] User experience is cleaner with fewer unnecessary fields
- [ ] All changes documented in memory and claudedocs

---

## 🧠 MEMORY STORAGE

All findings stored in memory entity: "Database Schema Audit"

**Key Observations**:
- Old SQLite seed schema vs new PostgreSQL schema mismatch
- UI built on outdated schema expectations
- Multiple unused fields being collected
- Critical bug: user_credentials table doesn't exist
- Need systematic alignment of UI with actual database

---

*Report Generated: October 23, 2025*
*Report Type: Schema Mismatch Audit*
*Next Steps: Begin Phase 2 - Fix Critical Bugs*
