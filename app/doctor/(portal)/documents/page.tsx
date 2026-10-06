import { DoctorDocumentsTable } from "@/components/doctor/doctor-documents-table"
import { redirect } from "next/navigation"
import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorDocumentsPage() {
  const [{ user }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  if (!user || !doctor) return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")
  const supabase = await createClient()
  const { data: documents, error } = await supabase.from("doctor_documents").select("id,doc_type,file_path,file_name,status,reviewer_note,uploaded_at").eq("doctor_id", doctor.id).order("uploaded_at", { ascending: false })
  const files = await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("doctor-documents").createSignedUrl(document.file_path, 300)
    return { ...document, signedUrl: data?.signedUrl ?? null }
  }))
  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Credential records</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">My documents</h1><p className="mt-2 text-sm leading-6 text-slate-600">Keep your professional documents current. Files are private and visible only to you and clinic administrators.</p>{error ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load your documents. Please refresh and try again.</p> : <DoctorDocumentsTable userId={user.id} doctorId={doctor.id} documents={files} />}</main>
}
