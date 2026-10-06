"use client"

import Image from "next/image"
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import * as yup from "yup"

import { getDoctorInitials } from "@/components/doctor-photo"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const schema = yup.object({
  full_name: yup.string().trim().matches(/^[\p{L}][\p{L}\s.'-]*$/u, "Use letters only in the doctor’s full name.").required("Enter the doctor’s full name."),
  fee: yup.number().typeError("Enter a valid consultation fee.").min(0, "Consultation fee cannot be negative.").required("Enter a consultation fee."),
  bio: yup.string().max(500, "Bio must be 500 characters or fewer."),
})
const field = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxPhotoBytes = 5 * 1024 * 1024

type MutationResult = { error?: string; success?: true }
type Doctor = { id: string; full_name: string; specialty_id: number | null; fee: number; bio: string | null; photo_url?: string | null }
type Props = { action: (data: FormData) => Promise<MutationResult>; specialties: { id: number; name: string }[]; doctor?: Doctor; compact?: boolean }

export function DoctorForm({ action, specialties, doctor, compact }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bio, setBio] = useState(doctor?.bio ?? "")
  const [photoUrl, setPhotoUrl] = useState(doctor?.photo_url ?? "")
  const [preview, setPreview] = useState<string | null>(doctor?.photo_url ?? null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const specialtyItems = useMemo(() => [{ value: "", label: "No specialty" }, ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name }))], [specialties])

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview) }, [preview])

  function clear(key: string) { setErrors((current) => ({ ...current, [key]: "" })) }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    if (!allowedImageTypes.has(file.type)) { setErrors((current) => ({ ...current, photo: "Choose a JPG, PNG, or WebP image." })); return }
    if (file.size > maxPhotoBytes) { setErrors((current) => ({ ...current, photo: "Photo must be 5 MB or smaller." })); return }
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    clear("photo")
  }

  async function uploadPhoto() {
    if (!photo) return photoUrl
    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `doctor-${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error } = await supabase.storage.from("doctor-photos").upload(path, photo, { contentType: photo.type, upsert: false })
    if (error) throw new Error("upload_failed")
    return supabase.storage.from("doctor-photos").getPublicUrl(path).data.publicUrl
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    try {
      await schema.validate(values, { abortEarly: false })
      setErrors((current) => ({ ...current, full_name: "", fee: "", bio: "" }))
    } catch (error) {
      if (error instanceof yup.ValidationError) setErrors(Object.fromEntries(error.inner.map((issue) => [issue.path ?? "form", issue.message])))
      return
    }
    if (errors.photo) return
    if (!doctor && !photo && !photoUrl) {
      setErrors((current) => ({ ...current, photo: "Add a doctor photo before saving." }))
      return
    }

    setSaving(true)
    try {
      const uploadedPhotoUrl = await uploadPhoto()
      setPhotoUrl(uploadedPhotoUrl)
      const formData = new FormData(form)
      formData.set("photo_url", uploadedPhotoUrl)
      const result = await action(formData)
      if (result.error) { setErrors((current) => ({ ...current, form: result.error ?? "We couldn’t save this doctor. Please try again." })); return }
      toast.success(doctor ? "Doctor updated." : "Doctor added.")
      if (!doctor) { form.reset(); setBio(""); setPhoto(null); setPhotoUrl(""); setPreview(null) }
    } catch {
      setErrors((current) => ({ ...current, photo: "We couldn’t upload the photo. Please try again." }))
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={submit} className={compact ? "mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4" : "mt-8 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"}>{doctor ? <input type="hidden" name="id" value={doctor.id} /> : null}<input type="hidden" name="photo_url" value={photoUrl} /><label className="grid gap-2 text-sm font-medium">Full name<input name="full_name" defaultValue={doctor?.full_name} onChange={() => clear("full_name")} aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? "doctor-name-error" : undefined} className={field} />{errors.full_name ? <span id="doctor-name-error" className="text-sm text-red-600">{errors.full_name}</span> : null}</label><div className="grid gap-2 text-sm font-medium"><label htmlFor="doctor-specialty">Specialty</label><Select name="specialty_id" defaultValue={doctor?.specialty_id ? String(doctor.specialty_id) : ""} items={specialtyItems}><SelectTrigger id="doctor-specialty" className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 shadow-sm focus-visible:border-[#0F766E] focus-visible:ring-teal-100"><SelectValue placeholder="No specialty" /></SelectTrigger><SelectContent alignItemWithTrigger={false} className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"><SelectItem value="" className="rounded-lg px-3 py-2.5 text-slate-600 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-medium data-[selected]:text-[#0F766E]">No specialty</SelectItem>{specialties.map((specialty) => <SelectItem key={specialty.id} value={String(specialty.id)} className="rounded-lg px-3 py-2.5 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-medium data-[selected]:text-[#0F766E]">{specialty.name}</SelectItem>)}</SelectContent></Select></div><label className="grid gap-2 text-sm font-medium">Consultation fee (Rs.)<input name="fee" type="number" min="0" step="0.01" defaultValue={doctor?.fee} onChange={() => clear("fee")} aria-invalid={Boolean(errors.fee)} aria-describedby={errors.fee ? "doctor-fee-error" : undefined} className={field} />{errors.fee ? <span id="doctor-fee-error" className="text-sm text-red-600">{errors.fee}</span> : null}</label>{compact ? <button disabled={saving} className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{saving ? "Saving…" : "Add doctor"}</button> : null}<label className={compact ? "grid gap-2 text-sm font-medium md:col-span-4" : "grid gap-2 text-sm font-medium"}>Bio <span className="font-normal text-slate-500">{500 - bio.length} characters remaining</span><textarea name="bio" value={bio} onChange={(event) => { setBio(event.target.value); clear("bio") }} maxLength={500} aria-invalid={Boolean(errors.bio)} aria-describedby={errors.bio ? "doctor-bio-error" : undefined} className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" />{errors.bio ? <span id="doctor-bio-error" className="text-sm text-red-600">{errors.bio}</span> : null}</label><div className={compact ? "grid gap-3 md:col-span-4 sm:grid-cols-[auto_1fr] sm:items-center" : "grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center"}><div className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-teal-50 text-sm font-semibold text-[#0F766E]">{preview ? <Image src={preview} alt="Selected doctor photo preview" width={80} height={80} unoptimized className="size-20 object-cover" /> : getDoctorInitials(doctor?.full_name ?? "Doctor")}</div><label className="grid gap-1 text-sm font-medium">Doctor photo {!doctor ? <span className="text-red-700">*</span> : null}<span className="text-xs font-normal text-slate-500">JPG, PNG, or WebP · up to 5 MB{!doctor ? " · required" : ""}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} aria-invalid={Boolean(errors.photo)} aria-describedby={errors.photo ? "doctor-photo-error" : undefined} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0F766E]" />{errors.photo ? <span id="doctor-photo-error" className="text-sm text-red-600">{errors.photo}</span> : null}</label></div>{errors.form ? <p role="alert" className="text-sm text-red-600">{errors.form}</p> : null}{!compact ? <button disabled={saving} className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{saving ? "Saving…" : "Save doctor"}</button> : null}</form>
}
