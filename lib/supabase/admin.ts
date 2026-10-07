import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Creates a server-only Supabase client for narrowly scoped operational work,
 * such as looking up an authenticated user's email after an already-authorized
 * booking mutation. Never import this module from a Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
