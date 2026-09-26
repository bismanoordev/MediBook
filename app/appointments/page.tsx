import { AppHeader } from "@/components/app-header"
import { requireUser } from "@/lib/auth"

export default async function AppointmentsPage() {
  const { profile } = await requireUser("/appointments")

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={profile?.full_name} />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">My appointments</h1>
        <p className="mt-3 text-slate-600">Your appointment list will be added in Phase 5.</p>
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No appointments to show yet.</div>
      </main>
    </div>
  )
}
