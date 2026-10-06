import { AppointmentsLoading } from "@/components/page-loading-skeletons"
import { PatientLoadingShell } from "@/components/patient-loading-shell"

export default function Loading() {
  return <PatientLoadingShell><AppointmentsLoading /></PatientLoadingShell>
}
