"use server"

import { revalidatePath } from "next/cache"
import * as yup from "yup"

import { requireAdmin } from "@/lib/auth"
import { getSupabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

const statuses = new Set(["pending", "confirmed", "cancelled", "completed"])
const doctorSchema = yup.object({ fullName: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Enter a valid doctor name.").required("Enter the doctor’s full name."), fee: yup.number().typeError("Enter a valid consultation fee.").min(0, "Consultation fee cannot be negative.").required("Enter a consultation fee.") })
const scheduleSchema = yup.object({ start: yup.string().matches(/^\d{2}:\d{2}$/, "Choose a valid start time.").required("Choose a start time."), end: yup.string().matches(/^\d{2}:\d{2}$/, "Choose a valid end time.").required("Choose an end time."), minutes: yup.number().oneOf([15, 20, 30, 60], "Choose 15, 20, 30, or 60 minutes.").required() })
const bucketPath = "/storage/v1/object/public/doctor-photos/"
type DoctorMutationResult = { error?: string; success?: true }

function validDoctorPhotoUrl(value: string) {
  if (!value) return true
  try {
    const candidate = new URL(value)
    const configured = new URL(getSupabaseEnv().url)
    return candidate.origin === configured.origin && candidate.pathname.startsWith(bucketPath)
  } catch { return false }
}

export async function createDoctor(formData: FormData): Promise<DoctorMutationResult> {
  await requireAdmin()
  const name = String(formData.get("full_name") ?? "").trim()
  const fee = Number(formData.get("fee"))
  const specialtyId = Number(formData.get("specialty_id"))
  const photoUrl = String(formData.get("photo_url") ?? "").trim()
  if (!(await doctorSchema.isValid({ fullName: name, fee })) || !validDoctorPhotoUrl(photoUrl)) return { error: "Please check the doctor details and photo." }
  const supabase = await createClient()
  const { error } = await supabase.from("doctors").insert({ full_name: name, fee, specialty_id: Number.isInteger(specialtyId) && specialtyId > 0 ? specialtyId : null, bio: String(formData.get("bio") ?? "").trim() || null, photo_url: photoUrl || null })
  if (error) return { error: "We couldn’t add this doctor. Please try again." }
  revalidatePath("/admin/doctors")
  revalidatePath("/doctors")
  return { success: true }
}

export async function updateDoctor(formData: FormData): Promise<DoctorMutationResult> {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("full_name") ?? "").trim()
  const fee = Number(formData.get("fee"))
  const specialtyId = Number(formData.get("specialty_id"))
  const photoUrl = String(formData.get("photo_url") ?? "").trim()
  if (!id || !(await doctorSchema.isValid({ fullName: name, fee })) || !validDoctorPhotoUrl(photoUrl)) return { error: "Please check the doctor details and photo." }
  const supabase = await createClient()
  const { error } = await supabase.from("doctors").update({ full_name: name, fee, specialty_id: Number.isInteger(specialtyId) && specialtyId > 0 ? specialtyId : null, bio: String(formData.get("bio") ?? "").trim() || null, photo_url: photoUrl || null }).eq("id", id)
  if (error) return { error: "We couldn’t update this doctor. Please try again." }
  revalidatePath("/admin/doctors")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${id}`)
  return { success: true }
}

export async function toggleDoctor(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const supabase = await createClient()
  await supabase.from("doctors").update({ is_active: formData.get("is_active") === "true" }).eq("id", id)
  revalidatePath("/admin/doctors")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${id}`)
}

export async function saveSchedule(formData: FormData) {
  await requireAdmin()
  const doctorId = String(formData.get("doctor_id") ?? "")
  const day = Number(formData.get("day_of_week"))
  const start = String(formData.get("start_time") ?? "")
  const end = String(formData.get("end_time") ?? "")
  const minutes = Number(formData.get("slot_minutes"))
  if (!doctorId || !Number.isInteger(day) || day < 0 || day > 6) return
  const supabase = await createClient()
  if (formData.get("enabled") !== "true") {
    await supabase.from("doctor_schedules").delete().eq("doctor_id", doctorId).eq("day_of_week", day)
    revalidatePath(`/admin/doctors/${doctorId}/schedule`)
    revalidatePath(`/doctors/${doctorId}`)
    return
  }
  if (!(await scheduleSchema.isValid({ start, end, minutes })) || end <= start) return
  await supabase.from("doctor_schedules").upsert({ doctor_id: doctorId, day_of_week: day, start_time: start, end_time: end, slot_minutes: minutes }, { onConflict: "doctor_id,day_of_week" })
  revalidatePath(`/admin/doctors/${doctorId}/schedule`)
  revalidatePath(`/doctors/${doctorId}`)
}

export async function updateAppointmentStatus(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!id || !statuses.has(status)) return
  const supabase = await createClient()
  await supabase.from("appointments").update({ status: status as "pending" | "confirmed" | "cancelled" | "completed" }).eq("id", id)
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
  revalidatePath("/appointments")
}
