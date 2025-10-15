# QURANAKH PROJECT BIBLE - COMPLETE SYSTEM DOCUMENTATION
**IMPORTANT: Update this file with EVERY feature. I read this FIRST in every conversation!**

## 🎯 SYSTEM OVERVIEW
QuranAkh is a complete School Management System for Quran education with:
- Multi-tenant architecture (many schools)
- 4 Role-based dashboards
- Real-time tracking
- Offline PWA support

## 👥 USER ROLES & PERMISSIONS

### 1. SCHOOL (Admin)
**Can Do Everything:**
- Add/edit/delete all users (students, teachers, parents)
- View all dashboards
- See all data
- Manage credentials
- View all reports
- Reset passwords
- Manage school settings
- View all assignments/homework/attendance

**CANNOT Do:**
- Create homework (only teachers)
- Submit assignments (only students)
- Grade submissions (only teachers)

### 2. TEACHER
**Can Do:**
- Create/edit/delete homework assignments
- Create Quran memorization targets
- Mark attendance
- Grade student submissions
- Add highlights/mistakes to Quran
- Send messages to students/parents
- View their classes only

**CANNOT Do:**
- Add new users
- View other teachers' classes
- Change passwords
- Access school settings

### 3. STUDENT
**Can Do:**
- View assigned homework
- Submit assignments
- View their grades
- View their attendance
- View Quran with their highlights
- Message their teacher

**CANNOT Do:**
- Create assignments
- View other students' data
- Change their password
- Add new users

### 4. PARENT
**Can Do (READ ONLY):**
- View their children's homework
- View their children's grades
- View their children's attendance
- View their children's Quran progress
- Message teachers

**CANNOT Do:**
- Submit for children
- Change any data
- Add users

## 📖 QURAN SYSTEM

### 6 Versions/Scripts:
1. **Uthmani** - Original Arabic script
2. **Imla'ei** - Simplified Arabic
3. **Indopak** - Indo-Pakistani script
4. **Turkish** - Turkish pronunciation
5. **English Transliteration**
6. **Farsi** - Persian script

### Highlighting System:
- Teachers highlight student mistakes
- 4 mistake types: Tajweed (orange), Haraka (red), Letter (brown), Recap (purple)
- Mistakes saved by: surah, ayah, word position
- Students see their mistakes
- Parents see children's mistakes

### Memorization Tracking:
- Track per surah/ayah
- Status: Not Started → In Progress → Memorized → Revision
- Set targets with deadlines
- Progress visualization

## 📚 HOMEWORK vs ASSIGNMENTS vs TARGETS

### HOMEWORK (Quran Specific):
- Created by: TEACHER ONLY
- Type: Memorization or Revision
- Content: Surah X, Ayah Y to Z
- Student records audio/video
- Teacher reviews and highlights mistakes

### ASSIGNMENTS (General):
- Created by: TEACHER ONLY
- Type: Written work, worksheets, projects
- Can attach files
- Text submissions
- Graded with points/percentage

### TARGETS (Goals):
- Created by: TEACHER ONLY
- Long-term memorization goals
- Example: "Memorize Juz 30 by end of term"
- Tracks progress over time
- Milestone based

## 💬 MESSAGING/NODE SYSTEM

### Node = Conversation Thread
- Each message creates a node
- Replies stay in same node
- Like WhatsApp conversations
- Teacher ↔ Student
- Teacher ↔ Parent
- School ↔ Everyone

## 📊 REPORTS NEEDED

### School Dashboard Shows:
- Total students/teachers/parents/classes
- Overall attendance rate
- Assignment completion rate
- Memorization progress (school-wide)
- Calendar events
- Recent activities
- Financial summary (if enabled)

### Teacher Dashboard Shows:
- Their classes
- Their students
- Homework to review
- Attendance to mark
- Messages
- Calendar
- Their performance metrics

### Student Dashboard Shows:
- Pending homework
- Grades
- Attendance record
- Quran progress
- Messages from teacher
- Calendar events
- Achievements

### Parent Dashboard Shows:
- Each child's homework
- Each child's grades
- Each child's attendance
- Each child's Quran progress
- Teacher messages
- School announcements

## 🔐 CREDENTIALS SYSTEM
- Auto-generates when user created
- Sends email automatically
- Only school can reset passwords
- No self-service password reset
- Passwords are permanent until school changes

## 📅 CALENDAR SYSTEM
- School creates events
- Teachers see all events
- Students see relevant events
- Parents see children's events
- Color coded by type

## 📈 ATTENDANCE
- Marked by: TEACHER ONLY
- States: Present, Absent, Late, Excused
- Tracked per class session
- Reports show percentage

## 🏆 GRADING SYSTEM
- 0-100 scale
- Letter grades (A-F)
- Pass/Fail threshold configurable
- GPA calculation
- Progress reports

## 📱 PWA FEATURES
- Works offline
- Caches Quran text
- Syncs when online
- Install as app
- Push notifications

## 🗄️ DATABASE TABLES NEEDED
1. schools
2. profiles (users)
3. students
4. teachers
5. parents
6. parent_students (link table)
7. classes
8. class_teachers
9. class_enrollments
10. quran_scripts
11. quran_surahs
12. quran_ayahs
13. highlights
14. highlight_notes
15. homework (Quran)
16. assignments (general)
17. targets
18. submissions
19. grades
20. attendance
21. messages
22. message_nodes
23. calendar_events
24. credentials
25. notifications
26. activity_logs
27. school_settings
28. academic_terms
29. grade_scales
30. achievements

## 🔴 CRITICAL RULES
1. ONLY teachers create homework/assignments (NOT school)
2. Parents are READ-ONLY
3. Students CANNOT change passwords
4. Each school's data is isolated
5. Credentials auto-generate on user creation
6. All dates/times in school's timezone

## 🎨 UI ELEMENTS THAT MUST EXIST
- Dashboard with stats cards
- Data tables with search/filter
- Calendar view
- Kanban board for assignments
- Progress charts
- Quran reader with highlighting
- Messaging interface
- Profile pages
- Settings panels
- Report generators

## ⚠️ COMMON MISTAKES TO AVOID
- Don't let school create homework
- Don't let students grade themselves
- Don't let parents edit anything
- Don't mix schools' data
- Don't forget foreign key constraints
- Don't create empty sections
- Don't use mock data in production

## 🚀 DEPLOYMENT REQUIREMENTS
- Supabase for backend
- Next.js for frontend
- Edge functions for emails
- Resend for email service
- PostgreSQL with RLS
- Real-time subscriptions

---
**UPDATE THIS FILE WHENEVER WE ADD/CHANGE FEATURES**