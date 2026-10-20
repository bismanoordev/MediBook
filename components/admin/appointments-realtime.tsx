"use client"

import { useEffect, useId } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function AppointmentsRealtime() {
  const router = useRouter()
  const instanceId = useId()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`admin-appointments-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => router.refresh())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [router, instanceId])

  return null
}
