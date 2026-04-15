export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          locale: 'en' | 'tr'
          total_quizzes_taken: number
          show_on_leaderboard: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
          avatar_url?: string | null
          locale?: 'en' | 'tr'
          total_quizzes_taken?: number
          show_on_leaderboard?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
          locale?: 'en' | 'tr'
          show_on_leaderboard?: boolean
          updated_at?: string
        }
        Relationships: GenericRelationship[]
      }
      quiz_types: {
        Row: {
          id: string
          slug: string
          name_en: string
          name_tr: string | null
          description_en: string
          description_tr: string | null
          icon: string
          category_group: 'mixed' | 'single-domain' | 'specialized'
          question_count: number
          time_limit_seconds: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_en: string
          name_tr?: string | null
          description_en: string
          description_tr?: string | null
          icon: string
          category_group: 'mixed' | 'single-domain' | 'specialized'
          question_count: number
          time_limit_seconds: number
          is_active?: boolean
          sort_order: number
          created_at?: string
        }
        Update: {
          name_en?: string
          name_tr?: string | null
          description_en?: string
          description_tr?: string | null
          icon?: string
          question_count?: number
          time_limit_seconds?: number
          is_active?: boolean
          sort_order?: number
        }
        Relationships: GenericRelationship[]
      }
      questions: {
        Row: {
          id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          explanation: string
          category: string
          difficulty: 'Easy' | 'Medium' | 'Hard'
          time_seconds: number
          sort_order: number
          is_active: boolean
          scoring_type: 'binary' | 'weighted'
          option_weights: Json
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          explanation: string
          category: string
          difficulty: 'Easy' | 'Medium' | 'Hard'
          time_seconds?: number
          sort_order: number
          is_active?: boolean
          scoring_type?: 'binary' | 'weighted'
          option_weights?: Json
          created_at?: string
        }
        Update: {
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: 'A' | 'B' | 'C' | 'D'
          explanation?: string
          category?: string
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          time_seconds?: number
          sort_order?: number
          is_active?: boolean
          scoring_type?: 'binary' | 'weighted'
          option_weights?: Json
        }
        Relationships: GenericRelationship[]
      }
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
          quiz_type_id: string | null
          started_at: string
          server_started_at: string
          finished_at: string | null
          server_finished_at: string | null
          time_spent_seconds: number | null
          score: number
          max_possible_score: number
          percentage: number | null
          status: 'in_progress' | 'completed' | 'timed_out' | 'abandoned'
          question_order: Json
          answer_order: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_type_id?: string | null
          started_at?: string
          server_started_at?: string
          finished_at?: string | null
          server_finished_at?: string | null
          time_spent_seconds?: number | null
          score?: number
          max_possible_score?: number
          percentage?: number | null
          status?: 'in_progress' | 'completed' | 'timed_out' | 'abandoned'
          question_order?: Json
          answer_order?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          quiz_type_id?: string | null
          finished_at?: string | null
          server_finished_at?: string | null
          time_spent_seconds?: number | null
          score?: number
          percentage?: number | null
          status?: 'in_progress' | 'completed' | 'timed_out' | 'abandoned'
        }
        Relationships: GenericRelationship[]
      }
      user_answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          selected_answer: 'A' | 'B' | 'C' | 'D' | null
          is_correct: boolean | null
          time_taken_ms: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          selected_answer?: 'A' | 'B' | 'C' | 'D' | null
          is_correct?: boolean | null
          time_taken_ms?: number | null
          answered_at?: string
        }
        Update: {
          selected_answer?: 'A' | 'B' | 'C' | 'D' | null
          is_correct?: boolean | null
          time_taken_ms?: number | null
        }
        Relationships: GenericRelationship[]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      start_quiz_session: {
        Args: { p_quiz_type_id?: string }
        Returns: string
      }
      get_my_ranking: {
        Args: { p_quiz_type_id?: string }
        Returns: {
          my_score: number
          my_rank: number
          my_percentile: number
          total_participants: number
        }[]
      }
      get_leaderboard: {
        Args: { p_quiz_type_id: string; p_limit?: number }
        Returns: {
          rank: number
          display_name: string
          score: number
          percentage: number
          completed_at: string
          is_current_user: boolean
        }[]
      }
      refresh_leaderboard: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
