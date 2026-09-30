"use client"

import { useState } from "react"
import { CheckCheck, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

export function MarkNotificationsRead({ userId, hasUnread }: { userId: string; hasUnread: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function markAllRead() {
    setSaving(true)
    const { error } = await createClient().from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
    setSaving(false)
    if (error) { toast.error("Notifications could not be updated. Please try again."); return }
    window.dispatchEvent(new CustomEvent("notifications-read", { detail: { userId } }))
    toast.success("All notifications marked as read.")
    router.refresh()
  }

  return <button type="button" onClick={markAllRead} disabled={!hasUnread || saving} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0F766E] shadow-sm hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}Mark all as read</button>
}
