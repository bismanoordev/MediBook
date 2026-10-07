"use server"

import { revalidatePath } from "next/cache"

import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { getSupabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

type AppointmentMutationResult = { error?: string; success?: true }
type AppointmentStatus = "confirmed" | "cancelled" | "completed"
type AvailabilityResult = { error?: string; success?: true }
type ProfileResult = { error?: string; success?: true }
type Qualification = { degree: string; institution: string; year: string }
type ProfileInput = { fullName: string; phone: string; bio: string; fee: string; photoUrl: string; specialtyId: string; experienceYears: string; languages: string[]; clinicName: string; city: string; qualifications: Qualification[] }

function validDoctorPhotoUrl(value: string) {
  if (!value) return true
  try {
    const candidate = new URL(value)
    const configured = new URL(getSupabaseEnv().url)
    return candidate.origin === configured.origin && candidate.pathname.startsWith("/storage/v1/object/public/doctor-photos/")
  } catch { return false }
}

function friendlyAppointmentError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("already confirmed") || normalized.includes("already")) return "This appointment was already updated. Refresh to see the latest status."
  if (normalized.includes("only pending appointments can be confirmed")) return "Only pending appointments can be confirmed."
  if (normalized.includes("before it starts")) return "You can complete an appointment only after it starts."
  return "We couldn't update this appointment. Please try again."
}

export async function updateDoctorAppointment(input: { appointmentId: string; status: AppointmentStatus; cancelReason?: string }): Promise<AppointmentMutationResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const appointmentId = input.appointmentId.trim()
  const cancelReason = input.cancelReason?.trim() ?? ""
  if (!doctor || !appointmentId || !["confirmed", "cancelled", "completed"].includes(input.status)) {
    return { error: "Please choose a valid appointment action." }
  }
  if (cancelReason.length > 500) return { error: "The decline reason must be 500 characters or fewer." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_appointment_status", {
    p_appointment_id: appointmentId,
    p_status: input.status,
    p_cancel_reason: input.status === "cancelled" ? cancelReason || null : null,
  })
  if (error) return { error: friendlyAppointmentError(error.message) }

  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/appointments")
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
  return { success: true }
}

export async function saveDoctorSchedule(formData: FormData): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const day = Number(formData.get("day_of_week"))
  const start = String(formData.get("start_time") ?? "")
  const end = String(formData.get("end_time") ?? "")
  const minutes = Number(formData.get("slot_minutes"))
  if (!doctor || !Number.isInteger(day) || day < 0 || day > 6) return { error: "We couldn't save these hours. Please try again." }

  const supabase = await createClient()
  if (formData.get("enabled") !== "true") {
    const { error } = await supabase.from("doctor_schedules").delete().eq("doctor_id", doctor.id).eq("day_of_week", day)
    if (error) return { error: "We couldn't turn off these hours. Please try again." }
  } else {
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || ![15, 20, 30, 60].includes(minutes) || end <= start) {
      return { error: "Choose a valid start time, end time, and slot length." }
    }
    const { error } = await supabase.from("doctor_schedules").upsert({ doctor_id: doctor.id, day_of_week: day, start_time: start, end_time: end, slot_minutes: minutes }, { onConflict: "doctor_id,day_of_week" })
    if (error) return { error: "We couldn't save these hours. Please try again." }
  }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true }
}

export async function addDoctorTimeOff(input: { startDate: string; endDate: string }): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const startDate = input.startDate
  const endDate = input.endDate
  if (!doctor || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { error: "Choose a valid first and last day." }
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const length = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
  if (end < start || length > 90) return { error: "Choose a range of up to 90 days." }

  const supabase = await createClient()
  const { error } = await supabase.from("doctor_time_off").insert({ doctor_id: doctor.id, start_date: startDate, end_date: endDate })
  if (error) {
    if (error.message.toLowerCase().includes("already have appointments on these days")) return { error: "You already have appointments on these days. Cancel them first." }
    return { error: "We couldn't save those days off. Please try again." }
  }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true }
}

