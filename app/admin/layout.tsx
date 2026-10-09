import { Suspense } from "react"

import { AdminShell } from "@/components/admin/admin-shell"
import { DashboardLoading } from "@/components/page-loading-skeletons"
import { requireAdmin } from "@/lib/auth"

async function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin()
  return <AdminShell name={profile?.full_name} email={user.email} userId={user.id}>{children}</AdminShell>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashboardLoading />}><AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout></Suspense>
}
