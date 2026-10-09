import { DoctorsDirectoryLoading } from "@/components/page-loading-skeletons"
import { PatientLoadingShell } from "@/components/patient-loading-shell"

export default function Loading() {
  return <PatientLoadingShell><DoctorsDirectoryLoading /></PatientLoadingShell>
}
