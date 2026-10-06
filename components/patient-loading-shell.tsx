import { AppHeader } from "@/components/app-header"

export function PatientLoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      {children}
    </div>
  )
}
