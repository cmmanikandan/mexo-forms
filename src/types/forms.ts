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
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Forms
// =============================================
export type FormStatus = 'draft' | 'published' | 'closed' | 'archived' | 'trashed';
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
  | 'time';

export interface Form {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  slug: string;
  status: FormStatus;
  form_type: FormType;
  is_published: boolean;
  accepting_responses: boolean;
  requires_login: boolean;
  one_response_per_user: boolean;
  confirmation_message?: string;
  starts_at?: string;
  ends_at?: string;
  is_starred?: boolean;
  created_at: string;
  updated_at: string;
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

export interface FormQuestion {
  id: string;
  form_id: string;
  section_id?: string;
  question_text: string;
  description?: string;
  question_type: QuestionType;
  required: boolean;
  position: number;
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
  status: 'in_progress' | 'submitted';
  device_type?: 'Desktop' | 'Mobile' | 'Tablet';
  completion_time_seconds?: number;
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
