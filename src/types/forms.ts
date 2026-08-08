// =============================================
// MEXO Shared Identity
// =============================================
export interface MexoProfile {
  id: string; // auth.users.id
  username: string;
  primary_address: string; // e.g. user@mexo.com
  first_name: string;
  last_name: string;
  avatar_url?: string;
  recovery_email?: string;
  date_of_birth?: string;
  gender?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Forms & Lifecycle
// =============================================
export type FormStatus = 'draft' | 'published' | 'closed' | 'archived' | 'trashed';
export type FormLifecycleStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'PAUSED' | 'CLOSED' | 'FULL' | 'ARCHIVED';
export type FormType = 'form' | 'quiz';
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'yes_no'
  | 'rating'
  | 'linear_scale'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'page_break';

export interface Form {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  slug: string;
  status: FormStatus;
  form_type: FormType;
  form_mode?: 'standard' | 'registration' | 'quiz';
  template_type?: string;
  is_published: boolean;
  accepting_responses: boolean;
  requires_login: boolean;
  one_response_per_user: boolean;
  confirmation_message?: string;
  show_quiz_score?: boolean;
  show_response_summary?: boolean;
  show_progress_bar?: boolean;
  shuffle_questions?: boolean;
  time_limit_minutes?: number;
  passing_score_percentage?: number;
  attachment_url?: string;
  attachment_name?: string;
  submission_attachment_url?: string;
  submission_attachment_name?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  theme_color?: string;
  is_starred?: boolean;
  created_at: string;
  updated_at: string;

  // Advanced Publishing, Scheduling & Registration Limits
  manual_closed_at?: string | null;
  paused_at?: string | null;
  response_limit?: number;
  show_remaining_capacity?: boolean;
  closed_title?: string;
  closed_message?: string;
  closed_button_text?: string;
  closed_button_url?: string;
  timezone?: string;
  allow_response_editing?: boolean;
  allow_cancellation?: boolean;
  waitlist_enabled?: boolean;
  registration_prefix?: string;
  event_name?: string;
  event_date?: string;
  event_venue?: string;

  // Joined fields
  response_count?: number;
  owner?: MexoProfile;
}

export interface FormSection {
  id: string;
  form_id: string;
  title: string;
  description?: string;
  position: number;
}

export interface QuestionSettings {
  max_rating?: number;
  min?: number;
  max?: number;
  min_label?: string;
  max_label?: string;
  allowed_file_types?: string[];
  // Conditional Logic (Show/Hide)
  show_if_question_id?: string;
  show_if_option_value?: string;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  section_id?: string;
  question_text: string;
  description?: string;
  question_type: QuestionType;
  required: boolean;
  position: number;
  explanation?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  options?: FormOption[];
}

export interface FormOption {
  id: string;
  question_id: string;
  label: string;
  value: string;
  is_correct?: boolean;
  points?: number;
  position: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  respondent_id?: string;
  respondent_email?: string;
  status: 'in_progress' | 'submitted' | 'cancelled' | 'waitlisted';
  device_type?: 'Desktop' | 'Mobile' | 'Tablet';
  completion_time_seconds?: number;
  registration_reference?: string;
  started_at: string;
  submitted_at?: string;
  answers?: FormAnswer[];
}

export interface FormAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text?: string;
  answer_json?: any;
  created_at: string;
}

export interface FormCollaborator {
  id: string;
  form_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'response_viewer';
  created_at: string;
}

// =============================================
// Builder State
// =============================================
export interface BuilderState {
  form: Form | null;
  sections: FormSection[];
  questions: FormQuestion[];
  selectedQuestionId: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
}

// =============================================
// Templates
// =============================================
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  questions: Partial<FormQuestion>[];
}

// =============================================
// Analytics
// =============================================
export interface ResponseAnalytics {
  total: number;
  today: number;
  completionRate: number;
  avgCompletionTimeSeconds: number;
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  trend: { date: string; count: number }[];
}
