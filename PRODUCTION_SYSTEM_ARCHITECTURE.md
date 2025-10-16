# QuranAkh Production System Architecture

## 🏗️ System Overview

**QuranAkh** is a comprehensive multi-tenant Learning Management System (LMS) specifically designed for Quran education. The system supports multiple schools, each with complete isolation of their data while sharing the same infrastructure.

## 🌐 Multi-Tenant Architecture

### Database Level (Supabase)
- **Row Level Security (RLS)**: Every table has `school_id` column
- **Automatic Filtering**: Users only see data from their own school
- **Complete Data Isolation**: No cross-school data leakage

### Application Level
- **School Context**: Set on user login via profile lookup
- **API Filtering**: All API calls automatically include school_id
- **Real-time Subscriptions**: Filtered by school and user permissions

## 👥 User Roles & Dashboards

### 1. **School Admin Dashboard** (`/school`)
**File**: `SchoolDashboard.tsx`
**Features**:
- Complete school management
- User management (teachers, students, parents)
- Class creation and scheduling
- Performance analytics and reports
- Billing and subscription management
- School settings and configuration
- Bulk student import/export

### 2. **Teacher Dashboard** (`/teacher`)
**File**: `TeacherDashboard.tsx`
**Features**:
- Assignment creation and management
- Student progress tracking
- Quran highlighting and mistake tracking
- Voice note recording for feedback
- Class attendance management
- Gradebook with rubrics
- Parent communication
- Homework scheduling

### 3. **Student Dashboard** (`/student`)
**File**: `StudentDashboard.tsx`
**Features**:
- View and submit assignments
- Practice Quran recitation
- Track personal progress
- View teacher feedback
- Access study materials
- Check homework schedule
- View grades and achievements
- Personal mastery tracking

### 4. **Parent Dashboard** (`/parent`)
**File**: `ParentDashboard.tsx`
**Features**:
- Monitor children's progress
- View assignments and grades
- Track attendance
- Communicate with teachers
- View homework completion
- Access progress reports
- Schedule parent-teacher meetings
- View payment history

### 5. **System Admin Dashboard** (`/admin`)
**File**: `AdminDashboard.tsx`
**Features**:
- Manage multiple schools
- System-wide analytics
- User management across schools
- Billing and subscriptions
- System configuration
- Platform monitoring

## 🔗 API Architecture

### Frontend → Backend Communication

#### Authentication & Authorization
```typescript
// API Client (lib/api.ts)
- JWT token-based authentication
- Automatic token refresh
- Role-based access control
- School context injection

// Supabase Direct Access (lib/supabase.ts)
- Real-time subscriptions
- Direct database queries with RLS
- File storage for voice notes
- Authentication management
```

#### Core API Modules

1. **Authentication API** (`authApi`)
   - Login/Register with school context
   - Profile management
   - Token refresh
   - Logout with cleanup

2. **Assignment API** (`assignmentApi`)
   - CRUD operations for assignments
   - Status transitions (assigned → viewed → submitted → reviewed → completed)
   - File attachments
   - Resubmission support

3. **Highlight API** (`highlightApi`)
   - Mistake tracking on Quran text
   - Color-coded mistake types (tajweed, haraka, letter, recap)
   - Teacher annotations
   - Student progress tracking

4. **Note API** (`noteApi`)
   - Text and voice notes
   - Linked to highlights
   - Teacher feedback system

5. **Quran API** (`quranApi`)
   - Ayah retrieval by surah
   - Multiple script support (Uthmani, Warsh, etc.)
   - Token positioning for highlights

6. **Gradebook API** (`gradebookApi`)
   - Grade management
   - Rubric creation and application
   - Progress analytics
   - Export capabilities

7. **Class Management API** (`classApi`)
   - Class CRUD operations
   - Student enrollment
   - Teacher assignment
   - Schedule management

8. **Student/Teacher APIs** (`studentApi`, `teacherApi`)
   - User management
   - Progress tracking
   - Bulk operations
   - Relationship management

## 🎯 Key Features

