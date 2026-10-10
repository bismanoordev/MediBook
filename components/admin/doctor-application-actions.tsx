"use client"

import { CheckCircle2, CircleAlert, Clock3, FileQuestion, Loader2, RotateCcw, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { reviewDoctorApplication, reviewDoctorDocument } from "@/app/admin/actions"
import { doctorApprovalDocumentError, requiredDocumentStatuses, type ApprovalDocument, type ApprovalDocumentStatus } from "@/lib/validation/doctor-approval"

const inputClass = "mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"

const statusStyle: Record<ApprovalDocumentStatus, string> = {
  verified: "text-green-800",
  pending: "text-amber-800",
  needs_action: "text-red-800",
  missing: "text-slate-600",
}

function statusDetails(status: ApprovalDocumentStatus) {
  if (status === "verified") return { label: "Verified", Icon: CheckCircle2 }
  if (status === "pending") return { label: "Pending", Icon: Clock3 }
  if (status === "needs_action") return { label: "Needs action", Icon: CircleAlert }
  return { label: "Not uploaded", Icon: FileQuestion }
}

function RequiredDocumentsChecklist({ documents }: { documents: ApprovalDocument[] }) {
  const required = requiredDocumentStatuses(documents)
  const degree = documents.find((document) => document.doc_type === "degree")?.status ?? "missing"
  const rows: Array<{ label: string; status: ApprovalDocumentStatus; optional?: boolean }> = [
    { label: "CNIC", status: required.cnic },
    { label: "PMDC license", status: required.pmdc_license },
    { label: "Degree certificate", status: degree, optional: true },
  ]

  return <div id="required-documents-checklist" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">Required documents</p><div className="mt-2 grid gap-2">{rows.map((row) => { const { Icon, label } = statusDetails(row.status); return <div key={row.label} className="flex min-w-0 items-center justify-between gap-3 text-sm"><span className="min-w-0 font-medium text-slate-700">{row.label}{row.optional ? <span className="ml-1 text-xs font-normal text-slate-500">Optional</span> : null}</span><span className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${statusStyle[row.status]}`}><Icon className="size-4" aria-hidden="true" />{label}</span></div> })}</div></div>
}

export function DoctorApplicationActions({ doctorId, status, documents }: { doctorId: string; status: string; documents: ApprovalDocument[] }) {
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const approvalError = doctorApprovalDocumentError(documents)

  if (status !== "pending") {
    const isRejected = status === "rejected"
    return <section className={`rounded-2xl border p-5 shadow-sm ${isRejected ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}><h2 className={`text-lg font-semibold ${isRejected ? "text-red-900" : "text-amber-950"}`}>{isRejected ? "Application rejected" : "Changes requested"}</h2><p className={`mt-1 text-sm leading-6 ${isRejected ? "text-red-800" : "text-amber-900"}`}>The doctor must update and submit this application again before it can be reviewed.</p></section>
  }

  function review(decision: "approved" | "rejected" | "changes_requested") {
    setError("")
    if (decision === "approved" && approvalError) { setError(approvalError); return }
    if (decision !== "approved" && !note.trim()) {
      setError(decision === "rejected" ? "Add a reason before rejecting this application." : "Add a note describing the requested changes.")
      return
    }
    startTransition(async () => {
      const result = await reviewDoctorApplication({ doctorId, decision, note })
      if (result.error) { setError(result.error); return }
      toast.success(decision === "approved" ? "Doctor approved." : decision === "rejected" ? "Application rejected." : "Changes requested from the doctor.")
      setNote("")
    })
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Application decision</h2><p className="mt-1 text-sm text-slate-500">Rejecting or requesting changes requires a clear note for the doctor.</p><RequiredDocumentsChecklist documents={documents} /><label className="mt-4 block text-sm font-medium">Review note<textarea value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} placeholder="Explain the decision or requested changes" /></label>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}<div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={pending} aria-describedby={approvalError ? "required-documents-checklist" : undefined} onClick={() => review("approved")} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-60 ${approvalError ? "border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-[#0F766E] text-white hover:bg-[#0D5F59]"}`}>{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Approve</button><button type="button" disabled={pending} onClick={() => review("changes_requested")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"><RotateCcw className="size-4" />Request changes</button><button type="button" disabled={pending} onClick={() => review("rejected")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><XCircle className="size-4" />Reject</button></div></section>
}

export function DoctorDocumentReview({ documentId, status, reviewerNote }: { documentId: string; status: "pending" | "verified" | "needs_action"; reviewerNote: string | null }) {
  const [note, setNote] = useState(reviewerNote ?? "")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function review(nextStatus: "verified" | "needs_action") {
    setError("")
    if (nextStatus === "needs_action" && !note.trim()) { setError("Add a note before requesting changes."); return }
    startTransition(async () => {
      const result = await reviewDoctorDocument({ documentId, status: nextStatus, note })
      if (result.error) { setError(result.error); return }
      toast.success(nextStatus === "verified" ? "Document verified." : "Document changes requested.")
    })
  }

  return <div className="mt-3 border-t border-slate-100 pt-3"><label className="block text-xs font-medium text-slate-600">Reviewer note<textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Required when requesting changes" /></label>{error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}<div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={pending || status === "verified"} onClick={() => review("verified")} className="rounded-lg bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-50">{pending ? "Saving…" : "Verify"}</button><button type="button" disabled={pending} onClick={() => review("needs_action")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Needs action</button></div></div>
}
