"use client"

import { useEffect, useId } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function DoctorAppointmentsRealtime({ doctorId }: { doctorId: string }) {
  const router = useRouter()
  const instanceId = useId()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`doctor-appointments-${doctorId}-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` }, () => router.refresh())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [doctorId, router, instanceId])

  return null
}
