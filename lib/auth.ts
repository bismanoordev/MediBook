import { cache } from "react"
import { redirect } from "next/navigation"

import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "patient" | "admin"

export const getAuthState = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle()

  return { user, profile }
})

export async function requireUser(returnTo: string) {
  const auth = await getAuthState()

  if (!auth.user) {
    const next = getSafeRedirectPath(returnTo, "/doctors")
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  return auth
}

export async function requireAdmin() {
  const auth = await getAuthState()

  if (!auth.user) {
    redirect("/login?next=%2Fadmin")
  }

  if (auth.profile?.role !== "admin") {
    redirect("/doctors?error=admin_required")
  }

  return auth
}

export async function redirectAuthenticatedUser() {
  const auth = await getAuthState()

  if (auth.user) {
    redirect(auth.profile?.role === "admin" ? "/admin" : "/doctors")
  }
}