### Assignment Lifecycle
```
1. Teacher creates assignment → Status: 'assigned'
2. Student views assignment → Status: 'viewed'
3. Student submits work → Status: 'submitted'
4. Teacher reviews → Status: 'reviewed'
5. Assignment complete → Status: 'completed'
6. Can be reopened → Status: 'reopened'
```

### Quran Learning Features
- **Interactive Text**: Selectable Quran text (not PDF)
- **Mistake Tracking**: Four types with color coding
- **Voice Feedback**: Teachers can record audio notes
- **Per-Ayah Mastery**: Track progress at verse level
- **Multiple Scripts**: Support for different Quranic scripts

### Real-time Features
- **Live Updates**: Assignment status changes
- **Instant Notifications**: In-app alerts
- **Collaborative Highlights**: Teacher-student interaction
- **Attendance Tracking**: Real-time class attendance

### Analytics & Reporting
- **Performance Dashboards**: Visual progress tracking
- **Mastery Heatmaps**: Surah completion visualization
- **Export Reports**: CSV/PDF generation
- **Parent Reports**: Weekly/monthly summaries

## 🔐 Security & Data Isolation

### Multi-Tenant Security
```sql
-- Every table has RLS policies
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Example policy: Users see only their school's data
CREATE POLICY "school_isolation" ON assignments
  FOR ALL USING (school_id = current_user_school_id());
```

### Authentication Flow
1. User logs in with email/password
2. JWT token generated with user_id
3. Profile fetched with school_id and role
4. All subsequent requests include school context
5. RLS policies enforce data isolation

## 📊 Database Schema (Key Tables)

### Core Tables
- `schools` - Multi-tenant school data
- `profiles` - User profiles with roles
- `teachers`, `students`, `parents` - Role-specific data
- `classes` - Class management
- `assignments` - Homework and tasks
- `highlights` - Quran mistake tracking
- `notes` - Feedback system
- `grades` - Gradebook entries
- `attendance` - Class attendance
- `ayah_mastery` - Per-verse progress

### Relationships
```
School ← has many → Users (teachers, students, parents)
Teacher ← teaches → Classes ← enrolled → Students
Teacher ← creates → Assignments ← submitted by → Students
Teacher ← creates → Highlights ← on → Student recitation
Parent ← monitors → Children (Students)
```

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=your_app_url
NODE_ENV=production
```

### Build & Deployment
```bash
# Frontend (Next.js)
cd frontend
npm install
npm run build

# Deployed on Netlify
# Auto-deploys from GitHub main branch
```

### API Endpoints
- Development: `http://localhost:5001`
- Production: `/api` (proxied through Next.js)

## 📱 Progressive Web App (PWA)

### Offline Capabilities
- Cached Quran text
- Offline assignment viewing
- Voice note caching
- Service worker for reliability

### Mobile Features
- Responsive design
- Touch-optimized interfaces
- Mobile-first components
- Push notifications support

## 🎨 UI Components

### Shared Components
- `ClassBuilder` - Visual class creation
- `SchoolModals` - Reusable modal dialogs
- `SchoolProfile` - School information display
- `AdvancedScheduler` - Class scheduling system

### Dashboard Features
- Real-time statistics
- Interactive charts
- Drag-and-drop interfaces
- Bulk operations
- Export capabilities
- Search and filtering
- Pagination

## ✅ Production Readiness

### Completed Features
- ✅ Multi-tenant architecture with RLS
- ✅ Complete authentication system
- ✅ All user role dashboards
- ✅ Assignment lifecycle management
- ✅ Quran learning tools
- ✅ Gradebook and reporting
- ✅ Real-time updates
- ✅ API integration
- ✅ TypeScript strict mode
- ✅ Production build optimization

### System Capabilities
- Supports unlimited schools
- Each school can have unlimited users
- Complete data isolation per school
- Real-time collaboration
- Scalable architecture
- Comprehensive API coverage
- Mobile-responsive design
- PWA support

## 📞 Support & Documentation

For deployment support or questions about the system architecture, refer to the inline documentation in each component or contact the development team.

---

**Version**: 1.0.0
**Last Updated**: October 2024
**Status**: Production Ready