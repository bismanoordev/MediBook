import { NextResponse } from "next/server"

import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { getHomePath } from "@/lib/home-path"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : { data: null }
      const { data: doctor } = profile?.role === "doctor" && user
        ? await supabase.from("doctors").select("approval_status").eq("user_id", user.id).maybeSingle()
        : { data: null }
      const next = getSafeRedirectPath(url.searchParams.get("next"), getHomePath(profile?.role, doctor?.approval_status))

      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  return NextResponse.redirect(new URL("/login?message=invalid_link", url.origin))
}
