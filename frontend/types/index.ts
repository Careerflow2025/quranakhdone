// Core Types
export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
export type AssignmentStatus = 'assigned' | 'viewed' | 'submitted' | 'reviewed' | 'completed' | 'reopened';
export type MistakeType = 'recap' | 'tajweed' | 'haraka' | 'letter';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type NoteType = 'text' | 'audio';
export type MasteryLevel = 'unknown' | 'learning' | 'proficient' | 'mastered';
export type NotificationChannel = 'in_app' | 'email' | 'push';

// User & Profile Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  school_id: string;
  role: Role;
  display_name: string;
  email: string;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;
  created_at: string;
}

// People Types
export interface Teacher {
  id: string;
  user_id: string;
  bio?: string;
  active: boolean;
  profile?: Profile;
}

export interface Student {
  id: string;
  user_id: string;
  dob?: string;
  gender?: string;
  active: boolean;
  profile?: Profile;
}

export interface Parent {
  id: string;
  user_id: string;
  profile?: Profile;
}

export interface ParentStudent {
  parent_id: string;
  student_id: string;
}

// Classes & Attendance
export interface Class {
  id: string;
  school_id: string;
  name: string;
  room?: string;
  schedule_json: Record<string, any>;
  created_by?: string;
  created_at: string;
  teachers?: Teacher[];
  students?: Student[];
}

export interface Attendance {
  id: string;
  class_id: string;
  session_date: string;
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}

// Quran Types
export interface QuranScript {
  id: string;
  code: string;
  display_name: string;
}

export interface QuranAyah {
  id: string;
  script_id: string;
  surah: number;
  ayah: number;
  text: string;
  token_positions: any[];
}

// Highlights & Notes
export interface Highlight {
  id: string;
  school_id: string;
  teacher_id: string;
  student_id: string;
  script_id: string;
  ayah_id: string;
  token_start: number;
  token_end: number;
  mistake: MistakeType;
  color: string;
  created_at: string;
  notes?: Note[];
  teacher?: Teacher;
  student?: Student;
  ayah?: QuranAyah;
}

export interface Note {
  id: string;
  highlight_id: string;
  author_user_id: string;
  type: NoteType;
  text?: string;
  audio_url?: string;
  created_at: string;
  author?: Profile;
}

// Assignment Types
export interface Assignment {
  id: string;
  school_id: string;
  created_by_teacher_id: string;
  student_id: string;
  title: string;
  description?: string;
  status: AssignmentStatus;
  due_at: string;
  late: boolean;
  reopen_count: number;
  created_at: string;
  teacher?: Teacher;
  student?: Student;
  submissions?: AssignmentSubmission[];
  attachments?: AssignmentAttachment[];
  rubrics?: Rubric[];
}

export interface AssignmentEvent {
  id: string;
  assignment_id: string;
  event_type: string;
  actor_user_id: string;
  from_status?: AssignmentStatus;
  to_status?: AssignmentStatus;
  meta?: Record<string, any>;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  text?: string;
  created_at: string;
}

export interface AssignmentAttachment {
  id: string;
  assignment_id: string;
  uploader_user_id: string;
  url: string;
  mime_type: string;
  created_at: string;
}

// Rubrics & Grades
export interface Rubric {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  criteria?: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  name: string;
  weight: number;
  max_score: number;
}

export interface Grade {
  id: string;
  assignment_id: string;
  student_id: string;
  criterion_id: string;
  score: number;
  max_score: number;
  created_at: string;
}

// Mastery
export interface AyahMastery {
  id: string;
  student_id: string;
  script_id: string;
  ayah_id: string;
  level: MasteryLevel;
  last_updated: string;
}

// Notifications
export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  channel: NotificationChannel;
  type: string;
  payload: Record<string, any>;
  sent_at?: string;
}

// Auth Types
export interface AuthUser {
  user: User;
  profile: Profile;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Socket Types
export interface SocketEvents {
  'highlight:created': (highlight: Highlight) => void;
  'highlight:updated': (highlight: Highlight) => void;
  'highlight:deleted': (highlightId: string) => void;
  'assignment:updated': (assignment: Assignment) => void;
  'note:created': (note: Note) => void;
}

// Component Props Types
export interface QuranViewerProps {
  surah: number;
  ayah?: number;
  script?: string;
  studentId?: string;
  isTeacher?: boolean;
  onHighlight?: (highlight: Partial<Highlight>) => void;
}

export interface HighlightPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  selectedText: string;
  selection: {
    ayahId: string;
    tokenStart: number;
    tokenEnd: number;
  };
  onSave: (mistakeType: MistakeType, note?: string) => void;
}

// Form Types
export interface CreateAssignmentForm {
  student_id: string;
  title: string;
  description?: string;
  due_at: string;
}

export interface HighlightForm {
  mistake: MistakeType;
  note?: string;
}

export interface VoiceNoteData {
  blob: Blob;
  duration: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  totalAssignments?: number;
  pendingAssignments?: number;
  completedAssignments?: number;
  averageGrade?: number;
}

// Color mapping for highlights
export const MISTAKE_COLORS: Record<MistakeType, string> = {
  recap: '#9333ea', // purple
  tajweed: '#ea580c', // orange  
  haraka: '#dc2626', // red
  letter: '#92400e', // brown
};