"use server"

import { revalidatePath } from "next/cache"
import * as yup from "yup"

import { requireAdmin } from "@/lib/auth"
import { getSupabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

const statuses = new Set(["confirmed", "cancelled", "completed"])
const doctorSchema = yup.object({ fullName: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Enter a valid doctor name.").required("Enter the doctor’s full name."), fee: yup.number().typeError("Enter a valid consultation fee.").min(0, "Consultation fee cannot be negative.").required("Enter a consultation fee.") })
const scheduleSchema = yup.object({ start: yup.string().matches(/^\d{2}:\d{2}$/, "Choose a valid start time.").required("Choose a start time."), end: yup.string().matches(/^\d{2}:\d{2}$/, "Choose a valid end time.").required("Choose an end time."), minutes: yup.number().oneOf([15, 20, 30, 60], "Choose 15, 20, 30, or 60 minutes.").required() })
const bucketPath = "/storage/v1/object/public/doctor-photos/"
type DoctorMutationResult = { error?: string; success?: true }
type ReviewResult = { error?: string; success?: true }

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
  if (!(await doctorSchema.isValid({ fullName: name, fee })) || !photoUrl || !validDoctorPhotoUrl(photoUrl)) return { error: "Please check the doctor details and add a valid photo." }
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

export async function deleteDoctor(doctorId: string): Promise<DoctorMutationResult> {
  await requireAdmin()
  const id = doctorId.trim()
  if (!id) return { error: "We couldn't identify this doctor. Please refresh and try again." }

  const supabase = await createClient()
  const { count, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", id)

  if (appointmentsError) return { error: "We couldn't check this doctor's appointments. Please try again." }
  if (count) return { error: "This doctor has appointments and cannot be removed. Resolve those appointments first." }

  const { error } = await supabase.from("doctors").delete().eq("id", id)
  if (error) return { error: "We couldn't remove this doctor. Please try again." }

  revalidatePath("/admin")
  revalidatePath("/admin/doctors")
  revalidatePath("/admin/doctors/applications")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${id}`)
  return { success: true }
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
  await supabase.rpc("set_appointment_status", {
    p_appointment_id: id,
    p_status: status,
    p_cancel_reason: String(formData.get("cancel_reason") ?? "").trim() || null,
  })
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
  revalidatePath("/appointments")
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
}

export async function reviewDoctorApplication(input: { doctorId: string; decision: "approved" | "rejected" | "changes_requested"; note?: string }): Promise<ReviewResult> {
  await requireAdmin()
  const doctorId = input.doctorId.trim()
  const note = input.note?.trim() ?? ""
  if (!doctorId || !["approved", "rejected", "changes_requested"].includes(input.decision)) {
    return { error: "Please choose a valid review action." }
  }
  if (["rejected", "changes_requested"].includes(input.decision) && !note) {
    return { error: input.decision === "rejected" ? "Please provide a reason for rejecting this application." : "Please explain the changes the doctor needs to make." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("doctors")
    .update({
      approval_status: input.decision,
      rejection_reason: input.decision === "approved" ? null : note,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", doctorId)

  if (error) return { error: "We couldn't save this application review. Please try again." }
  revalidatePath("/admin")
  revalidatePath("/admin/doctors")
  revalidatePath("/admin/doctors/applications")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${doctorId}`)
  return { success: true }
}

export async function reviewDoctorDocument(input: { documentId: string; status: "verified" | "needs_action"; note?: string }): Promise<ReviewResult> {
  await requireAdmin()
  const documentId = input.documentId.trim()
  const note = input.note?.trim() ?? ""
  if (!documentId || !["verified", "needs_action"].includes(input.status)) {
    return { error: "Please choose a valid document review action." }
  }
  if (input.status === "needs_action" && !note) {
    return { error: "Please explain what needs to be changed in this document." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("doctor_documents")
    .update({ status: input.status, reviewer_note: input.status === "verified" ? null : note, reviewed_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) return { error: "We couldn't save this document review. Please try again." }
  revalidatePath("/admin/doctors/applications")
  return { success: true }
}

export async function reviewProfileChange(input: { changeId: string; approve: boolean; note?: string }): Promise<ReviewResult> {
  await requireAdmin()
  const changeId = input.changeId.trim()
  const note = input.note?.trim() ?? ""
  if (!changeId) return { error: "Please choose a profile change to review." }
  if (!input.approve && !note) return { error: "Please add a note before rejecting these profile changes." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("review_profile_change", { p_change_id: changeId, p_approve: input.approve, p_note: note || null })
  if (error) {
    if (error.message.toLowerCase().includes("already reviewed")) return { error: "Someone already reviewed this. Refresh the page." }
    return { error: "We couldn't save this profile review. Please try again." }
  }
  revalidatePath("/admin")
  revalidatePath("/admin/doctors/applications")
  revalidatePath("/doctor/profile")
  revalidatePath("/doctors")
  return { success: true }
}
