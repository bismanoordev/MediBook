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
import { getHomePath } from "@/lib/home-path"
import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { createClient } from "@/lib/supabase/client"

type LoginFormProps = {
  next?: string
  message?: string
}

const loginSchema = yup.object({
  email: yup.string().trim().matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a complete email address, for example name@gmail.com.").required("Enter your email address."),
  password: yup.string().required("Enter your password."),
})

export function LoginForm({ next, message }: LoginFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    try {
      await loginSchema.validate({ email, password }, { abortEarly: false })
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) setFieldErrors(Object.fromEntries(validationError.inner.map((issue) => [issue.path ?? "form", issue.message])))
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

    const { data: doctor } = profile?.role === "doctor"
      ? await supabase.from("doctors").select("approval_status").eq("user_id", data.user.id).maybeSingle()
      : { data: null }
    const fallback = getHomePath(profile?.role, doctor?.approval_status)
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
          aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          onChange={() => setFieldErrors((current) => ({ ...current, email: "" }))}
          required
        />
        {fieldErrors.email ? <p id="login-email-error" className="text-sm text-red-600">{fieldErrors.email}</p> : null}
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
          aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          onChange={() => setFieldErrors((current) => ({ ...current, password: "" }))}
          required
        />
        {fieldErrors.password ? <p id="login-password-error" className="text-sm text-red-600">{fieldErrors.password}</p> : null}
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
