import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"

type AppHeaderProps = {
  name?: string | null
  admin?: boolean
}

export function AppHeader({ name, admin = false }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-7">
          <Link href={admin ? "/admin" : "/doctors"} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-sm text-white">M</span>
            MediBook
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">
            {admin ? (
              <>
                <Link href="/admin">Dashboard</Link>
                <Link href="/admin/doctors">Doctors</Link>
                <Link href="/admin/appointments">Appointments</Link>
                <Link href="/admin/patients">Patients</Link>
              </>
            ) : (
              <>
                <Link href="/doctors">Doctors</Link>
                <Link href="/appointments">Appointments</Link>
                <Link href="/profile">Profile</Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {name ? <span className="hidden text-sm text-slate-600 md:inline">{name}</span> : null}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
