import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin()

  return <AdminShell name={profile?.full_name} email={user.email} userId={user.id}>{children}</AdminShell>
}
