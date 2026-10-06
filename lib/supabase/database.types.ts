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

export type ProfileRole = "patient" | "doctor" | "admin"

export type DoctorApprovalStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested"

export type DoctorDocumentType = "cnic" | "pmdc_license" | "degree"
export type DoctorDocumentStatus = "pending" | "verified" | "needs_action"
export type DoctorProfileChangeStatus = "pending" | "approved" | "rejected"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: ProfileRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: ProfileRole
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
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
          user_id: string | null
          approval_status: DoctorApprovalStatus
          rejection_reason: string | null
          experience_years: number | null
          languages: string[]
          clinic_name: string | null
          city: string | null
          pmdc_number: string | null
          qualifications: Json
          onboarding_step: number
          submitted_at: string | null
          reviewed_at: string | null
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
          user_id?: string | null
          approval_status?: DoctorApprovalStatus
          rejection_reason?: string | null
          experience_years?: number | null
          languages?: string[]
          clinic_name?: string | null
          city?: string | null
          pmdc_number?: string | null
          qualifications?: Json
          onboarding_step?: number
          submitted_at?: string | null
          reviewed_at?: string | null
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
          user_id?: string | null
          approval_status?: DoctorApprovalStatus
          rejection_reason?: string | null
          experience_years?: number | null
          languages?: string[]
          clinic_name?: string | null
          city?: string | null
          pmdc_number?: string | null
          qualifications?: Json
          onboarding_step?: number
          submitted_at?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_documents: {
        Row: { id: string; doctor_id: string; doc_type: DoctorDocumentType; file_path: string; file_name: string; status: DoctorDocumentStatus; reviewer_note: string | null; uploaded_at: string; reviewed_at: string | null }
        Insert: { id?: string; doctor_id: string; doc_type: DoctorDocumentType; file_path: string; file_name: string; status?: DoctorDocumentStatus; reviewer_note?: string | null; uploaded_at?: string; reviewed_at?: string | null }
        Update: { id?: string; doctor_id?: string; doc_type?: DoctorDocumentType; file_path?: string; file_name?: string; status?: DoctorDocumentStatus; reviewer_note?: string | null; uploaded_at?: string; reviewed_at?: string | null }
        Relationships: [{ foreignKeyName: "doctor_documents_doctor_id_fkey"; columns: ["doctor_id"]; isOneToOne: false; referencedRelation: "doctors"; referencedColumns: ["id"] }]
      }
      doctor_time_off: {
        Row: { id: number; doctor_id: string; start_date: string; end_date: string; created_at: string }
        Insert: { id?: never; doctor_id: string; start_date: string; end_date: string; created_at?: string }
        Update: { id?: never; doctor_id?: string; start_date?: string; end_date?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "doctor_time_off_doctor_id_fkey"; columns: ["doctor_id"]; isOneToOne: false; referencedRelation: "doctors"; referencedColumns: ["id"] }]
      }
      doctor_profile_changes: {
        Row: { id: string; doctor_id: string; changes: Json; status: DoctorProfileChangeStatus; admin_note: string | null; created_at: string; reviewed_at: string | null }
        Insert: { id?: string; doctor_id: string; changes: Json; status?: DoctorProfileChangeStatus; admin_note?: string | null; created_at?: string; reviewed_at?: string | null }
        Update: { id?: string; doctor_id?: string; changes?: Json; status?: DoctorProfileChangeStatus; admin_note?: string | null; created_at?: string; reviewed_at?: string | null }
        Relationships: [{ foreignKeyName: "doctor_profile_changes_doctor_id_fkey"; columns: ["doctor_id"]; isOneToOne: false; referencedRelation: "doctors"; referencedColumns: ["id"] }]
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
      is_doctor: { Args: Record<PropertyKey, never>; Returns: boolean }
      my_doctor_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_booked_slots: {
        Args: { p_doctor_id: string; p_date: string }
        Returns: { start_time: string }[]
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      submit_doctor_application: { Args: Record<PropertyKey, never>; Returns: undefined }
      set_appointment_status: { Args: { p_appointment_id: string; p_status: string; p_cancel_reason?: string | null }; Returns: undefined }
      review_profile_change: { Args: { p_change_id: string; p_approve: boolean; p_note?: string | null }; Returns: undefined }
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
