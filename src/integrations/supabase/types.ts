export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_description: string
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_match_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_match_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_match_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_target_match_id_fkey"
            columns: ["target_match_id"]
            isOneToOne: false
            referencedRelation: "exchange_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      exchange_chat_messages: {
        Row: {
          created_at: string
          id: string
          match_id: string
          message: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          message: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "exchange_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      exchange_matches: {
        Row: {
          academic_year: string
          admin_approved: boolean | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          location_id: string | null
          match_status: string
          matched_at: string
          semester: string
          student_1_confirmed: boolean | null
          student_1_id: string
          student_2_confirmed: boolean | null
          student_2_id: string
          time_slot_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          admin_approved?: boolean | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          match_status?: string
          matched_at?: string
          semester: string
          student_1_confirmed?: boolean | null
          student_1_id: string
          student_2_confirmed?: boolean | null
          student_2_id: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          admin_approved?: boolean | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          match_status?: string
          matched_at?: string
          semester?: string
          student_1_confirmed?: boolean | null
          student_1_id?: string
          student_2_confirmed?: boolean | null
          student_2_id?: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_matches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "exchange_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_matches_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "exchange_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_time_slots: {
        Row: {
          created_at: string
          current_exchanges: number | null
          date: string
          end_time: string
          id: string
          is_active: boolean | null
          location_id: string | null
          max_exchanges: number | null
          period: Database["public"]["Enums"]["time_slot_period"]
          start_time: string
        }
        Insert: {
          created_at?: string
          current_exchanges?: number | null
          date: string
          end_time: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          max_exchanges?: number | null
          period: Database["public"]["Enums"]["time_slot_period"]
          start_time: string
        }
        Update: {
          created_at?: string
          current_exchanges?: number | null
          date?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          max_exchanges?: number | null
          period?: Database["public"]["Enums"]["time_slot_period"]
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_time_slots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "exchange_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          profile_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          profile_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          profile_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revision_content: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_data: Json | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          created_by: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["content_status"]
          subject_id: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_data?: Json | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subject_id: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_data?: Json | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subject_id?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_content_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_info: {
        Row: {
          academic_info_completed: boolean | null
          books_owned: string[]
          books_required: string[]
          branch: Database["public"]["Enums"]["branch"]
          created_at: string
          division: string
          exchange_status: Database["public"]["Enums"]["exchange_status"]
          id: string
          roll_number: number
          slot: number
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_info_completed?: boolean | null
          books_owned: string[]
          books_required: string[]
          branch: Database["public"]["Enums"]["branch"]
          created_at?: string
          division: string
          exchange_status?: Database["public"]["Enums"]["exchange_status"]
          id?: string
          roll_number: number
          slot: number
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_info_completed?: boolean | null
          books_owned?: string[]
          books_required?: string[]
          branch?: Database["public"]["Enums"]["branch"]
          created_at?: string
          division?: string
          exchange_status?: Database["public"]["Enums"]["exchange_status"]
          id?: string
          roll_number?: number
          slot?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slot: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slot: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slot?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      determine_slot: { Args: { roll_num: number }; Returns: number }
      get_books_owned: { Args: { slot_num: number }; Returns: string[] }
      get_books_required: { Args: { slot_num: number }; Returns: string[] }
      get_current_semester: {
        Args: never
        Returns: {
          academic_year: string
          semester: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_admin_email: { Args: { _email: string }; Returns: boolean }
      is_student_matched_this_semester: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action_description: string
          _action_type: string
          _metadata?: Json
          _target_match_id?: string
          _target_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      branch: "CS" | "IT" | "EXTC" | "MECH" | "CIVIL" | "AIDS" | "AIML"
      content_status: "draft" | "pending_approval" | "approved" | "rejected"
      content_type: "pdf" | "notes" | "flashcard"
      exchange_status:
        | "pending"
        | "requested"
        | "matched"
        | "completed"
        | "cancelled"
      time_slot_period: "morning" | "afternoon" | "evening"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
      branch: ["CS", "IT", "EXTC", "MECH", "CIVIL", "AIDS", "AIML"],
      content_status: ["draft", "pending_approval", "approved", "rejected"],
      content_type: ["pdf", "notes", "flashcard"],
      exchange_status: [
        "pending",
        "requested",
        "matched",
        "completed",
        "cancelled",
      ],
      time_slot_period: ["morning", "afternoon", "evening"],
    },
  },
} as const
