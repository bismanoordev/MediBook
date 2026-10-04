"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { reviewProfileChange } from "@/app/admin/actions"

export function ProfileChangeActions({ changeId, status }: { changeId: string; status: "pending" | "approved" | "rejected" }) {
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  if (status !== "pending") return null
  function review(approve: boolean) {
    setError("")
    if (!approve && !note.trim()) { setError("Add a note before rejecting these changes."); return }
    startTransition(async () => {
      const result = await reviewProfileChange({ changeId, approve, note })
      if (result.error) { setError(result.error); return }
      toast.success(approve ? "Profile changes approved." : "Profile changes rejected.")
      setNote("")
    })
  }
  return <div className="mt-4 border-t border-slate-100 pt-4"><label className="block text-sm font-medium">Admin note <span className="font-normal text-slate-500">(required to reject)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Optional approval note or required rejection reason" /></label>{error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => review(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Approve changes</button><button type="button" disabled={pending} onClick={() => review(false)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><XCircle className="size-4" />Reject changes</button></div></div>
}
