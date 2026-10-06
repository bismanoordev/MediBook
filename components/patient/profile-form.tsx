"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as yup from "yup"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const profileSchema = yup.object({ fullName: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Use letters only in your full name.").min(2, "Enter your full name.").required("Enter your full name."), phone: yup.string().matches(/^\d{7,15}$/, "Enter a valid phone number using digits only.").required("Enter your phone number.") })

export function ProfileForm({ userId, fullName, phone }: { userId: string; fullName: string; phone: string }) {
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [phoneValue, setPhone] = useState(phone)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const changed = name !== fullName || phoneValue !== phone
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try { await profileSchema.validate({ fullName: name, phone: phoneValue }, { abortEarly: false }); setErrors({}) } catch (validationError) { if (validationError instanceof yup.ValidationError) setErrors(Object.fromEntries(validationError.inner.map((issue) => [issue.path ?? "form", issue.message]))); return }
    setSaving(true)
    const { error } = await createClient().from("profiles").update({ full_name: name.trim(), phone: phoneValue.trim() || null }).eq("id", userId)
    setSaving(false)
    if (error) return toast.error("We could not save your profile. Please try again.")
    toast.success("Your profile has been updated.")
    router.refresh()
  }
  return <form onSubmit={save} className="mt-6 grid items-start gap-5 sm:grid-cols-2">
    <div className="grid w-full content-start gap-2 self-start"><label htmlFor="profile-full-name" className="text-sm font-medium text-slate-800">Full name</label><Input id="profile-full-name" className="h-11 w-full rounded-xl border-slate-300 px-3 text-sm focus-visible:border-[#0F766E] focus-visible:ring-[#0F766E]/25" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, fullName: "" })) }} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "profile-name-error" : undefined} required />{errors.fullName ? <span id="profile-name-error" role="alert" className="text-sm leading-5 text-red-600">{errors.fullName}</span> : null}</div>
    <div className="grid w-full content-start gap-2 self-start"><label htmlFor="profile-phone" className="text-sm font-medium text-slate-800">Phone number</label><Input id="profile-phone" className="h-11 w-full rounded-xl border-slate-300 px-3 text-sm focus-visible:border-[#0F766E] focus-visible:ring-[#0F766E]/25" value={phoneValue} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, "")); setErrors((current) => ({ ...current, phone: "" })) }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "profile-phone-error" : "profile-phone-hint"} inputMode="numeric" placeholder="03001234567" /><span id="profile-phone-hint" className="max-w-full text-xs leading-5 text-slate-600">Use digits only, for example 03001234567.</span>{errors.phone ? <span id="profile-phone-error" role="alert" className="text-sm leading-5 text-red-600">{errors.phone}</span> : null}</div>
    <Button disabled={saving || !changed} className="h-11 w-full rounded-xl bg-[#0F766E] px-4 text-sm font-semibold hover:bg-[#0D5F59] disabled:opacity-60 sm:col-span-2 sm:w-fit sm:min-w-36">{saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}{saving ? "Saving..." : "Save changes"}</Button>
  </form>
}
