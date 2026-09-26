import { AppHeader } from "@/components/app-header"
import { requireAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={profile?.full_name} admin />
      {children}
    </div>
  )
}
