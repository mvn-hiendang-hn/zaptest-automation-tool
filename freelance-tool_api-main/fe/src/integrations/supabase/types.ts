export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_collections_backup: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_tests: {
        Row: {
          body: string | null
          collection_id: string | null
          created_at: string
          headers: Json | null
          id: string
          method: string
          name: string
          response: Json | null
          status_code: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          body?: string | null
          collection_id?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          method: string
          name: string
          response?: Json | null
          status_code?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          body?: string | null
          collection_id?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          method?: string
          name?: string
          response?: Json | null
          status_code?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tests_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "api_collections_backup"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_runs: {
        Row: {
          collection_id: string | null
          completed_at: string | null
          created_at: string | null
          failure_count: number | null
          id: string
          status: string | null
          success_count: number | null
          test_schedules_id: string | null
          total_duration: number | null
          total_tests: number | null
          user_id: string | null
        }
        Insert: {
          collection_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          status?: string | null
          success_count?: number | null
          test_schedules_id?: string | null
          total_duration?: number | null
          total_tests?: number | null
          user_id?: string | null
        }
        Update: {
          collection_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          status?: string | null
          success_count?: number | null
          test_schedules_id?: string | null
          total_duration?: number | null
          total_tests?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_runs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "api_collections_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_runs_test_schedules_id_fkey"
            columns: ["test_schedules_id"]
            isOneToOne: false
            referencedRelation: "test_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          collection_run_id: string | null
          created_at: string | null
          duration: number | null
          error: string | null
          id: string
          response: Json | null
          status_code: number | null
          test_id: string | null
        }
        Insert: {
          collection_run_id?: string | null
          created_at?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          response?: Json | null
          status_code?: number | null
          test_id?: string | null
        }
        Update: {
          collection_run_id?: string | null
          created_at?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          response?: Json | null
          status_code?: number | null
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_collection_run_id_fkey"
            columns: ["collection_run_id"]
            isOneToOne: false
            referencedRelation: "collection_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "api_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_schedules: {
        Row: {
          active: boolean
          collection_id: string
          created_at: string
          day_time: string | null
          frequency: string
          hour_interval: number
          id: string
          last_run: string | null
          minute_interval: number | null
          name: string
          recipient_email: string | null
          selected_days: number[]
          send_email: boolean
          specific_time: string | null
          specific_weekday: number | null
          timer_type: string
          updated_at: string
          user_id: string
          week_day: string | null
          week_time: string | null
        }
        Insert: {
          active?: boolean
          collection_id: string
          created_at?: string
          day_time?: string | null
          frequency: string
          hour_interval?: number
          id?: string
          last_run?: string | null
          minute_interval?: number | null
          name: string
          recipient_email?: string | null
          selected_days?: number[]
          send_email?: boolean
          specific_time?: string | null
          specific_weekday?: number | null
          timer_type?: string
          updated_at?: string
          user_id: string
          week_day?: string | null
          week_time?: string | null
        }
        Update: {
          active?: boolean
          collection_id?: string
          created_at?: string
          day_time?: string | null
          frequency?: string
          hour_interval?: number
          id?: string
          last_run?: string | null
          minute_interval?: number | null
          name?: string
          recipient_email?: string | null
          selected_days?: number[]
          send_email?: boolean
          specific_time?: string | null
          specific_weekday?: number | null
          timer_type?: string
          updated_at?: string
          user_id?: string
          week_day?: string | null
          week_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_schedules_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "api_collections_backup"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
