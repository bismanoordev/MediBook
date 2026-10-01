import { ProfileForm } from "@/components/patient/profile-form"
import { AppHeader } from "@/components/app-header"
import { requireUser } from "@/lib/auth"

function getInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return initials.toUpperCase() || "P"
}

export default async function ProfilePage() {
  const { user, profile } = await requireUser("/profile")
  const fullName = profile?.full_name?.trim() ?? ""
  const phone = profile?.phone?.trim() ?? ""
  const needsDetails = !fullName || !phone

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={fullName || undefined} email={user.email} userId={user.id} />

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Account settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Your profile</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Keep your contact details current so the clinic can support your appointments.</p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="account-summary-title">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#0F766E] text-lg font-semibold text-white shadow-sm" aria-hidden="true">{getInitials(fullName)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Patient account</p>
              <h2 id="account-summary-title" className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">{fullName || "Complete your profile"}</h2>
              <p className="mt-1 truncate text-sm text-slate-600">{user.email ?? "Your account email"}</p>
            </div>
            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">Private account</span>
          </div>
          {needsDetails ? <div className="border-t border-teal-100 bg-teal-50/70 px-5 py-3 text-sm leading-6 text-slate-700 sm:px-7">Add your name and phone number below to complete your account details.</div> : null}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="personal-details-title">
          <div>
            <h2 id="personal-details-title" className="text-xl font-semibold tracking-tight text-slate-900">Personal details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only your name and phone number can be updated here. Your sign-in email stays read-only.</p>
          </div>
          <ProfileForm userId={user.id} fullName={fullName} phone={phone} />
        </section>
      </main>
    </div>
  )
}
