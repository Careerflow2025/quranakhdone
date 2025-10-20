# Claude Session Context - Supabase MCP Setup

## Current Status: AWAITING RESTART TO ACTIVATE SUPABASE MCP

### What We've Accomplished (Session: 2025-10-19)

1. ✅ **Identified Connection Issue**
   - Supabase MCP was not properly configured
   - Region mismatch error was appearing (us-east-1 was correct, but connection method was wrong)

2. ✅ **Set Environment Variables** (Windows System-wide)
   ```
   SUPABASE_PROJECT_REF=rlfvubgyogkkqbjjmjwd
   SUPABASE_REGION=us-east-1
   SUPABASE_URL=https://rlfvubgyogkkqbjjmjwd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU2OTk2OSwiZXhwIjoyMDc2MTQ1OTY5fQ.dtbMQ2c0erz6yPx3dt7T7HBw89z2T6wF6CeMrkTqDrI
   ```

3. ✅ **Updated MCP Configuration**
   - File: `C:/Users/Locum Meds/.claude/claude_desktop_config.json`
   - Added Supabase MCP server with cloud-hosted URL:
   ```json
   "supabase": {
     "url": "https://mcp.supabase.com/mcp?project_ref=rlfvubgyogkkqbjjmjwd&features=database"
   }
   ```

### Project Details

**Project**: QuranAkh - Multi-tenant Quran learning platform
- **Database**: Supabase PostgreSQL
- **Region**: East US (North Virginia) - us-east-1
- **Project Ref**: rlfvubgyogkkqbjjmjwd
- **Stack**: Next.js + Tailwind + Supabase

### Database Schema Status

**Current State**: Unknown - need to check after MCP connection is active

**Expected Tables** (from CLAUDE.md):
- schools, profiles, teachers, students, parents, parent_students
- classes, class_teachers, class_enrollments, attendance
- quran_scripts, quran_ayahs
- highlights, notes
- assignments, assignment_events, assignment_submissions, assignment_attachments
- rubrics, rubric_criteria, assignment_rubrics, grades
- ayah_mastery
- notifications, devices

### What Happens After Restart

1. **Immediate Test**: Run `mcp__supabase__get_schemas` to confirm connection
2. **Database Audit**: Check current tables and schema state
3. **Compare Against Spec**: Verify against CLAUDE.md schema requirements
4. **Next Steps**: Based on audit results, either:
   - Create missing tables/migrations
   - Fix existing schema issues
   - Set up RLS policies
   - Implement assignment lifecycle
   - Build dashboard components

### Important Context

- **User Issue**: Wants full database access to manage QuranAkh schema
- **User is Admin**: Has service role key, can manage everything
- **Production Database**: Be careful with destructive operations
- **Migration Strategy**: User has deleted old migrations, starting fresh

### Files to Reference

1. `C:/Users/Locum Meds/.claude/CLAUDE.md` - Complete project spec
2. `C:/quranakhfinalproduction/.claude/settings.local.json` - Permissions
3. Git status shows many deleted migrations - user cleaned up old attempts

### First Actions After Restart

```
1. Test connection: mcp__supabase__get_schemas
2. List all tables: mcp__supabase__get_tables (for each schema)
3. Compare with spec in CLAUDE.md
4. Present user with current state vs desired state
5. Ask user what they want to do next
```

### User Permissions Already Granted

- mcp__supabase__live_dangerously
- mcp__supabase__execute_postgresql
- mcp__supabase__get_schemas
- Full database access capabilities

### Critical Notes

- **DO NOT** assume database is empty - check first
- **DO NOT** drop tables without explicit user confirmation
- **DO** use RLS policies as per spec
- **DO** follow multi-tenant isolation pattern (school_id on all tables)
- **DO** remember this is a production database for a real application

---

**When I restart, my first message should be:**
"Welcome back! Let me test the Supabase MCP connection and show you the current state of your database..."
