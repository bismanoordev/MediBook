import Link from "next/link"
import { redirect } from "next/navigation"

import { DoctorProfileForm } from "@/components/doctor/doctor-profile-form"
import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorProfilePage() {
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  if (!user || !doctor) return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")
  if (doctor.approval_status !== "approved") return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10"><section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-2xl font-semibold text-slate-900">Profile editing is available after approval</h1><p className="mt-2 text-sm leading-6 text-slate-700">Complete or update your onboarding application first. Your public profile will become editable once the clinic approves it.</p><Link href="/doctor/onboarding" className="mt-5 inline-flex rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D5F59]">Go to onboarding</Link></section></main>
  const supabase = await createClient()
  const [{ data: specialties }, { data: pendingChange, error }] = await Promise.all([
    supabase.from("specialties").select("id,name").order("name"),
    supabase.from("doctor_profile_changes").select("id,created_at").eq("doctor_id", doctor.id).eq("status", "pending").maybeSingle(),
  ])
  return <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">{error ? <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load your pending profile review. Please refresh and try again.</p> : null}<DoctorProfileForm userId={user.id} phone={profile?.phone ?? ""} doctor={doctor} specialties={specialties ?? []} pendingChange={pendingChange} /></main>
}
