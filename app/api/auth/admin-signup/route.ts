import { timingSafeEqual } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { getFriendlyAuthError } from "@/lib/auth-errors"
import type { Database } from "@/lib/supabase/database.types"
import { getSupabaseEnv } from "@/lib/supabase/env"

type AdminSignupPayload = {
  fullName?: unknown
  phone?: unknown
  email?: unknown
  password?: unknown
  accessCode?: unknown
}

function matchesAccessCode(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate)
  const expectedBuffer = Buffer.from(expected)

  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  )
}

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const expectedAccessCode = process.env.ADMIN_SIGNUP_CODE

  if (!serviceRoleKey || !expectedAccessCode) {
    return NextResponse.json(
      { error: "Admin signup has not been configured yet. Contact the clinic owner." },
      { status: 503 },
    )
  }

  let payload: AdminSignupPayload

  try {
    payload = (await request.json()) as AdminSignupPayload
  } catch {
    return NextResponse.json({ error: "Invalid signup request." }, { status: 400 })
  }

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : ""
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : ""
  const email = typeof payload.email === "string" ? payload.email.trim() : ""
  const password = typeof payload.password === "string" ? payload.password : ""
  const accessCode =
    typeof payload.accessCode === "string" ? payload.accessCode.trim() : ""

  if (fullName.length < 2 || phone.length < 7 || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Complete all fields with valid account details." },
      { status: 400 },
    )
  }

  if (
    accessCode.length > 256 ||
    !matchesAccessCode(accessCode, expectedAccessCode)
  ) {
    return NextResponse.json(
      { error: "The admin invitation code is invalid." },
      { status: 403 },
    )
  }

  const { url, key } = getSupabaseEnv()
  const signupClient = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error: signupError } = await signupClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=/admin`,
    },
  })

  if (signupError) {
    return NextResponse.json(
      { error: getFriendlyAuthError(signupError.message) },
      { status: 400 },
    )
  }

  if (!data.user || data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in instead." },
      { status: 409 },
    )
  }

  const { error: roleError } = await adminClient
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id)

  if (roleError) {
    await adminClient.auth.admin.deleteUser(data.user.id)
    return NextResponse.json(
      { error: "We could not finish creating the admin account. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    requiresEmailConfirmation: !data.session,
  })
}
