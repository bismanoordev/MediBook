"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { sendBookingCancelledByPatientEmail } from "@/lib/email/booking-emails"
import { createClient } from "@/lib/supabase/server"

type CancelAppointmentResult = { error?: string; success?: true }

export async function cancelPatientAppointment(appointmentId: string): Promise<CancelAppointmentResult> {
  const { user, profile } = await requireUser("/appointments")
  if (profile?.role !== "patient" || !/^[0-9a-f-]{36}$/i.test(appointmentId)) {
    return { error: "We couldn't cancel this appointment. Please refresh and try again." }
  }

  const supabase = await createClient()
  const { data: appointment, error: lookupError } = await supabase
    .from("appointments")
    .select("id,status")
    .eq("id", appointmentId)
    .eq("patient_id", user.id)
    .maybeSingle()

  if (lookupError || !appointment || !["pending", "confirmed"].includes(appointment.status)) {
    return { error: "This appointment can no longer be cancelled. Please refresh to see its latest status." }
  }

  const { error } = await supabase.rpc("cancel_appointment", { p_appointment_id: appointmentId })
  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes("2 hours")) return { error: "Appointments can only be cancelled more than 2 hours ahead." }
    if (message.includes("not found") || message.includes("cannot be cancelled")) return { error: "This appointment can no longer be cancelled. Please refresh to see its latest status." }
    return { error: "We couldn't cancel this appointment. Please try again." }
  }

  await sendBookingCancelledByPatientEmail(appointmentId)
  revalidatePath("/appointments")
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
  return { success: true }
}
