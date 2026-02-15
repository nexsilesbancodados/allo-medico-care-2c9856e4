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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          performed_by: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          performed_by?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          performed_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_by: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          status: string
          updated_at: string
          video_room_url: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
          video_room_url?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
          video_room_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_affiliations: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          status: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          status?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_affiliations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_affiliations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_profiles: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          content: string
          created_at: string
          doctor_id: string
          id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          content?: string
          created_at?: string
          doctor_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string
          doctor_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          name: string
          relationship: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name: string
          relationship: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name?: string
          relationship?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          bio: string | null
          consultation_price: number | null
          created_at: string
          crm: string
          crm_state: string
          education: string | null
          experience_years: number | null
          id: string
          is_approved: boolean | null
          rating: number | null
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          crm: string
          crm_state?: string
          education?: string | null
          experience_years?: number | null
          id?: string
          is_approved?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          crm?: string
          crm_state?: string
          education?: string | null
          experience_years?: number | null
          id?: string
          is_approved?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_specialties: {
        Row: {
          doctor_id: string
          id: string
          specialty_id: string
        }
        Insert: {
          doctor_id: string
          id?: string
          specialty_id: string
        }
        Update: {
          doctor_id?: string
          id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_specialties_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          max_appointments: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_appointments?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_appointments?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          appointment_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          medications: Json
          observations: string | null
          patient_id: string
          pdf_url: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          medications?: Json
          observations?: string | null
          patient_id: string
          pdf_url?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          medications?: Json
          observations?: string | null
          patient_id?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      get_clinic_profile_id: { Args: { _user_id: string }; Returns: string }
      get_doctor_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "patient" | "doctor" | "clinic" | "admin"
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
      app_role: ["patient", "doctor", "clinic", "admin"],
    },
  },
} as const
