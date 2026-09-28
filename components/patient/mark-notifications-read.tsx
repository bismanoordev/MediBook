"use client"

import { useEffect } from "react"

import { createClient } from "@/lib/supabase/client"

export function MarkNotificationsRead({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient()

    void supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
  }, [userId])

  return null
}
