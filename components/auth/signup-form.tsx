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
import * as yup from "yup"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { cn } from "@/lib/utils"
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

const patientSignupSchema = yup.object({
  fullName: yup.string().trim().min(2, "Enter your full name.").required("Enter your full name."),
  phone: yup.string().matches(/^\d{7,15}$/, "Enter a valid phone number using digits only.").required("Enter your phone number."),
  email: yup.string().trim().email("Enter a valid email address.").required("Enter your email address."),
  password: yup.string().min(8, "Password must contain at least 8 characters.").required("Enter a password."),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords do not match.").required("Confirm your password."),
})

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

    try {
      await patientSignupSchema.validate({ fullName, phone, email, password, confirmPassword })
    } catch (validationError) {
      setError(validationError instanceof yup.ValidationError ? validationError.message : "Check your account details.")
      return
    }

    if (role === "admin" && !accessCode) {
      setError("Enter the admin invitation code provided by your clinic.")
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
        className="relative mb-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5 shadow-inner shadow-slate-200/70"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl shadow-sm transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            role === "admin"
              ? "translate-x-full bg-[#0F766E] shadow-teal-900/15"
              : "translate-x-0 bg-white shadow-slate-300/60",
          )}
        />
        <button
          id="patient-signup-tab"
          type="button"
          role="tab"
          aria-selected={role === "patient"}
          aria-controls="signup-form-panel"
          onClick={() => selectRole("patient")}
          className={cn(
            "relative z-10 min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 motion-reduce:transition-none",
            role === "patient" ? "text-[#0F766E]" : "text-slate-500 hover:text-slate-800",
          )}
        >
          I&apos;m a patient
        </button>
        <button
          id="admin-signup-tab"
          type="button"
          role="tab"
          aria-selected={role === "admin"}
          aria-controls="signup-form-panel"
          onClick={() => selectRole("admin")}
          className={cn(
            "relative z-10 min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 motion-reduce:transition-none",
            role === "admin" ? "text-white" : "text-slate-500 hover:text-slate-800",
          )}
        >
          I&apos;m an admin
        </button>
      </div>

      <div
        key={`signup-copy-${role}`}
        className="mb-8 space-y-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
        aria-live="polite"
      >
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
        <form
          key={role}
          id="signup-form-panel"
          role="tabpanel"
          aria-labelledby={`${role}-signup-tab`}
          className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
          onSubmit={handleSubmit}
        >
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
                inputMode="numeric"
                pattern="[0-9]*"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "")
                }}
                placeholder="03001234567"
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
