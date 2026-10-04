"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function DoctorAppointmentsRealtime({ doctorId }: { doctorId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`doctor-appointments-${doctorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` }, () => router.refresh())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [doctorId, router])

  return null
}
