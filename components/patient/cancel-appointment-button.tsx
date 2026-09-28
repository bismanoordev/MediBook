"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function cancel() {
    if (!window.confirm("Cancel this appointment? This cannot be undone.")) return
    setLoading(true)
    const { error } = await createClient().rpc("cancel_appointment", { p_appointment_id: appointmentId })
    setLoading(false)
    if (error) return toast.error(error.message.includes("2 hours") ? "Appointments can only be cancelled more than 2 hours ahead." : "We could not cancel this appointment. Please try again.")
    toast.success("Your appointment has been cancelled.")
    router.refresh()
  }
  return <Button onClick={cancel} disabled={loading} variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">{loading ? "Cancelling..." : "Cancel appointment"}</Button>
}
