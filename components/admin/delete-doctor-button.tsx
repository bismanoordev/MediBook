"use client"

import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteDoctor } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function DeleteDoctorButton({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function removeDoctor() {
    startTransition(async () => {
      const result = await deleteDoctor(doctorId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`${doctorName} was removed.`)
      router.refresh()
    })
  }

  return <Dialog><DialogTrigger render={<button type="button" disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:h-9" />}><Trash2 className="size-3.5" aria-hidden="true" />Remove doctor</DialogTrigger><DialogContent showCloseButton={false} className="max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"><DialogHeader className="gap-3 p-6 pb-4"><span className="grid size-11 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle className="size-5" aria-hidden="true" /></span><DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">Remove doctor?</DialogTitle><DialogDescription className="leading-6 text-slate-600">Permanently remove <span className="font-semibold text-slate-900">{doctorName}</span>? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter className="-mx-0 -mb-0 rounded-b-2xl border-slate-200 bg-slate-50/70 px-6 py-4"><DialogClose render={<Button type="button" variant="outline" className="h-11 rounded-xl border-slate-300 bg-white" />}>Cancel</DialogClose><Button type="button" disabled={pending} onClick={removeDoctor} className="h-11 rounded-xl bg-red-600 px-4 font-semibold text-white hover:bg-red-700">{pending ? <><Loader2 className="animate-spin" aria-hidden="true" />Removing...</> : <><Trash2 className="size-4" aria-hidden="true" />Remove doctor</>}</Button></DialogFooter></DialogContent></Dialog>
}
