"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, UserRound } from "lucide-react"
import Image from "next/image"

import { LogoutButton } from "@/components/auth/logout-button"
import { createClient } from "@/lib/supabase/client"

type AccountMenuProps = {
  userId: string
  name?: string | null
  email?: string | null
  role?: "patient" | "doctor" | "admin"
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

export function AccountMenu({ userId, name, email, role = "patient" }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [profileName, setProfileName] = useState(name?.trim() ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const displayName = profileName || "My account"
  const roleLabel = role === "admin" ? "Admin account" : role === "doctor" ? "Doctor account" : "Patient account"

  useEffect(() => {
    let active = true

    async function loadProfileName() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (active) { setProfileName(data?.full_name?.trim() ?? ""); setAvatarUrl(data?.avatar_url ?? null) }
    }

    void loadProfileName()
    return () => { active = false }
  }, [name, userId])

  useEffect(() => {
    if (!open) return

    function closeWhenOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", closeWhenOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 pr-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
      >
        <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-[#CCFBF1] text-xs font-bold text-[#0F766E]" aria-hidden="true">{avatarUrl ? <Image src={avatarUrl} alt="" width={28} height={28} unoptimized className="size-full object-cover" /> : getInitials(profileName)}</span>
        <span className="max-w-24 truncate">{displayName}</span>
        <ChevronDown className={`size-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open ? <div id={menuId} role="menu" aria-label="My account" className="absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="flex items-center gap-3 px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-teal-50 text-[#0F766E]" aria-hidden="true">{avatarUrl ? <Image src={avatarUrl} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : <UserRound className="size-4" />}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{email ?? "Signed-in MediBook user"}</p>
          </div>
        </div>
        <p className="mx-2 border-t border-slate-100 px-3 py-3 text-xs font-medium text-slate-600">{roleLabel}</p>
        <div className="border-t border-slate-100 p-2">
          <LogoutButton role="menuitem" className="w-full justify-start" />
        </div>
      </div> : null}
    </div>
  )
}
