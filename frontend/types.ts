// Core Quran Types
export interface QuranAyah {
  id: string;
  surah: number;
  ayah: number;
  text: string;
  script_id: string;
  token_positions: any;
}

export interface QuranScript {
  id: string;
  code: string;
  display_name: string;
}

// Highlight and Annotation Types
export type MistakeType = 'recap' | 'tajweed' | 'haraka' | 'letter';

export const MISTAKE_COLORS: Record<MistakeType, string> = {
  recap: '#9333ea', // purple
  tajweed: '#f97316', // orange
  haraka: '#ef4444', // red
  letter: '#92400e', // brown
};

export type HighlightColor = 'green' | 'gold' | 'orange' | 'red' | 'brown' | 'purple';

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
  color: HighlightColor;
  status: 'active' | 'gold' | 'archived';
  created_at: string;
  updated_at: string;
  notes?: Note[];
}

export type NoteType = 'text' | 'audio';

export interface Note {
  id: string;
  highlight_id: string;
  author_user_id: string;
  type: NoteType;
  text?: string;
  audio_url?: string;
  created_at: string;
}

export interface PenAnnotation {
  id: string;
  student_id: string;
  teacher_id: string;
  page_number: number;
  script_id: string;
  drawing_data: any;
  created_at: string;
}

// Assignment Types
export type AssignmentStatus =
  | 'assigned'
  | 'viewed'
  | 'submitted'
  | 'reviewed'
  | 'completed'
  | 'reopened';

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

// Homework Types (Green Highlights)
export interface Homework {
  id: string;
  school_id: string;
  teacher_id: string;
  student_id: string;
  highlight_id?: string;
  title: string;
  instructions?: string;
  due_at: string;
  completed_at?: string;
  status: 'assigned' | 'submitted' | 'completed';
  created_at: string;
}

// User & Role Types
export type UserRole = 'school' | 'teacher' | 'student' | 'parent';

export interface Profile {
  user_id: string;
  school_id: string;
  role: UserRole;
  display_name?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  bio?: string;
  active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  school_id: string;
  dob?: string;
  gender?: string;
  active: boolean;
  created_at: string;
}

export interface Parent {
  id: string;
  user_id: string;
  school_id: string;
  created_at: string;
}

// Class Types
export interface Class {
  id: string;
  school_id: string;
  name: string;
  room?: string;
  schedule_json: any;
  created_by?: string;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: string;
  class_id: string;
  session_date: string;
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}

// Target & Progress Types
export interface Target {
  id: string;
  school_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  target_type: 'individual' | 'class' | 'school';
  class_id?: string;
  due_at?: string;
  created_at: string;
}

export type MasteryLevel = 'unknown' | 'learning' | 'proficient' | 'mastered';

export interface AyahMastery {
  id: string;
  student_id: string;
  script_id: string;
  ayah_id: string;
  level: MasteryLevel;
  last_updated: string;
}

export interface PracticeLog {
  id: string;
  student_id: string;
  page_number: number;
  script_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  idle_detected: boolean;
  created_at: string;
}

// Grading Types
export interface Rubric {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  name: string;
  weight: number;
  max_score: number;
  created_at: string;
}

export interface Grade {
  id: string;
  assignment_id: string;
  student_id: string;
  criterion_id?: string;
  score: number;
  max_score: number;
  created_at: string;
}

// Communication Types
export interface Message {
  id: string;
  school_id: string;
  from_user_id: string;
  to_user_id: string;
  subject?: string;
  body: string;
  read_at?: string;
  created_at: string;
}

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  payload?: any;
  read_at?: string;
  sent_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  school_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  class_id?: string;
  created_at: string;
}
