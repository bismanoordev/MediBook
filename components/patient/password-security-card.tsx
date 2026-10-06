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
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="security-title"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><KeyRound className="size-5" /></span><div><h2 id="security-title" className="text-xl font-semibold text-slate-900">Security</h2><p className="mt-1 text-sm leading-6 text-slate-600">Choose a strong password to keep your account safe.</p></div></div><form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2"><PasswordInput id="profile-new-password" label="New password" value={password} onChange={(event) => { setPassword(event.target.value); setError("") }} autoComplete="new-password" placeholder="At least 8 characters" /><PasswordInput id="profile-confirm-password" label="Confirm password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError("") }} autoComplete="new-password" placeholder="Repeat password" />{error ? <p role="alert" className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}<div className="flex flex-wrap gap-3 sm:col-span-2"><Button disabled={saving} className="h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{saving ? <Loader2 className="animate-spin" /> : null}{saving ? "Saving..." : "Save password"}</Button>{needsReset ? <Button type="button" variant="outline" onClick={() => void sendReset()} className="h-11 rounded-xl border-teal-200 text-[#0F766E] hover:bg-teal-50">Send me a reset link</Button> : null}</div></form></section>
}
