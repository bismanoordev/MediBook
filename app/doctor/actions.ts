"use server"

import { revalidatePath } from "next/cache"

import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

type AppointmentMutationResult = { error?: string; success?: true }
type AppointmentStatus = "confirmed" | "cancelled" | "completed"

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
