import { PublicPageFooter } from "@/components/public-page-footer"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <PublicPageFooter>{children}</PublicPageFooter>
}
