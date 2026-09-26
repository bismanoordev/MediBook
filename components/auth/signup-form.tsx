"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

type SignupRole = "patient" | "admin"

type AdminSignupResponse = {
  error?: string
  requiresEmailConfirmation?: boolean
}

const roleCopy: Record<
  SignupRole,
  { eyebrow: string; title: string; description: string }
> = {
  patient: {
    eyebrow: "Patient account",
    title: "Create your account",
    description: "Book doctors and manage your appointments in one place.",
  },
  admin: {
    eyebrow: "Admin account",
    title: "Set up admin access",
    description: "Use the secure invitation code provided by your clinic.",
  },
}

export function SignupForm() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [role, setRole] = useState<SignupRole>("patient")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  function selectRole(nextRole: SignupRole) {
    if (isSubmitting || nextRole === role) return
    setRole(nextRole)
    setError(null)
    setCheckEmail(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get("fullName") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")
    const accessCode = String(formData.get("accessCode") ?? "").trim()

    if (fullName.length < 2) {
      setError("Enter your full name.")
      return
    }

    if (phone.length < 7) {
      setError("Enter a valid phone number.")
      return
    }

    if (role === "admin" && !accessCode) {
      setError("Enter the admin invitation code provided by your clinic.")
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

    if (role === "admin") {
      let response: Response

      try {
        response = await fetch("/api/auth/admin-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, phone, email, password, accessCode }),
        })
      } catch {
        const message = "We could not reach the server. Check your connection and try again."
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
        return
      }

      const result = (await response.json().catch(() => ({}))) as AdminSignupResponse

      if (!response.ok) {
        const message = result.error ?? "Admin signup is unavailable. Please try again."
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
        return
      }

      if (result.requiresEmailConfirmation) {
        setCheckEmail(true)
        setIsSubmitting(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        const message = getFriendlyAuthError(signInError.message)
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
        return
      }

      toast.success("Your MediBook admin account is ready.")
      router.replace("/admin")
      router.refresh()
      return
    }

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

    toast.success("Your MediBook patient account is ready.")
    router.replace("/doctors")
    router.refresh()
  }

  const copy = roleCopy[role]

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose account type"
        className="mb-8 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "patient"}
          onClick={() => selectRole("patient")}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-selected:bg-card aria-selected:text-primary aria-selected:shadow-sm"
        >
          I&apos;m a patient
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "admin"}
          onClick={() => selectRole("admin")}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:shadow-sm"
        >
          I&apos;m an admin
        </button>
      </div>

      <div className="mb-8 space-y-3" aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
          {copy.title}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
      </div>

      {checkEmail ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-emerald-950">
            Check your email
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Open the confirmation link we sent you, then return to sign in.
          </p>
        </div>
      ) : (
        <form key={role} className="space-y-4" onSubmit={handleSubmit}>
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
              <label htmlFor={`${role}-fullName`} className="text-sm font-medium">
                Full name
              </label>
              <Input
                id={`${role}-fullName`}
                name="fullName"
                autoComplete="name"
                placeholder={role === "admin" ? "Administrator full name" : "Your full name"}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={`${role}-phone`} className="text-sm font-medium">
                Phone number
              </label>
              <Input
                id={`${role}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+92 300 1234567"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={`${role}-email`} className="text-sm font-medium">
                {role === "admin" ? "Work email address" : "Email address"}
              </label>
              <Input
                id={`${role}-email`}
                name="email"
                type="email"
                autoComplete="email"
                placeholder={role === "admin" ? "admin@clinic.com" : "you@example.com"}
                className="h-11"
                required
              />
            </div>

            {role === "admin" ? (
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="admin-accessCode" className="text-sm font-medium">
                  Admin invitation code
                </label>
                <Input
                  id="admin-accessCode"
                  name="accessCode"
                  type="password"
                  autoComplete="off"
                  placeholder="Enter your secure invitation code"
                  className="h-11"
                  required
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  This code is issued privately by your clinic owner.
                </p>
              </div>
            ) : null}

            <PasswordInput
              id={`${role}-password`}
              name="password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />

            <PasswordInput
              id={`${role}-confirmPassword`}
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
            ) : role === "admin" ? (
              <ShieldCheck aria-hidden="true" />
            ) : (
              <UserPlus aria-hidden="true" />
            )}
            {isSubmitting
              ? "Creating account..."
              : role === "admin"
                ? "Create admin account"
                : "Create patient account"}
          </Button>
        </form>
      )}
    </div>
  )
}
