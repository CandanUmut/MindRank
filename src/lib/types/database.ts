export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// GenericRelationship shape required by @supabase/supabase-js internals.
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          updated_at?: string
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
        }
        Relationships: GenericRelationship[]
      }
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
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
    // Use mapped-type empty objects (no string index) to avoid polluting
    // the TablesAndViews intersection inside @supabase/postgrest-js.
    Views: { [_ in never]: never }
    Functions: {
      start_quiz_session: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_ranking: {
        Args: Record<string, never>
        Returns: {
          my_score: number
          my_rank: number
          my_percentile: number
          total_participants: number
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
