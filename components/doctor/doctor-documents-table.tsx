"use client"

import { CheckCircle2, CircleAlert, Clock3, ExternalLink, FileText, Loader2, LockKeyhole, Upload } from "lucide-react"
import { ChangeEvent, useState } from "react"
import { toast } from "sonner"

import { replaceDoctorDocument } from "@/app/doctor/actions"

type DocumentType = "cnic" | "pmdc_license" | "degree"
type Status = "pending" | "verified" | "needs_action"
type Document = { id: string; doc_type: DocumentType; file_path: string; file_name: string; status: Status; reviewer_note: string | null; uploaded_at: string; signedUrl: string | null }
type Props = { documents: Document[] }
const documentTypes: { type: DocumentType; name: string; required: boolean }[] = [{ type: "cnic", name: "CNIC", required: true }, { type: "pmdc_license", name: "PMDC license", required: true }, { type: "degree", name: "Degree certificate", required: false }]

function StatusBadge({ status }: { status: Status | "missing" }) {
  const Icon = status === "verified" ? CheckCircle2 : status === "needs_action" ? CircleAlert : status === "pending" ? Clock3 : FileText
  const label = status === "needs_action" ? "Needs action" : status[0].toUpperCase() + status.slice(1)
  const colors = status === "verified" ? "bg-green-100 text-green-800" : status === "needs_action" ? "bg-red-100 text-red-800" : status === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}><Icon className="size-3.5" />{label}</span>
}

export function DoctorDocumentsTable({ documents }: Props) {
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState<DocumentType | null>(null)
  const byType = new Map(documents.map((document) => [document.doc_type, document]))
  const counts = { verified: documents.filter((document) => document.status === "verified").length, pending: documents.filter((document) => document.status === "pending").length, needsAction: documents.filter((document) => document.status === "needs_action").length, missing: documentTypes.filter(({ type }) => !byType.has(type)).length }

  async function upload(type: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 5_242_880) { setError("Use a JPG, PNG, or PDF file smaller than 5 MB."); return }
    setError(""); setUploading(type)
    const formData = new FormData()
    formData.set("doc_type", type)
    formData.set("file", file)
    const result = await replaceDoctorDocument(formData)
    setUploading(null)
    event.target.value = ""
    if (result.error) { setError(result.error); return }
    toast.success("Document uploaded for review.")
  }

  return <><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Document summary"><Summary label="Verified" value={counts.verified} status="verified" /><Summary label="Pending" value={counts.pending} status="pending" /><Summary label="Needs action" value={counts.needsAction} status="needs_action" /><Summary label="Missing" value={counts.missing} status="missing" /></section>{error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}<section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-900">Document status</h2><p className="mt-1 text-sm text-slate-500">Upload JPG, PNG, or PDF files up to 5 MB. You can replace a file only when the admin asks for changes. Verified files are locked.</p></div><div className="divide-y divide-slate-100">{documentTypes.map(({ type, name, required }) => { const document = byType.get(type); const status = document?.status ?? "missing"; const busy = uploading === type; const canUpload = status === "missing" || status === "needs_action"; return <article key={type} className="grid gap-4 p-5 sm:grid-cols-[minmax(9rem,.65fr)_minmax(0,1fr)_auto] sm:items-center sm:px-6"><div><p className="font-semibold text-slate-900">{name}{required ? <span className="text-red-700"> *</span> : null}</p><StatusBadge status={status} /></div><div className="min-w-0">{document ? <><p className="truncate text-sm font-medium text-slate-700" title={document.file_name}>{document.file_name}</p><p className="mt-1 text-xs text-slate-500">Uploaded {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(document.uploaded_at))}</p>{document.signedUrl ? <a href={document.signedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0F766E] hover:underline"><ExternalLink className="size-4" />Open private file</a> : <p className="mt-2 text-sm text-red-700">This file couldn&apos;t be opened. Please try again.</p>}</> : <p className="text-sm text-slate-500">Not uploaded yet.</p>}</div><div className="min-w-0 sm:justify-self-end">{canUpload ? <>{status === "needs_action" ? <p className="mb-3 max-w-xs break-words rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800"><span className="font-semibold">Reviewer note: </span>{document?.reviewer_note || "The admin asked for changes to this file."}</p> : null}<label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:ring-offset-2"><Upload className="size-4" />{busy ? <Loader2 className="size-4 animate-spin" /> : status === "needs_action" ? "Replace" : "Upload"}<input type="file" disabled={busy} className="sr-only" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void upload(type, event)} /></label></> : status === "pending" ? <p className="inline-flex max-w-xs items-start gap-2 text-sm text-slate-500"><Clock3 className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />Waiting for admin review. You can replace this file only if the admin asks for changes.</p> : <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-800"><LockKeyhole className="size-4" aria-hidden="true" />Verified files are locked</p>}</div></article> })}</div></section></>
}

function Summary({ label, value, status }: { label: string; value: number; status: Status | "missing" }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><StatusBadge status={status} /><p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{label} documents</p></article> }
