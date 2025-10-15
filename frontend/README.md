# QuranAkh Frontend

A modern Next.js 14 frontend for the QuranAkh digital Quran learning platform with complete TypeScript support.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student, Parent)
- Protected routes with automatic redirects
- Session management with automatic token refresh

### 📱 Progressive Web App (PWA)
- Offline support with service worker
- Installation prompts for mobile and desktop
- Optimized for mobile devices
- Push notifications ready

### 📖 Quran Viewer
- **Text selection and highlighting** with 4 mistake types:
  - 🟣 Purple: Recap needed
  - 🟠 Orange: Tajweed rules
  - 🔴 Red: Haraka (vowel marks)
  - 🟤 Brown: Letter pronunciation
- Real-time highlighting updates via Socket.io
- Voice note recording and playback
- Multi-script support (Uthmani Hafs, Warsh, etc.)

### 🎯 Role-Based Dashboards

#### Admin Dashboard
- School-wide statistics and analytics
- User management (students, teachers, parents)
- Class management and enrollment
- System configuration

#### Teacher Dashboard
- Interactive Quran teaching interface
- Student progress monitoring
- Assignment creation and management
- Voice note feedback system
- Real-time highlighting for student corrections

#### Student Dashboard
- Personal assignment tracking
- Quran reading with teacher highlights
- Progress visualization
- Performance analytics

#### Parent Dashboard
- Children's progress monitoring
- Communication with teachers
- Academic performance overview
- Schedule and calendar integration

### ⚡ Real-time Features
- Live highlighting updates
- Assignment status changes
- Notification system
- Multi-user collaboration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components  
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios
- **Authentication**: JWT with localStorage persistence
- **PWA**: Service Worker with offline support

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- QuranAkh Backend API running on `http://localhost:5000`

### Installation

1. **Clone and navigate**:
   ```bash
   cd /path/to/quranakh/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:5000` (backend must be running)

## Project Structure

```
frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                  # Auth route group
│   ├── admin/                   # Admin dashboard routes
│   ├── teacher/                 # Teacher dashboard routes  
│   ├── student/                 # Student dashboard routes
│   ├── parent/                  # Parent dashboard routes
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing/login page
│   └── providers.tsx           # App providers (Query, Toast)
│
├── components/                  # Reusable components
│   ├── ui/                     # Shadcn/ui base components
│   ├── auth/                   # Authentication components
│   ├── quran/                  # Quran viewer components
│   └── dashboard/              # Dashboard components
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts             # Authentication hook
│   ├── useSocket.ts           # Socket.io hook
│   └── useQuran.ts            # Quran data hook
│
├── lib/                       # Utility libraries
│   ├── api.ts                # Axios client and API endpoints
│   ├── auth.ts               # JWT handling utilities
│   ├── socket.ts             # Socket.io client
│   └── utils.ts              # General utilities
│
├── store/                     # Zustand state stores
│   ├── authStore.ts          # Authentication state
│   ├── highlightStore.ts     # Highlights state
│   └── assignmentStore.ts    # Assignment state
│
├── types/                     # TypeScript type definitions
│   └── index.ts              # All type definitions
│
└── public/                    # Static assets
    ├── manifest.json          # PWA manifest
    └── icons/                 # PWA icons
```

## Key Components

### Quran Viewer (`components/quran/QuranViewer.tsx`)
The core component for interactive Quran reading and teaching:
- Text selection for highlighting
- Real-time highlight rendering  
- Voice note integration
- Teacher/student mode switching

### Highlight Popover (`components/quran/HighlightPopover.tsx`)
Modal for creating highlights with mistake type selection and optional notes.

### Voice Note Recorder (`components/quran/VoiceNoteRecorder.tsx`)
Audio recording component for teacher feedback with:
- Recording controls
- Audio playback
- File upload to backend

### Dashboard Components
Role-specific dashboard layouts with:
- Statistics and analytics
- Quick actions
- Recent activity
- Navigation menus

## Authentication Flow

1. **Login**: User enters credentials on landing page
2. **JWT Storage**: Token stored in localStorage with user profile
3. **Route Protection**: `ProtectedRoute` component validates access
4. **Role Redirection**: Users redirected to appropriate dashboard
5. **Auto-refresh**: Token refreshed automatically when needed
6. **Logout**: Clears all auth data and redirects to login

## Highlighting System

### Teacher Workflow:
1. Select student from dropdown
2. Navigate to desired Quran passage
3. Select text with mouse
4. Choose mistake type (Recap, Tajweed, Haraka, Letter)  
5. Optional: Add text note
6. Save highlight

### Student Experience:
1. Open Quran reader
2. View highlighted text with color coding
3. See teacher notes and voice feedback
4. Practice corrected sections

## Real-time Updates

The app uses Socket.io for real-time features:
- **Highlight Creation**: Teachers create highlights, students see immediately
- **Assignment Updates**: Status changes propagated to all relevant users
- **Voice Notes**: New audio feedback appears in real-time

## API Integration

All API calls use a centralized Axios client (`lib/api.ts`) with:
- Automatic JWT token attachment
- Error handling and retry logic
- Request/response interceptors
- Endpoint organization by feature

## State Management

Zustand stores handle different aspects of app state:
- **authStore**: User authentication and profile data
- **highlightStore**: Quran highlights and notes
- **assignmentStore**: Assignment lifecycle management

## Responsive Design

- Mobile-first design approach
- Responsive layouts for all screen sizes
- Touch-friendly interface for tablets
- PWA installation on mobile devices

## Building for Production

```bash
# Build the application
npm run build

# Start production server  
npm start

# Build with static export (optional)
npm run build && npm run export
```

## PWA Features

- **Offline Support**: Core functionality available offline
- **Installation**: Add to home screen on mobile/desktop
- **Background Sync**: Updates when connection restored
- **Push Notifications**: Real-time alerts (when configured)

## Browser Support

- Modern browsers with ES2019+ support
- Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- Mobile Safari and Chrome on iOS/Android

## Contributing

1. Follow TypeScript strict mode
2. Use existing component patterns
3. Maintain responsive design
4. Test authentication flows
5. Ensure PWA compatibility

## Security Considerations

- JWT tokens in localStorage (consider httpOnly cookies for production)
- Input sanitization on all forms
- XSS protection via React's built-in escaping
- CSRF protection via custom headers
- Role-based access control on all routes

## Performance Optimization

- Next.js automatic code splitting
- Image optimization with Next.js Image
- React Query caching for API calls
- Component lazy loading
- Service worker asset caching

## Deployment

The frontend can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify** 
- **AWS S3 + CloudFront**
- **Digital Ocean App Platform**
- **Traditional web servers** (with Node.js)

Ensure environment variables are configured in your deployment platform.