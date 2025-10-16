# 🚀 QuranAkh Backend Setup Guide
**Complete Database & Infrastructure Setup**

**Project**: QuranAkh Production
**Database**: rlfvubgyogkkqbjjmjwd (East US)
**Created**: October 16, 2025

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Storage Buckets Setup](#storage-buckets-setup)
4. [Authentication Configuration](#authentication-configuration)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🔧 Prerequisites

### Required Accounts:
- ✅ Supabase Account (already created)
- ⏳ Resend Account (for emails) - [Sign up](https://resend.com)
- ✅ GitHub Repository

### Required Tools:
```bash
# Install Node.js (v18+ recommended)
node --version  # Should be v18 or higher

# Install npm packages (already done)
cd frontend && npm install
cd ../backend && npm install
```

---

## 🗄️ Database Setup

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project: **rlfvubgyogkkqbjjmjwd** (East US)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute Database Schema

**File Location**: `supabase/migrations/20251016000001_complete_production_schema.sql`

#### Option A: Via Supabase Dashboard (Recommended)

1. Open SQL Editor in Supabase Dashboard
2. Click **New Query**
3. Copy the entire contents of `20251016000001_complete_production_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for completion (should take 10-30 seconds)
7. You should see: "Success. No rows returned"

#### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed
cd C:\quranakhfinalproduction
npx supabase db push

# Or execute specific migration
psql "postgresql://postgres:vQAZjPh54Hnp_$#@db.rlfvubgyogkkqbjjmjwd.supabase.co:5432/postgres" -f supabase/migrations/20251016000001_complete_production_schema.sql
```

### Step 3: Apply Row Level Security Policies

**File Location**: `supabase/migrations/20251016000002_rls_policies.sql`

1. In SQL Editor, click **New Query**
2. Copy contents of `20251016000002_rls_policies.sql`
3. Paste and **Run**
4. Wait for completion

### Step 4: Verify Database Setup

Run this verification query:

```sql
-- Verify all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 35+ tables including:
-- schools, profiles, teachers, students, parents
-- classes, attendance, highlights, notes
-- assignments, homework, targets, messages, etc.

-- Verify Quran scripts were seeded
SELECT * FROM quran_scripts;

-- Should return 6 scripts:
-- uthmani-hafs, warsh, qaloon, al-duri, al-bazzi, qunbul

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Should show all tables with RLS enabled
```

---

## 📦 Storage Buckets Setup

### Required Buckets:

1. **voice-notes** - For teacher voice notes (5MB max)
2. **attachments** - For assignment file uploads
3. **school-logos** - For school branding

### Setup Steps:

1. In Supabase Dashboard, go to **Storage**
2. Click **Create a new bucket**

#### Bucket 1: voice-notes

```yaml
Name: voice-notes
Public: false (private)
File size limit: 5MB
Allowed MIME types: audio/m4a, audio/mp3, audio/wav, audio/webm
```

**RLS Policy for voice-notes:**

```sql
-- Teachers can upload voice notes
CREATE POLICY "teachers_upload_voice_notes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = auth.uid()
  )
);

-- Students and parents can view assigned voice notes
CREATE POLICY "view_assigned_voice_notes" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'voice-notes' AND (
    -- Teacher who uploaded
    owner = auth.uid() OR
    -- Student who received
    EXISTS (
      SELECT 1 FROM notes n
      JOIN highlights h ON h.id = n.highlight_id
      JOIN students s ON s.id = h.student_id
      WHERE s.user_id = auth.uid()
      AND n.audio_url LIKE '%' || name || '%'
    ) OR
    -- Parent of student
    EXISTS (
      SELECT 1 FROM notes n
      JOIN highlights h ON h.id = n.highlight_id
      JOIN students s ON s.id = h.student_id
      JOIN parent_students ps ON ps.student_id = s.id
      JOIN parents p ON p.id = ps.parent_id
      WHERE p.user_id = auth.uid()
      AND n.audio_url LIKE '%' || name || '%'
    )
  )
);
```

#### Bucket 2: attachments

```yaml
Name: attachments
Public: false (private)
File size limit: 10MB
Allowed MIME types: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**RLS Policy for attachments:**

```sql
-- Teachers and students can upload attachments
CREATE POLICY "upload_attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (
    EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid())
  )
);

