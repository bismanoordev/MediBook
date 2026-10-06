"use client"

import Image from "next/image"
import { ChangeEvent, ReactNode, useState } from "react"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase() || "P"
const pathFrom = (url: string) => { const key = "/patient-avatars/"; const index = url.indexOf(key); return index < 0 ? null : url.slice(index + key.length) }

async function resized(file: File) {
  const image = new window.Image()
  const source = URL.createObjectURL(file)
  image.src = source
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject })
  URL.revokeObjectURL(source)
  const canvas = document.createElement("canvas")
  const size = Math.min(image.width, image.height)
  canvas.width = canvas.height = 512
  const context = canvas.getContext("2d")
  if (!context) throw new Error("image")
  context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 512, 512)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("image")), "image/jpeg", .88))
  return new File([blob], "avatar.jpg", { type: "image/jpeg" })
}

function friendly(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : ""
  if (text.includes("policy") || text.includes("row-level") || text.includes("authorized")) return "Your upload session expired. Please sign out and sign back in, then try again."
  if (text.includes("bucket") || text.includes("not found")) return "Photo storage is not available yet. Please contact support."
  return "We couldn’t upload your photo. Please try again."
}

export function ProfilePhotoUpload({ userId, name, avatarUrl, children }: { userId: string; name: string; avatarUrl?: string | null; children: ReactNode }) {
  const router = useRouter()
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined)
  const preview = localPreview ?? avatarUrl ?? ""
  const [saving, setSaving] = useState(false)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 2097152) return toast.error("Use a JPG, PNG, or WebP image smaller than 2 MB.")

    setSaving(true)
    const supabase = createClient()
    try {
      const file = await resized(selected)
      const path = `${userId}/avatar-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from("patient-avatars").upload(path, file, { contentType: "image/jpeg", upsert: false })
      if (uploadError) throw uploadError
      const url = supabase.storage.from("patient-avatars").getPublicUrl(path).data.publicUrl
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId)
      if (updateError) { await supabase.storage.from("patient-avatars").remove([path]); throw updateError }
      const old = avatarUrl ? pathFrom(avatarUrl) : null
      if (old) await supabase.storage.from("patient-avatars").remove([old])
      setLocalPreview(url)
      toast.success("Profile photo updated.")
      router.refresh()
    } catch (error) {
      toast.error(friendly(error))
    } finally {
      setSaving(false)
      event.target.value = ""
    }
  }

  async function remove() {
    if (!avatarUrl || !window.confirm("Remove your profile photo?")) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId)
    if (error) toast.error("We couldn’t remove your photo. Please try again.")
    else {
      const path = pathFrom(avatarUrl)
      if (path) await supabase.storage.from("patient-avatars").remove([path])
      setLocalPreview("")
      toast.success("Profile photo removed.")
      router.refresh()
    }
    setSaving(false)
  }

  return <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center"><div className="relative shrink-0"><div className="grid size-[88px] place-items-center overflow-hidden rounded-full bg-[#0F766E] text-2xl font-semibold text-white ring-4 ring-teal-50 shadow-sm sm:size-24">{preview ? <Image src={preview} alt={`${name || "Patient"} profile photo`} width={96} height={96} unoptimized className="size-full object-cover" /> : initials(name)}{saving ? <span className="absolute inset-0 grid place-items-center bg-slate-900/40"><Loader2 className="size-6 animate-spin text-white" /></span> : null}</div><label aria-label="Change profile photo" className="absolute -bottom-1 -right-1 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm transition hover:bg-[#0D5F59] focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:ring-offset-2"><Camera className="size-4" /><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(event) => void upload(event)} /></label></div>{children}<div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end"><div className="flex w-full gap-2 sm:w-auto"><label className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-within:ring-2 focus-within:ring-[#0F766E] sm:flex-none"><Upload className="size-4" />{preview ? "Change photo" : "Upload photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(event) => void upload(event)} /></label>{preview ? <button type="button" disabled={saving} onClick={() => void remove()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:flex-none"><Trash2 className="size-4" />Remove photo</button> : null}</div><p className="text-center text-xs text-slate-500 sm:text-right">JPG, PNG or WebP, up to 2 MB.</p>{!preview ? <p className="max-w-52 text-center text-xs leading-5 text-slate-500 sm:text-right">Add a photo so your doctor can recognise you.</p> : null}</div></div>
}
