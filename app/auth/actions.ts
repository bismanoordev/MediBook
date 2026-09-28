"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type SignOutResult = { error?: string }

export async function signOut(): Promise<SignOutResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: "We could not log you out. Please try again." }
  }

  redirect("/")
}
