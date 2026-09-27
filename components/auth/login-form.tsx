"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { createClient } from "@/lib/supabase/client"

type LoginFormProps = {
  next?: string
  message?: string
}

const loginSchema = yup.object({
  email: yup.string().trim().email("Enter a valid email address.").required("Enter your email address."),
  password: yup.string().required("Enter your password."),
})

export function LoginForm({ next, message }: LoginFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    try {
      await loginSchema.validate({ email, password })
    } catch (validationError) {
      setError(validationError instanceof yup.ValidationError ? validationError.message : "Check your login details.")
      setIsSubmitting(false)
      return
    }

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      const friendlyError = getFriendlyAuthError(signInError.message)
      setError(friendlyError)
      toast.error(friendlyError)
      setIsSubmitting(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle()

    const fallback = profile?.role === "admin" ? "/admin" : "/doctors"
    const destination = getSafeRedirectPath(next, fallback)

    toast.success("Welcome back to MediBook.")
    router.replace(destination)
    router.refresh()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message === "password_updated"
            ? "Your password has been updated. You can sign in now."
            : "This link is invalid or has expired. Please request a new one."}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">Password</span>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
