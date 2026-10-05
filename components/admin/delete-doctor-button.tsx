"use client"

import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteDoctor } from "@/app/admin/actions"

export function DeleteDoctorButton({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function removeDoctor() {
    if (!window.confirm(`Permanently remove ${doctorName}? This cannot be undone.`)) return

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

  return <button type="button" disabled={pending} onClick={removeDoctor} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 className="size-3.5" aria-hidden="true" />{pending ? <Loader2 className="size-3.5 animate-spin" aria-label="Removing doctor" /> : null}Remove doctor</button>
}
