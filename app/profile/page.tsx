import { AppHeader } from "@/components/app-header"
import { requireUser } from "@/lib/auth"
import { ProfileForm } from "@/components/patient/profile-form"

export default async function ProfilePage() {
  const { user, profile } = await requireUser("/profile")

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={profile?.full_name} userId={user.id} />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Full name</dt><dd className="mt-1 font-medium">{profile?.full_name || "Not added"}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="mt-1 font-medium">{profile?.phone || "Not added"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Email</dt><dd className="mt-1 font-medium">{user.email}</dd></div>
          </dl>
          <ProfileForm userId={user.id} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
        </div>
      </main>
    </div>
  )
}
