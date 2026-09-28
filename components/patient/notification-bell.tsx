"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

type Notification = { id: string; title: string; message: string; is_read: boolean }

export function NotificationBell({ userId, href }: { userId: string; href: string }) {
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data } = await supabase.from("notifications").select("id, title, message, is_read").eq("user_id", userId).order("created_at", { ascending: false }).limit(8)
      setItems(data ?? [])
    }
    void load()
    const handleNotificationsRead = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail

      if (detail?.userId === userId) {
        setItems((current) => current.map((item) => ({ ...item, is_read: true })))
      }
    }
    const channel = supabase.channel(`patient-notifications-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
      if (payload.eventType === "INSERT") {
        const notification = payload.new as Notification
        toast.info(notification.title, { description: notification.message })
      }

      void load()
    }).subscribe()
    window.addEventListener("notifications-read", handleNotificationsRead)
    return () => {
      window.removeEventListener("notifications-read", handleNotificationsRead)
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const unread = items.filter((item) => !item.is_read).length
  function clearUnreadCount() {
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  return (
    <Link href={href} onClick={clearUnreadCount} className="relative grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
      <Bell className="size-5" />
      {unread ? <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}
    </Link>
  )
}
