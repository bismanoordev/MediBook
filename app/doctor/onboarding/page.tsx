import { ClipboardPenLine } from "lucide-react"

import { DoctorPagePlaceholder } from "@/components/doctor/doctor-page-placeholder"

export default function DoctorOnboardingPage() {
  return <DoctorPagePlaceholder title="Complete your doctor profile" description="Your five-step professional onboarding will appear here. It is kept separate from the dashboard so you can focus on your application." icon={ClipboardPenLine} />
}
