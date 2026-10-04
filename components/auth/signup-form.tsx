"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2, Loader2, Stethoscope, UserPlus, UsersRound } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFriendlyAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

type AccountType = "patient" | "doctor"
type Specialty = { id: number; name: string }

const signupSchema = yup.object({
  fullName: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Use letters only in your full name.").min(2, "Enter your full name.").required("Enter your full name."),
  phone: yup.string().matches(/^\d{7,15}$/, "Enter a valid phone number using digits only.").required("Enter your phone number."),
  email: yup.string().trim().matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a complete email address, for example name@gmail.com.").required("Enter your email address."),
  password: yup.string().min(8, "Password must contain at least 8 characters.").required("Enter a password."),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords do not match.").required("Confirm your password."),
})

const doctorSignupSchema = signupSchema.shape({
  specialtyId: yup.string().matches(/^\d+$/, "Choose your specialty.").required("Choose your specialty."),
  acceptedTerms: yup.boolean().oneOf([true], "You need to accept the terms to continue.").required("You need to accept the terms to continue."),
})

export function SignupForm() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [accountType, setAccountType] = useState<AccountType>("patient")
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [specialtiesError, setSpecialtiesError] = useState(false)
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [checkEmail, setCheckEmail] = useState(false)

  useEffect(() => {
    if (accountType !== "doctor" || specialties.length || specialtiesError) return

    let cancelled = false
    async function loadSpecialties() {
      setIsLoadingSpecialties(true)
      const { data, error: loadError } = await supabase.from("specialties").select("id, name").order("name")

      if (!cancelled) {
        setSpecialties(data ?? [])
        setSpecialtiesError(Boolean(loadError))
        setIsLoadingSpecialties(false)
      }
    }

    void loadSpecialties()
    return () => { cancelled = true }
  }, [accountType, specialties.length, specialtiesError, supabase])

  function chooseAccountType(nextType: AccountType) {
    setAccountType(nextType)
    setError(null)
    setFieldErrors({})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    const values = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      specialtyId: String(formData.get("specialtyId") ?? ""),
      acceptedTerms: formData.get("acceptedTerms") === "on",
    }

    try {
      await (accountType === "doctor" ? doctorSignupSchema : signupSchema).validate(values, { abortEarly: false })
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) setFieldErrors(Object.fromEntries(validationError.inner.map((issue) => [issue.path ?? "form", issue.message])))
      return
    }

    if (accountType === "doctor" && specialtiesError) {
      setError("We couldn’t load specialties. Please refresh and try again.")
      return
    }

    setIsSubmitting(true)
    const isDoctor = accountType === "doctor"
    const destination = isDoctor ? "/doctor/onboarding" : "/doctors"
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: isDoctor
          ? { full_name: values.fullName, phone: values.phone, role: "doctor", specialty_id: values.specialtyId }
          : { full_name: values.fullName, phone: values.phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${destination}`,
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

    toast.success(isDoctor ? "Your doctor application is ready to complete." : "Your MediBook patient account is ready.")
    router.replace(destination)
    router.refresh()
  }

  const isDoctor = accountType === "doctor"

  return (
    <div>
      <div className="mb-8 space-y-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{isDoctor ? "Doctor account" : "Patient account"}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">Create your account</h1>
        <p className="text-sm leading-6 text-muted-foreground">{isDoctor ? "Join MediBook and complete your professional profile for review." : "Book doctors and manage your appointments in one place."}</p>
      </div>

      {checkEmail ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-emerald-950">Check your email</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">Open the confirmation link we sent you, then return to sign in.</p>
        </div>
      ) : (
        <form id="signup-form-panel" className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500" onSubmit={handleSubmit}>
          <fieldset className="grid grid-cols-2 gap-2" aria-label="Choose account type">
            <legend className="sr-only">Choose account type</legend>
            <button type="button" onClick={() => chooseAccountType("patient")} aria-pressed={!isDoctor} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 ${!isDoctor ? "border-[#0F766E] bg-[#CCFBF1]/60 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-[#0F766E]"><UsersRound className="size-4" aria-hidden="true" /></span><span><span className="block text-sm font-semibold">I&apos;m a patient</span><span className="mt-0.5 block text-xs leading-4">Book care</span></span></button>
            <button type="button" onClick={() => chooseAccountType("doctor")} aria-pressed={isDoctor} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 ${isDoctor ? "border-[#0F766E] bg-[#CCFBF1]/60 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-[#0F766E]"><Stethoscope className="size-4" aria-hidden="true" /></span><span><span className="block text-sm font-semibold">I&apos;m a doctor</span><span className="mt-0.5 block text-xs leading-4">Join MediBook</span></span></button>
          </fieldset>

          {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" id="signup-fullName" error={fieldErrors.fullName} errorId="signup-name-error"><Input id="signup-fullName" name="fullName" autoComplete="name" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^\p{L}\s.'-]/gu, "") }} placeholder="Your full name" className="h-11" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "signup-name-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, fullName: "" }))} required /></Field>
            <Field label="Phone number" id="signup-phone" error={fieldErrors.phone} errorId="signup-phone-error"><Input id="signup-phone" name="phone" type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]*" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "") }} placeholder="03001234567" className="h-11" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "signup-phone-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, phone: "" }))} required /></Field>

            {isDoctor ? <div className="space-y-2 sm:col-span-2"><label htmlFor="doctor-specialty" className="text-sm font-medium">Specialty</label><Select items={[{ value: "", label: "Choose your specialty" }, ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name }))]} name="specialtyId" required disabled={isLoadingSpecialties || specialtiesError || !specialties.length} onValueChange={() => setFieldErrors((current) => ({ ...current, specialtyId: "" }))}><SelectTrigger id="doctor-specialty" className="w-full data-[size=default]:h-11" aria-invalid={Boolean(fieldErrors.specialtyId)} aria-describedby={fieldErrors.specialtyId ? "signup-specialty-error" : undefined}><SelectValue placeholder={isLoadingSpecialties ? "Loading specialties…" : specialtiesError ? "Specialties unavailable" : specialties.length ? "Choose your specialty" : "No specialties available"} /></SelectTrigger><SelectContent alignItemWithTrigger={false} className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">{specialties.map((specialty) => <SelectItem key={specialty.id} value={String(specialty.id)} className="rounded-lg px-3 py-2.5 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-medium data-[selected]:text-[#0F766E]">{specialty.name}</SelectItem>)}</SelectContent></Select>{specialtiesError ? <p className="text-sm text-red-600">We couldn&apos;t load specialties. Please refresh and try again.</p> : null}{fieldErrors.specialtyId ? <p id="signup-specialty-error" className="text-sm text-red-600">{fieldErrors.specialtyId}</p> : null}</div> : null}

            <Field label="Email address" id="signup-email" error={fieldErrors.email} errorId="signup-email-error"><Input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "signup-email-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, email: "" }))} required /></Field>
            <div className="space-y-2"><PasswordInput id="signup-password" name="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "signup-password-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, password: "" }))} required />{fieldErrors.password ? <p id="signup-password-error" className="text-sm text-red-600">{fieldErrors.password}</p> : null}</div>
            <div className="space-y-2"><PasswordInput id="signup-confirmPassword" name="confirmPassword" label="Confirm password" autoComplete="new-password" placeholder="Repeat password" minLength={8} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? "signup-confirm-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, confirmPassword: "" }))} required />{fieldErrors.confirmPassword ? <p id="signup-confirm-error" className="text-sm text-red-600">{fieldErrors.confirmPassword}</p> : null}</div>
          </div>

          {isDoctor ? <div className="space-y-2"><label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600"><input name="acceptedTerms" type="checkbox" className="peer sr-only" aria-invalid={Boolean(fieldErrors.acceptedTerms)} aria-describedby={fieldErrors.acceptedTerms ? "signup-terms-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, acceptedTerms: "" }))} /><span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] border-input bg-white transition-colors peer-checked:border-[#0F766E] peer-checked:bg-[#0F766E] peer-checked:[&>svg]:opacity-100 peer-hover:border-[#0F766E] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F766E]/30 peer-focus-visible:ring-offset-2 peer-aria-invalid:border-red-500 peer-disabled:opacity-50"><Check className="size-3.5 stroke-[3] text-white opacity-0 transition-opacity" /></span><span className="min-w-0 leading-5">I agree to MediBook&apos;s <span className="font-semibold text-[#0F766E] hover:underline">Terms</span> and <span className="font-semibold text-[#0F766E] hover:underline">Privacy Policy</span>.</span></label>{fieldErrors.acceptedTerms ? <p id="signup-terms-error" className="text-sm text-red-600">{fieldErrors.acceptedTerms}</p> : null}</div> : null}

          <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting || (isDoctor && (isLoadingSpecialties || specialtiesError || !specialties.length))}>{isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}{isSubmitting ? "Creating account..." : isDoctor ? "Create doctor account" : "Create patient account"}</Button>
        </form>
      )}
    </div>
  )
}

function Field({ label, id, error, errorId, children }: { label: string; id: string; error?: string; errorId: string; children: React.ReactNode }) {
  return <div className="space-y-2 sm:col-span-2"><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}{error ? <p id={errorId} className="text-sm text-red-600">{error}</p> : null}</div>
}
