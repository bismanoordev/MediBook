import type { DoctorApprovalStatus, ProfileRole } from "@/lib/supabase/database.types"

export function getHomePath(
  role: ProfileRole | null | undefined,
  approvalStatus?: DoctorApprovalStatus | null,
) {
  if (role === "admin") return "/admin"

  if (role === "doctor") {
    return approvalStatus === "draft" ||
      approvalStatus === "rejected" ||
      approvalStatus === "changes_requested"
      ? "/doctor/onboarding"
      : "/doctor"
  }

  return "/doctors"
}
