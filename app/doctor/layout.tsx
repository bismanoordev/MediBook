import { requireDoctor } from "@/lib/auth"

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  await requireDoctor()
  return children
}
