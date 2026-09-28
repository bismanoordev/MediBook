"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function ProfileForm({ userId, fullName, phone }: { userId: string; fullName: string; phone: string }) {
  const [name, setName] = useState(fullName)
  const [phoneValue, setPhone] = useState(phone)
  const [saving, setSaving] = useState(false)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return toast.error("Enter your full name.")
    setSaving(true)
    const { error } = await createClient().from("profiles").update({ full_name: name.trim(), phone: phoneValue.trim() || null }).eq("id", userId)
    setSaving(false)
    if (error) return toast.error("We could not save your profile. Please try again.")
    toast.success("Your profile has been updated.")
  }
  return <form onSubmit={save} className="mt-8 grid gap-5 sm:grid-cols-2">
    <label className="grid gap-2 text-sm font-medium">Full name<Input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label className="grid gap-2 text-sm font-medium">Phone number<Input value={phoneValue} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="0300 1234567" /></label>
    <Button disabled={saving} className="h-10 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59] sm:col-span-2 sm:w-fit">{saving ? "Saving..." : "Save changes"}</Button>
  </form>
}
