"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function BookingForm({ doctorId, date, time }: { doctorId: string; date: string; time: string }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    const { error } = await supabase.from("appointments").insert({ patient_id: user.id, doctor_id: doctorId, appointment_date: date, start_time: time, reason: reason.trim() || null })
    setLoading(false)
    if (error) return toast.error(error.message.includes("appointments_no_double_booking") ? "That slot was just booked. Please select another time." : "We could not book that slot. Please try again.")
    toast.success("Your appointment request has been sent.")
    router.push("/appointments")
    router.refresh()
  }
  return <form onSubmit={book} className="mt-4 grid gap-3"><label className="grid gap-1.5 text-sm font-medium">Reason for visit <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." /></label><Button type="submit" disabled={loading} className="h-10 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? "Booking..." : "Confirm booking"}</Button></form>
}
