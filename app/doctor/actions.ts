"use server"

import { revalidatePath } from "next/cache"

import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { sendBookingAcceptedEmail, sendBookingCancelledByDoctorEmail, sendBookingRejectedEmail } from "@/lib/email/booking-emails"
import { getSupabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import { availabilityDates, friendlyAvailabilityError, type AvailabilityDateInput, type AvailabilityResult, type AvailabilityUpdateInput, validAvailabilityUpdate } from "@/lib/availability"
import { isoDate, pakistanBookingWindowEnd, pakistanToday } from "@/lib/slots"

type AppointmentMutationResult = { error?: string; success?: true }
type AppointmentStatus = "confirmed" | "cancelled" | "completed"
type ProfileResult = { error?: string; success?: true }
type DocumentMutationResult = { error?: string; success?: true }
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

const allowedDocumentTypes = ["cnic", "pmdc_license", "degree"] as const
const allowedDocumentMimeTypes = ["image/jpeg", "image/png", "application/pdf"]

export async function replaceDoctorDocument(formData: FormData): Promise<DocumentMutationResult> {
  const auth = await requireDoctor()
  const doctor = await getDoctorRecord()
  const docType = String(formData.get("doc_type") ?? "")
  const file = formData.get("file")
  if (!doctor || !allowedDocumentTypes.includes(docType as typeof allowedDocumentTypes[number]) || !(file instanceof File)) {
    return { error: "Choose a valid document to upload." }
  }
  const documentType = docType as typeof allowedDocumentTypes[number]
  if (!allowedDocumentMimeTypes.includes(file.type) || file.size <= 0 || file.size > 5_242_880) {
    return { error: "Use a JPG, PNG, or PDF file smaller than 5 MB." }
  }

  const supabase = await createClient()
  const { data: existing, error: lookupError } = await supabase
    .from("doctor_documents")
    .select("id,status")
    .eq("doctor_id", doctor.id)
    .eq("doc_type", documentType)
    .maybeSingle()
  if (lookupError) return { error: "We couldn't check this document. Please try again." }
  if (existing?.status === "pending") {
    return { error: "This document is waiting for admin review. You can replace it only if the admin asks for changes." }
  }
  if (existing?.status === "verified") return { error: "This document has been verified and cannot be replaced." }
  if (existing && existing.status !== "needs_action") return { error: "This document can't be replaced right now. Please try again." }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "pdf"
  const filePath = `${auth.user.id}/${documentType}-${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from("doctor-documents").upload(filePath, file)
  if (uploadError) return { error: "Your document couldn't be uploaded. Please try again." }

  const { error: saveError } = await supabase
    .from("doctor_documents")
    .upsert({ doctor_id: doctor.id, doc_type: documentType, file_path: filePath, file_name: file.name, status: "pending", reviewer_note: null }, { onConflict: "doctor_id,doc_type" })
  if (saveError) return { error: "Your document couldn't be saved. Please try again." }

  revalidatePath("/doctor/documents")
  revalidatePath("/admin/doctors/applications")
  return { success: true }
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
  const { data: appointment, error: lookupError } = await supabase
    .from("appointments")
    .select("id,status")
    .eq("id", appointmentId)
    .eq("doctor_id", doctor.id)
    .maybeSingle()
  if (lookupError || !appointment) return { error: "This appointment is not available. Refresh to see the latest status." }

  const { error } = await supabase.rpc("set_appointment_status", {
    p_appointment_id: appointmentId,
    p_status: input.status,
    p_cancel_reason: input.status === "cancelled" ? cancelReason || null : null,
  })
  if (error) return { error: friendlyAppointmentError(error.message) }

  if (input.status === "confirmed") await sendBookingAcceptedEmail(appointmentId)
  if (input.status === "cancelled") {
    await (appointment.status === "pending" ? sendBookingRejectedEmail(appointmentId) : sendBookingCancelledByDoctorEmail(appointmentId))
  }

  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/appointments")
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
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

export async function addDoctorAvailabilityDates(input: AvailabilityDateInput): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const today = isoDate(pakistanToday())
  const lastAllowedDate = isoDate(pakistanBookingWindowEnd())
  const dates = availabilityDates(input, today, lastAllowedDate)
  if (!doctor || !dates) {
    return { error: "Please provide valid date, time, and slot length." }
  }

  const supabase = await createClient()
  const { data: existing, error: existingError } = await supabase.from("doctor_availability_overrides").select("override_date").eq("doctor_id", doctor.id).in("override_date", dates)
  if (existingError) return { error: "We couldn't check those dates. Please try again." }
  const existingDates = new Set((existing ?? []).map((item) => item.override_date))
  const datesToAdd = dates.filter((date) => !existingDates.has(date))
  if (!datesToAdd.length) return { success: true, added: 0, skipped: dates.length }

  const { error } = await supabase.from("doctor_availability_overrides").insert(datesToAdd.map((date) => ({ doctor_id: doctor.id, override_date: date, start_time: input.start, end_time: input.end, slot_minutes: input.minutes })))
  if (error) {
    return { error: friendlyAvailabilityError(error.message, "We couldn't save those availability dates. Please try again.") }
  }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true, added: datesToAdd.length, skipped: dates.length - datesToAdd.length }
}

export async function updateDoctorAvailability(input: AvailabilityUpdateInput): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const today = isoDate(pakistanToday())
  const lastAllowedDate = isoDate(pakistanBookingWindowEnd())
  if (!doctor || !validAvailabilityUpdate(input, today, lastAllowedDate)) return { error: "Please provide valid date, time, and slot length." }

  const supabase = await createClient()
  const { error } = await supabase.from("doctor_availability_overrides").update({ override_date: input.date, start_time: input.start, end_time: input.end, slot_minutes: input.minutes }).eq("id", input.id).eq("doctor_id", doctor.id)
  if (error) return { error: friendlyAvailabilityError(error.message, "We couldn't save this availability date. Please try again.") }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true }
}

export async function removeDoctorAvailability(id: number): Promise<AvailabilityResult> {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  if (!doctor || !Number.isInteger(id) || id < 1) return { error: "We couldn't remove this specific date's availability. Please try again." }
  const supabase = await createClient()
  const { error } = await supabase.from("doctor_availability_overrides").delete().eq("id", id).eq("doctor_id", doctor.id)
  if (error) return { error: friendlyAvailabilityError(error.message, "We couldn't remove this availability date. Please try again.") }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
  return { success: true }
}
