import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { getAuthState } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ResetPasswordPage() {
  const { user } = await getAuthState()

  if (!user) {
    redirect("/login?message=invalid_link")
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Choose a new password"
      description="Use at least 8 characters and keep it somewhere safe."
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
