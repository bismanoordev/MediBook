import Link from "next/link"
import { CheckCircle2, CircleAlert, Clock3, ExternalLink, FileText, MapPin } from "lucide-react"

import { DoctorApplicationActions, DoctorDocumentReview } from "@/components/admin/doctor-application-actions"
import { DoctorPhoto } from "@/components/doctor-photo"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { DoctorApprovalStatus, Json } from "@/lib/supabase/database.types"

const tabs: { value: DoctorApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "rejected", label: "Rejected" },
  { value: "approved", label: "Approved" },
]
const documentLabels = { cnic: "CNIC", pmdc_license: "PMDC license", degree: "Degree certificate" }
const documentStatus = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  needs_action: "bg-red-100 text-red-800",
}

function DocumentStatusBadge({ status }: { status: "pending" | "verified" | "needs_action" }) {
  const Icon = status === "verified" ? CheckCircle2 : status === "needs_action" ? CircleAlert : Clock3
  const label = status === "needs_action" ? "Needs action" : status[0].toUpperCase() + status.slice(1)
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${documentStatus[status]}`}><Icon className="size-3.5" aria-hidden="true" />{label}</span>
}

type Search = { tab?: string; q?: string; id?: string }
type Qualification = { degree?: string; institution?: string; year?: string }

function applicationHref(params: Search, changes: Partial<Search>) {
  const next = new URLSearchParams()
  const values = { ...params, ...changes }
  Object.entries(values).forEach(([key, value]) => { if (value) next.set(key, value) })
  return `/admin/doctors/applications?${next}`
}

function qualificationsFrom(value: Json): Qualification[] {
  return Array.isArray(value) ? value.filter((item): item is Qualification => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []
}

export default async function DoctorApplicationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin()
  const params = await searchParams
  const selectedTab = tabs.some((tab) => tab.value === params.tab) ? params.tab as DoctorApprovalStatus : "pending"
  const supabase = await createClient()
  let query = supabase.from("doctors").select("id,full_name,photo_url,approval_status,submitted_at,rejection_reason,specialties(name)").in("approval_status", tabs.map((tab) => tab.value)).order("submitted_at", { ascending: false, nullsFirst: false })
  if (params.q?.trim()) query = query.ilike("full_name", `%${params.q.trim().replace(/[,%]/g, "")}%`)
  const { data: applications, error } = await query
  const list = applications ?? []
  const counts = Object.fromEntries(tabs.map((tab) => [tab.value, list.filter((doctor) => doctor.approval_status === tab.value).length])) as Record<DoctorApprovalStatus, number>
  const visible = list.filter((doctor) => doctor.approval_status === selectedTab)
  const selectedId = params.id && visible.some((doctor) => doctor.id === params.id) ? params.id : visible[0]?.id

  const detailResult = selectedId
    ? await supabase.from("doctors").select("*,specialties(name)").eq("id", selectedId).maybeSingle()
    : { data: null, error: null }
  const doctor = detailResult.data
  const documentsResult = doctor
    ? await supabase.from("doctor_documents").select("*").eq("doctor_id", doctor.id).order("uploaded_at")
    : { data: [], error: null }
  const documents = documentsResult.data ?? []
  const signedDocuments = await Promise.all(documents.map(async (document) => {
    const { data } = await supabase.storage.from("doctor-documents").createSignedUrl(document.file_path, 300)
    return { ...document, signedUrl: data?.signedUrl ?? null }
  }))
  const hasError = Boolean(error || detailResult.error || documentsResult.error)

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
    <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Credential review</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Doctor applications</h1>
    <p className="mt-2 text-sm text-slate-600">Review submitted credentials and give doctors a clear next step.</p>

    <form className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
      <input type="hidden" name="tab" value={selectedTab} />
      <label className="sr-only" htmlFor="application-search">Search applications by doctor name</label>
      <input id="application-search" name="q" defaultValue={params.q} placeholder="Search doctor name" className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />
      <button className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">Search</button>
      {params.q ? <Link href={applicationHref(params, { q: undefined })} className="grid h-10 place-items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Clear</Link> : null}
    </form>

    <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Application status filters">{tabs.map((tab) => <Link key={tab.value} href={applicationHref(params, { tab: tab.value, id: undefined })} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${selectedTab === tab.value ? "bg-[#0F766E] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]"}`}>{tab.label} <span className="ml-1 opacity-80">{counts[tab.value]}</span></Link>)}</nav>

    {hasError ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{"We couldn't load all application details. Please refresh and try again."}</p> : null}
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(18rem,.65fr)_minmax(0,1.35fr)]">
      <section aria-label="Applications" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {visible.length ? <div className="grid gap-2">{visible.map((application) => { const specialty = application.specialties as unknown as { name: string } | null; const active = application.id === selectedId; return <Link key={application.id} href={applicationHref(params, { id: application.id })} className={`flex items-center gap-3 rounded-xl p-3 transition ${active ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50"}`}><DoctorPhoto fullName={application.full_name} photoUrl={application.photo_url} className="size-11 rounded-xl" sizes="44px" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{application.full_name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{specialty?.name ?? "No specialty"}</span></span></Link> })}</div> : <div className="p-8 text-center text-sm text-slate-500">{params.q ? "No applications match this search." : `No ${tabs.find((tab) => tab.value === selectedTab)?.label.toLowerCase()} applications.`}</div>}
      </section>

      {doctor ? <section className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start gap-4"><DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} className="size-20 rounded-2xl" sizes="80px" priority /><div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold tracking-tight text-slate-900">{doctor.full_name}</h2><p className="mt-1 text-sm font-medium text-[#0F766E]">{(doctor.specialties as unknown as { name: string } | null)?.name ?? "No specialty"}</p><p className="mt-2 text-sm text-slate-600">Submitted {doctor.submitted_at ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(doctor.submitted_at)) : "not yet submitted"}</p></div></div><div className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Consultation fee</span>Rs. {Number(doctor.fee).toLocaleString()}</p><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Experience</span>{doctor.experience_years ?? "Not provided"} years</p><p className="flex gap-2"><MapPin className="mt-0.5 size-4 text-[#0F766E]" />{doctor.city ?? "City not provided"}</p><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Clinic or hospital</span>{doctor.clinic_name ?? "Not provided"}</p><p className="sm:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">PMDC number</span>{doctor.pmdc_number ?? "Not provided"}</p></div>{doctor.bio ? <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">{doctor.bio}</p> : null}</article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold text-slate-900">Qualifications and practice</h2><p className="mt-1 text-sm text-slate-500">Languages: {doctor.languages.length ? doctor.languages.join(", ") : "Not provided"}</p><div className="mt-4 grid gap-3">{qualificationsFrom(doctor.qualifications).length ? qualificationsFrom(doctor.qualifications).map((qualification, index) => <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-900">{qualification.degree || "Degree"}</p><p className="mt-1 text-slate-600">{qualification.institution || "Institution not provided"}{qualification.year ? ` · ${qualification.year}` : ""}</p></div>) : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No qualifications were provided.</p>}</div></article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold text-slate-900">Documents</h2><p className="mt-1 text-sm text-slate-500">Private files are available only through short-lived secure links.</p><div className="mt-4 grid gap-3">{signedDocuments.length ? signedDocuments.map((document) => <div key={document.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-900">{documentLabels[document.doc_type]}</p><p className="mt-1 truncate text-sm text-slate-500">{document.file_name}</p></div><DocumentStatusBadge status={document.status} /></div>{document.signedUrl ? <a href={document.signedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0F766E] hover:underline"><FileText className="size-4" />Preview or download<ExternalLink className="size-3" /></a> : <p className="mt-3 text-sm text-red-700">{"This file couldn't be opened. Please try again."}</p>}<DoctorDocumentReview documentId={document.id} status={document.status} reviewerNote={document.reviewer_note} /></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No documents have been uploaded.</p>}</div></article>

        <DoctorApplicationActions doctorId={doctor.id} />
      </section> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Select an application to review its details.</section>}
    </div>
  </main>
}
