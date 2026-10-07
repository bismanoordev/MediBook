import { redirect } from "next/navigation"
import Link from "next/link"
import { HeartPulse } from "lucide-react"

import { AccountMenu } from "@/components/auth/account-menu"
import { DoctorOnboardingForm } from "@/components/doctor/doctor-onboarding-form"
import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorOnboardingPage() {
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  if (!user || !doctor) redirect("/doctors")
  if (!["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor")
  const supabase = await createClient()
  const [{ data: specialties }, { data: documents }] = await Promise.all([supabase.from("specialties").select("id,name").order("name"), supabase.from("doctor_documents").select("doc_type,file_name,status,reviewer_note").eq("doctor_id", doctor.id)])
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 rounded-xl font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-white shadow-sm"><HeartPulse className="size-4" aria-hidden="true" /></span>
            MediBook
          </Link>
          <AccountMenu userId={user.id} name={profile?.full_name} email={user.email} role="doctor" avatarUrl={doctor.photo_url} />
        </div>
      </header>
      <DoctorOnboardingForm userId={user.id} doctor={doctor} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} specialties={specialties ?? []} documents={documents ?? []} />
    </div>
  )
}
