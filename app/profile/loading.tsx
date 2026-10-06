import { ProfileLoading } from "@/components/page-loading-skeletons"
import { PatientLoadingShell } from "@/components/patient-loading-shell"

export default function Loading() {
  return <PatientLoadingShell><ProfileLoading /></PatientLoadingShell>
}
