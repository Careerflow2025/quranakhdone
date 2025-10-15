# QuranAkh Backend API

Express.js backend for the QuranAkh assignment gradebook PWA system.

## Features

- **JWT Authentication** with role-based access control
- **SQLite Database** using better-sqlite3 for synchronous operations
- **File Upload System** with multer for voice notes and attachments
- **Socket.IO** for real-time updates and notifications
- **Role-based Permissions** (owner, admin, teacher, student, parent)
- **Assignment Lifecycle Management** with status transitions
- **Quran Highlights System** with mistake tracking
- **Gradebook & Rubrics** for assessment

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **File Uploads**: Multer
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info

### Schools Management
- `GET /schools/my` - Get current user's school info
- `PUT /schools/my` - Update school (admin/owner only)
- `GET /schools/my/users` - Get school users (admin/owner only)
- `POST /schools/my/users` - Create new school user (admin/owner only)
- `GET /schools/my/stats` - Get school statistics (admin/owner only)

### Highlights & Notes
- `GET /highlights` - Get highlights with filtering
- `GET /highlights/:id` - Get specific highlight with notes
- `POST /highlights` - Create new highlight (teachers only)
- `PUT /highlights/:id` - Update highlight
- `DELETE /highlights/:id` - Delete highlight
- `POST /highlights/:id/notes` - Add note to highlight

### Assignments
- `GET /assignments` - Get assignments with filtering
- `GET /assignments/:id` - Get specific assignment with details
- `POST /assignments` - Create new assignment (teachers only)
- `PUT /assignments/:id` - Update assignment
- `POST /assignments/:id/transition` - Change assignment status
- `POST /assignments/:id/submit` - Submit assignment (students only)
- `POST /assignments/:id/grade` - Grade assignment (teachers only)
- `DELETE /assignments/:id` - Delete assignment

### File Uploads
- `POST /uploads/voice-note` - Upload voice note (teachers only)
- `POST /uploads/assignment-attachments` - Upload assignment attachments
- `POST /uploads/profile-image` - Upload profile image
- `POST /uploads/school-logo` - Upload school logo (admin/owner only)
- `DELETE /uploads/:type/:filename` - Delete uploaded file
- `GET /uploads/info/:type/:filename` - Get file information

### System
- `GET /health` - Health check endpoint
- `GET /api-docs` - API documentation

## User Roles & Permissions

### Owner
- Full control over their school
- Can manage all users, assignments, and highlights
- Can update school settings and logo

### Admin
- School administration capabilities
- Can manage users and view all data within school
- Cannot delete the school or change ownership

### Teacher
- Can create and manage assignments for their students
- Can create highlights and notes for student work
- Can upload voice notes for feedback
- Can grade assignments using rubrics

### Student
- Can view their own assignments and highlights
- Can submit assignments with attachments
- Can see teacher feedback and voice notes
- Read-only access to their highlights

### Parent
- Read-only access to their children's data
- Can view assignments, highlights, and grades
- Receives notifications about child's progress

## Database Schema

The system uses SQLite with the following main tables:

- `schools` - Multi-tenant school information
- `profiles` - User accounts linked to auth system
- `teachers`, `students`, `parents` - Role-specific data
- `classes`, `class_enrollments`, `class_teachers` - Class management
- `quran_scripts`, `quran_ayahs` - Quran text data
- `highlights`, `notes` - Quran highlight system
- `assignments`, `assignment_events` - Assignment lifecycle
- `rubrics`, `grades` - Assessment system

## Real-time Features (Socket.IO)

The system supports real-time updates through Socket.IO:

### Client Events
- `highlight_updated` - Broadcast highlight changes
- `assignment_status_changed` - Notify status transitions
- `voice_note_uploaded` - Real-time feedback notifications
- `typing_start/stop` - Typing indicators
- `user_active` - Presence updates

### Server Events
- `highlight_created/updated/deleted` - Highlight notifications
- `new_assignment` - Assignment notifications
- `new_voice_note` - Teacher feedback notifications
- `user_online/offline` - User presence updates

## File Upload Structure

Files are organized by school and user:

```
uploads/
├── voice-notes/{school_id}/{teacher_id}/{filename}
├── attachments/{school_id}/{user_id}/{filename}
├── profiles/{school_id}/{user_id}/{filename}
└── school-logos/{school_id}/{filename}
```

## Security Features

- **JWT Authentication** with refresh token rotation
- **Rate Limiting** on all endpoints (stricter on auth)
- **CORS Protection** with whitelist
- **Helmet Security Headers**
- **File Upload Validation** (type, size limits)
- **Role-based Access Control** on all resources
- **School Data Isolation** (users only see their school's data)

## Development

### Project Structure
```
backend/
├── config/          # Database configuration
├── middleware/      # Auth and role checking middleware
├── routes/          # API route handlers
├── utils/           # JWT utilities and helpers
├── uploads/         # File upload storage
├── db/             # SQLite database files
└── server.js       # Main application entry point
```

### Key Files
- `server.js` - Main Express app with Socket.IO
- `config/database.js` - SQLite setup and schema
- `middleware/auth.js` - JWT authentication
- `middleware/roleCheck.js` - Role-based permissions
- `utils/jwt.js` - JWT token management

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use strong JWT secret (32+ random characters)
3. Configure proper CORS origins
4. Set up reverse proxy (nginx) for static file serving
5. Enable HTTPS
6. Set up log rotation
7. Configure process manager (PM2)

## License

MIT License - see LICENSE file for details.