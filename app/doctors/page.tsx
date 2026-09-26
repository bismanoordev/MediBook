import Link from "next/link"

import { AppHeader } from "@/components/app-header"
import { buttonVariants } from "@/components/ui/button"
import { getAuthState } from "@/lib/auth"
import { cn } from "@/lib/utils"

type DoctorsPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const { user, profile } = await getAuthState()
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {user ? (
        <AppHeader name={profile?.full_name} />
      ) : (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="font-bold text-[#0F766E]">MediBook</Link>
            <Link href="/login?next=/doctors" className={cn(buttonVariants(), "rounded-full bg-[#0F766E] hover:bg-[#115E59]")}>Log in</Link>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {error === "admin_required" ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">That area is only available to clinic administrators.</div>
        ) : null}
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Find care</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Choose your doctor</h1>
        <p className="mt-3 max-w-2xl text-slate-600">The doctor directory and live slot picker will be built in Phase 5. Your Supabase connection and route are ready.</p>
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Doctor cards will appear here in Phase 5.</div>
      </main>
    </div>
  )
}
