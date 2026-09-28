"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
export function BookingForm({ doctorId, date, time }: { doctorId: string; date: string; time: string }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, date, time, reason }),
    })
    const result = await response.json().catch(() => ({ error: "We could not save your appointment. Please try again." })) as { error?: string }
    setLoading(false)
    if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    if (!response.ok) return toast.error(result.error ?? "We could not save your appointment. Please try again.")
    toast.success("Your appointment request has been sent.")
    router.replace("/appointments")
  }
  return <form onSubmit={book} className="mt-4 grid gap-3"><label className="grid gap-1.5 text-sm font-medium">Reason for visit <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." /></label><Button type="submit" disabled={loading} className="h-10 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? "Booking..." : "Confirm booking"}</Button></form>
}
