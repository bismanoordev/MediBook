import Link from "next/link"

import { AppHeader } from "@/components/app-header"
import { buttonVariants } from "@/components/ui/button"
import { getAuthState } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type DoctorsPageProps = { searchParams: Promise<{ error?: string; specialty?: string }> }

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const { user, profile } = await getAuthState()
  const { error, specialty } = await searchParams
  const supabase = await createClient()
  const [{ data: specialties, error: specialtiesError }, { data: doctors, error: doctorsError }] = await Promise.all([
    supabase.from("specialties").select("id, name").order("name"),
    supabase.from("doctors").select("id, specialty_id, full_name, bio, fee, photo_url, specialties(name)").order("full_name"),
  ])
  const selectedSpecialty = specialty && /^\d+$/.test(specialty) ? Number(specialty) : undefined
  const filteredDoctors = selectedSpecialty ? (doctors ?? []).filter((doctor) => (doctor as { specialty_id?: number }).specialty_id === selectedSpecialty) : doctors

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {user ? (
        <AppHeader name={profile?.full_name} userId={user.id} />
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
        <p className="mt-3 max-w-2xl text-slate-600">Browse experienced clinicians, then choose a time that works for you.</p>
        {specialtiesError || doctorsError ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load doctors right now. Please refresh and try again.</div> : <>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Filter doctors by specialty"><Link href="/doctors" className={cn(buttonVariants({ variant: !selectedSpecialty ? "default" : "outline" }), "h-9 rounded-xl", !selectedSpecialty && "bg-[#0F766E] hover:bg-[#0D5F59]")}>All specialties</Link>{specialties?.map((item) => <Link key={item.id} href={`/doctors?specialty=${item.id}`} className={cn(buttonVariants({ variant: selectedSpecialty === item.id ? "default" : "outline" }), "h-9 rounded-xl", selectedSpecialty === item.id && "bg-[#0F766E] hover:bg-[#0D5F59]")}>{item.name}</Link>)}</div>
          {filteredDoctors?.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredDoctors.map((doctor) => { const specialtyName = (doctor.specialties as unknown as { name: string } | null)?.name; return <article key={doctor.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-50 font-semibold text-[#0F766E]">{doctor.full_name.split(" ").slice(1, 3).map((part) => part[0]).join("")}</div><div><h2 className="font-semibold text-slate-900">{doctor.full_name}</h2><p className="mt-1 text-sm text-[#0F766E]">{specialtyName ?? "Clinic doctor"}</p></div></div><p className="mt-5 min-h-10 text-sm leading-5 text-slate-600">{doctor.bio ?? "Professional care tailored to your needs."}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-medium text-slate-700">Rs. {Number(doctor.fee).toLocaleString()}</span><Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>View availability</Link></div></article> })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No doctors match this specialty yet.</div>}
        </>}
      </main>
    </div>
  )
}
