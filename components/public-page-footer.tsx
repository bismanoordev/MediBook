import { getAuthState } from "@/lib/auth"
import { SiteFooter } from "@/components/site-footer"

export async function PublicPageFooter({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthState()

  return (
    <>
      {children}
      <SiteFooter role={profile?.role} />
    </>
  )
}
