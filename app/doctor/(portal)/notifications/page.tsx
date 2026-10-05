import { MarkNotificationsRead } from "@/components/patient/mark-notifications-read"
import { NotificationsList, type NotificationItem } from "@/components/patient/notifications-list"
import { requireDoctor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorNotificationsPage() {
  const { user } = await requireDoctor()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex justify-end">
        <MarkNotificationsRead userId={user.id} hasUnread={Boolean(data?.some((item) => !item.is_read))} />
      </div>
      <NotificationsList notifications={data as NotificationItem[] | null} error={Boolean(error)} />
    </main>
  )
}
