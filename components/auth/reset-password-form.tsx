"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

const resetPasswordSchema = yup.object({
  password: yup.string().min(8, "Password must contain at least 8 characters.").required("Enter a password."),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords do not match.").required("Confirm your password."),
})

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    try {
      await resetPasswordSchema.validate({ password, confirmPassword })
    } catch (validationError) {
      setError(validationError instanceof yup.ValidationError ? validationError.message : "Check your new password.")
      return
    }

    setIsSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      const friendlyError = getFriendlyAuthError(updateError.message)
      setError(friendlyError)
      toast.error(friendlyError)
      setIsSubmitting(false)
      return
    }

    await supabase.auth.signOut()
    toast.success("Your password has been updated.")
    router.replace("/login?message=password_updated")
    router.refresh()
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

      <PasswordInput
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        minLength={8}
        required
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        minLength={8}
        required
      />

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound aria-hidden="true" />
        )}
        {isSubmitting ? "Updating password..." : "Update password"}
      </Button>
    </form>
  )
}
