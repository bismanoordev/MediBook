export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"

export type ProfileRole = "patient" | "admin"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: ProfileRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: ProfileRole
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: ProfileRole
          created_at?: string
        }
        Relationships: []
      }
      specialties: {
        Row: { id: number; name: string; created_at: string }
        Insert: { id?: never; name: string; created_at?: string }
        Update: { id?: never; name?: string; created_at?: string }
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          full_name: string
          specialty_id: number | null
          bio: string | null
          fee: number
          photo_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          specialty_id?: number | null
          bio?: string | null
          fee?: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          specialty_id?: number | null
          bio?: string | null
          fee?: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          id: number
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_minutes: number
        }
        Insert: {
          id?: never
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_minutes?: number
        }
        Update: {
          id?: never
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          start_time: string
          end_time: string | null
          status: AppointmentStatus
          reason: string | null
          cancel_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          start_time: string
          end_time?: string | null
          status?: AppointmentStatus
          reason?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string | null
          status?: AppointmentStatus
          reason?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      get_booked_slots: {
        Args: { p_doctor_id: string; p_date: string }
        Returns: { start_time: string }[]
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database["public"]

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"]

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"]
