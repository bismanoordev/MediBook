"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function AppointmentsRealtime() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel("admin-appointments").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => router.refresh()).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [router])

  return null
}
