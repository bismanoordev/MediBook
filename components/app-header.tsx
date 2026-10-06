import Link from "next/link"
import { HeartPulse } from "lucide-react"
import { AccountMenu } from "@/components/auth/account-menu"
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer"
import { NavigationLink } from "@/components/navigation-link"
import { NotificationBell } from "@/components/patient/notification-bell"
import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { getNavigation } from "@/lib/navigation"

export async function AppHeader(props: { name?: string | null; email?: string | null; userId?: string } = {}) {
  void props
  const [{ user, profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  const navigation = getNavigation(profile?.role, doctor?.approval_status)
  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><div className="flex items-center gap-7"><Link href="/" className="flex items-center gap-2 rounded-xl font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"><span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-4" aria-hidden="true" /></span>MediBook</Link><nav aria-label="Primary navigation" className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">{navigation.links.map((link) => <NavigationLink key={link.href} link={link} className="rounded-lg hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]" />)}</nav></div><div className="flex items-center gap-3">{user ? <div className="hidden sm:block"><NotificationBell userId={user.id} href={navigation.notificationsHref} /></div> : null}{user ? <div className="hidden sm:block"><AccountMenu userId={user.id} name={profile?.full_name} email={user.email} role={navigation.accountRole} avatarUrl={profile?.avatar_url} /></div> : null}<MobileNavigationDrawer links={navigation.mobileLinks} userId={user?.id} name={profile?.full_name} email={user?.email} role={user ? navigation.accountRole : undefined} notificationsHref={user ? navigation.notificationsHref : undefined} /></div></div></header>
}
