"use client"

import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

type Notification = {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function NotificationBell({ userId, href }: { userId: string; href: string }) {
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      setLoading(true)
      const [latestResult, unreadResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("id,title,message,is_read,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false),
      ])

      setItems(latestResult.data ?? [])
      setUnread(unreadResult.count ?? 0)
      setError(Boolean(latestResult.error || unreadResult.error))
      setLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const notification = payload.new as Notification
            toast.info(notification.title, { description: notification.message })
          }
          void load()
        },
      )
      .subscribe()

    const marked = (event: Event) => {
      if ((event as CustomEvent<{ userId?: string }>).detail?.userId === userId) {
        setItems((current) => current.map((item) => ({ ...item, is_read: true })))
        setUnread(0)
      }
    }

    window.addEventListener("notifications-read", marked)
    return () => {
      window.removeEventListener("notifications-read", marked)
      void supabase.removeChannel(channel)
    }
  }, [userId])

  async function markAll() {
    setSaving(true)
    const { error: updateError } = await createClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
    setSaving(false)

    if (updateError) {
      toast.error("Notifications could not be updated. Please try again.")
      return
    }

    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnread(0)
    window.dispatchEvent(new CustomEvent("notifications-read", { detail: { userId } }))
    toast.success("All notifications marked as read.")
  }

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="relative grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]" aria-expanded={open} aria-haspopup="dialog" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}><Bell className="size-5" />{unread ? <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}</button>{open ? <div role="dialog" aria-label="Latest notifications" className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between gap-3"><strong className="text-sm">Notifications</strong><button type="button" onClick={markAll} disabled={!unread || saving} className="text-xs font-semibold text-[#0F766E] disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="mr-1 inline size-4" />}Mark all read</button></div>{loading ? <p className="p-4 text-sm text-slate-500">Loading notifications…</p> : error ? <p className="p-4 text-sm text-red-700">Notifications couldn’t load. Please try again.</p> : items.length ? <ul className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-100">{items.map((item) => <li key={item.id} className={`py-3 ${item.is_read ? "" : "rounded-lg bg-teal-50 px-2"}`}><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p></li>)}</ul> : <p className="p-4 text-sm text-slate-500">You’re all caught up.</p>}<Link href={href} onClick={() => setOpen(false)} className="mt-3 block rounded-xl bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-[#0F766E] hover:bg-teal-50">View all notifications</Link></div> : null}</div>
}
