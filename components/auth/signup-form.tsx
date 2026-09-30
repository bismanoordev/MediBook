"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

const patientSignupSchema = yup.object({
  fullName: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Use letters only in your full name.").min(2, "Enter your full name.").required("Enter your full name."),
  phone: yup.string().matches(/^\d{7,15}$/, "Enter a valid phone number using digits only.").required("Enter your phone number."),
  email: yup.string().trim().matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a complete email address, for example name@gmail.com.").required("Enter your email address."),
  password: yup.string().min(8, "Password must contain at least 8 characters.").required("Enter a password."),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords do not match.").required("Confirm your password."),
})

export function SignupForm() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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

    try {
      await patientSignupSchema.validate({ fullName, phone, email, password, confirmPassword }, { abortEarly: false })
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        setFieldErrors(Object.fromEntries(validationError.inner.map((issue) => [issue.path ?? "form", issue.message])))
      }
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

    toast.success("Your MediBook patient account is ready.")
    router.replace("/doctors")
    router.refresh()
  }

  return (
    <div>
      <div
        className="mb-8 space-y-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Patient account
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
          Create your account
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Book doctors and manage your appointments in one place.
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
          id="signup-form-panel"
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
              <label htmlFor="patient-fullName" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="patient-fullName"
                name="fullName"
                autoComplete="name"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/[^\p{L}\s.'-]/gu, "")
                }}
                placeholder="Your full name"
                className="h-11"
                required
              />
              {fieldErrors.fullName ? <p className="text-sm text-red-600">{fieldErrors.fullName}</p> : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="patient-phone" className="text-sm font-medium">
                Phone number
              </label>
              <Input
                id="patient-phone"
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
              {fieldErrors.phone ? <p className="text-sm text-red-600">{fieldErrors.phone}</p> : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="patient-email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="patient-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11"
                required
              />
              {fieldErrors.email ? <p className="text-sm text-red-600">{fieldErrors.email}</p> : null}
            </div>

            <PasswordInput
              id="patient-password"
              name="password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            {fieldErrors.password ? <p className="-mt-2 text-sm text-red-600">{fieldErrors.password}</p> : null}

            <PasswordInput
              id="patient-confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Repeat password"
              minLength={8}
              required
            />
            {fieldErrors.confirmPassword ? <p className="-mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p> : null}
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
            {isSubmitting
              ? "Creating account..."
              : "Create patient account"}
          </Button>
        </form>
      )}
    </div>
  )
}
