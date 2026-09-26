import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"
import { redirectAuthenticatedUser } from "@/lib/auth"

export default async function SignupPage() {
  await redirectAuthenticatedUser()

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Your next appointment is only a few clicks away."
      showBackHome
      footer={<p>Already have an account? <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">Log in</Link></p>}
    >
      <SignupForm />
    </AuthShell>
  )
}
