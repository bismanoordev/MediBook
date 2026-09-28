import { MarkNotificationsRead } from "@/components/patient/mark-notifications-read"
import { NotificationsList, type NotificationItem } from "@/components/patient/notifications-list"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function AdminNotificationsPage() {
  const { user } = await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <MarkNotificationsRead userId={user.id} />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <NotificationsList notifications={data as NotificationItem[] | null} error={Boolean(error)} admin />
      </main>
    </>
  )
}
