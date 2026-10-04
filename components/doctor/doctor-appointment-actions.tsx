"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { updateDoctorAppointment } from "@/app/doctor/actions"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Props = { appointmentId: string; status: "pending" | "confirmed" | "cancelled" | "completed"; canComplete: boolean }

export function DoctorAppointmentActions({ appointmentId, status, canComplete }: Props) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function run(statusToSet: "confirmed" | "cancelled" | "completed") {
    setError("")
    startTransition(async () => {
      const result = await updateDoctorAppointment({ appointmentId, status: statusToSet, cancelReason: reason })
      if (result.error) { setError(result.error); return }
      toast.success(statusToSet === "confirmed" ? "Appointment confirmed." : statusToSet === "completed" ? "Appointment marked completed." : "Appointment declined.")
      setOpen(false)
      setReason("")
    })
  }

  return <div className="flex flex-wrap gap-2">
    {status === "pending" ? <button type="button" disabled={pending} onClick={() => run("confirmed")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Confirm</button> : null}
    {status === "confirmed" && canComplete ? <button type="button" disabled={pending} onClick={() => run("completed")} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Mark completed</button> : null}
    {!['cancelled', 'completed'].includes(status) ? <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50" />}><XCircle className="size-4" />Decline</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Decline appointment?</DialogTitle><DialogDescription>You can add an optional reason for the patient.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-medium">Reason (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="min-h-24 rounded-xl border border-slate-200 p-3 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Explain why you are unable to see this patient" /></label>{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<DialogFooter><button type="button" disabled={pending} onClick={() => run("cancelled")} className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{pending ? "Declining…" : "Decline appointment"}</button></DialogFooter></DialogContent></Dialog> : null}
    {error && !open ? <p role="alert" className="basis-full text-sm text-red-700">{error}</p> : null}
  </div>
}
