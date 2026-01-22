
export type Language = 'th' | 'en' | 'is';

export interface User {
  __backendId?: string;
  type: 'user';
  user_id: string;
  user_name: string;
  user_email: string;
  password?: string;
  user_role: 'admin' | 'teacher' | 'student' | 'student_council';
  user_class?: string; 
  assigned_locations?: string[]; 
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
  images?: string[]; 
  score: number; 
  raw_score?: number; 
  attendance_data?: { id: string; name: string; present: boolean }[]; 
  attendance_score?: number; 
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
  school_name?: string;
  school_affiliation?: string;
  executives?: string;
  logo_url?: string;
  reminder_time?: string;
  reminder_daily?: Record<number, string>; 
  last_reminder_sent_date?: string; 
  language?: Language;
  showQuickLogin?: boolean;
}

export type AnyData = User | Room | Criterion | Assessment | Goal | Notification | SystemSettings;

export interface CurrentUser {
  email: string;
  role: string;
  userName: string;
  initials: string;
  assigned_locations?: string[]; 
}
