import { AppHeader } from "@/components/app-header"
import { MarkNotificationsRead } from "@/components/patient/mark-notifications-read"
import { NotificationsList, type NotificationItem } from "@/components/patient/notifications-list"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function NotificationsPage() {
  const { user, profile } = await requireUser("/notifications")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={profile?.full_name} email={user.email} userId={user.id} />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="flex justify-end"><MarkNotificationsRead userId={user.id} hasUnread={Boolean(data?.some((item) => !item.is_read))} /></div>
        <NotificationsList notifications={data as NotificationItem[] | null} error={Boolean(error)} />
      </main>
    </div>
  )
}
