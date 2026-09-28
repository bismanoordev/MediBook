"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function cancel() {
    setLoading(true)
    const { error } = await createClient().rpc("cancel_appointment", { p_appointment_id: appointmentId })
    setLoading(false)

    if (error) return toast.error(error.message.includes("2 hours") ? "Appointments can only be cancelled more than 2 hours ahead." : "We could not cancel this appointment. Please try again.")

    setOpen(false)
    toast.success("Your appointment has been cancelled.")
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        variant="outline"
        className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        Cancel appointment
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
        <DialogContent showCloseButton={!loading} className="max-w-md rounded-2xl p-6 shadow-xl">
          <DialogHeader className="gap-3 pr-8">
            <DialogTitle className="text-xl font-semibold text-slate-900">Cancel appointment?</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Keep appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={cancel}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? "Cancelling..." : "Yes, cancel appointment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
