import { Suspense } from "react"

import { DashboardLoading } from "@/components/page-loading-skeletons"
import { requireDoctor } from "@/lib/auth"

async function AuthenticatedDoctorLayout({ children }: { children: React.ReactNode }) {
  await requireDoctor()
  return children
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashboardLoading doctor />}><AuthenticatedDoctorLayout>{children}</AuthenticatedDoctorLayout></Suspense>
}
