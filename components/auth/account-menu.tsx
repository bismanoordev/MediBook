"use client"

import { ChevronDown, UserRound } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"

type AccountMenuProps = {
  name?: string | null
  email?: string | null
  role?: "patient" | "admin"
}

function getInitials(name?: string | null) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return initials?.toUpperCase() || "M"
}

export function AccountMenu({ name, email, role = "patient" }: AccountMenuProps) {
  const displayName = name?.trim() || "My account"
  const roleLabel = role === "admin" ? "Administrator" : "Patient account"

  return (
    <details className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 pr-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span className="grid size-7 place-items-center rounded-full bg-[#CCFBF1] text-xs font-bold text-[#0F766E]" aria-hidden="true">{getInitials(name)}</span>
        <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
        <ChevronDown className="size-4 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
        <span className="sr-only">Open account menu</span>
      </summary>

      <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="flex items-center gap-3 px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]" aria-hidden="true"><UserRound className="size-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{email ?? "Signed-in MediBook user"}</p>
          </div>
        </div>
        <p className="mx-2 border-t border-slate-100 px-3 py-3 text-xs font-medium text-slate-600">{roleLabel}</p>
        <div className="border-t border-slate-100 p-2 [&>button]:w-full [&>button]:justify-start">
          <LogoutButton />
        </div>
      </div>
    </details>
  )
}
