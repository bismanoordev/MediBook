import Link from "next/link"

import { createClient } from "@/lib/supabase/server"

export default async function AdminPatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams
  const supabase = await createClient()
  let query = supabase.from("profiles").select("id, full_name, phone, created_at").eq("role", "patient").order("created_at", { ascending: false })
  if (q.trim()) query = query.ilike("full_name", "%" + q.trim() + "%")
  const { data: patients, error } = await query
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Patient directory</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Patients</h1><form className="mt-6 flex max-w-lg gap-2"><input name="q" defaultValue={q} placeholder="Search patient by name" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E]" /><button className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">Search</button>{q ? <Link href="/admin/patients" className="grid h-10 place-items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Clear</Link> : null}</form>{error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load patients. Please refresh and try again.</p> : patients?.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{patients.map((patient) => <div key={patient.id} className="grid gap-1 p-4 sm:grid-cols-3 sm:items-center"><strong className="text-sm">{patient.full_name ?? "Name not added"}</strong><span className="text-sm text-slate-600">{patient.phone ?? "No phone"}</span><span className="text-xs text-slate-500">Joined {new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(patient.created_at))}</span></div>)}</div></div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No patients match your search.</div>}</main>
}
