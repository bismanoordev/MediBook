"use client"

import { Bell, X } from "lucide-react"
import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

type Notification = { id: string; title: string; message: string; is_read: boolean }

export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data } = await supabase.from("notifications").select("id, title, message, is_read").eq("user_id", userId).order("created_at", { ascending: false }).limit(8)
      setItems(data ?? [])
    }
    void load()
    const channel = supabase.channel(`patient-notifications-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => void load()).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [userId])

  const unread = items.filter((item) => !item.is_read).length
  async function markRead() {
    setOpen((value) => !value)
    if (!unread) return
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  function closeNotifications() {
    setOpen(false)
  }

  return <div className="relative">
    <button onClick={markRead} className="relative grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
      <Bell className="size-5" />
      {unread ? <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}
    </button>
    {open ? <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="flex items-center justify-between gap-3 px-2 pb-2"><p className="text-sm font-semibold">Notifications</p><button onClick={closeNotifications} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]" aria-label="Close notifications"><X className="size-4" /></button></div>
      {items.length ? <ul className="max-h-80 space-y-1 overflow-auto">{items.map((item) => <li key={item.id} className="rounded-xl p-2.5 hover:bg-slate-50"><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.message}</p></li>)}</ul> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">You&apos;re all caught up.</p>}
    </div> : null}
  </div>
}
