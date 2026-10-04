import { DoctorShell } from "@/components/doctor/doctor-shell"
import { getAuthState, getDoctorRecord } from "@/lib/auth"

export default async function DoctorPortalLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])

  if (!user) return children
  return <DoctorShell name={profile?.full_name} email={user.email} userId={user.id} approvalStatus={doctor?.approval_status ?? null} rejectionReason={doctor?.rejection_reason}>{children}</DoctorShell>
}
