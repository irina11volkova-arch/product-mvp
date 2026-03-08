export type PageMode = 'partnerka' | 'sales' | 'transcription' | 'callcenter';

export interface Session {
  id: string;
  title: string;
  status: 'processing' | 'done' | 'error';
  prompt_id: string | null;
  transcript_json: string | null;
  feedback_json: string | null;
  error_message: string | null;
  manager_name: string | null;
  score: number | null;
  mode: PageMode | null;
  audio_path: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  name: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  highlight: 'green' | 'red' | null;
  comment: string | null;
  start?: number;
  end?: number;
}

export interface FeedbackResult {
  overall_status: string;
  rapport_note: string;
  client_name: string;
  manager_name: string;
  score: number;
  segments: TranscriptSegment[];
}

export interface EmployeeSummary {
  manager_name: string;
  call_count: number;
  avg_score: number;
}

export interface EmployeeReportResult {
  recurring_mistakes: {
    pattern: string;
    frequency: string;
    examples: string[];
    impact: string;
  }[];
  strengths: {
    pattern: string;
    frequency: string;
    examples: string[];
  }[];
  training_recommendations: {
    area: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  overall_trend: string;
  score_trend: 'improving' | 'declining' | 'stable';
}

export interface DeepgramWord {
  word: string;
  speaker: number;
  start: number;
  end: number;
}

export interface DeepgramResult {
  transcript: string;
  words: DeepgramWord[];
  speakers: Map<number, string[]>;
}
