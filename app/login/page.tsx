import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { redirectAuthenticatedUser } from "@/lib/auth"

type LoginPageProps = {
  searchParams: Promise<{ next?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectAuthenticatedUser()
  const { next, message } = await searchParams
  const safeMessage =
    message === "password_updated" || message === "invalid_link"
      ? message
      : undefined

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to MediBook"
      description="Manage your appointments and book your next clinic visit."
      showBackHome
      footer={<p>New to MediBook? <Link href="/signup" className="font-semibold text-[#0F766E] hover:underline">Create an account</Link></p>}
    >
      <LoginForm next={next} message={safeMessage} />
    </AuthShell>
  )
}
