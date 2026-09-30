"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statuses = new Set(["pending", "confirmed", "cancelled", "completed"])

export async function createDoctor(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("full_name") ?? "").trim()
  const fee = Number(formData.get("fee"))
  const specialtyId = Number(formData.get("specialty_id"))
  if (!name || !Number.isFinite(fee) || fee < 0) return
  const supabase = await createClient()
  await supabase.from("doctors").insert({ full_name: name, fee, specialty_id: Number.isInteger(specialtyId) && specialtyId > 0 ? specialtyId : null, bio: String(formData.get("bio") ?? "").trim() || null, photo_url: String(formData.get("photo_url") ?? "").trim() || null })
  revalidatePath("/admin/doctors")
  revalidatePath("/doctors")
}

export async function updateDoctor(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("full_name") ?? "").trim()
  const fee = Number(formData.get("fee"))
  const specialtyId = Number(formData.get("specialty_id"))
  if (!id || !name || !Number.isFinite(fee) || fee < 0) return
  const supabase = await createClient()
  await supabase.from("doctors").update({ full_name: name, fee, specialty_id: Number.isInteger(specialtyId) && specialtyId > 0 ? specialtyId : null, bio: String(formData.get("bio") ?? "").trim() || null }).eq("id", id)
  revalidatePath("/admin/doctors")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${id}`)
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
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || ![15, 20, 30, 60].includes(minutes)) return
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
