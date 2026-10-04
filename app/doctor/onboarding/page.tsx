import { redirect } from "next/navigation"
import { DoctorOnboardingForm } from "@/components/doctor/doctor-onboarding-form"
import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorOnboardingPage() {
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  if (!user || !doctor) redirect("/doctors")
  if (!["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor")
  const supabase = await createClient()
  const [{ data: specialties }, { data: documents }] = await Promise.all([supabase.from("specialties").select("id,name").order("name"), supabase.from("doctor_documents").select("doc_type,file_name,status,reviewer_note").eq("doctor_id", doctor.id)])
  return <DoctorOnboardingForm userId={user.id} doctor={doctor} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} specialties={specialties ?? []} documents={documents ?? []} />
}
