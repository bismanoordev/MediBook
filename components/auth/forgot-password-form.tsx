"use client"

import { FormEvent, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

const emailSchema = yup.object({
  email: yup.string().trim().matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a complete email address, for example name@gmail.com.").required("Enter your email address."),
})

export function ForgotPasswordForm() {
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    try {
      await emailSchema.validate({ email })
    } catch (validationError) {
      setError(validationError instanceof yup.ValidationError ? validationError.message : "Enter a valid email address.")
      setIsSubmitting(false)
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    )

    if (resetError) {
      const friendlyError = getFriendlyAuthError(resetError.message)
      setError(friendlyError)
      toast.error(friendlyError)
      setIsSubmitting(false)
      return
    }

    setSent(true)
    setIsSubmitting(false)
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          If an account exists for that email, a secure reset link is on its way.
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
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

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Mail aria-hidden="true" />
        )}
        {isSubmitting ? "Sending link..." : "Send reset link"}
      </Button>
    </form>
  )
}
