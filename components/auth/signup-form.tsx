"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

export function SignupForm() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get("fullName") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (fullName.length < 2) {
      setError("Enter your full name.")
      return
    }

    if (phone.length < 7) {
      setError("Enter a valid phone number.")
      return
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/doctors`,
      },
    })

    if (signUpError) {
      const friendlyError = getFriendlyAuthError(signUpError.message)
      setError(friendlyError)
      toast.error(friendlyError)
      setIsSubmitting(false)
      return
    }

    if (!data.session) {
      setCheckEmail(true)
      setIsSubmitting(false)
      return
    }

    toast.success("Your MediBook account is ready.")
    router.replace("/doctors")
    router.refresh()
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Open the confirmation link we sent you, then return to sign in.
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="fullName" className="text-sm font-medium">
            Full name
          </label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Your full name"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone number
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+92 300 1234567"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
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

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat password"
          minLength={8}
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
          <UserPlus aria-hidden="true" />
        )}
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
