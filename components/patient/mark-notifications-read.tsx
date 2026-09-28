"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function MarkNotificationsRead({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function markAsRead() {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select("id")

      if (error) return

      window.dispatchEvent(new CustomEvent("notifications-read", { detail: { userId } }))

      if (data.length) {
        router.refresh()
      }
    }

    void markAsRead()
  }, [router, userId])

  return null
}
