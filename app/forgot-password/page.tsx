import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email and we will send you a secure reset link."
      footer={<Link href="/login" className="font-semibold text-[#0F766E] hover:underline">Back to login</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
