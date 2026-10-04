"use server"

import { revalidatePath } from "next/cache"

import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

type AppointmentMutationResult = { error?: string; success?: true }
type AppointmentStatus = "confirmed" | "cancelled" | "completed"
type AvailabilityResult = { error?: string; success?: true }

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

export async function saveDoctorSchedule(formData: FormData) {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  const day = Number(formData.get("day_of_week"))
  const start = String(formData.get("start_time") ?? "")
  const end = String(formData.get("end_time") ?? "")
  const minutes = Number(formData.get("slot_minutes"))
  if (!doctor || !Number.isInteger(day) || day < 0 || day > 6) return

  const supabase = await createClient()
  if (formData.get("enabled") !== "true") {
    await supabase.from("doctor_schedules").delete().eq("doctor_id", doctor.id).eq("day_of_week", day)
  } else if (/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && [15, 20, 30, 60].includes(minutes) && end > start) {
    await supabase.from("doctor_schedules").upsert({ doctor_id: doctor.id, day_of_week: day, start_time: start, end_time: end, slot_minutes: minutes }, { onConflict: "doctor_id,day_of_week" })
  }
  revalidatePath("/doctor/availability")
  revalidatePath(`/doctors/${doctor.id}`)
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
