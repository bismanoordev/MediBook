"use client"

import { useState } from "react"
import { toast } from "sonner"
import { KeyRound, Loader2 } from "lucide-react"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const validPassword = (value: string) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)

export function PasswordSecurityCard({ email }: { email?: string | null }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [needsReset, setNeedsReset] = useState(false)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNeedsReset(false)
    if (!validPassword(password)) return setError("Use at least 8 characters with a letter and a number.")
    if (password !== confirm) return setError("Passwords do not match.")
    setSaving(true); const { error: updateError } = await createClient().auth.updateUser({ password }); setSaving(false)
    if (updateError) { const recentLogin = /reauth|recent|session/i.test(updateError.message); setNeedsReset(recentLogin); setError(recentLogin ? "For your security, please verify your account before changing your password." : "We couldn’t update your password. Please try again."); return }
    setPassword(""); setConfirm(""); toast.success("Your password has been updated.")
  }
  async function sendReset() { if (!email) return; const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }); if (resetError) return toast.error("We couldn’t send a reset link. Please try again."); toast.success("We sent a password reset link to your email.") }
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="security-title"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><KeyRound className="size-5" aria-hidden="true" /></span><div><h2 id="security-title" className="text-xl font-semibold tracking-tight text-slate-900">Security</h2><p className="mt-1 text-sm leading-6 text-slate-600">Choose a strong password to keep your account safe.</p></div></div><form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2"><PasswordInput id="profile-new-password" className="h-11 rounded-xl border-slate-300 px-3 text-sm focus-visible:border-[#0F766E] focus-visible:ring-[#0F766E]/25" label="New password" value={password} onChange={(event) => { setPassword(event.target.value); setError("") }} autoComplete="new-password" placeholder="At least 8 characters" aria-describedby="password-hint" /><PasswordInput id="profile-confirm-password" className="h-11 rounded-xl border-slate-300 px-3 text-sm focus-visible:border-[#0F766E] focus-visible:ring-[#0F766E]/25" label="Confirm password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError("") }} autoComplete="new-password" placeholder="Repeat password" aria-describedby="password-hint" /><p id="password-hint" className="sm:col-span-2 -mt-2 text-xs leading-5 text-slate-500">Use at least 8 characters, with a letter and a number.</p>{error ? <p role="alert" aria-live="polite" className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}<div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row"><Button disabled={saving} className="h-11 w-full rounded-xl bg-[#0F766E] px-4 text-sm font-semibold hover:bg-[#0D5F59] disabled:opacity-60 sm:w-auto sm:min-w-36">{saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}{saving ? "Saving..." : "Save password"}</Button>{needsReset ? <Button type="button" variant="outline" onClick={() => void sendReset()} className="h-11 w-full rounded-xl border-teal-200 text-[#0F766E] hover:bg-teal-50 sm:w-auto">Send me a reset link</Button> : null}</div></form></section>
}
