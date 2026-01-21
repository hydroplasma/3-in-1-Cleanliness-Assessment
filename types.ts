
export type Language = 'th' | 'en' | 'is';

export interface User {
  __backendId?: string;
  type: 'user';
  user_id: string;
  user_name: string;
  user_email: string;
  password?: string;
  user_role: 'admin' | 'teacher' | 'student' | 'student_council';
  user_class?: string; // Added for mapping to rooms/areas
  assigned_locations?: string[]; // New: List of room names/ids this user can assess
  user_status: string;
  user_created_at: string;
}

export interface Room {
  __backendId?: string;
  type: 'room';
  room_id: string;
  room_name: string;
  room_building: string;
  room_floor: string;
  responsible_class: string;
  created_at: string;
}

export interface Criterion {
  __backendId?: string;
  type: 'criterion';
  criterion_id: string;
  criterion_type: 'area' | 'classroom' | 'restroom';
  criterion_name: string;
  criterion_description: string;
  rubric_5?: string;
  rubric_4?: string;
  rubric_3?: string;
  rubric_2?: string;
  rubric_1?: string;
  created_at: string;
  [key: string]: any; 
}

export interface Assessment {
  __backendId?: string;
  type: 'assessment';
  assessment_id: string;
  assessment_type: 'area' | 'classroom' | 'restroom';
  location: string;
  date: string;
  evaluator: string;
  remarks: string;
  image_count: number;
  images?: string[]; // Added: Store base64 image strings
  score: number; // Percentage 0-100 for consistency
  raw_score?: number; // Actual raw score (e.g. out of 30 for Area)
  attendance_data?: { id: string; name: string; present: boolean }[]; // Attendance tracking
  attendance_score?: number; // Score from attendance
  status: 'excellent' | 'good' | 'needs_improvement';
  created_at: string;
  [key: string]: any; 
}

export interface Goal {
  __backendId?: string;
  type: 'goal';
  goal_id: string;
  goal_location: string;
  goal_target: number;
  goal_current: number;
  goal_deadline: string;
}

export interface Notification {
  __backendId?: string;
  type: 'notification';
  notification_id: string;
  notification_type: 'alert' | 'info';
  notification_title: string;
  notification_message: string;
  notification_read: boolean;
  notification_created_at: string;
}

export interface SystemSettings {
  __backendId?: string;
  type: 'settings';
  telegram_token: string;
  telegram_chat_id: string;
  notify_low_score: boolean;
  notify_reminders: boolean;
  notify_goals: boolean;
  themeColor: 'indigo' | 'blue' | 'emerald' | 'rose';
  // School Information
  school_name?: string;
  school_affiliation?: string;
  executives?: string;
  logo_url?: string;
  // New: Multi-day Reminder configuration
  reminder_time?: string; // Fallback legacy field
  reminder_daily?: Record<number, string>; // {0: '08:00', 1: '08:30', ...} 0=Sunday
  last_reminder_sent_date?: string; // YYYY-MM-DD
  language?: Language; // New: Language setting
}

export type AnyData = User | Room | Criterion | Assessment | Goal | Notification | SystemSettings;

export interface CurrentUser {
  email: string;
  role: string;
  userName: string;
  initials: string;
  assigned_locations?: string[]; // New: Carry rights info in session
}
