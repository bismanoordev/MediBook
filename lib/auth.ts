import { cache } from "react"
import { redirect } from "next/navigation"

import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { getHomePath } from "@/lib/home-path"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type UserRole = "patient" | "doctor" | "admin"

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
    redirect(auth.profile?.role === "doctor" ? "/doctor" : "/doctors?error=admin_required")
  }

  return auth
}

export async function requireDoctor() {
  const auth = await getAuthState()

  if (!auth.user) redirect("/login?next=%2Fdoctor")
  if (auth.profile?.role !== "doctor") redirect("/doctors")

  return auth
}

export const getDoctorRecord = cache(async (): Promise<Tables<"doctors"> | null> => {
  const auth = await getAuthState()
  if (!auth.user || auth.profile?.role !== "doctor") return null

  const supabase = await createClient()
  const { data } = await supabase.from("doctors").select("*").eq("user_id", auth.user.id).maybeSingle()
  return data
})

export async function redirectAuthenticatedUser() {
  const auth = await getAuthState()

  if (auth.user) {
    const doctor = await getDoctorRecord()
    redirect(getHomePath(auth.profile?.role, doctor?.approval_status))
  }
}
