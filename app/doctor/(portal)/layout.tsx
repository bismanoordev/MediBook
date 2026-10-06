import { DoctorShell } from "@/components/doctor/doctor-shell"
import { LogoutButton } from "@/components/auth/logout-button"
import { getAuthState, getDoctorRecord } from "@/lib/auth"

export default async function DoctorPortalLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])

  if (!user) return children
  if (!doctor) return <main className="grid min-h-screen place-items-center bg-[#F8FAFC] p-5"><section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Your doctor profile is not available.</h1><p className="mt-2 text-sm leading-6 text-slate-600">Please contact support.</p><LogoutButton className="mt-5 h-11 rounded-xl" /></section></main>
  return <DoctorShell name={profile?.full_name} email={user.email} userId={user.id} approvalStatus={doctor?.approval_status ?? null} rejectionReason={doctor?.rejection_reason}>{children}</DoctorShell>
}