export async function removeDoctorTimeOff(id: number): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  if (!doctor || !Number.isInteger(id) || id < 1) return { error: "We couldn't remove those days off. Please try again." }
  const supabase = await createClient()
  const { error } = await supabase.from("doctor_time_off").delete().eq("id", id).eq("doctor_id", doctor.id)
  if (error) return { error: "We couldn't remove those days off. Please try again." }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true }
}

export async function submitDoctorProfileChanges(input: ProfileInput): Promise<ProfileResult> {
  const auth = await requireDoctor()
  const doctor = await getDoctorRecord()
  if (!doctor || doctor.approval_status !== "approved") return { error: "Your profile can be edited after your application is approved." }
  const fullName = input.fullName.trim()
  const phone = input.phone.trim()
  const bio = input.bio.trim()
  const fee = Number(input.fee)
  const specialtyId = input.specialtyId ? Number(input.specialtyId) : null
  const experienceYears = input.experienceYears ? Number(input.experienceYears) : null
  const languages = input.languages.map((language) => language.trim()).filter(Boolean)
  const qualifications = input.qualifications.filter((item) => item.degree.trim() || item.institution.trim() || item.year.trim()).map((item) => ({ degree: item.degree.trim(), institution: item.institution.trim(), year: item.year.trim() }))
  if (!fullName || !phone || !validDoctorPhotoUrl(input.photoUrl) || !Number.isFinite(fee) || fee < 0 || (specialtyId !== null && (!Number.isInteger(specialtyId) || specialtyId < 1)) || (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0))) return { error: "Please check your profile details and try again." }

  const changes: Record<string, unknown> = {}
  if (fullName !== doctor.full_name) changes.full_name = fullName
  if (bio !== (doctor.bio ?? "")) changes.bio = bio || null
  if (fee !== Number(doctor.fee)) changes.fee = fee
  if (input.photoUrl !== (doctor.photo_url ?? "")) changes.photo_url = input.photoUrl || null
  if (specialtyId !== doctor.specialty_id) changes.specialty_id = specialtyId
  if (experienceYears !== doctor.experience_years) changes.experience_years = experienceYears
  if (JSON.stringify(languages) !== JSON.stringify(doctor.languages)) changes.languages = languages
  if (input.clinicName.trim() !== (doctor.clinic_name ?? "")) changes.clinic_name = input.clinicName.trim() || null
  if (input.city.trim() !== (doctor.city ?? "")) changes.city = input.city.trim() || null
  if (JSON.stringify(qualifications) !== JSON.stringify(doctor.qualifications)) changes.qualifications = qualifications

  const supabase = await createClient()
  const currentPhone = auth.profile?.phone ?? ""
  if (phone !== currentPhone) {
    const { error } = await supabase.from("profiles").update({ phone }).eq("id", auth.user.id)
    if (error) return { error: "We couldn't update your phone number. Please try again." }
  }
  if (!Object.keys(changes).length) return { success: true }
  const { error } = await supabase.from("doctor_profile_changes").insert({ doctor_id: doctor.id, changes: changes as never })
  if (error) return { error: "We couldn't send your profile changes for review. Please try again." }
  revalidatePath("/doctor/profile")
  revalidatePath("/admin/doctors/applications")
  return { success: true }
}

export async function withdrawDoctorProfileChange(changeId: string): Promise<ProfileResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  if (!doctor || !changeId) return { error: "We couldn't withdraw this profile change. Please try again." }
  const supabase = await createClient()
  const { error } = await supabase.from("doctor_profile_changes").delete().eq("id", changeId).eq("doctor_id", doctor.id).eq("status", "pending")
  if (error) return { error: "We couldn't withdraw this profile change. Please try again." }
  revalidatePath("/doctor/profile")
  revalidatePath("/admin/doctors/applications")
  return { success: true }
}