-- View attachments you uploaded or that are assigned to you
CREATE POLICY "view_relevant_attachments" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments' AND (
    owner = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignment_attachments aa
      JOIN assignments a ON a.id = aa.assignment_id
      JOIN students s ON s.id = a.student_id
      WHERE s.user_id = auth.uid()
      AND aa.url LIKE '%' || name || '%'
    )
  )
);
```

#### Bucket 3: school-logos

```yaml
Name: school-logos
Public: true
File size limit: 2MB
Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml
```

**RLS Policy for school-logos:**

```sql
-- Only school owners/admins can upload logos
CREATE POLICY "upload_school_logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'school-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Anyone can view school logos (public bucket)
CREATE POLICY "view_school_logos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'school-logos');
```

---

## 🔐 Authentication Configuration

### Email Templates Setup

1. Go to **Authentication** → **Email Templates** in Supabase Dashboard

2. Configure templates:

#### Confirmation Email (Account Creation)
```html
<h2>Welcome to QuranAkh!</h2>
<p>Your school has created an account for you.</p>
<p><strong>Email:</strong> {{ .Email }}</p>
<p>Click below to confirm your email and set up your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### Password Reset
```html
<h2>Reset your password</h2>
<p>Someone requested a password reset for your QuranAkh account.</p>
<p>Click below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### Authentication Settings

Go to **Authentication** → **Settings**:

```yaml
Site URL: http://localhost:3000 (development)
          https://your-domain.com (production)

Redirect URLs:
  - http://localhost:3000/**
  - https://your-domain.com/**

Email Auth: Enabled
Email Confirmations: Required
Secure Email Change: Enabled
```

---

## 🔑 Environment Variables

### Frontend (.env.local)

Already configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rlfvubgyogkkqbjjmjwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)

Already configured with:
```env
SUPABASE_URL=https://rlfvubgyogkkqbjjmjwd.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres.rlfvubgyogkkqbjjmjwd:...
```

### Additional: Resend API (Email Service)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to both .env files:
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@quranakh.com
```

4. Verify domain (if using custom domain):
   - Add DNS records as instructed by Resend
   - Verify in Resend dashboard

---

## ✅ Testing

### Test 1: Database Connection

```bash
cd frontend
npm run dev
```

Open browser console and check for Supabase connection errors.

### Test 2: Create Test School

Run this in Supabase SQL Editor:

```sql
-- Create test school
INSERT INTO schools (name, timezone)
VALUES ('Test Academy', 'America/New_York')
RETURNING *;

-- Note the returned ID for next steps
```

### Test 3: Create Test Admin User

```sql
-- First create auth user via Supabase Dashboard:
-- Authentication → Users → Add User
-- Email: admin@testacademy.com
-- Password: TestPassword123!
-- Auto-confirm: Yes

-- Then create profile (replace user_id with the one from auth.users)
INSERT INTO profiles (user_id, school_id, role, display_name, email)
VALUES (
  'user-uuid-from-auth-users',
  'school-uuid-from-previous-step',
  'owner',
  'Test Admin',
  'admin@testacademy.com'
);
```

### Test 4: Login Test

1. Go to http://localhost:3000
2. Login with admin@testacademy.com / TestPassword123!
3. Should redirect to School Dashboard
4. Check browser console for errors

---

## 🚀 Deployment

### Netlify Deployment

1. **Push to GitHub** (see next section)

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click **Add new site** → **Import an existing project**
   - Select GitHub and your repository
   - Choose **main** branch

3. **Build Settings:**
   ```yaml
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/.next
   ```

4. **Environment Variables:**
   In Netlify Dashboard → Site Settings → Environment Variables, add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://rlfvubgyogkkqbjjmjwd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RESEND_API_KEY=your-resend-key
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   ```

5. **Deploy:**
   - Click **Deploy site**
   - Wait for build to complete (3-5 minutes)
   - Visit your site URL

6. **Custom Domain** (Optional):
   - Go to **Domain settings**
   - Click **Add custom domain**
   - Add quranakh.com
   - Follow DNS configuration instructions

### Supabase Production Settings

Update in Supabase Dashboard:

1. **Authentication** → **URL Configuration:**
   ```
   Site URL: https://your-domain.com
   Redirect URLs: https://your-domain.com/**
   ```

2. **API Settings:**
   - Enable CORS for your domain
   - Add to allowed origins

---

## 🔒 Security Checklist

Before going live:

- [ ] All RLS policies are enabled and tested
- [ ] Environment variables are set in Netlify (not in code)
- [ ] .env and .env.local are in .gitignore
- [ ] Database password is strong and unique
- [ ] API keys are rotated from defaults
- [ ] Email verification is required
- [ ] Storage buckets have proper RLS policies
- [ ] HTTPS is enforced (automatic with Netlify)
- [ ] CORS is properly configured
- [ ] Test accounts are removed from production database

---

## 📞 Support

If you encounter issues:

1. Check Supabase Dashboard → **Logs** for errors
2. Check browser console for client-side errors
3. Verify environment variables are correct
4. Test database connection with verification queries
5. Check RLS policies are not blocking legitimate access

---

## 📝 Next Steps for Beta Testing

1. ✅ Complete database setup (this guide)
2. ✅ Configure storage buckets
3. ⏳ Create 5-10 test users (different roles)
4. ⏳ Test all major workflows
5. ⏳ Deploy to Netlify
6. ⏳ Invite beta testers
7. ⏳ Collect feedback
8. ⏳ Fix bugs and iterate

---

**Last Updated**: October 16, 2025
**Status**: Ready for database setup
**Next**: Execute SQL migrations in Supabase Dashboard
